import prisma from '@/infrastructure/db/prisma';

export class ListPendingReceipts {
  async execute(businessId?: string) {
    const payments = await prisma.payment.findMany({
      where: {
        method: 'QR_MANUAL',
        status: 'PENDING',
        receiptUrl: { not: null },
        ...(businessId && {
          order: {
            businessId,
          },
        }),
      },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
            business: {
              select: {
                id: true,
                name: true,
              },
            },
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return payments;
  }
}
