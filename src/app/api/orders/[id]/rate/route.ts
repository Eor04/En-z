export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma';
import {
  requireUser,
  requireOwnedOrder,
  authErrorResponse,
} from '@/infrastructure/services/auth/session-guards';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // Sólo el cliente del pedido puede calificar: antes cualquiera podía
    // inflar o hundir la calificación de un repartidor, sin sesión.
    const user = await requireUser(['CUSTOMER', 'ADMIN']);
    const { id } = params;
    await requireOwnedOrder(user, id);

    const body = await req.json();
    const { rating, review } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'La calificación debe ser un valor de 1 a 5 estrellas' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { status: true, driverId: true, driverRating: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'La orden no existe' }, { status: 404 });
    }

    if (!order.driverId) {
      return NextResponse.json(
        { error: 'Este pedido todavía no tiene repartidor asignado.' },
        { status: 400 }
      );
    }

    if (order.status !== 'entregado') {
      return NextResponse.json(
        { error: 'Podés calificar recién cuando el pedido esté entregado.' },
        { status: 400 }
      );
    }

    if (order.driverRating != null && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Este pedido ya fue calificado.' },
        { status: 409 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        driverRating: Math.round(Number(rating)),
        driverReview: review ? String(review).trim() : null,
        ratedAt: new Date(),
      },
      include: {
        driver: { select: { id: true, name: true, driverCode: true } },
        business: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: '¡Gracias por calificar el servicio del repartidor!',
      order: updatedOrder,
    });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al calificar el repartidor' },
      { status: 500 }
    );
  }
}
