import { NextResponse } from 'next/server';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { UploadPaymentReceipt } from '@/application/use-cases/payments/UploadPaymentReceipt';

const paymentRepository = new PrismaPaymentRepository();
const orderRepository = new PrismaOrderRepository();
const uploadPaymentReceipt = new UploadPaymentReceipt(paymentRepository, orderRepository);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await uploadPaymentReceipt.execute({
      orderId: body.orderId,
      receiptUrl: body.receiptUrl,
      transactionReference: body.transactionReference,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al adjuntar comprobante' },
      { status: 400 }
    );
  }
}
