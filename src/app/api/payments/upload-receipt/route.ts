export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { UploadPaymentReceipt } from '@/application/use-cases/payments/UploadPaymentReceipt';
import {
  requireUser,
  requireOwnedOrder,
  authErrorResponse,
} from '@/infrastructure/services/auth/session-guards';

const paymentRepository = new PrismaPaymentRepository();
const orderRepository = new PrismaOrderRepository();
const uploadPaymentReceipt = new UploadPaymentReceipt(paymentRepository, orderRepository);

export async function POST(req: Request) {
  try {
    // Sólo el cliente dueño del pedido puede adjuntarle un comprobante:
    // antes cualquiera podía subir uno a un pedido ajeno.
    const user = await requireUser(['CUSTOMER', 'ADMIN']);
    const body = await req.json();
    await requireOwnedOrder(user, body.orderId);

    const result = await uploadPaymentReceipt.execute({
      orderId: body.orderId,
      receiptUrl: body.receiptUrl,
      transactionReference: body.transactionReference,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al adjuntar comprobante' },
      { status: 400 }
    );
  }
}
