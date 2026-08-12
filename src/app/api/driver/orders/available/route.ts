export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { ListAvailableOrdersForDrivers } from '@/application/use-cases/driver/ListAvailableOrdersForDrivers';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';

const listAvailableOrders = new ListAvailableOrdersForDrivers();

export async function GET() {
  try {
    await requireUser(['DRIVER', 'ADMIN']);

    const orders = await listAvailableOrders.execute();
    return NextResponse.json({ orders });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al obtener pedidos disponibles' },
      { status: 500 }
    );
  }
}
