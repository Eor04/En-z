import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { IOrderRepository } from '@/domain/repositories/IOrderRepository';
import prisma from '@/infrastructure/db/prisma';

export interface GatewayWebhookPayload {
  event: 'payment.completed' | 'payment.failed' | string;
  orderId: string;
  transactionId: string;
  amount: number;
  currency: string;
  signature?: string;
}

export class HandleGatewayWebhook {
  constructor(
    private paymentRepository: IPaymentRepository,
    private orderRepository: IOrderRepository
  ) {}

  async execute(payload: GatewayWebhookPayload) {
    const { event, orderId, transactionId, amount } = payload;

    if (!orderId) {
      throw new Error('orderId es requerido en el payload del webhook');
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error(`Orden con ID ${orderId} no encontrada`);
    }

    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new Error(`Pago no encontrado para la orden ${orderId}`);
    }

    if (event === 'payment.completed') {
      const result = await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'APPROVED',
            transactionId: transactionId || `TX-WEBHOOK-${Date.now()}`,
            updatedAt: new Date(),
          },
        });

        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'en_preparacion',
            updatedAt: new Date(),
          },
        });

        await tx.orderTracking.updateMany({
          where: { orderId: order.id },
          data: {
            acceptedAt: new Date(),
          },
        });

        return { payment: updatedPayment, order: updatedOrder };
      });

      return {
        success: true,
        event,
        message: 'Webhook procesado: Pago confirmado y orden avanzada a preparación.',
        orderId: result.order.id,
        paymentStatus: result.payment.status,
      };
    } else {
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REJECTED',
          transactionId,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        event,
        message: 'Webhook procesado: Pago marcado como fallido.',
        orderId: order.id,
        paymentStatus: updatedPayment.status,
      };
    }
  }
}
