export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/services/auth/auth-options';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { VerifyPaymentReceipt } from '@/application/use-cases/payments/VerifyPaymentReceipt';
import { ListPendingReceipts } from '@/application/use-cases/payments/ListPendingReceipts';

const paymentRepository = new PrismaPaymentRepository();
const orderRepository = new PrismaOrderRepository();
const verifyPaymentReceipt = new VerifyPaymentReceipt(paymentRepository, orderRepository);
const listPendingReceipts = new ListPendingReceipts();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || undefined;

    const receipts = await listPendingReceipts.execute(businessId);
    return NextResponse.json({ receipts });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener comprobantes pendientes' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const result = await verifyPaymentReceipt.execute({
      paymentId: body.paymentId,
      verifiedByUserId: (session?.user as any)?.id || 'admin-system',
      approved: Boolean(body.approved),
      rejectionReason: body.rejectionReason,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al procesar verificación del comprobante' },
      { status: 400 }
    );
  }
}
