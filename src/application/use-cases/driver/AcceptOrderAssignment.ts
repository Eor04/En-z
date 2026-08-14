import prisma from '@/infrastructure/db/prisma';
import { realtimeEventBus } from '@/infrastructure/services/events/realtime-event-bus';
import { getBatchOrders } from '@/application/services/order-batch';

export interface AcceptOrderInput {
  orderId: string;
  driverId: string;
}

/**
 * El repartidor toma un pedido.
 *
 * Si el pedido pertenece a un lote multi-comercio se le asignan TODAS las
 * comandas del lote de una sola vez: es un único viaje con varias paradas.
 * Antes cada comanda se tomaba por separado y podían repartirla dos personas.
 */
export class AcceptOrderAssignment {
  async execute(input: AcceptOrderInput) {
    const { orderId, driverId } = input;

    if (!orderId || !driverId) {
      throw new Error('orderId y driverId son requeridos');
    }

    const driver = await prisma.user.findUnique({ where: { id: driverId } });
    if (!driver) {
      throw new Error('El repartidor no existe en la base de datos');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { business: true, payment: true },
    });
    if (!order) {
      throw new Error('La orden especificada no existe');
    }

    // Todas las comandas del mismo pedido
    const hermanas = await getBatchOrders(orderId);
    const activas = hermanas.filter((o: any) => o.status !== 'cancelado');

    const tomadaPorOtro = activas.find(
      (o: any) => o.driverId && o.driverId !== driverId
    );
    if (tomadaPorOtro) {
      throw new Error('Este pedido ya fue tomado por otro repartidor');
    }

    const finalizada = activas.find((o: any) => o.status === 'entregado');
    if (finalizada) {
      throw new Error('Este pedido ya fue entregado');
    }

    // Regla central: no se puede recoger hasta que todas las cocinas terminen
    const enCocina = activas.filter((o: any) => o.status !== 'buscando_driver');
    if (enCocina.length > 0) {
      const nombres = enCocina.map((o: any) => o.business?.name ?? 'un local').join(', ');
      throw new Error(
        `Todavía falta que termine: ${nombres}. El pedido se libera cuando estén los ${activas.length} locales.`
      );
    }

    const idsAAsignar = activas.map((o: any) => o.id);

    // Asignación atómica de todo el lote
    const asignadas = await prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: { id: { in: idsAAsignar }, driverId: null },
        data: { driverId, status: 'en_camino', updatedAt: new Date() },
      });

      for (const id of idsAAsignar) {
        await tx.orderTracking.upsert({
          where: { orderId: id },
          update: { pickedUpAt: new Date() },
          create: { orderId: id, pickedUpAt: new Date() },
        });
      }

      return tx.order.findMany({
        where: { id: { in: idsAAsignar } },
        include: {
          business: { include: { space: true } },
          customer: { select: { id: true, name: true, phone: true } },
          items: { include: { product: true } },
          payment: true,
          tracking: true,
          driver: { select: { id: true, name: true, phone: true, driverCode: true } },
        },
      });
    });

    const principal = asignadas.find((o) => o.id === orderId) ?? asignadas[0];
    const datosDriver = {
      driverId,
      driverName: principal.driver?.name || 'Repartidor asignado',
      driverCode: principal.driver?.driverCode || '',
      driverPhone: principal.driver?.phone || '',
      status: 'en_camino' as const,
    };

    // Avisar a cada tienda y a cada canal de seguimiento del lote
    for (const o of asignadas) {
      realtimeEventBus.publish(`store:${o.businessId}`, 'order:driver_assigned', {
        orderId: o.id,
        businessId: o.businessId,
        ...datosDriver,
      });

      realtimeEventBus.publish(`order:${o.id}`, 'order:driver_assigned', {
        orderId: o.id,
        ...datosDriver,
      });
    }

    realtimeEventBus.publish('driver:pool', 'order:driver_assigned', {
      orderId,
      orderIds: idsAAsignar,
      claimedByDriverId: driverId,
    });

    const esLote = asignadas.length > 1;

    return {
      success: true,
      message: esLote
        ? `Pedido tomado. Recogé en ${asignadas.length} locales antes de salir.`
        : `Pedido ORD-${orderId.slice(0, 6).toUpperCase()} asignado con éxito. ¡En camino!`,
      order: principal,
      orders: asignadas,
      isMultiStore: esLote,
      pickups: asignadas.map((o) => ({
        orderId: o.id,
        businessName: o.business?.name,
        spaceName: o.business?.space?.name ?? null,
        items: o.items.map((i: any) => ({ name: i.product?.name, quantity: i.quantity })),
      })),
    };
  }
}
