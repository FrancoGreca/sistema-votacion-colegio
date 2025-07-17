// src/application/controllers/CandidateController.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCandidateRepository } from '../../infrastructure/database/config/RepositoryContainer';
import { errorHandler } from '../middleware/middleware';
import { CandidateResponse } from '../../core/types/ApiTypes';

export class CandidateController {
  static async getCandidates(req: NextRequest): Promise<NextResponse> {
    try {
      const candidateRepo = getCandidateRepository();
      const candidates = await candidateRepo.findAll();

      // Convertir a formato de respuesta compatible
      const response: CandidateResponse[] = candidates.map(candidate => ({
        id: candidate.id,
        nombre: candidate.nombre,
        apellido: candidate.apellido,
        grado: candidate.grado,
        curso: candidate.curso
      }));

      return NextResponse.json(response);
    } catch (error) {
      return errorHandler(error);
    }
  }

  static async getCandidatesByGradeAndCourse(
    req: NextRequest,
    grade: string,
    course: string
  ): Promise<NextResponse> {
    try {
      const candidateRepo = getCandidateRepository();
      const candidates = await candidateRepo.findByGradeAndCourse(grade, course);

      const response: CandidateResponse[] = candidates.map(candidate => ({
        id: candidate.id,
        nombre: candidate.nombre,
        apellido: candidate.apellido,
        grado: candidate.grado,
        curso: candidate.curso
      }));

      return NextResponse.json(response);
    } catch (error) {
      return errorHandler(error);
    }
  }
}

// src/application/controllers/AuthController.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStudentRepository } from '../../infrastructure/database/config/RepositoryContainer';
import { errorHandler } from '../middleware/middleware';
import { LoginRequest, LoginResponse } from '../../core/types/ApiTypes';
import { AuthenticationError } from '../../core/errors/DomainErrors';

export class AuthController {
  static async authenticate(req: NextRequest): Promise<NextResponse> {
    try {
      const body: LoginRequest = await req.json();
      const { username, password } = body;

      if (!username || !password) {
        throw new AuthenticationError('Usuario y contraseña son requeridos');
      }

      const studentRepo = getStudentRepository();
      const student = await studentRepo.findByCredentials(username, password);

      if (!student) {
        const response: LoginResponse = {
          success: false,
          error: 'Usuario o contraseña incorrectos'
        };
        return NextResponse.json(response);
      }

      const response: LoginResponse = {
        success: true,
        student: {
          id: student.id,
          username: student.username,
          nombre: student.nombre,
          apellido: student.apellido,
          grado: student.grado,
          curso: student.curso,
          active: student.active
        }
      };

      return NextResponse.json(response);
    } catch (error) {
      return errorHandler(error);
    }
  }
}

// src/application/controllers/VoteController.ts
import { NextRequest, NextResponse } from 'next/server';
import { 
  getVoteRepository, 
  getStudentRepository, 
  getCandidateRepository,
  getCacheService 
} from '../../infrastructure/database/config/RepositoryContainer';
import { errorHandler } from '../middleware/middleware';
import { Vote } from '../../core/entities/Vote';
import { VoteRequest, VoteResponse, VotesResponse, CheckVoteResponse } from '../../core/types/ApiTypes';
import { VotingError, NotFoundError } from '../../core/errors/DomainErrors';
import { IdGenerator, DateUtils } from '../../core/utils/CoreUtils';

