export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { ListGlobalAuditOrders } from '@/application/use-cases/admin/ListGlobalAuditOrders';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';

const listGlobalOrders = new ListGlobalAuditOrders();

export async function GET(req: Request) {
  try {
    await requireUser(['ADMIN']);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as any;
    const paymentMethod = searchParams.get('paymentMethod') as any;
    const businessId = searchParams.get('businessId') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;

    const orders = await listGlobalOrders.execute({
      status,
      paymentMethod,
      businessId,
      search,
      limit,
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al obtener libro global de órdenes' },
      { status: 500 }
    );
  }
}
