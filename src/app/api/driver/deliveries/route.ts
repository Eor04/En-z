export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';
import { ListDriverDeliveries } from '@/application/use-cases/driver/ListDriverDeliveries';
import prisma from '@/infrastructure/db/prisma';

const listDriverDeliveries = new ListDriverDeliveries();

export async function GET(req: Request) {
  try {
    // Antes `?driverId=` dejaba leer las entregas y ganancias de cualquier
    // repartidor, y sin sesión caía al primero de la base.
    const user = await requireUser(['DRIVER', 'ADMIN']);
    const { searchParams } = new URL(req.url);

    const driverId =
      user.role === 'ADMIN' ? (searchParams.get('driverId') ?? user.id) : user.id;

    const data = await listDriverDeliveries.execute(driverId);
    return NextResponse.json(data);
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al obtener entregas del repartidor' },
      { status: 500 }
    );
  }
}