export class VoteController {
  static async getVotes(req: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(req.url);
      const mes = searchParams.get('mes');
      const ano = searchParams.get('ano');

      if (!mes || !ano) {
        return NextResponse.json({}, { status: 400 });
      }

      const year = parseInt(ano);
      if (!DateUtils.isValidYear(year)) {
        throw new VotingError('Año inválido');
      }

      const voteRepo = getVoteRepository();
      const voteCounts = await voteRepo.countByCandidate(mes, year);

      // Convertir Map a objeto para la respuesta
      const response: VotesResponse = {};
      voteCounts.forEach((count, candidateId) => {
        response[candidateId] = count;
      });

      return NextResponse.json(response);
    } catch (error) {
      return errorHandler(error);
    }
  }

  static async castVote(req: NextRequest): Promise<NextResponse> {
    try {
      const body: VoteRequest = await req.json();
      const { studentUsername, candidateId, mes, ano } = body;

      if (!candidateId || !mes || !ano) {
        throw new VotingError('Datos de voto incompletos');
      }

      const voteRepo = getVoteRepository();
      const studentRepo = getStudentRepository();
      const candidateRepo = getCandidateRepository();

      // Validar candidato
      const candidate = await candidateRepo.findById(candidateId);
      if (!candidate) {
        throw new NotFoundError('Candidate', candidateId);
      }

      let studentId = 'anonymous';

      // Si es modo autenticado, validar estudiante
      if (studentUsername) {
        const student = await studentRepo.findByUsername(studentUsername);
        if (!student) {
          throw new NotFoundError('Student', studentUsername);
        }
        studentId = student.id;

        // Verificar si ya votó
        const existingVote = await voteRepo.findByStudent(studentId, mes, ano);
        if (existingVote) {
          throw new VotingError('Ya votaste este mes');
        }
      } else {
        // Modo anónimo - usar username si se proporciona, sino generar ID
        studentId = studentUsername || `anon-${Date.now()}`;
      }

      // Crear y guardar voto
      const voteId = IdGenerator.generateVoteId(studentId, candidateId, mes, ano);
      const vote = new Vote(voteId, studentId, candidateId, mes, ano);

      await voteRepo.save(vote);

      // Invalidar cache de votos
      const cache = getCacheService();
      await cache.invalidate(`votes:${mes}:${ano}*`);

      const response: VoteResponse = { success: true };
      return NextResponse.json(response);
    } catch (error) {
      return errorHandler(error);
    }
  }

  static async checkVote(req: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(req.url);
      const username = searchParams.get('username');

      if (!username) {
        return NextResponse.json({ hasVoted: false }, { status: 400 });
      }

      const currentMonth = DateUtils.getCurrentMonth();
      const currentYear = DateUtils.getCurrentYear();

      const voteRepo = getVoteRepository();
      const studentRepo = getStudentRepository();

      // Buscar estudiante
      const student = await studentRepo.findByUsername(username);
      if (!student) {
        const response: CheckVoteResponse = { hasVoted: false };
        return NextResponse.json(response);
      }

      // Verificar si ya votó
      const existingVote = await voteRepo.findByStudent(student.id, currentMonth, currentYear);
      
      const response: CheckVoteResponse = { 
        hasVoted: !!existingVote 
      };
      
      return NextResponse.json(response);
    } catch (error) {
      return errorHandler(error);
    }
  }

  static async clearVotes(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const { mes, ano } = body;

      if (!mes || !ano) {
        throw new VotingError('Mes y año son requeridos');
      }

      const voteRepo = getVoteRepository();
      await voteRepo.deleteByPeriod(mes, ano);

      // Invalidar cache
      const cache = getCacheService();
      await cache.invalidate(`votes:${mes}:${ano}*`);

      return NextResponse.json({ success: true });
    } catch (error) {
      return errorHandler(error);
    }
  }
}

// src/application/controllers/DiagnosticController.ts
import { NextRequest, NextResponse } from 'next/server';
import { SystemDiagnostics } from '../../utils/diagnostics';
import { errorHandler } from '../middleware/middleware';

export class DiagnosticController {
  static async runDiagnostics(req: NextRequest): Promise<NextResponse> {
    try {
      const diagnostics = new SystemDiagnostics();
      const results = await diagnostics.runAll();

      return NextResponse.json({
        success: true,
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return errorHandler(error);
    }
  }

  static async getSystemStatus(req: NextRequest): Promise<NextResponse> {
    try {
      const diagnostics = new SystemDiagnostics();
      const report = await diagnostics.generateReport();

      return NextResponse.json({
        success: true,
        ...report,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return errorHandler(error);
    }
  }
}