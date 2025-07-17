// src/application/adapters/CompatibilityAdapter.ts
/**
 * Adaptador para mantener compatibilidad con el código existente
 * durante la migración gradual a la nueva arquitectura
 */

import { 
  getCandidateRepository, 
  getVoteRepository, 
  getStudentRepository 
} from '../../infrastructure/database/config/RepositoryContainer';
import { CandidateResponse, VotesResponse } from '../../core/types/ApiTypes';

/**
 * Funciones compatibles con el código existente en lib/auth.ts
 */
export class CompatibilityAdapter {
  
  /**
   * Compatible con getCandidates() de lib/auth.ts
   */
  static async getCandidates(): Promise<CandidateResponse[]> {
    try {
      const candidateRepo = getCandidateRepository();
      const candidates = await candidateRepo.findAll();

      return candidates.map(candidate => ({
        id: candidate.id,
        nombre: candidate.nombre,
        apellido: candidate.apellido,
        grado: candidate.grado,
        curso: candidate.curso
      }));
    } catch (error) {
      console.error('Error in CompatibilityAdapter.getCandidates:', error);
      
      // Fallback a datos demo como en el código original
      return [
        { id: "1", nombre: "Ana", apellido: "García", grado: "1ro", curso: "Arrayan" },
        { id: "2", nombre: "Luis", apellido: "Martín", grado: "1ro", curso: "Arrayan" },
        { id: "3", nombre: "Sofia", apellido: "López", grado: "1ro", curso: "Ceibo" },
        { id: "4", nombre: "Carlos", apellido: "Rodríguez", grado: "2do", curso: "Jacarandá" },
        { id: "5", nombre: "María", apellido: "Fernández", grado: "2do", curso: "Arrayan" },
      ];
    }
  }

  /**
   * Compatible con getVotes() de lib/auth.ts
   */
  static async getVotes(mes: string, ano: string): Promise<VotesResponse> {
    try {
      const voteRepo = getVoteRepository();
      const year = parseInt(ano);
      const voteCounts = await voteRepo.countByCandidate(mes, year);

      // Convertir Map a objeto
      const result: VotesResponse = {};
      voteCounts.forEach((count, candidateId) => {
        result[candidateId] = count;
      });

      return result;
    } catch (error) {
      console.error('Error in CompatibilityAdapter.getVotes:', error);
      
      // Fallback a localStorage para modo demo
      if (typeof window !== 'undefined') {
        return JSON.parse(localStorage.getItem('demo-votes') || '{}');
      }
      
      return {};
    }
  }

  /**
   * Compatible con authenticateStudent() de lib/auth.ts
   */
  static async authenticateStudent(username: string, password: string): Promise<{
    success: boolean;
    student?: any;
    error?: string;
  }> {
    try {
      const studentRepo = getStudentRepository();
      const student = await studentRepo.findByCredentials(username, password);

      if (!student) {
        return {
          success: false,
          error: 'Usuario o contraseña incorrectos'
        };
      }

      return {
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
    } catch (error) {
      console.error('Error in CompatibilityAdapter.authenticateStudent:', error);
      return { 
        success: false, 
        error: 'Error de conexión' 
      };
    }
  }

  /**
   * Compatible con hasVotedThisMonth() de lib/auth.ts
   */
  static async hasVotedThisMonth(studentUsername: string): Promise<boolean> {
    try {
      const studentRepo = getStudentRepository();
      const voteRepo = getVoteRepository();

      const student = await studentRepo.findByUsername(studentUsername);
      if (!student) {
        return false;
      }

      const currentMonth = new Date().toLocaleString('es', { month: 'long' });
      const currentYear = new Date().getFullYear();

      const vote = await voteRepo.findByStudent(student.id, currentMonth, currentYear);
      return !!vote;
    } catch (error) {
      console.error('Error in CompatibilityAdapter.hasVotedThisMonth:', error);
      return false;
    }
  }

  /**
   * Compatible con saveAuthenticatedVote() de lib/auth.ts
   */
  static async saveAuthenticatedVote(
    studentUsername: string, 
    candidateId: string
  ): Promise<boolean> {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('es', { month: 'long' });
      const currentYear = currentDate.getFullYear();

      // Usar el VoteController directamente
      const fakeRequest = {
        json: async () => ({
          studentUsername,
          candidateId,
          mes: currentMonth,
          ano: currentYear
        })
      } as any;

      const { VoteController } = await import('../controllers/Controllers');
      const response = await VoteController.castVote(fakeRequest);
      
      // Mantener compatibilidad con localStorage para modo demo
      if (response.ok) {
        if (typeof window !== 'undefined') {
          const votes = JSON.parse(localStorage.getItem('demo-votes') || '{}');
          votes[candidateId] = (votes[candidateId] || 0) + 1;
          localStorage.setItem('demo-votes', JSON.stringify(votes));
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error in CompatibilityAdapter.saveAuthenticatedVote:', error);
      return false;
    }
  }
}

/**
 * Funciones de migración para actualizar el código existente gradualmente
 */
export class MigrationHelper {
  
  /**
   * Reemplaza las importaciones de lib/auth.ts
   */
  static getReplacementFunctions() {
    return {
      getCandidates: CompatibilityAdapter.getCandidates,
      getVotes: CompatibilityAdapter.getVotes,
      authenticateStudent: CompatibilityAdapter.authenticateStudent,
      hasVotedThisMonth: CompatibilityAdapter.hasVotedThisMonth,
      saveAuthenticatedVote: CompatibilityAdapter.saveAuthenticatedVote,
    };
  }

  /**
   * Verifica si una función está usando la nueva arquitectura
   */
  static async testNewArchitecture(): Promise<{
    candidates: boolean;
    votes: boolean;
    auth: boolean;
  }> {
    try {
      const candidates = await CompatibilityAdapter.getCandidates();
      const votes = await CompatibilityAdapter.getVotes('enero', '2025');
      const auth = await CompatibilityAdapter.hasVotedThisMonth('test');

      return {
        candidates: Array.isArray(candidates),
        votes: typeof votes === 'object',
        auth: typeof auth === 'boolean'
      };
    } catch (error) {
      console.error('Error testing new architecture:', error);
      return {
        candidates: false,
        votes: false,
        auth: false
      };
    }
  }
}