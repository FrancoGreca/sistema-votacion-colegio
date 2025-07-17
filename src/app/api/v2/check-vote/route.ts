// src/app/api/v2/check-vote/route.ts
import { NextRequest } from 'next/server';
import { VoteController } from '../../../../application/controllers/Controllers';
import { rateLimitMiddleware, cacheMiddleware } from '../../../../application/middleware/middleware';
import { generateCacheKey } from '../../../../application/middleware/middleware';

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = rateLimitMiddleware(15, 60000)(request); // 15 checks per minute
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Cache con TTL corto (30 segundos) para check de votos
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