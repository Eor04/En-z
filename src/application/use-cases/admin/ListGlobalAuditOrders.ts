import prisma from '@/infrastructure/db/prisma';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export interface AuditOrdersFilter {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  businessId?: string;
  search?: string;
  limit?: number;
}

export class ListGlobalAuditOrders {
  async execute(filter: AuditOrdersFilter = {}) {
    const { status, paymentMethod, businessId, search, limit = 50 } = filter;

    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (businessId) {
      whereClause.businessId = businessId;
    }

    if (paymentMethod) {
      whereClause.payment = {
        method: paymentMethod,
      };
    }

    if (search) {
      whereClause.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { deliveryAddress: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { business: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        business: {
          include: { space: true },
        },
        driver: { select: { id: true, name: true, phone: true, driverCode: true } },
        payment: true,
        tracking: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return orders;
  }
}
