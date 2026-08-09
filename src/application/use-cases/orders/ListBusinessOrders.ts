import prisma from '@/infrastructure/db/prisma';

export class ListBusinessOrders {
  async execute(businessId: string) {
    const orders = await prisma.order.findMany({
      where: { businessId },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
        payment: true,
        driver: {
          select: { id: true, name: true, driverCode: true, phone: true },
        },
        tracking: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }
}
