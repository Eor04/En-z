import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { IOrderRepository } from '@/domain/repositories/IOrderRepository';
import prisma from '@/infrastructure/db/prisma';

export interface GatewayPaymentInput {
  orderId: string;
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
}

export class ProcessGatewayPayment {
  constructor(
    private paymentRepository: IPaymentRepository,
    private orderRepository: IOrderRepository
  ) {}

  async execute(input: GatewayPaymentInput) {
    const { orderId, cardNumber, cardHolder, expiry, cvv } = input;

    if (!orderId || !cardNumber || !cardHolder || !expiry || !cvv) {
      throw new Error('Todos los campos de la tarjeta de pago son requeridos');
    }

    // Validación básica de tarjeta
    const cleanNumber = cardNumber.replace(/\s+/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      throw new Error('Número de tarjeta no válido');
    }

    if (cvv.length < 3 || cvv.length > 4) {
      throw new Error('Código CVV no válido');
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Orden no encontrada');
    }

    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new Error('No existe registro de pago para esta orden');
    }

    if (payment.status === 'APPROVED') {
      throw new Error('Esta orden ya cuenta con un pago aprobado');
    }

    // Simular autorización de pasarela (Libélula / Cybersource / Red Enlace)
    const transactionId = `TX-GATEWAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'APPROVED',
          method: 'GATEWAY_ONLINE',
          transactionId,
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
      transactionId,
      message: 'Pago con tarjeta aprobado exitosamente por la pasarela.',
      payment: result.payment,
      order: result.order,
    };
  }
}
