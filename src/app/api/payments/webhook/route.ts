import { NextResponse } from 'next/server';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { HandleGatewayWebhook } from '@/application/use-cases/payments/HandleGatewayWebhook';

const paymentRepository = new PrismaPaymentRepository();
const orderRepository = new PrismaOrderRepository();
const handleGatewayWebhook = new HandleGatewayWebhook(paymentRepository, orderRepository);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const result = await handleGatewayWebhook.execute({
      event: payload.event || 'payment.completed',
      orderId: payload.orderId,
      transactionId: payload.transactionId || `TX-WH-${Date.now()}`,
      amount: payload.amount,
      currency: payload.currency || 'BOB',
      signature: payload.signature,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al procesar webhook de pago' },
      { status: 400 }
    );
  }
}
