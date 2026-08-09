import prisma from '@/infrastructure/db/prisma';

export class ListAvailableOrdersForDrivers {
  async execute() {
    const orders = await prisma.order.findMany({
      where: {
        driverId: null,
        status: 'buscando_driver',
        OR: [
          { payment: { status: 'APPROVED' } },
          { payment: { method: 'CASH' } },
        ],
      },
      include: {
        business: {
          include: {
            space: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
        tracking: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return orders;
  }
}
