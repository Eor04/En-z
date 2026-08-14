import prisma from '@/infrastructure/db/prisma';

/**
 * Métricas globales de la plataforma.
 *
 * Antes traía TODOS los usuarios y TODOS los pedidos a memoria (con su pago y
 * su comercio) sólo para contarlos con `.filter()`. Con unos miles de pedidos
 * eso son megabytes por cada carga del panel. Ahora cuenta y suma en Postgres,
 * que es donde están los índices.
 */
export class GetPlatformMetrics {
  async execute() {
    const ACTIVOS = ['en_preparacion', 'buscando_driver', 'en_camino'] as const;

    const [
      usuariosPorRol,
      totalUsuarios,
      totalSpaces,
      totalBusinesses,
      openBusinesses,
      pedidosPorEstado,
      totalOrders,
      entregados,
      pagosPorMetodo,
      ventasPorComercio,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.user.count(),

      prisma.space.count(),
      prisma.business.count(),
      prisma.business.count({ where: { isOpen: true } }),

      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.order.count(),

      // GMV y comisiones sólo de lo efectivamente entregado
      prisma.order.aggregate({
        where: { status: 'entregado' },
        _sum: { totalPrice: true, deliveryFee: true },
        _count: { _all: true },
      }),

      prisma.payment.groupBy({ by: ['method'], _count: { _all: true } }),

      // Top comercios: agregado en la base y limitado a 5
      prisma.order.groupBy({
        by: ['businessId'],
        where: { status: 'entregado' },
        _sum: { totalPrice: true },
        _count: { _all: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 5,
      }),
    ]);

    const contarRol = (rol: string) =>
      usuariosPorRol.find((u) => u.role === rol)?._count._all ?? 0;

    const contarEstado = (estado: string) =>
      pedidosPorEstado.find((o) => o.status === estado)?._count._all ?? 0;

    const contarMetodo = (metodo: string) =>
      pagosPorMetodo.find((p) => p.method === metodo)?._count._all ?? 0;

    const totalGmv = entregados._sum.totalPrice ?? 0;
    const totalDeliveryFees = entregados._sum.deliveryFee ?? 0;
    const completados = entregados._count._all;

    // Sólo acá se consultan nombres, y como mucho de 5 comercios
    const nombres = await prisma.business.findMany({
      where: { id: { in: ventasPorComercio.map((v) => v.businessId) } },
      select: { id: true, name: true },
    });

    const topBusinesses = ventasPorComercio.map((v) => ({
      name: nombres.find((n) => n.id === v.businessId)?.name ?? 'Local',
      count: v._count._all,
      total: v._sum.totalPrice ?? 0,
    }));

    return {
      financials: {
        totalGmv,
        totalDeliveryFees,
        totalProductsRevenue: totalGmv - totalDeliveryFees,
        avgTicket: completados > 0 ? totalGmv / completados : 0,
      },
      orders: {
        total: totalOrders,
        completed: completados,
        active: ACTIVOS.reduce((s, e) => s + contarEstado(e), 0),
        pendingPayment: contarEstado('esperando_pago'),
        cancelled: contarEstado('cancelado'),
      },
      catalog: {
        spaces: totalSpaces,
        businesses: totalBusinesses,
        openBusinesses,
      },
      users: {
        total: totalUsuarios,
        customers: contarRol('CUSTOMER'),
        businessOwners: contarRol('BUSINESS_OWNER'),
        drivers: contarRol('DRIVER'),
        admins: contarRol('ADMIN'),
      },
      paymentMethods: {
        QR_MANUAL: contarMetodo('QR_MANUAL'),
        GATEWAY_ONLINE: contarMetodo('GATEWAY_ONLINE'),
        CASH: contarMetodo('CASH'),
      },
      topBusinesses,
    };
  }
}
