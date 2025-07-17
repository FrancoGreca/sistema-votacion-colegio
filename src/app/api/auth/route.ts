// src/app/api/auth/route.ts - MIGRADO USANDO NUEVA ARQUITECTURA
import { NextRequest } from 'next/server';
import { AuthController } from '../../../application/controllers/Controllers';
import { rateLimitMiddleware } from '../../../application/middleware/middleware';

export async function POST(request: NextRequest) {
  // Rate limiting más estricto para autenticación
  const rateLimitResponse = rateLimitMiddleware(5, 60000)(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return await AuthController.authenticate(request);
}

/* 
COMPARACIÓN: ANTES vs DESPUÉS

ANTES (código original):
- Llamadas directas a Airtable
- Lógica de autenticación en la ruta
- Sin rate limiting (vulnerable a ataques de fuerza bruta)
- Manejo manual de modo demo
- Validación básica

DESPUÉS (nueva arquitectura):
- Repository pattern con abstracción de DB
- Lógica de autenticación en controlador
- Rate limiting para prevenir ataques
- Manejo automático de diferentes tipos de DB
- Validación tipada y manejo robusto de errores
*/