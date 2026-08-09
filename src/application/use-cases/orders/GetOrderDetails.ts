import { IOrderRepository } from '@/domain/repositories/IOrderRepository';
import prisma from '@/infrastructure/db/prisma';

export class GetOrderDetails {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string) {
    const rawOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
        business: {
          include: { space: true },
        },
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        driver: {
          select: { id: true, name: true, driverCode: true, phone: true },
        },
        payment: true,
        tracking: true,
      },
    });

    if (!rawOrder) {
      throw new Error('Orden no encontrada');
    }

    // Si la orden pertenece a un lote multi-comercio, recuperar las órdenes vinculadas
    let batchOrders: any[] = [];
    if (rawOrder.batchCode) {
      batchOrders = await prisma.order.findMany({
        where: { batchCode: rawOrder.batchCode },
        include: {
          items: {
            include: { product: true },
          },
          business: {
            include: { space: true },
          },
          payment: true,
          tracking: true,
          driver: {
            select: { id: true, name: true, driverCode: true, phone: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    return {
      ...rawOrder,
      batchOrders: batchOrders.length > 0 ? batchOrders : [rawOrder],
      isMultiStore: (batchOrders.length > 1),
    };
  }
}
