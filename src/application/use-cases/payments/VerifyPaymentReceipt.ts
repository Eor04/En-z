import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { IOrderRepository } from '@/domain/repositories/IOrderRepository';
import prisma from '@/infrastructure/db/prisma';
import { realtimeEventBus } from '@/infrastructure/services/events/realtime-event-bus';

export interface VerifyReceiptInput {
  paymentId: string;
  verifiedByUserId?: string;
  approved: boolean;
  rejectionReason?: string;
}

export class VerifyPaymentReceipt {
  constructor(
    private paymentRepository: IPaymentRepository,
    private orderRepository: IOrderRepository
  ) {}

  async execute(input: VerifyReceiptInput) {
    const { paymentId, approved, rejectionReason } = input;

    if (!paymentId) {
      throw new Error('paymentId es requerido');
    }

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('No se encontró el registro de pago');
    }

    const order = await this.orderRepository.findById(payment.orderId);
    if (!order) {
      throw new Error('No se encontró la orden asociada al pago');
    }

    if (approved) {
      // 1. Aprobar pago
      // 2. Avanzar estado de la orden de 'esperando_pago' a 'en_preparacion'
      // 3. Actualizar tiempo de aceptación en OrderTracking
      const result = await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'APPROVED',
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

      // Emitir eventos en tiempo real a cocina, cliente y administración
      realtimeEventBus.publish(`store:${order.businessId}`, 'order:paid', {
        orderId: order.id,
        businessId: order.businessId,
        paymentId: payment.id,
        status: 'en_preparacion',
        totalPrice: order.totalPrice,
      });

      realtimeEventBus.publish(`order:${order.id}`, 'order:status_updated', {
        orderId: order.id,
        status: 'en_preparacion',
        paymentStatus: 'APPROVED',
      });

      return {
        success: true,
        approved: true,
        message: 'Comprobante verificado con éxito. Pedido enviado a cocina.',
        payment: result.payment,
        order: result.order,
      };
    } else {
      // Rechazar pago
      const result = await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'REJECTED',
            updatedAt: new Date(),
          },
        });

        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            notes: order.notes
              ? `${order.notes} [Comprobante rechazado: ${rejectionReason || 'Comprobante no válido'}]`
              : `[Comprobante rechazado: ${rejectionReason || 'Comprobante no válido'}]`,
          },
        });

        return { payment: updatedPayment, order: updatedOrder };
      });

      realtimeEventBus.publish(`order:${order.id}`, 'order:status_updated', {
        orderId: order.id,
        status: order.status,
        paymentStatus: 'REJECTED',
        reason: rejectionReason,
      });

      return {
        success: true,
        approved: false,
        message: `Comprobante rechazado: ${rejectionReason || 'No coincide con el monto o cuenta'}.`,
        payment: result.payment,
        order: result.order,
      };
    }
  }
}
