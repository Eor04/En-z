export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { ProcessGatewayPayment } from '@/application/use-cases/payments/ProcessGatewayPayment';
import {
  requireUser,
  requireOwnedOrder,
  authErrorResponse,
} from '@/infrastructure/services/auth/session-guards';

const paymentRepository = new PrismaPaymentRepository();
const orderRepository = new PrismaOrderRepository();
const processGatewayPayment = new ProcessGatewayPayment(paymentRepository, orderRepository);

export async function POST(req: Request) {
  try {
    // Sólo el cliente dueño del pedido puede pagarlo
    const user = await requireUser(['CUSTOMER', 'ADMIN']);
    const body = await req.json();
    await requireOwnedOrder(user, body.orderId);

    const result = await processGatewayPayment.execute({
      orderId: body.orderId,
      cardNumber: body.cardNumber,
      cardHolder: body.cardHolder,
      expiry: body.expiry,
      cvv: body.cvv,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al procesar el pago con tarjeta' },
      { status: 400 }
    );
  }
}
