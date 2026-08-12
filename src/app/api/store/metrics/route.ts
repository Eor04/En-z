export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireUser, getOwnBusinessId, authErrorResponse } from '@/infrastructure/services/auth/session-guards';
import prisma from '@/infrastructure/db/prisma';

export async function GET(req: Request) {
  try {
    // Sin sesión devolvía las ventas y ganancias del primer comercio de la base
    const user = await requireUser(['BUSINESS_OWNER', 'ADMIN']);
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7'; // días

    const ownId = await getOwnBusinessId(user);
    const business = ownId
      ? await prisma.business.findUnique({ where: { id: ownId } })
      : null;

    if (!business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    const businessId = business.id;
    const days = parseInt(period) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    // ─── PEDIDOS DEL NEGOCIO ────────────────────────────────────────────
    const allOrders = await prisma.order.findMany({
      where: {
        businessId,
        createdAt: { gte: since },
      },
      include: {
        payment: true,
        items: {
          include: {
            product: { select: { id: true, name: true, price: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // ─── MÉTRICAS GLOBALES (todos los tiempos) ──────────────────────────
    const allTimeOrders = await prisma.order.findMany({
      where: { businessId },
      include: { payment: true },
    });

    const completedAll = allTimeOrders.filter((o: any) => o.status === 'entregado');
    const totalRevenueAllTime = completedAll.reduce((sum: number, o: any) => {
      const amount = o.payment?.amount || 0;
      return sum + amount;
    }, 0);

    // ─── VENTAS DEL PERÍODO ─────────────────────────────────────────────
    const completedOrders = allOrders.filter((o: any) => o.status === 'entregado');
    const pendingOrders = allOrders.filter((o: any) =>
      ['esperando_confirmacion', 'esperando_pago', 'en_preparacion', 'buscando_driver', 'en_camino'].includes(o.status)
    );
    const cancelledOrders = allOrders.filter((o: any) => o.status === 'cancelado');

    const periodRevenue = completedOrders.reduce((sum: number, o: any) => {
      return sum + (o.payment?.amount || 0);
    }, 0);

    // ─── TICKET PROMEDIO ────────────────────────────────────────────────
    const avgTicket = completedOrders.length > 0 ? periodRevenue / completedOrders.length : 0;

    // ─── PRODUCTO MÁS VENDIDO ───────────────────────────────────────────
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    completedOrders.forEach((o: any) => {
      o.items.forEach((item: any) => {
        const id = item.product?.id || item.productId;
        const name = item.product?.name || 'Producto';
        if (!productSales[id]) productSales[id] = { name, qty: 0, revenue: 0 };
        productSales[id].qty += item.quantity;
        productSales[id].revenue += item.quantity * (item.product?.price || item.unitPrice || 0);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // ─── VENTAS POR DÍA ─────────────────────────────────────────────────
    const dailyMap: Record<string, { date: string; orders: number; revenue: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { date: key, orders: 0, revenue: 0 };
    }

    completedOrders.forEach((o: any) => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (dailyMap[key]) {
        dailyMap[key].orders += 1;
        dailyMap[key].revenue += o.payment?.amount || 0;
      }
    });

    const dailySales = Object.values(dailyMap);

    // ─── MÉTODOS DE PAGO ────────────────────────────────────────────────
    const paymentMethods: Record<string, number> = {};
    completedOrders.forEach((o: any) => {
      const method = o.payment?.method || 'DESCONOCIDO';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    // ─── MEJOR DÍA DE VENTA ─────────────────────────────────────────────
    let bestDay = { date: '', revenue: 0 };
    dailySales.forEach((d) => {
      if (d.revenue > bestDay.revenue) bestDay = { date: d.date, revenue: d.revenue };
    });

    // ─── HOY ────────────────────────────────────────────────────────────
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayData = dailyMap[todayKey] || { orders: 0, revenue: 0 };

    // ─── TASA DE APROBACIÓN ─────────────────────────────────────────────
    const approvalRate = allOrders.length > 0
      ? Math.round((completedOrders.length / allOrders.length) * 100)
      : 0;

    // ─── RESPUESTA ──────────────────────────────────────────────────────
    return NextResponse.json({
      business: {
        id: business.id,
        name: (business as any).name,
        category: (business as any).category,
        isOpen: (business as any).isOpen,
      },
      period: { days, since: since.toISOString() },
      summary: {
        totalOrdersPeriod: allOrders.length,
        completedOrders: completedOrders.length,
        pendingOrders: pendingOrders.length,
        cancelledOrders: cancelledOrders.length,
        periodRevenue,
        totalRevenueAllTime,
        avgTicket,
        approvalRate,
      },
      today: todayData,
      bestDay,
      topProducts,
      dailySales,
      paymentMethods,
    });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('[store/metrics]', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener métricas del negocio' },
      { status: 500 }
    );
  }
}
