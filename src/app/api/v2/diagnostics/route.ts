// src/app/api/v2/diagnostics/route.ts
import { NextRequest } from 'next/server';
import { DiagnosticController } from '../../../../application/controllers/Controllers';
import { rateLimitMiddleware } from '../../../../application/middleware/middleware';

export async function GET(request: NextRequest) {
  // Rate limiting para diagnósticos
  const rateLimitResponse = rateLimitMiddleware(5, 300000)(request); // 5 por 5 minutos
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'status') {
    return await DiagnosticController.getSystemStatus(request);
  }

  return await DiagnosticController.runDiagnostics(request);
}