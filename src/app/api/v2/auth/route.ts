// src/app/api/v2/auth/route.ts
import { NextRequest } from 'next/server';
import { AuthController } from '../../../../application/controllers/Controllers';
import { rateLimitMiddleware } from '../../../../application/middleware/middleware';

export async function POST(request: NextRequest) {
  // Rate limiting más estricto para autenticación
  const rateLimitResponse = rateLimitMiddleware(5, 60000)(request); // 5 intentos por minuto
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return await AuthController.authenticate(request);
}