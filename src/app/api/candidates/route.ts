// src/app/api/candidates/route.ts - MIGRADO USANDO NUEVA ARQUITECTURA
import { NextRequest } from 'next/server';
import { CandidateController } from '../../../application/controllers/Controllers';
import { rateLimitMiddleware, cacheMiddleware } from '../../../application/middleware/middleware';
import { generateCacheKey } from '../../../application/middleware/middleware';
import { getCacheConfig } from '../../../config/environment';

export async function GET(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResponse = rateLimitMiddleware(20, 60000)(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Aplicar cache
  const cacheConfig = getCacheConfig();
  const cacheHandler = cacheMiddleware({
    ttl: cacheConfig.ttl.candidates,
    keyGenerator: (req) => generateCacheKey('candidates', {}),
  });

  return await cacheHandler(request, async () => {
    return await CandidateController.getCandidates(request);
  });
}

/* 
COMPARACIÓN: ANTES vs DESPUÉS

ANTES (código original):
- Lógica de negocio mezclada con API
- Hardcoded Airtable client
- Sin rate limiting
- Sin cache
- Fallback manual a datos demo
- Manejo básico de errores

DESPUÉS (nueva arquitectura):
- Controladores separados
- Repository pattern
- Rate limiting automático
- Cache configurable
- Fallback automático según configuración
- Manejo tipado de errores
*/