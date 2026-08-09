export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/services/auth/auth-options';
import { CompleteOrderDelivery } from '@/application/use-cases/driver/CompleteOrderDelivery';

const completeOrderDelivery = new CompleteOrderDelivery();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const driverId = body.driverId || (session?.user as any)?.id;
    if (!driverId) {
      return NextResponse.json(
        { error: 'ID de repartidor requerido' },
        { status: 400 }
      );
    }

    const result = await completeOrderDelivery.execute({
      orderId: body.orderId,
      driverId,
      notes: body.notes,
      rating: body.rating ? Number(body.rating) : undefined,
      review: body.review,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al completar la entrega del pedido' },
      { status: 400 }
    );
  }
}
