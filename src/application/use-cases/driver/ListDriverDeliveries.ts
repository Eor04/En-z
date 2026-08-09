import prisma from '@/infrastructure/db/prisma';

export class ListDriverDeliveries {
  async execute(driverId: string) {
    if (!driverId) {
      throw new Error('driverId es requerido');
    }

    const orders = await prisma.order.findMany({
      where: { driverId },
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
      },
      orderBy: { updatedAt: 'desc' },
    });

    const activeDeliveries = orders.filter((o) => o.status === 'en_camino');
    const completedDeliveries = orders.filter((o) => o.status === 'entregado');

    // Fechas de referencia
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Entregas de Hoy
    const todayCompleted = completedDeliveries.filter(
      (o) => new Date(o.updatedAt).getTime() >= today.getTime()
    );
    const todayEarnings = todayCompleted.reduce((sum, o) => sum + Number(o.deliveryFee || 10), 0);
    const todayCashOrders = todayCompleted.filter((o) => o.payment?.method === 'CASH');
    const todayQrOrders = todayCompleted.filter((o) => o.payment?.method !== 'CASH');
    const todayCashEarnings = todayCashOrders.reduce(
      (sum, o) => sum + Number(o.deliveryFee || 10),
      0
    );
    const todayQrEarnings = todayQrOrders.reduce(
      (sum, o) => sum + Number(o.deliveryFee || 10),
      0
    );
    const todayCashCollectedTotal = todayCashOrders.reduce(
      (sum, o) => sum + Number(o.totalPrice || 0),
      0
    );
    const todayQrPaidTotal = todayQrOrders.reduce(
      (sum, o) => sum + Number(o.totalPrice || 0),
      0
    );

    // 2. Entregas de Ayer
    const yesterdayCompleted = completedDeliveries.filter((o) => {
      const t = new Date(o.updatedAt).getTime();
      return t >= yesterday.getTime() && t < today.getTime();
    });
    const yesterdayEarnings = yesterdayCompleted.reduce(
      (sum, o) => sum + Number(o.deliveryFee || 10),
      0
    );
    const yesterdayCashEarnings = yesterdayCompleted
      .filter((o) => o.payment?.method === 'CASH')
      .reduce((sum, o) => sum + Number(o.deliveryFee || 10), 0);
    const yesterdayQrEarnings = yesterdayCompleted
      .filter((o) => o.payment?.method !== 'CASH')
      .reduce((sum, o) => sum + Number(o.deliveryFee || 10), 0);

    // 3. Entregas de la Semana (Últimos 7 días)
    const weekCompleted = completedDeliveries.filter(
      (o) => new Date(o.updatedAt).getTime() >= sevenDaysAgo.getTime()
    );
    const weekEarnings = weekCompleted.reduce((sum, o) => sum + Number(o.deliveryFee || 10), 0);
    const weekCashEarnings = weekCompleted
      .filter((o) => o.payment?.method === 'CASH')
      .reduce((sum, o) => sum + Number(o.deliveryFee || 10), 0);
    const weekQrEarnings = weekCompleted
      .filter((o) => o.payment?.method !== 'CASH')
      .reduce((sum, o) => sum + Number(o.deliveryFee || 10), 0);

    // 4. Totales Históricos
    const totalEarnings = completedDeliveries.reduce(
      (sum, o) => sum + Number(o.deliveryFee || 10),
      0
    );
    const totalCashEarnings = completedDeliveries
      .filter((o) => o.payment?.method === 'CASH')
      .reduce((sum, o) => sum + Number(o.deliveryFee || 10), 0);
    const totalQrEarnings = completedDeliveries
      .filter((o) => o.payment?.method !== 'CASH')
      .reduce((sum, o) => sum + Number(o.deliveryFee || 10), 0);

    // 5. Calificaciones y Reseñas
    const ratedOrders = completedDeliveries.filter((o) => o.driverRating && o.driverRating > 0);
    const avgRating =
      ratedOrders.length > 0
        ? Number(
            (
              ratedOrders.reduce((sum, o) => sum + Number(o.driverRating), 0) /
              ratedOrders.length
            ).toFixed(1)
          )
        : 5.0;

    const reviews = ratedOrders
      .map((o) => ({
        orderId: o.id,
        rating: o.driverRating,
        review: o.driverReview,
        customerName: o.customer?.name || 'Cliente de Trinidad',
        date: o.ratedAt || o.updatedAt,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      activeDeliveries,
      completedDeliveries,
      stats: {
        totalDeliveries: completedDeliveries.length,
        totalEarnings,
        todayDeliveries: todayCompleted.length,
        todayEarnings,
        rating: avgRating,
        totalReviews: ratedOrders.length,
        reviews,
      },
      wallet: {
        today: {
          deliveries: todayCompleted.length,
          totalEarnings: todayEarnings,
          cashEarnings: todayCashEarnings,
          qrEarnings: todayQrEarnings,
          cashOrdersCount: todayCashOrders.length,
          qrOrdersCount: todayQrOrders.length,
          cashCollectedTotal: todayCashCollectedTotal,
          qrPaidTotal: todayQrPaidTotal,
        },
        yesterday: {
          deliveries: yesterdayCompleted.length,
          totalEarnings: yesterdayEarnings,
          cashEarnings: yesterdayCashEarnings,
          qrEarnings: yesterdayQrEarnings,
        },
        week: {
          deliveries: weekCompleted.length,
          totalEarnings: weekEarnings,
          cashEarnings: weekCashEarnings,
          qrEarnings: weekQrEarnings,
        },
        allTime: {
          deliveries: completedDeliveries.length,
          totalEarnings,
          cashEarnings: totalCashEarnings,
          qrEarnings: totalQrEarnings,
        },
      },
    };
  }
}
