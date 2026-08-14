import { IOrderRepository } from '@/domain/repositories/IOrderRepository';
import prisma from '@/infrastructure/db/prisma';

export class GetOrderDetails {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string) {
    const rawOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
        business: {
          include: { space: true },
        },
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        driver: {
          select: {
            id: true,
            name: true,
            driverCode: true,
            phone: true,
            // Última posición reportada, para el mapa en vivo del cliente
            driverLat: true,
            driverLng: true,
            driverLocationAt: true,
          },
        },
        payment: true,
        tracking: true,
      },
    });

    if (!rawOrder) {
      throw new Error('Orden no encontrada');
    }

    // Si la orden pertenece a un lote multi-comercio, recuperar las órdenes vinculadas
    let batchOrders: any[] = [];
    if (rawOrder.batchCode) {
      batchOrders = await prisma.order.findMany({
        where: { batchCode: rawOrder.batchCode },
        include: {
          items: {
            include: { product: true },
          },
          business: {
            include: { space: true },
          },
          payment: true,
          tracking: true,
          driver: {
            select: { id: true, name: true, driverCode: true, phone: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    const todas = batchOrders.length > 0 ? batchOrders : [rawOrder];

    /* Avance del lote: el cliente ve UN pedido aunque por detrás haya una
       comanda por cocina. Necesita saber cuáles ya salieron y a cuál falta. */
    const activas = todas.filter((o: any) => o.status !== 'cancelado');
    const listas = todas.filter((o: any) =>
      ['buscando_driver', 'en_camino', 'entregado'].includes(o.status)
    );
    const pendientes = activas.filter(
      (o: any) => !['buscando_driver', 'en_camino', 'entregado'].includes(o.status)
    );

    /* El pool de repartidores sólo despacha con el pago aprobado (o en
       efectivo, que se cobra al entregar). Si las cocinas terminaron pero el
       comprobante sigue sin verificar, el pedido queda parado: hay que
       decírselo al cliente en vez de mostrar "buscando repartidor". */
    const sinPagar = activas.filter(
      (o: any) => o.payment?.method !== 'CASH' && o.payment?.status !== 'APPROVED'
    );
    const cocinasListas = activas.length > 0 && pendientes.length === 0;

    return {
      ...rawOrder,
      batchOrders: todas,
      isMultiStore: batchOrders.length > 1,
      batch: {
        batchCode: rawOrder.batchCode,
        total: todas.length,
        listas: listas.length,
        pendientes: pendientes.length,
        readyForPickup: cocinasListas,
        esperandoA: pendientes.map((o: any) => o.business?.name ?? 'Local'),
        listasNombres: listas.map((o: any) => o.business?.name ?? 'Local'),
        bloqueadoPorPago: cocinasListas && sinPagar.length > 0,
        pagosPendientes: sinPagar.length,
      },
    };
  }
}
