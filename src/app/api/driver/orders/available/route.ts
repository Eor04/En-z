export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { ListAvailableOrdersForDrivers } from '@/application/use-cases/driver/ListAvailableOrdersForDrivers';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';

const listAvailableOrders = new ListAvailableOrdersForDrivers();

export async function GET() {
  try {
    await requireUser(['DRIVER', 'ADMIN']);

    /* execute() ya devuelve { groups, orders }: envolverlo otra vez dejaba el
       panel del repartidor leyendo `groups` en el nivel equivocado. */
    const { groups, orders } = await listAvailableOrders.execute();
    return NextResponse.json({ groups, orders });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al obtener pedidos disponibles' },
      { status: 500 }
    );
  }
}
