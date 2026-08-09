import { IPaymentRepository, CreatePaymentData } from '@/domain/repositories/IPaymentRepository';
import { Payment } from '@/domain/entities/Payment';
import { PaymentMethod, PaymentStatus } from '@/domain/value-objects/enums';
import prisma from '../db/prisma';

export class PrismaPaymentRepository implements IPaymentRepository {
  private mapToDomain(raw: any): Payment {
    return new Payment({
      id: raw.id,
      orderId: raw.orderId,
      method: raw.method as PaymentMethod,
      status: raw.status as PaymentStatus,
      amount: raw.amount,
      receiptUrl: raw.receiptUrl,
      transactionId: raw.transactionId,
      qrCodeData: raw.qrCodeData,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  async findById(id: string): Promise<Payment | null> {
    const payment = await prisma.payment.findUnique({ where: { id } });
    return payment ? this.mapToDomain(payment) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const payment = await prisma.payment.findUnique({ where: { orderId } });
    return payment ? this.mapToDomain(payment) : null;
  }

  async create(data: CreatePaymentData): Promise<Payment> {
    const payment = await prisma.payment.create({
      data: {
        orderId: data.orderId,
        method: data.method,
        amount: data.amount,
        status: data.status || 'PENDING',
        receiptUrl: data.receiptUrl,
        transactionId: data.transactionId,
        qrCodeData: data.qrCodeData,
      },
    });
    return this.mapToDomain(payment);
  }

  async updateStatus(id: string, status: PaymentStatus, transactionId?: string): Promise<Payment> {
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        ...(transactionId && { transactionId }),
      },
    });
    return this.mapToDomain(payment);
  }

  async updateReceiptUrl(orderId: string, receiptUrl: string): Promise<Payment> {
    const payment = await prisma.payment.update({
      where: { orderId },
      data: {
        receiptUrl,
      },
    });
    return this.mapToDomain(payment);
  }

  async listPendingReceipts(businessId?: string): Promise<Payment[]> {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        receiptUrl: { not: null },
        ...(businessId && {
          order: {
            businessId,
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((p) => this.mapToDomain(p));
  }
}
