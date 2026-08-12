export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';
import { CompleteOrderDelivery } from '@/application/use-cases/driver/CompleteOrderDelivery';

const completeOrderDelivery = new CompleteOrderDelivery();

export async function POST(req: Request) {
  try {
    // Igual que al aceptar: la identidad nunca viene del cuerpo
    const driver = await requireUser(['DRIVER', 'ADMIN']);
    const body = await req.json();
    const driverId = driver.id;

    const result = await completeOrderDelivery.execute({
      orderId: body.orderId,
      driverId,
      notes: body.notes,
      rating: body.rating ? Number(body.rating) : undefined,
      review: body.review,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al completar la entrega del pedido' },
      { status: 400 }
    );
  }
}
