// src/application/middleware/rateLimiting.ts
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minuto
  ) {
    // Limpiar entradas expiradas cada 5 minutos
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  isAllowed(clientId: string): boolean {
    const now = Date.now();
    const entry = this.requests.get(clientId);

    if (!entry || now > entry.resetTime) {
      // Primera request o ventana expirada
      this.requests.set(clientId, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [clientId, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(clientId);
      }
    }
  }
}

// Instancia global del rate limiter
const globalRateLimiter = new RateLimiter();

export function rateLimitMiddleware(
  maxRequests: number = 10,
  windowMs: number = 60000
) {
  const limiter = new RateLimiter(maxRequests, windowMs);

  return (req: NextRequest): NextResponse | null => {
    // Obtener identificador del cliente
    const clientId = req.ip || 
                     req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    if (!limiter.isAllowed(clientId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please try again later.' 
        },
        { status: 429 }
      );
    }

    return null; // Continúa con la request
  };
}

// src/application/middleware/caching.ts
import { getCacheService } from '../../infrastructure/database/config/RepositoryContainer';

interface CacheOptions {
  ttl: number; // seconds
  keyGenerator?: (req: NextRequest) => string;
  skipCache?: (req: NextRequest) => boolean;
}

export function cacheMiddleware(options: CacheOptions) {
  const { ttl, keyGenerator, skipCache } = options;

  return async (
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    // Skip cache si es POST/PUT/DELETE o si la función skipCache lo indica
    if (req.method !== 'GET' || (skipCache && skipCache(req))) {
      return await handler();
    }

    const cache = getCacheService();
    const cacheKey = keyGenerator ? 
      keyGenerator(req) : 
      `${req.url}-${req.method}`;

    try {
      // Intentar obtener del cache
      const cachedResponse = await cache.get<any>(cacheKey);
      if (cachedResponse) {
        return NextResponse.json(cachedResponse, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': `max-age=${ttl}`
          }
        });
      }

      // No está en cache, ejecutar handler
      const response = await handler();
      
      // Solo cachear respuestas exitosas
      if (response.ok) {
        const responseData = await response.json();
        await cache.set(cacheKey, responseData, ttl);
        
        return NextResponse.json(responseData, {
          headers: {
            'X-Cache': 'MISS',
            'Cache-Control': `max-age=${ttl}`
          }
        });
      }

      return response;

    } catch (error) {
      console.error('Cache middleware error:', error);
      // En caso de error en cache, continuar sin cache
      return await handler();
    }
  };
}

// src/application/middleware/errorHandling.ts
import { 
  DomainError, 
  ValidationError, 
  NotFoundError, 
  AuthenticationError, 
  VotingError 
} from '../../core/errors/DomainErrors';

export function errorHandler(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        code: error.code 
      },
      { status: 400 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        code: error.code 
      },
      { status: 404 }
    );
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        code: error.code 
      },
      { status: 401 }
    );
  }

  if (error instanceof VotingError) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        code: error.code 
      },
      { status: 400 }
    );
  }

  if (error instanceof DomainError) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        code: error.code 
      },
      { status: 400 }
    );
  }

  // Error genérico
  return NextResponse.json(
    { 
      success: false, 
      error: 'Internal server error' 
    },
    { status: 500 }
  );
}

// src/application/middleware/utils.ts
export function getClientId(req: NextRequest): string {
  return req.ip || 
         req.headers.get('x-forwarded-for')?.split(',')[0] || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

export function generateCacheKey(prefix: string, params: Record<string, string>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return `${prefix}:${sortedParams}`;
}

export function isValidRequest(req: NextRequest, requiredFields: string[]): boolean {
  const body = req.json();
  return requiredFields.every(field => 
    body && typeof body === 'object' && field in body
  );
}