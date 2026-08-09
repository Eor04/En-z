import { PaymentMethod, PaymentStatus } from '../value-objects/enums';

export interface PaymentProps {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  receiptUrl?: string | null;
  transactionId?: string | null;
  qrCodeData?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  constructor(public readonly props: PaymentProps) {}

  get id(): string {
    return this.props.id;
  }
  get orderId(): string {
    return this.props.orderId;
  }
  get method(): PaymentMethod {
    return this.props.method;
  }
  get status(): PaymentStatus {
    return this.props.status;
  }
  get amount(): number {
    return this.props.amount;
  }
  get receiptUrl(): string | null | undefined {
    return this.props.receiptUrl;
  }
  get transactionId(): string | null | undefined {
    return this.props.transactionId;
  }
  get qrCodeData(): string | null | undefined {
    return this.props.qrCodeData;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isPending(): boolean {
    return this.props.status === 'PENDING';
  }

  isApproved(): boolean {
    return this.props.status === 'APPROVED';
  }

  isRejected(): boolean {
    return this.props.status === 'REJECTED';
  }

  isManualQR(): boolean {
    return this.props.method === 'QR_MANUAL';
  }

  isOnlineGateway(): boolean {
    return this.props.method === 'GATEWAY_ONLINE';
  }

  isCash(): boolean {
    return this.props.method === 'CASH';
  }

  toJSON(): PaymentProps {
    return { ...this.props };
  }
}
