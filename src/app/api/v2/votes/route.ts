// src/app/api/v2/votes/route.ts
import { NextRequest } from 'next/server';
import { VoteController } from '../../../../application/controllers/Controllers';
import { rateLimitMiddleware, cacheMiddleware } from '../../../../application/middleware/middleware';
import { generateCacheKey } from '../../../../application/middleware/middleware';
import { getCacheConfig } from '../../../../config/environment';

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = rateLimitMiddleware(30, 60000)(request); // 30 requests per minute
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Cache para votos (menor TTL porque cambian más frecuentemente)
  const cacheConfig = getCacheConfig();
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get('mes') || '';
  const ano = searchParams.get('ano') || '';

  const cacheHandler = cacheMiddleware({
    ttl: cacheConfig.ttl.votes, // 1 minuto por defecto
    keyGenerator: (req) => generateCacheKey('votes', { mes, ano }),
  });

  return await cacheHandler(request, async () => {
    return await VoteController.getVotes(request);
  });
}

export async function POST(request: NextRequest) {
  // Rate limiting más estricto para votos
  const rateLimitResponse = rateLimitMiddleware(3, 60000)(request); // 3 votos por minuto
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return await VoteController.castVote(request);
}

export async function DELETE(request: NextRequest) {
  // Rate limiting para eliminación de votos (admin)
  const rateLimitResponse = rateLimitMiddleware(2, 300000)(request); // 2 por 5 minutos
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return await VoteController.clearVotes(request);
}