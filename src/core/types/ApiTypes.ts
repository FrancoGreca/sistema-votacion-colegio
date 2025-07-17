// src/core/types/ApiTypes.ts

// Request/Response types para compatibilidad con API actual
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  student?: {
    id: string;
    username: string;
    nombre: string;
    apellido: string;
    grado: string;
    curso: string;
    active: boolean;
  };
  error?: string;
}

export interface VoteRequest {
  studentUsername?: string; // Para modo autenticado
  candidateId: string;
  month: string;
  year: number;
}

export interface VoteResponse {
  success: boolean;
  error?: string;
}

export interface CandidateResponse {
  id: string;
  nombre: string;
  apellido: string;
  grado: string;
  curso: string;
}

export interface VotesResponse {
  [candidateId: string]: number;
}

export interface CheckVoteResponse {
  hasVoted: boolean;
}

// Internal domain types
export interface StudentData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  grade: string;
  course: string;
  active: boolean;
}

export interface CandidateData {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  course: string;
}

export interface VoteData {
  id: string;
  studentId: string;
  candidateId: string;
  month: string;
  year: number;
  timestamp: Date;
}