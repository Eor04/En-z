export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { GetPlatformMetrics } from '@/application/use-cases/admin/GetPlatformMetrics';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';

const getPlatformMetrics = new GetPlatformMetrics();

export async function GET() {
  try {
    await requireUser(['ADMIN']);

    const metrics = await getPlatformMetrics.execute();
    return NextResponse.json(metrics);
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al obtener métricas de la plataforma' },
      { status: 500 }
    );
  }
}
