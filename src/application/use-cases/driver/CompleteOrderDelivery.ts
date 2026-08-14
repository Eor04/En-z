import prisma from '@/infrastructure/db/prisma';
import { realtimeEventBus } from '@/infrastructure/services/events/realtime-event-bus';
import { getBatchOrders } from '@/application/services/order-batch';

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

    /* El repartidor hizo UN viaje: si el pedido era multi-comercio se cierran
       todas las comandas que lleva encima, no sólo la que tocó en pantalla. */
    const hermanas = await getBatchOrders(orderId);
    const aEntregar = hermanas.filter(
      (o: any) => o.driverId === driverId && o.status !== 'entregado' && o.status !== 'cancelado'
    );
    const ids = aEntregar.length > 0 ? aEntregar.map((o: any) => o.id) : [orderId];

    const entregadas = await prisma.$transaction(async (tx) => {
      // 1. Los pagos en efectivo pendientes se cobran al entregar
      await tx.payment.updateMany({
        where: { orderId: { in: ids }, method: 'CASH', status: 'PENDING' },
        data: { status: 'APPROVED', updatedAt: new Date() },
      });

      for (const id of ids) {
        await tx.orderTracking.upsert({
          where: { orderId: id },
          update: { deliveredAt: new Date() },
          create: { orderId: id, deliveredAt: new Date() },
        });
      }

      // 2. Marcar entregadas. La calificación y la nota van sólo en la comanda
      //    sobre la que el repartidor confirmó, para no duplicarlas.
      await tx.order.updateMany({
        where: { id: { in: ids } },
        data: { status: 'entregado', updatedAt: new Date() },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          notes: notes ? `${order.notes || ''} [Entrega: ${notes}]` : order.notes,
          driverRating: validRating,
          driverReview: review?.trim() || undefined,
          ratedAt: validRating ? new Date() : undefined,
        },
      });

      return tx.order.findMany({
        where: { id: { in: ids } },
        include: {
          payment: true,
          tracking: true,
          customer: { select: { id: true, name: true, phone: true } },
          business: { select: { id: true, name: true } },
        },
      });
    });

    // 3. Avisar por cada comanda: al cliente y a cada tienda
    for (const o of entregadas) {
      realtimeEventBus.publish(`order:${o.id}`, 'order:delivered', {
        orderId: o.id,
        status: 'entregado',
        driverId,
        deliveredAt: new Date().toISOString(),
      });

      if (o.businessId) {
        realtimeEventBus.publish(`store:${o.businessId}`, 'order:delivered', {
          orderId: o.id,
          status: 'entregado',
          driverId,
        });
      }
    }

    const principal = entregadas.find((o) => o.id === orderId) ?? entregadas[0];

    return {
      success: true,
      message:
        entregadas.length > 1
          ? `¡Entrega confirmada! Se cerraron las ${entregadas.length} comandas del pedido.`
          : '¡Entrega confirmada con éxito en el domicilio del cliente!',
      order: principal,
      orders: entregadas,
    };
  }
}
