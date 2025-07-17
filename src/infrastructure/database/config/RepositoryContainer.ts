// src/infrastructure/database/config/RepositoryContainer.ts
import { DatabaseFactory, RepositoryContainer as IRepositoryContainer } from './DatabaseFactory';
import { IStudentRepository, ICandidateRepository, IVoteRepository } from '../../../core/interfaces/repositories/IRepositories';
import { ICacheService } from '../../../core/interfaces/services/IServices';

/**
 * Singleton para acceder a los repositorios de manera global
 */
export class RepositoryContainer {
  private static instance: RepositoryContainer;
  private repositories: IRepositoryContainer;

  private constructor() {
    const factory = DatabaseFactory.getInstance();
    this.repositories = factory.createRepositories();
  }

  static getInstance(): RepositoryContainer {
    if (!RepositoryContainer.instance) {
      RepositoryContainer.instance = new RepositoryContainer();
    }
    return RepositoryContainer.instance;
  }

  // Getters para acceso fácil a los repositorios
  get students(): IStudentRepository {
    return this.repositories.studentRepository;
  }

  get candidates(): ICandidateRepository {
    return this.repositories.candidateRepository;
  }

  get votes(): IVoteRepository {
    return this.repositories.voteRepository;
  }

  get cache(): ICacheService {
    return this.repositories.cacheService;
  }

  /**
   * Obtiene todos los repositorios
   */
  getAll(): IRepositoryContainer {
    return this.repositories;
  }

  /**
   * Reinicia los repositorios (útil para cambiar configuración)
   */
  refresh(): void {
    DatabaseFactory.getInstance().reset();
    const factory = DatabaseFactory.getInstance();
    this.repositories = factory.createRepositories();
  }

  /**
   * Obtiene información sobre la configuración actual
   */
  getConfig() {
    return DatabaseFactory.getInstance().getCurrentConfig();
  }
}

/**
 * Helper functions para acceso directo
 */
export const getStudentRepository = (): IStudentRepository => {
  return RepositoryContainer.getInstance().students;
};

export const getCandidateRepository = (): ICandidateRepository => {
  return RepositoryContainer.getInstance().candidates;
};

export const getVoteRepository = (): IVoteRepository => {
  return RepositoryContainer.getInstance().votes;
};

export const getCacheService = (): ICacheService => {
  return RepositoryContainer.getInstance().cache;
};

export const getRepositories = (): IRepositoryContainer => {
  return RepositoryContainer.getInstance().getAll();
};