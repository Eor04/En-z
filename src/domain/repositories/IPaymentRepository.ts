import { Payment, PaymentProps } from '../entities/Payment';
import { PaymentMethod, PaymentStatus } from '../value-objects/enums';

export interface CreatePaymentData {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  status?: PaymentStatus;
  receiptUrl?: string | null;
  transactionId?: string | null;
  qrCodeData?: string | null;
}

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  create(data: CreatePaymentData): Promise<Payment>;
  updateStatus(id: string, status: PaymentStatus, transactionId?: string): Promise<Payment>;
  updateReceiptUrl(orderId: string, receiptUrl: string): Promise<Payment>;
  listPendingReceipts(businessId?: string): Promise<Payment[]>;
}
