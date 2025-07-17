// src/infrastructure/database/config/DatabaseFactory.ts
import { IStudentRepository, ICandidateRepository, IVoteRepository } from '../../../core/interfaces/repositories/IRepositories';
import { ICacheService } from '../../../core/interfaces/services/IServices';

// Airtable implementations
import { AirtableStudentRepository } from '../repositories/airtable/AirtableRepositories';
import { AirtableCandidateRepository } from '../repositories/airtable/AirtableRepositories';
import { AirtableVoteRepository } from '../repositories/airtable/AirtableRepositories';
import { AirtableClient } from '../../external/airtable/AirtableClient';

// Mock implementations
import { MockStudentRepository } from '../repositories/mock/MockRepositories';
import { MockCandidateRepository } from '../repositories/mock/MockRepositories';
import { MockVoteRepository } from '../repositories/mock/MockRepositories';
import { MockCacheService } from '../repositories/mock/MockRepositories';

// Memory cache implementation
import { MemoryCache } from '../../cache/MemoryCache';

export type DatabaseType = 'airtable' | 'mock' | 'mongodb' | 'postgresql';

export interface RepositoryContainer {
  studentRepository: IStudentRepository;
  candidateRepository: ICandidateRepository;
  voteRepository: IVoteRepository;
  cacheService: ICacheService;
}

export class DatabaseFactory {
  private static instance: DatabaseFactory;
  private container: RepositoryContainer | null = null;

  private constructor() {}

  static getInstance(): DatabaseFactory {
    if (!DatabaseFactory.instance) {
      DatabaseFactory.instance = new DatabaseFactory();
    }
    return DatabaseFactory.instance;
  }

  /**
   * Determina qué base de datos usar basándose en las variables de entorno
   */
  private determineDatabaseType(): DatabaseType {
    // Prioridad de configuración:
    // 1. Variable de entorno específica
    const dbType = process.env.DATABASE_TYPE as DatabaseType;
    if (dbType && ['airtable', 'mock', 'mongodb', 'postgresql'].includes(dbType)) {
      return dbType;
    }

    // 2. Si Airtable está configurado
    const airtableKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
    const airtableBase = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
    
    if (airtableKey && airtableBase && 
        airtableKey !== 'DEMO_MODE' && airtableBase !== 'DEMO_MODE') {
      return 'airtable';
    }

    // 3. Por defecto, usar mock
    return 'mock';
  }

  /**
   * Crea los repositorios según el tipo de base de datos configurado
   */
  createRepositories(): RepositoryContainer {
    if (this.container) {
      return this.container;
    }

    const dbType = this.determineDatabaseType();
    console.log(`🗄️ Inicializando repositorios para: ${dbType}`);

    switch (dbType) {
      case 'airtable':
        this.container = this.createAirtableRepositories();
        break;
      
      case 'mock':
        this.container = this.createMockRepositories();
        break;
      
      case 'mongodb':
        // Para futuras implementaciones
        throw new Error('MongoDB no implementado aún. Use DATABASE_TYPE=airtable o DATABASE_TYPE=mock');
      
      case 'postgresql':
        // Para futuras implementaciones
        throw new Error('PostgreSQL no implementado aún. Use DATABASE_TYPE=airtable o DATABASE_TYPE=mock');
      
      default:
        throw new Error(`Tipo de base de datos no soportado: ${dbType}`);
    }

    return this.container;
  }

  /**
   * Crea repositorios para Airtable
   */
  private createAirtableRepositories(): RepositoryContainer {
    const airtableClient = new AirtableClient();
    
    if (!airtableClient.isConfigured()) {
      console.warn('⚠️ Airtable no configurado correctamente, fallback a Mock');
      return this.createMockRepositories();
    }

    return {
      studentRepository: new AirtableStudentRepository(airtableClient),
      candidateRepository: new AirtableCandidateRepository(airtableClient),
      voteRepository: new AirtableVoteRepository(airtableClient),
      cacheService: new MemoryCache()
    };
  }

  /**
   * Crea repositorios Mock para demo/testing
   */
  private createMockRepositories(): RepositoryContainer {
    return {
      studentRepository: new MockStudentRepository(),
      candidateRepository: new MockCandidateRepository(),
      voteRepository: new MockVoteRepository(),
      cacheService: new MockCacheService()
    };
  }

  /**
   * Obtiene la configuración actual de base de datos
   */
  getCurrentConfig(): {
    type: DatabaseType;
    isConfigured: boolean;
    details: Record<string, any>;
  } {
    const dbType = this.determineDatabaseType();
    
    const config = {
      type: dbType,
      isConfigured: false,
      details: {}
    };

    switch (dbType) {
      case 'airtable':
        const airtableClient = new AirtableClient();
        config.isConfigured = airtableClient.isConfigured();
        config.details = {
          hasApiKey: !!process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
          hasBaseId: !!process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID,
          isDemoMode: airtableClient.isDemoMode()
        };
        break;
      
      case 'mock':
        config.isConfigured = true;
        config.details = {
          description: 'Modo demo - datos en memoria/localStorage'
        };
        break;
    }

    return config;
  }

  /**
   * Reinicia la instancia del factory (útil para testing)
   */
  reset(): void {
    this.container = null;
  }

  /**
   * Cambia dinámicamente el tipo de base de datos (útil para testing)
   */
  forceType(type: DatabaseType): RepositoryContainer {
    this.container = null;
    
    // Temporalmente cambiar la variable de entorno
    const originalType = process.env.DATABASE_TYPE;
    process.env.DATABASE_TYPE = type;
    
    const repositories = this.createRepositories();
    
    // Restaurar la variable original
    if (originalType) {
      process.env.DATABASE_TYPE = originalType;
    } else {
      delete process.env.DATABASE_TYPE;
    }
    
    return repositories;
  }
}