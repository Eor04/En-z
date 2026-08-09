import { OrderStatus } from '../value-objects/enums';

export interface OrderItemProps {
  id: string;
  orderId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderProps {
  id: string;
  customerId: string;
  businessId: string;
  driverId?: string | null;
  totalPrice: number;
  deliveryFee: number;
  deliveryAddress: string;
  customerPhone: string;
  notes?: string | null;
  batchCode?: string | null;
  driverRating?: number | null;
  driverReview?: string | null;
  ratedAt?: Date | null;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItemProps[];
}

export class Order {
  constructor(public readonly props: OrderProps) {}

  get id(): string {
    return this.props.id;
  }
  get customerId(): string {
    return this.props.customerId;
  }
  get businessId(): string {
    return this.props.businessId;
  }
  get driverId(): string | null | undefined {
    return this.props.driverId;
  }
  get totalPrice(): number {
    return this.props.totalPrice;
  }
  get deliveryFee(): number {
    return this.props.deliveryFee;
  }
  get deliveryAddress(): string {
    return this.props.deliveryAddress;
  }
  get customerPhone(): string {
    return this.props.customerPhone;
  }
  get notes(): string | null | undefined {
    return this.props.notes;
  }
  get batchCode(): string | null | undefined {
    return this.props.batchCode;
  }
  get driverRating(): number | null | undefined {
    return this.props.driverRating;
  }
  get driverReview(): string | null | undefined {
    return this.props.driverReview;
  }
  get ratedAt(): Date | null | undefined {
    return this.props.ratedAt;
  }
  get status(): OrderStatus {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get items(): OrderItemProps[] {
    return this.props.items || [];
  }

  isAwaitingPayment(): boolean {
    return this.props.status === 'esperando_pago';
  }

  isInPreparation(): boolean {
    return this.props.status === 'en_preparacion';
  }

  isSeekingDriver(): boolean {
    return this.props.status === 'buscando_driver';
  }

  isOnTheWay(): boolean {
    return this.props.status === 'en_camino';
  }

  isDelivered(): boolean {
    return this.props.status === 'entregado';
  }

  isCancelled(): boolean {
    return this.props.status === 'cancelado';
  }

  toJSON(): OrderProps {
    return {
      ...this.props,
      items: this.items,
    };
  }
}
