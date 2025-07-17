// src/config/environment.ts

export interface EnvironmentConfig {
  // Database configuration
  database: {
    type: 'airtable' | 'mock' | 'mongodb' | 'postgresql';
    airtable?: {
      apiKey: string;
      baseId: string;
    };
    mongodb?: {
      connectionString: string;
      database: string;
    };
    postgresql?: {
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
    };
  };

  // Application configuration
  app: {
    useAuth: boolean;
    adminPassword: string;
    environment: 'development' | 'production' | 'test';
  };

  // Cache configuration
  cache: {
    type: 'memory' | 'redis';
    ttl: {
      candidates: number;
      votes: number;
      students: number;
    };
    redis?: {
      url: string;
    };
  };

  // Rate limiting
  rateLimiting: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
}

class Environment {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): EnvironmentConfig {
    return {
      database: {
        type: this.getDatabaseType(),
        airtable: {
          apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || '',
          baseId: process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || '',
        },
        mongodb: {
          connectionString: process.env.MONGODB_CONNECTION_STRING || '',
          database: process.env.MONGODB_DATABASE || 'voting_system',
        },
        postgresql: {
          host: process.env.POSTGRES_HOST || 'localhost',
          port: parseInt(process.env.POSTGRES_PORT || '5432'),
          database: process.env.POSTGRES_DATABASE || 'voting_system',
          username: process.env.POSTGRES_USERNAME || '',
          password: process.env.POSTGRES_PASSWORD || '',
        },
      },

      app: {
        useAuth: process.env.NEXT_PUBLIC_USE_AUTH === 'true',
        adminPassword: process.env.ADMIN_PASSWORD || 'colegio2024',
        environment: (process.env.NODE_ENV as any) || 'development',
      },

      cache: {
        type: process.env.CACHE_TYPE as any || 'memory',
        ttl: {
          candidates: parseInt(process.env.CACHE_TTL_CANDIDATES || '300'), // 5 minutos
          votes: parseInt(process.env.CACHE_TTL_VOTES || '60'),           // 1 minuto
          students: parseInt(process.env.CACHE_TTL_STUDENTS || '600'),    // 10 minutos
        },
        redis: {
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        },
      },

      rateLimiting: {
        enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10'),
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minuto
      },
    };
  }

  private getDatabaseType(): 'airtable' | 'mock' | 'mongodb' | 'postgresql' {
    const dbType = process.env.DATABASE_TYPE as any;
    
    if (['airtable', 'mock', 'mongodb', 'postgresql'].includes(dbType)) {
      return dbType;
    }

    // Auto-detectar basándose en configuración disponible
    if (this.hasAirtableConfig()) return 'airtable';
    if (this.hasMongoConfig()) return 'mongodb';
    if (this.hasPostgresConfig()) return 'postgresql';
    
    return 'mock';
  }

  private hasAirtableConfig(): boolean {
    const apiKey = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;
    const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
    return !!(apiKey && baseId && apiKey !== 'DEMO_MODE' && baseId !== 'DEMO_MODE');
  }

  private hasMongoConfig(): boolean {
    return !!process.env.MONGODB_CONNECTION_STRING;
  }

  private hasPostgresConfig(): boolean {
    return !!(process.env.POSTGRES_HOST && process.env.POSTGRES_USERNAME);
  }

  // Getters para acceso fácil
  get databaseConfig() {
    return this.config.database;
  }

  get appConfig() {
    return this.config.app;
  }

  get cacheConfig() {
    return this.config.cache;
  }

  get rateLimitConfig() {
    return this.config.rateLimiting;
  }

  get isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  get isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  get isTest(): boolean {
    return this.config.app.environment === 'test';
  }

  /**
   * Valida que la configuración sea correcta
   */
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar configuración de base de datos
    switch (this.config.database.type) {
      case 'airtable':
        if (!this.hasAirtableConfig()) {
          errors.push('Airtable configuration missing: NEXT_PUBLIC_AIRTABLE_API_KEY and NEXT_PUBLIC_AIRTABLE_BASE_ID required');
        }
        break;
      
      case 'mongodb':
        if (!this.hasMongoConfig()) {
          errors.push('MongoDB configuration missing: MONGODB_CONNECTION_STRING required');
        }
        break;
      
      case 'postgresql':
        if (!this.hasPostgresConfig()) {
          errors.push('PostgreSQL configuration missing: POSTGRES_HOST and POSTGRES_USERNAME required');
        }
        break;
    }

    // Validar configuración de cache
    if (this.config.cache.type === 'redis' && !process.env.REDIS_URL) {
      errors.push('Redis configuration missing: REDIS_URL required when CACHE_TYPE=redis');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Retorna la configuración actual como objeto plano
   */
  toObject(): EnvironmentConfig {
    return { ...this.config };
  }
}

// Singleton instance
const environment = new Environment();

export default environment;

// Helper functions
export const getConfig = () => environment.toObject();
export const getDatabaseConfig = () => environment.databaseConfig;
export const getAppConfig = () => environment.appConfig;
export const getCacheConfig = () => environment.cacheConfig;
export const getRateLimitConfig = () => environment.rateLimitConfig;

export const isDevelopment = () => environment.isDevelopment;
export const isProduction = () => environment.isProduction;
export const isTest = () => environment.isTest;

export const validateEnvironment = () => environment.validate();