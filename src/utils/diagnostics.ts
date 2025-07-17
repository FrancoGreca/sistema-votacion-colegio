// src/utils/diagnostics.ts
import { RepositoryContainer } from '../infrastructure/database/config/RepositoryContainer';
import { DatabaseFactory } from '../infrastructure/database/config/DatabaseFactory';
import environment, { validateEnvironment } from '../config/environment';

export interface DiagnosticResult {
  category: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: Record<string, any>;
}

export class SystemDiagnostics {
  private results: DiagnosticResult[] = [];

  async runAll(): Promise<DiagnosticResult[]> {
    this.results = [];

    await this.checkEnvironmentConfig();
    await this.checkDatabaseConnection();
    await this.checkRepositories();
    await this.checkCacheService();
    await this.checkDataIntegrity();

    return this.results;
  }

  private addResult(category: string, status: 'success' | 'warning' | 'error', message: string, details?: Record<string, any>) {
    this.results.push({ category, status, message, details });
  }

  private async checkEnvironmentConfig(): Promise<void> {
    try {
      const validation = validateEnvironment();
      
      if (validation.isValid) {
        this.addResult('Environment', 'success', 'Configuración de entorno válida', {
          databaseType: environment.databaseConfig.type,
          useAuth: environment.appConfig.useAuth,
          cacheType: environment.cacheConfig.type
        });
      } else {
        this.addResult('Environment', 'error', 'Errores en configuración de entorno', {
          errors: validation.errors
        });
      }
    } catch (error) {
      this.addResult('Environment', 'error', 'Error al validar configuración', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async checkDatabaseConnection(): Promise<void> {
    try {
      const factory = DatabaseFactory.getInstance();
      const config = factory.getCurrentConfig();

      this.addResult('Database', config.isConfigured ? 'success' : 'warning', 
        `Base de datos: ${config.type}`, {
          configured: config.isConfigured,
          details: config.details
        });

    } catch (error) {
      this.addResult('Database', 'error', 'Error en configuración de base de datos', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async checkRepositories(): Promise<void> {
    try {
      const container = RepositoryContainer.getInstance();
      
      // Test Student Repository
      const students = await container.students.findAll();
      this.addResult('Repositories', 'success', `Repositorio de estudiantes funcionando`, {
        studentsFound: students.length
      });

      // Test Candidate Repository  
      const candidates = await container.candidates.findAll();
      this.addResult('Repositories', 'success', `Repositorio de candidatos funcionando`, {
        candidatesFound: candidates.length
      });

      // Test Vote Repository
      const currentMonth = new Date().toLocaleString('es', { month: 'long' });
      const currentYear = new Date().getFullYear();
      const votes = await container.votes.findByPeriod(currentMonth, currentYear);
      this.addResult('Repositories', 'success', `Repositorio de votos funcionando`, {
        votesFound: votes.length,
        period: `${currentMonth} ${currentYear}`
      });

    } catch (error) {
      this.addResult('Repositories', 'error', 'Error en repositorios', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async checkCacheService(): Promise<void> {
    try {
      const container = RepositoryContainer.getInstance();
      const cache = container.cache;

      // Test cache functionality
      const testKey = 'diagnostic-test';
      const testValue = { test: true, timestamp: Date.now() };

      await cache.set(testKey, testValue, 10);
      const retrieved = await cache.get(testKey);

      if (retrieved && JSON.stringify(retrieved) === JSON.stringify(testValue)) {
        this.addResult('Cache', 'success', 'Servicio de cache funcionando correctamente');
        
        // Cleanup test data
        await cache.invalidate(testKey);
      } else {
        this.addResult('Cache', 'warning', 'Cache no retorna datos correctamente');
      }

    } catch (error) {
      this.addResult('Cache', 'error', 'Error en servicio de cache', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async checkDataIntegrity(): Promise<void> {
    try {
      const container = RepositoryContainer.getInstance();
      
      // Verificar que hay candidatos disponibles
      const candidates = await container.candidates.findAll();
      if (candidates.length === 0) {
        this.addResult('Data Integrity', 'warning', 'No hay candidatos disponibles para votar');
      } else {
        this.addResult('Data Integrity', 'success', `${candidates.length} candidatos disponibles`);
      }

      // Verificar estructura de datos de candidatos
      const sampleCandidate = candidates[0];
      if (sampleCandidate) {
        const hasRequiredFields = sampleCandidate.id && 
                                  sampleCandidate.firstName && 
                                  sampleCandidate.lastName;
        
        if (hasRequiredFields) {
          this.addResult('Data Integrity', 'success', 'Estructura de candidatos válida');
        } else {
          this.addResult('Data Integrity', 'error', 'Estructura de candidatos inválida', {
            sampleCandidate: {
              id: sampleCandidate.id,
              firstName: sampleCandidate.firstName,
              lastName: sampleCandidate.lastName
            }
          });
        }
      }

      // Si está en modo auth, verificar estudiantes
      if (environment.appConfig.useAuth) {
        const students = await container.students.findAll();
        if (students.length === 0) {
          this.addResult('Data Integrity', 'warning', 'Modo auth habilitado pero no hay estudiantes');
        } else {
          this.addResult('Data Integrity', 'success', `${students.length} estudiantes registrados`);
        }
      }

    } catch (error) {
      this.addResult('Data Integrity', 'error', 'Error verificando integridad de datos', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Ejecuta diagnósticos específicos para API routes
   */
  async checkApiRoutes(): Promise<DiagnosticResult[]> {
    const apiResults: DiagnosticResult[] = [];

    try {
      // Test candidates API
      const candidatesResponse = await fetch('/api/candidates');
      if (candidatesResponse.ok) {
        const candidates = await candidatesResponse.json();
        apiResults.push({
          category: 'API Routes',
          status: 'success',
          message: 'API de candidatos funcionando',
          details: { candidatesFound: candidates.length }
        });
      } else {
        apiResults.push({
          category: 'API Routes',
          status: 'error',
          message: `API de candidatos falló: ${candidatesResponse.status}`,
        });
      }

      // Test auth API (solo si está habilitado)
      if (environment.appConfig.useAuth) {
        const authResponse = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'test', password: 'test' })
        });

        if (authResponse.ok) {
          apiResults.push({
            category: 'API Routes',
            status: 'success',
            message: 'API de autenticación respondiendo',
          });
        } else {
          apiResults.push({
            category: 'API Routes',
            status: 'warning',
            message: `API de autenticación falló: ${authResponse.status}`,
          });
        }
      }

      // Test votes API
      const votesResponse = await fetch('/api/votes?mes=enero&ano=2025');
      if (votesResponse.ok) {
        apiResults.push({
          category: 'API Routes',
          status: 'success',
          message: 'API de votos funcionando',
        });
      } else {
        apiResults.push({
          category: 'API Routes',
          status: 'error',
          message: `API de votos falló: ${votesResponse.status}`,
        });
      }

    } catch (error) {
      apiResults.push({
        category: 'API Routes',
        status: 'error',
        message: 'Error al probar API routes',
        details: { error: error instanceof Error ? error.message : String(error) }
      });
    }

    return apiResults;
  }

  /**
   * Genera un reporte completo del sistema
   */
  async generateReport(): Promise<{
    summary: {
      total: number;
      success: number;
      warning: number;
      error: number;
    };
    results: DiagnosticResult[];
    systemInfo: {
      databaseType: string;
      cacheType: string;
      authEnabled: boolean;
      environment: string;
    };
  }> {
    const results = await this.runAll();
    
    const summary = {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      warning: results.filter(r => r.status === 'warning').length,
      error: results.filter(r => r.status === 'error').length,
    };

    const systemInfo = {
      databaseType: environment.databaseConfig.type,
      cacheType: environment.cacheConfig.type,
      authEnabled: environment.appConfig.useAuth,
      environment: environment.appConfig.environment,
    };

    return {
      summary,
      results,
      systemInfo
    };
  }
}

/**
 * Helper function para ejecutar diagnósticos rápidos
 */
export async function runQuickDiagnostics(): Promise<DiagnosticResult[]> {
  const diagnostics = new SystemDiagnostics();
  return await diagnostics.runAll();
}

/**
 * Helper function para obtener estado del sistema
 */
export async function getSystemStatus(): Promise<{
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details: any;
}> {
  try {
    const results = await runQuickDiagnostics();
    
    const hasErrors = results.some(r => r.status === 'error');
    const hasWarnings = results.some(r => r.status === 'warning');

    if (hasErrors) {
      return {
        status: 'error',
        message: 'Sistema con errores críticos',
        details: results.filter(r => r.status === 'error')
      };
    }

    if (hasWarnings) {
      return {
        status: 'warning',
        message: 'Sistema funcionando con advertencias',
        details: results.filter(r => r.status === 'warning')
      };
    }

    return {
      status: 'healthy',
      message: 'Sistema funcionando correctamente',
      details: results
    };

  } catch (error) {
    return {
      status: 'error',
      message: 'Error al verificar estado del sistema',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}