// src/core/interfaces/services/IAuthService.ts
import { Student } from '../../entities/Student';

export interface IAuthService {
  authenticate(username: string, password: string): Promise<Student | null>;
  validateSession(token: string): Promise<Student | null>;
  hasVotedThisMonth(studentId: string): Promise<boolean>;
}

// src/core/interfaces/services/IVotingService.ts
import { Candidate } from '../../entities/Candidate';

export interface VotingResult {
  candidateId: string;
  candidate: Candidate;
  voteCount: number;
  percentage: number;
}

export interface VotingStatistics {
  totalVotes: number;
  results: VotingResult[];
  period: {
    month: string;
    year: number;
  };
}

export interface IVotingService {
  getCandidates(): Promise<Candidate[]>;
  castVote(studentId: string, candidateId: string, month: string, year: number): Promise<void>;
  getResults(month: string, year: number): Promise<VotingStatistics>;
  hasStudentVoted(studentId: string, month: string, year: number): Promise<boolean>;
  clearVotes(month: string, year: number): Promise<void>;
}

// src/core/interfaces/services/ICacheService.ts
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  clear(): Promise<void>;
}