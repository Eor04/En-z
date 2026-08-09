import { NextResponse } from 'next/server';
import { GetPlatformMetrics } from '@/application/use-cases/admin/GetPlatformMetrics';

const getPlatformMetrics = new GetPlatformMetrics();

export async function GET() {
  try {
    const metrics = await getPlatformMetrics.execute();
    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener métricas de la plataforma' },
      { status: 500 }
    );
  }
}
