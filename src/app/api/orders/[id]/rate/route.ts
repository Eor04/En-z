import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
      include: { driver: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'La orden no existe' }, { status: 404 });
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
    return NextResponse.json(
      { error: error.message || 'Error al calificar el repartidor' },
      { status: 500 }
    );
  }
}
