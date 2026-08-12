export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';
import { AcceptOrderAssignment } from '@/application/use-cases/driver/AcceptOrderAssignment';

const acceptOrderAssignment = new AcceptOrderAssignment();

export async function POST(req: Request) {
  try {
    // El repartidor sale de la sesión: aceptar `body.driverId` permitía
    // tomar pedidos en nombre de otro repartidor.
    const driver = await requireUser(['DRIVER', 'ADMIN']);
    const body = await req.json();
    const driverId = driver.id;

    const result = await acceptOrderAssignment.execute({
      orderId: body.orderId,
      driverId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al aceptar asignación de pedido' },
      { status: 400 }
    );
  }
}
