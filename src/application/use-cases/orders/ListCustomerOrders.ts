import prisma from '@/infrastructure/db/prisma';

export class ListCustomerOrders {
  async execute(customerId: string) {
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        business: {
          select: { id: true, name: true, logoUrl: true },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
        payment: {
          select: { id: true, method: true, status: true, amount: true },
        },
        tracking: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }
}
