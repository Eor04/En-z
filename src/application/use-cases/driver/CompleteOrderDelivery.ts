import prisma from '@/infrastructure/db/prisma';
import { realtimeEventBus } from '@/infrastructure/services/events/realtime-event-bus';

export interface CompleteDeliveryInput {
  orderId: string;
  driverId: string;
  notes?: string;
  rating?: number;
  review?: string;
}

export class CompleteOrderDelivery {
  async execute(input: CompleteDeliveryInput) {
    const { orderId, driverId, notes, rating, review } = input;

    if (!orderId || !driverId) {
      throw new Error('orderId y driverId son requeridos');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new Error('La orden no existe');
    }

    if (order.driverId !== driverId) {
      throw new Error('No estás autorizado para finalizar un pedido asignado a otro repartidor');
    }

    if (order.status === 'entregado') {
      throw new Error('Esta orden ya fue marcada como entregada previamente');
    }

    const validRating = rating && rating >= 1 && rating <= 5 ? Math.round(rating) : undefined;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Si el pago era en efectivo (CASH) y estaba PENDING, marcarlo como APPROVED
      if (order.payment && order.payment.method === 'CASH' && order.payment.status === 'PENDING') {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: 'APPROVED',
            updatedAt: new Date(),
          },
        });
      }

      // 2. Actualizar tracking deliveredAt
      await tx.orderTracking.upsert({
        where: { orderId },
        update: { deliveredAt: new Date() },
        create: { orderId, deliveredAt: new Date() },
      });

      // 3. Actualizar orden a 'entregado' con posible calificación
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'entregado',
          notes: notes ? `${order.notes || ''} [Entrega: ${notes}]` : order.notes,
          driverRating: validRating,
          driverReview: review?.trim() || undefined,
          ratedAt: validRating ? new Date() : undefined,
          updatedAt: new Date(),
        },
        include: {
          payment: true,
          tracking: true,
          customer: { select: { id: true, name: true, phone: true } },
          business: { select: { id: true, name: true } },
        },
      });

      return updatedOrder;
    });

    // 4. Emitir eventos SSE de entrega completada en tiempo real
    realtimeEventBus.publish(`order:${orderId}`, 'order:delivered', {
      orderId,
      status: 'entregado',
      driverId,
      deliveredAt: new Date().toISOString(),
    });

    if (result.businessId || result.business?.id) {
      realtimeEventBus.publish(`store:${result.businessId || result.business?.id}`, 'order:delivered', {
        orderId,
        status: 'entregado',
        driverId,
      });
    }

    return {
      success: true,
      message: '¡Entrega confirmada con éxito en el domicilio del cliente!',
      order: result,
    };
  }
}
