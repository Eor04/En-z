import prisma from '@/infrastructure/db/prisma';
import { puedeSalirAlPool } from '@/application/services/order-batch';

/**
 * Pedidos disponibles para los repartidores.
 *
 * Se agrupan por `batchCode`: un pedido multi-comercio es UN viaje con varias
 * paradas, no varios pedidos sueltos. El lote sólo aparece cuando TODAS sus
 * cocinas terminaron; si una sigue preparando, el repartidor no lo ve todavía
 * (antes se le mostraba la comanda lista y viajaba dos veces al mismo patio).
 */

export interface DriverPickup {
  businessId: string;
  businessName: string;
  spaceName: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  orderId: string;
  items: Array<{ name: string; quantity: number }>;
  subtotal: number;
}

export class ListAvailableOrdersForDrivers {
  async execute() {
    // 1. Comandas listas, sin repartidor y con el pago resuelto
    const candidatas = await prisma.order.findMany({
      where: {
        driverId: null,
        status: 'buscando_driver',
        OR: [{ payment: { status: 'APPROVED' } }, { payment: { method: 'CASH' } }],
      },
      include: {
        business: { include: { space: true } },
        customer: { select: { id: true, name: true, phone: true } },
        items: { include: { product: true } },
        payment: true,
        tracking: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (candidatas.length === 0) return { groups: [], orders: [] };

    // 2. Para los lotes hay que mirar TODAS las comandas hermanas, incluso las
    //    que siguen en cocina: son las que bloquean la salida del repartidor.
    const batchCodes = Array.from(
      new Set(candidatas.map((o) => o.batchCode).filter((c): c is string => Boolean(c)))
    );

    const hermanas = batchCodes.length
      ? await prisma.order.findMany({
          where: { batchCode: { in: batchCodes } },
          select: {
            id: true,
            batchCode: true,
            status: true,
            driverId: true,
            business: { select: { name: true } },
          },
        })
      : [];

    const porLote: Record<string, typeof hermanas> = {};
    hermanas.forEach((h) => {
      if (!h.batchCode) return;
      (porLote[h.batchCode] ??= []).push(h);
    });

    // 3. Armar los grupos
    const grupos: Record<string, typeof candidatas> = {};
    candidatas.forEach((orden) => {
      // Sin batchCode cada pedido es su propio grupo
      const clave = orden.batchCode ?? `single:${orden.id}`;
      (grupos[clave] ??= []).push(orden);
    });

    const resultado: any[] = [];

    Object.keys(grupos).forEach((clave) => {
      const ordenes = grupos[clave];
      const batchCode = ordenes[0].batchCode;

      if (batchCode) {
        const todas = porLote[batchCode] ?? [];

        // Si alguna cocina sigue trabajando, el lote todavía no sale
        if (!puedeSalirAlPool(todas)) return;

        // Y todas las comandas activas tienen que estar entre las candidatas
        const activas = todas.filter((o) => o.status !== 'cancelado');
        if (activas.length !== ordenes.length) return;
      }

      const pickups: DriverPickup[] = ordenes.map((o) => ({
        businessId: o.businessId,
        businessName: o.business?.name ?? 'Local',
        spaceName: o.business?.space?.name ?? null,
        address: o.business?.address ?? null,
        googleMapsUrl: o.business?.googleMapsUrl ?? null,
        latitude: o.business?.latitude ?? null,
        longitude: o.business?.longitude ?? null,
        phone: o.business?.ownerPhone ?? null,
        orderId: o.id,
        items: o.items.map((i: any) => ({
          name: i.product?.name ?? 'Producto',
          quantity: i.quantity,
        })),
        subtotal: o.totalPrice - o.deliveryFee,
      }));

      const principal = ordenes[0];

      resultado.push({
        // Clave estable para la interfaz del repartidor
        groupId: clave,
        batchCode,
        isMultiStore: ordenes.length > 1,
        pickupCount: ordenes.length,
        orderIds: ordenes.map((o) => o.id),

        // Lo que el repartidor necesita ver de un vistazo
        pickups,
        customer: principal.customer,
        deliveryAddress: principal.deliveryAddress,
        customerPhone: principal.customerPhone,
        notes: principal.notes,
        createdAt: principal.createdAt,

        // Un solo envío por viaje, aunque haya varias comandas
        deliveryFee: principal.deliveryFee,
        productsTotal: ordenes.reduce((s, o) => s + (o.totalPrice - o.deliveryFee), 0),
        totalPrice: ordenes.reduce((s, o) => s + o.totalPrice, 0),
        paymentMethod: principal.payment?.method ?? null,
        paymentStatus: principal.payment?.status ?? null,

        orders: ordenes,
      });
    });

    return {
      groups: resultado,
      // Plano, por si algo más consume la lista suelta
      orders: resultado.reduce<any[]>((acc, g) => acc.concat(g.orders), []),
    };
  }
}
