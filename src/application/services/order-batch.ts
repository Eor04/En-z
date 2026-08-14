import prisma from '@/infrastructure/db/prisma';

/**
 * Lotes multi-comercio.
 *
 * Un pedido con platos de varios locales se guarda como VARIAS órdenes que
 * comparten `batchCode` (una comanda por cocina, que es lo que cada tienda
 * necesita). Pero para el cliente y para el repartidor es UN solo pedido:
 *
 * - El repartidor no debe ver el lote hasta que TODAS las cocinas terminaron,
 *   si no viajaría dos veces al mismo patio.
 * - El cliente debe ver el avance por local ("Don Pepe listo, falta Tokyo").
 *
 * Este módulo concentra esas dos reglas.
 */

/** Estados en los que la comanda ya salió de cocina. */
const LISTO = new Set(['buscando_driver', 'en_camino', 'entregado']);

/** Estados que ya no bloquean al lote (cancelada no frena a las demás). */
const NO_BLOQUEA = new Set([
  'buscando_driver',
  'en_camino',
  'entregado',
  'cancelado',
]);

export interface BatchSibling {
  id: string;
  status: string;
  driverId: string | null;
  businessId: string;
  businessName: string;
  itemCount: number;
  paymentMethod: string | null;
  paymentStatus: string | null;
  /** El pago de esta comanda frena el despacho. */
  pagoPendiente: boolean;
}

export interface BatchProgress {
  batchCode: string | null;
  isMultiStore: boolean;
  total: number;
  /** Comandas que ya salieron de cocina. */
  listas: number;
  /** Comandas todavía en cocina o esperando pago. */
  pendientes: number;
  /** Todas las cocinas terminaron: recién acá el lote va al pool de repartidores. */
  readyForPickup: boolean;
  siblings: BatchSibling[];
  /** Nombres de los locales que faltan, para el mensaje al cliente. */
  esperandoA: string[];
  /** Cocinas listas pero con el pago sin confirmar: el pedido NO se despacha. */
  bloqueadoPorPago: boolean;
  pagosPendientes: number;
}

/**
 * ¿El lote puede salir al pool de repartidores?
 *
 * Función pura para poder probar la regla sin base de datos. Un lote sale
 * cuando todas sus comandas NO canceladas están en `buscando_driver` y ninguna
 * fue tomada ya por un repartidor. Si todas están canceladas, no hay viaje.
 */
export function puedeSalirAlPool(
  siblings: Array<{ status: string; driverId: string | null }>
): boolean {
  const activas = siblings.filter((s) => s.status !== 'cancelado');
  if (activas.length === 0) return false;
  return activas.every((s) => s.status === 'buscando_driver' && !s.driverId);
}

/** Trae todas las comandas del lote (o la sola orden si no es lote). */
export async function getBatchOrders(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { batchCode: true },
  });

  if (!order) return [];

  if (!order.batchCode) {
    const single = await prisma.order.findUnique({
      where: { id: orderId },
      include: { business: { select: { id: true, name: true } }, items: true, payment: true },
    });
    return single ? [single] : [];
  }

  return prisma.order.findMany({
    where: { batchCode: order.batchCode },
    include: { business: { select: { id: true, name: true } }, items: true, payment: true },
    orderBy: { createdAt: 'asc' },
  });
}

/** Resume el avance del lote al que pertenece un pedido. */
export async function getBatchProgress(orderId: string): Promise<BatchProgress> {
  const orders = await getBatchOrders(orderId);

  const siblings: BatchSibling[] = orders.map((o: any) => ({
    id: o.id,
    status: o.status,
    driverId: o.driverId,
    businessId: o.businessId,
    businessName: o.business?.name ?? 'Local',
    itemCount: o.items?.length ?? 0,
    paymentMethod: o.payment?.method ?? null,
    paymentStatus: o.payment?.status ?? null,
    /* El pool sólo despacha con el pago aprobado, o en efectivo (se cobra al
       entregar). Un QR sin verificar deja el pedido parado. */
    pagoPendiente:
      o.payment?.method !== 'CASH' && o.payment?.status !== 'APPROVED',
  }));

  const activas = siblings.filter((s) => s.status !== 'cancelado');
  const listas = siblings.filter((s) => LISTO.has(s.status)).length;
  const pendientes = activas.filter((s) => !LISTO.has(s.status));
  const sinPagar = activas.filter((s) => s.pagoPendiente);

  const cocinasListas = activas.length > 0 && siblings.every((s) => NO_BLOQUEA.has(s.status));

  return {
    batchCode: (orders[0] as any)?.batchCode ?? null,
    isMultiStore: siblings.length > 1,
    total: siblings.length,
    listas,
    pendientes: pendientes.length,
    // Si todas quedaron canceladas no hay nada que recoger
    readyForPickup: cocinasListas,
    siblings,
    esperandoA: pendientes.map((s) => s.businessName),
    /* Las cocinas terminaron pero falta confirmar el pago: el pedido queda
       parado sin que nadie lo note. Hay que decírselo al cliente. */
    bloqueadoPorPago: cocinasListas && sinPagar.length > 0,
    pagosPendientes: sinPagar.length,
  };
}

/** Órdenes del lote que un repartidor debería tomar de una sola vez. */
export async function getBatchOrderIdsToAssign(orderId: string): Promise<string[]> {
  const orders = await getBatchOrders(orderId);
  return orders
    .filter((o: any) => o.status === 'buscando_driver' && !o.driverId)
    .map((o: any) => o.id);
}

export { LISTO as ESTADOS_LISTOS };
