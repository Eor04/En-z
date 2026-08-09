import { Order, OrderProps } from '../entities/Order';
import { OrderStatus } from '../value-objects/enums';

export interface CreateOrderItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CreateOrderData {
  customerId: string;
  businessId: string;
  totalPrice: number;
  deliveryFee?: number;
  deliveryAddress: string;
  customerPhone: string;
  notes?: string | null;
  items: CreateOrderItemData[];
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  findByBusinessId(businessId: string, status?: OrderStatus): Promise<Order[]>;
  findByDriverId(driverId: string): Promise<Order[]>;
  findAvailableForDrivers(): Promise<Order[]>;
  create(data: CreateOrderData): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  assignDriver(id: string, driverId: string): Promise<Order>;
}
