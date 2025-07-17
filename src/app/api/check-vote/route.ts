// src/app/api/check-vote/route.ts - MIGRADO USANDO NUEVA ARQUITECTURA
import { NextRequest } from 'next/server';
import { VoteController } from '../../../application/controllers/Controllers';
import { rateLimitMiddleware, cacheMiddleware } from '../../../application/middleware/middleware';
import { generateCacheKey } from '../../../application/middleware/middleware';

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = rateLimitMiddleware(15, 60000)(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Cache con TTL corto
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') || '';

  const cacheHandler = cacheMiddleware({
    ttl: 30, // 30 segundos
    keyGenerator: (req) => generateCacheKey('check-vote', { username }),
  });

  return await cacheHandler(request, async () => {
    return await VoteController.checkVote(request);
  });
}

/* 
COMPARACIÓN: ANTES vs DESPUÉS

ANTES (código original):
- Lógica de verificación en la ruta
- Consultas directas a Airtable
- Sin cache (consulta repetitiva costosa)
- Manejo manual de fechas
- Sin rate limiting

DESPUÉS (nueva arquitectura):
- Lógica de verificación en controlador
- Abstracción de base de datos
- Cache para reducir consultas repetitivas
- Utilidades centralizadas para fechas
- Rate limiting para prevenir abuso
*/