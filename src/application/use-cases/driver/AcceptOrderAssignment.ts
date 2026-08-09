import prisma from '@/infrastructure/db/prisma';
import { realtimeEventBus } from '@/infrastructure/services/events/realtime-event-bus';

export interface AcceptOrderInput {
  orderId: string;
  driverId: string;
}

export class AcceptOrderAssignment {
  async execute(input: AcceptOrderInput) {
    const { orderId, driverId } = input;

    if (!orderId || !driverId) {
      throw new Error('orderId y driverId son requeridos');
    }

    // 1. Validar que el repartidor existe
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new Error('El repartidor no existe en la base de datos');
    }

    // 2. Validar orden y conflicto de asignación atómica
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { business: true, payment: true },
    });

    if (!order) {
      throw new Error('La orden especificada no existe');
    }

    if (order.driverId && order.driverId !== driverId) {
      throw new Error('Este pedido ya fue tomado por otro repartidor');
    }

    if (order.status === 'entregado' || order.status === 'cancelado') {
      throw new Error(`No se puede tomar un pedido en estado "${order.status}"`);
    }

    // 3. Asignación atómica y actualización de tracking
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          driverId,
          status: 'en_camino',
          updatedAt: new Date(),
        },
        include: {
          business: {
            include: { space: true },
          },
          customer: {
            select: { id: true, name: true, phone: true },
          },
          items: {
            include: { product: true },
          },
          payment: true,
          tracking: true,
          driver: {
            select: { id: true, name: true, phone: true, driverCode: true },
          },
        },
      });

      await tx.orderTracking.upsert({
        where: { orderId },
        update: { pickedUpAt: new Date() },
        create: { orderId, pickedUpAt: new Date() },
      });

      return updatedOrder;
    });

    // 4. Emitir eventos SSE a tienda, cliente, pool de drivers y admin
    realtimeEventBus.publish(`store:${result.businessId}`, 'order:driver_assigned', {
      orderId,
      businessId: result.businessId,
      driverId,
      driverName: result.driver?.name || 'Repartidor Asignado',
      driverCode: result.driver?.driverCode || '',
      driverPhone: result.driver?.phone || '',
      status: 'en_camino',
    });

    realtimeEventBus.publish(`order:${orderId}`, 'order:driver_assigned', {
      orderId,
      driverId,
      driverName: result.driver?.name || 'Repartidor Asignado',
      driverCode: result.driver?.driverCode || '',
      driverPhone: result.driver?.phone || '',
      status: 'en_camino',
    });

    realtimeEventBus.publish('driver:pool', 'order:driver_assigned', {
      orderId,
      claimedByDriverId: driverId,
    });

    return {
      success: true,
      message: `Pedido ORD-${orderId.slice(0, 6).toUpperCase()} asignado con éxito. ¡En camino a entregar!`,
      order: result,
    };
  }
}
