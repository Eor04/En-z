import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { IOrderRepository } from '@/domain/repositories/IOrderRepository';
import prisma from '@/infrastructure/db/prisma';
import { realtimeEventBus } from '@/infrastructure/services/events/realtime-event-bus';

export interface UploadReceiptInput {
  orderId: string;
  receiptUrl: string;
  transactionReference?: string;
}

export class UploadPaymentReceipt {
  constructor(
    private paymentRepository: IPaymentRepository,
    private orderRepository: IOrderRepository
  ) {}

  async execute(input: UploadReceiptInput) {
    const { orderId, receiptUrl, transactionReference } = input;

    if (!orderId || !receiptUrl) {
      throw new Error('orderId y receiptUrl son requeridos');
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('La orden especificada no existe');
    }

    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new Error('No se encontró registro de pago asociado a la orden');
    }

    if (payment.status === 'APPROVED') {
      throw new Error('Este pago ya fue aprobado previamente');
    }

    // Actualizar URL de comprobante y transacción
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        receiptUrl,
        ...(transactionReference && { transactionId: transactionReference }),
      },
    });

    realtimeEventBus.publish(`store:${order.businessId}`, 'order:created', {
      orderId,
      receiptUrl,
      paymentId: payment.id,
      status: order.status,
      type: 'receipt_uploaded',
    });

    realtimeEventBus.publish(`order:${orderId}`, 'order:status_updated', {
      orderId,
      hasReceipt: true,
      status: order.status,
    });

    return {
      success: true,
      message: 'Comprobante adjuntado exitosamente. En espera de verificación.',
      payment: updatedPayment,
    };
  }
}
