// src/app/api/v2/candidates/route.ts
import { NextRequest } from 'next/server';
import { CandidateController } from '../../../../application/controllers/Controllers.ts';
import { rateLimitMiddleware, cacheMiddleware } from '../../../../application/middleware/middleware';
import { generateCacheKey } from '../../../../application/middleware/middleware';
import { getCacheConfig } from '../../../../config/environment';

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = rateLimitMiddleware(20, 60000)(request); // 20 requests per minute
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Cache middleware
  const cacheConfig = getCacheConfig();
  const cacheHandler = cacheMiddleware({
    ttl: cacheConfig.ttl.candidates, // 5 minutos por defecto
    keyGenerator: (req) => generateCacheKey('candidates', {}),
  });

  return await cacheHandler(request, async () => {
    return await CandidateController.getCandidates(request);
  });
}