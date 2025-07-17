// src/infrastructure/database/repositories/mock/MockStudentRepository.ts
import { IStudentRepository } from '../../../../core/interfaces/repositories/IRepositories';
import { Student } from '../../../../core/entities/Student';

export class MockStudentRepository implements IStudentRepository {
  private students: Student[] = [
    new Student('demo', 'ana.garcia', 'Ana', 'García', '1ro', 'Arrayan', true),
    new Student('demo2', 'luis.martin', 'Luis', 'Martín', '1ro', 'Arrayan', true),
    new Student('demo3', 'sofia.lopez', 'Sofia', 'López', '1ro', 'Ceibo', true),
    new Student('demo4', 'carlos.rodriguez', 'Carlos', 'Rodríguez', '2do', 'Jacarandá', true),
    new Student('demo5', 'maria.fernandez', 'María', 'Fernández', '2do', 'Arrayan', true),
  ];

  async findById(id: string): Promise<Student | null> {
    const student = this.students.find(s => s.id === id);
    return student || null;
  }

  async findByUsername(username: string): Promise<Student | null> {
    const student = this.students.find(s => s.username === username);
    return student || null;
  }

  async findByCredentials(username: string, password: string): Promise<Student | null> {
    // En modo demo, cualquier password '123' funciona
    if (password !== '123') return null;
    
    const student = this.students.find(s => s.username === username && s.active);
    return student || null;
  }

  async findAll(): Promise<Student[]> {
    return this.students.filter(s => s.active);
  }

  async findByGradeAndCourse(grade: string, course: string): Promise<Student[]> {
    return this.students.filter(s => 
      s.grade === grade && 
      s.course === course && 
      s.active
    );
  }
}

// src/infrastructure/database/repositories/mock/MockCandidateRepository.ts
import { ICandidateRepository } from '../../../../core/interfaces/repositories/IRepositories';
import { Candidate } from '../../../../core/entities/Candidate';

export class MockCandidateRepository implements ICandidateRepository {
  private candidates: Candidate[] = [
    new Candidate('1', 'Ana', 'García', '1ro', 'Arrayan'),
    new Candidate('2', 'Luis', 'Martín', '1ro', 'Arrayan'),
    new Candidate('3', 'Sofia', 'López', '1ro', 'Ceibo'),
    new Candidate('4', 'Carlos', 'Rodríguez', '2do', 'Jacarandá'),
    new Candidate('5', 'María', 'Fernández', '2do', 'Arrayan'),
    new Candidate('6', 'Diego', 'Álvarez', '3ro', 'Ceibo'),
    new Candidate('7', 'Valentina', 'Silva', '3ro', 'Jacarandá'),
    new Candidate('8', 'Joaquín', 'Morales', '4to', 'Arrayan'),
    new Candidate('9', 'Isabella', 'Castro', '4to', 'Ceibo'),
    new Candidate('10', 'Mateo', 'Vargas', '5to', 'Jacarandá'),
  ];

  async findAll(): Promise<Candidate[]> {
    return [...this.candidates];
  }

  async findById(id: string): Promise<Candidate | null> {
    const candidate = this.candidates.find(c => c.id === id);
    return candidate || null;
  }

  async findByGradeAndCourse(grade: string, course: string): Promise<Candidate[]> {
    return this.candidates.filter(c => 
      c.grade === grade && c.course === course
    );
  }

  async findActive(): Promise<Candidate[]> {
    // En modo mock, todos los candidatos están activos
    return [...this.candidates];
  }
}

// src/infrastructure/database/repositories/mock/MockVoteRepository.ts
import { IVoteRepository } from '../../../../core/interfaces/repositories/IRepositories';
import { Vote } from '../../../../core/entities/Vote';

export class MockVoteRepository implements IVoteRepository {
  private votes: Vote[] = [];

  // Simular localStorage en el servidor/browser
  private getStorageKey(prefix: string): string {
    return `mock-votes-${prefix}`;
  }

  private loadVotesFromStorage(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('demo-votes-full');
      if (stored) {
        try {
          const votesData = JSON.parse(stored);
          this.votes = votesData.map((v: any) => new Vote(
            v.id,
            v.studentId,
            v.candidateId,
            v.month,
            v.year,
            new Date(v.timestamp)
          ));
        } catch (error) {
          console.error('Error loading votes from storage:', error);
          this.votes = [];
        }
      }
    }
  }

  private saveVotesToStorage(): void {
    if (typeof window !== 'undefined') {
      const votesData = this.votes.map(v => ({
        id: v.id,
        studentId: v.studentId,
        candidateId: v.candidateId,
        month: v.month,
        year: v.year,
        timestamp: v.timestamp.toISOString()
      }));
      localStorage.setItem('demo-votes-full', JSON.stringify(votesData));

      // También mantener compatibilidad con el formato actual
      const voteCounts: Record<string, number> = {};
      this.votes.forEach(vote => {
        voteCounts[vote.candidateId] = (voteCounts[vote.candidateId] || 0) + 1;
      });
      localStorage.setItem('demo-votes', JSON.stringify(voteCounts));
    }
  }

  constructor() {
    this.loadVotesFromStorage();
  }

  async save(vote: Vote): Promise<void> {
    // Verificar si ya existe un voto para este estudiante en este período
    const existingVote = await this.findByStudent(vote.studentId, vote.month, vote.year);
    if (existingVote) {
      throw new Error('El estudiante ya votó en este período');
    }

    this.votes.push(vote);
    this.saveVotesToStorage();
  }

  async findByPeriod(month: string, year: number): Promise<Vote[]> {
    this.loadVotesFromStorage();
    return this.votes.filter(vote => vote.isFromPeriod(month, year));
  }

  async findByStudent(studentId: string, month: string, year: number): Promise<Vote | null> {
    this.loadVotesFromStorage();
    const vote = this.votes.find(v => 
      v.studentId === studentId && 
      v.isFromPeriod(month, year)
    );
    return vote || null;
  }

  async findByStudentUsername(username: string, month: string, year: number): Promise<Vote | null> {
    // En modo mock, usamos username como studentId para simplicidad
    return this.findByStudent(username, month, year);
  }

  async countByCandidate(month: string, year: number): Promise<Map<string, number>> {
    const votes = await this.findByPeriod(month, year);
    const counts = new Map<string, number>();

    votes.forEach(vote => {
      const current = counts.get(vote.candidateId) || 0;
      counts.set(vote.candidateId, current + 1);
    });

    return counts;
  }

  async deleteByPeriod(month: string, year: number): Promise<void> {
    this.loadVotesFromStorage();
    this.votes = this.votes.filter(vote => !vote.isFromPeriod(month, year));
    this.saveVotesToStorage();
  }
}

// src/infrastructure/database/repositories/mock/MockCacheService.ts
import { ICacheService } from '../../../../core/interfaces/services/IServices';

export class MockCacheService implements ICacheService {
  private cache: Map<string, { value: any; expiry: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });
  }

  async invalidate(pattern: string): Promise<void> {
    // Implementación simple para mock: eliminar claves que coincidan con el patrón
    const keys = Array.from(this.cache.keys());
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    });
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}