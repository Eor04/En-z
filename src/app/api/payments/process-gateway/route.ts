export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { ProcessGatewayPayment } from '@/application/use-cases/payments/ProcessGatewayPayment';

const paymentRepository = new PrismaPaymentRepository();
const orderRepository = new PrismaOrderRepository();
const processGatewayPayment = new ProcessGatewayPayment(paymentRepository, orderRepository);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await processGatewayPayment.execute({
      orderId: body.orderId,
      cardNumber: body.cardNumber,
      cardHolder: body.cardHolder,
      expiry: body.expiry,
      cvv: body.cvv,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al procesar el pago con tarjeta' },
      { status: 400 }
    );
  }
}
