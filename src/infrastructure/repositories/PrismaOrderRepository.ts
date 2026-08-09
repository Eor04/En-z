import { IOrderRepository, CreateOrderData } from '@/domain/repositories/IOrderRepository';
import { Order } from '@/domain/entities/Order';
import { OrderStatus } from '@/domain/value-objects/enums';
import prisma from '../db/prisma';

export class PrismaOrderRepository implements IOrderRepository {
  private mapToDomain(raw: any): Order {
    return new Order({
      id: raw.id,
      customerId: raw.customerId,
      businessId: raw.businessId,
      driverId: raw.driverId,
      totalPrice: raw.totalPrice,
      deliveryFee: raw.deliveryFee,
      deliveryAddress: raw.deliveryAddress,
      customerPhone: raw.customerPhone,
      notes: raw.notes,
      batchCode: raw.batchCode,
      driverRating: raw.driverRating,
      driverReview: raw.driverReview,
      ratedAt: raw.ratedAt,
      status: raw.status as OrderStatus,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      items: raw.items
        ? raw.items.map((i: any) => ({
            id: i.id,
            orderId: i.orderId,
            productId: i.productId,
            productName: i.product?.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.subtotal,
          }))
        : [],
    });
  }

  async findById(id: string): Promise<Order | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        payment: true,
        tracking: true,
        business: true,
        customer: true,
        driver: true,
      },
    });
    return order ? this.mapToDomain(order) : null;
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        items: { include: { product: true } },
        payment: true,
        tracking: true,
        business: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o: any) => this.mapToDomain(o));
  }

  async findByBusinessId(businessId: string, status?: OrderStatus): Promise<Order[]> {
    const where: any = { businessId };
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        payment: true,
        tracking: true,
        customer: true,
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o: any) => this.mapToDomain(o));
  }

  async findByDriverId(driverId: string): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      where: { driverId },
      include: {
        items: { include: { product: true } },
        payment: true,
        tracking: true,
        business: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o: any) => this.mapToDomain(o));
  }

  async findAvailableForDrivers(): Promise<Order[]> {
    const orders = await prisma.order.findMany({
      where: { status: 'buscando_driver', driverId: null },
      include: {
        items: { include: { product: true } },
        business: true,
        customer: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return orders.map((o: any) => this.mapToDomain(o));
  }

  async create(data: CreateOrderData): Promise<Order> {
    const order = await prisma.order.create({
      data: {
        customerId: data.customerId,
        businessId: data.businessId,
        totalPrice: data.totalPrice,
        deliveryFee: data.deliveryFee ?? 10.0,
        deliveryAddress: data.deliveryAddress,
        customerPhone: data.customerPhone,
        notes: data.notes,
        status: 'esperando_pago',
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
        tracking: {
          create: {},
        },
      },
      include: {
        items: { include: { product: true } },
        tracking: true,
      },
    });

    return this.mapToDomain(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const updateData: any = { status };

    // Si el estado transiciona a en_preparacion, registrar timestamp acceptedAt
    if (status === 'en_preparacion') {
      await prisma.orderTracking.upsert({
        where: { orderId: id },
        update: { acceptedAt: new Date() },
        create: { orderId: id, acceptedAt: new Date() },
      });
    }

    // Si el estado transiciona a en_camino, registrar timestamp pickedUpAt
    if (status === 'en_camino') {
      await prisma.orderTracking.upsert({
        where: { orderId: id },
        update: { pickedUpAt: new Date() },
        create: { orderId: id, pickedUpAt: new Date() },
      });
    }

    // Si el estado transiciona a entregado, registrar timestamp deliveredAt
    if (status === 'entregado') {
      await prisma.orderTracking.upsert({
        where: { orderId: id },
        update: { deliveredAt: new Date() },
        create: { orderId: id, deliveredAt: new Date() },
      });
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { product: true } },
        payment: true,
        tracking: true,
      },
    });

    return this.mapToDomain(order);
  }

  async assignDriver(id: string, driverId: string): Promise<Order> {
    const order = await prisma.order.update({
      where: { id },
      data: {
        driverId,
        status: 'en_camino',
      },
      include: {
        items: { include: { product: true } },
        tracking: true,
      },
    });

    await prisma.orderTracking.upsert({
      where: { orderId: id },
      update: { pickedUpAt: new Date() },
      create: { orderId: id, pickedUpAt: new Date() },
    });

    return this.mapToDomain(order);
  }
}
