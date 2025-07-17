// src/core/interfaces/repositories/IStudentRepository.ts
import { Student } from '../../entities/Student';

export interface IStudentRepository {
  findById(id: string): Promise<Student | null>;
  findByUsername(username: string): Promise<Student | null>;
  findByCredentials(username: string, password: string): Promise<Student | null>;
  findAll(): Promise<Student[]>;
  findByGradeAndCourse(grade: string, course: string): Promise<Student[]>;
}

// src/core/interfaces/repositories/ICandidateRepository.ts
import { Candidate } from '../../entities/Candidate';

export interface ICandidateRepository {
  findAll(): Promise<Candidate[]>;
  findById(id: string): Promise<Candidate | null>;
  findByGradeAndCourse(grade: string, course: string): Promise<Candidate[]>;
  findActive(): Promise<Candidate[]>;
}

// src/core/interfaces/repositories/IVoteRepository.ts
import { Vote } from '../../entities/Vote';

export interface IVoteRepository {
  save(vote: Vote): Promise<void>;
  findByPeriod(month: string, year: number): Promise<Vote[]>;
  findByStudent(studentId: string, month: string, year: number): Promise<Vote | null>;
  findByStudentUsername(username: string, month: string, year: number): Promise<Vote | null>;
  countByCandidate(month: string, year: number): Promise<Map<string, number>>;
  deleteByPeriod(month: string, year: number): Promise<void>;
}