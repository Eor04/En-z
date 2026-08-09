import prisma from '@/infrastructure/db/prisma';

export class GetPlatformMetrics {
  async execute() {
    // 1. Conteo de usuarios por rol
    const users = await prisma.user.findMany({
      select: { id: true, role: true, createdAt: true },
    });

    const userStats = {
      total: users.length,
      customers: users.filter((u) => u.role === 'CUSTOMER').length,
      businessOwners: users.filter((u) => u.role === 'BUSINESS_OWNER').length,
      drivers: users.filter((u) => u.role === 'DRIVER').length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
    };

    // 2. Conteo de Espacios y Comercios
    const [totalSpaces, totalBusinesses, openBusinesses] = await Promise.all([
      prisma.space.count(),
      prisma.business.count(),
      prisma.business.count({ where: { isOpen: true } }),
    ]);

    // 3. Órdenes y Métricas Financieras (GMV)
    const orders = await prisma.order.findMany({
      include: {
        payment: true,
        business: {
          select: { id: true, name: true },
        },
      },
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'entregado');
    const activeOrders = orders.filter((o) => ['en_preparacion', 'buscando_driver', 'en_camino'].includes(o.status));
    const pendingPaymentOrders = orders.filter((o) => o.status === 'esperando_pago');
    const cancelledOrders = orders.filter((o) => o.status === 'cancelado');

    // GMV: Total de dinero procesado en ventas entregadas/aprobadas
    const totalGmv = completedOrders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
    const totalDeliveryFees = completedOrders.reduce((sum, o) => sum + Number(o.deliveryFee || 10), 0);
    const totalProductsRevenue = totalGmv - totalDeliveryFees;

    // Desglose por método de pago
    const paymentMethods = {
      QR_MANUAL: orders.filter((o) => o.payment?.method === 'QR_MANUAL').length,
      GATEWAY_ONLINE: orders.filter((o) => o.payment?.method === 'GATEWAY_ONLINE').length,
      CASH: orders.filter((o) => o.payment?.method === 'CASH').length,
    };

    // Top comercios con más ventas
    const salesByBusinessMap: Record<string, { name: string; count: number; total: number }> = {};
    for (const o of completedOrders) {
      const bId = o.businessId;
      const bName = o.business?.name || 'Local';
      if (!salesByBusinessMap[bId]) {
        salesByBusinessMap[bId] = { name: bName, count: 0, total: 0 };
      }
      salesByBusinessMap[bId].count += 1;
      salesByBusinessMap[bId].total += Number(o.totalPrice || 0);
    }

    const topBusinesses = Object.values(salesByBusinessMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      financials: {
        totalGmv,
        totalDeliveryFees,
        totalProductsRevenue,
        avgTicket: completedOrders.length > 0 ? totalGmv / completedOrders.length : 0,
      },
      orders: {
        total: totalOrders,
        completed: completedOrders.length,
        active: activeOrders.length,
        pendingPayment: pendingPaymentOrders.length,
        cancelled: cancelledOrders.length,
      },
      catalog: {
        spaces: totalSpaces,
        businesses: totalBusinesses,
        openBusinesses,
      },
      users: userStats,
      paymentMethods,
      topBusinesses,
    };
  }
}
