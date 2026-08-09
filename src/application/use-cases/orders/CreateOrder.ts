import { IOrderRepository } from '@/domain/repositories/IOrderRepository';
import { IBusinessRepository } from '@/domain/repositories/IBusinessRepository';
import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Order } from '@/domain/entities/Order';
import { PaymentMethod } from '@/domain/value-objects/enums';
import prisma from '@/infrastructure/db/prisma';
import { realtimeEventBus } from '@/infrastructure/services/events/realtime-event-bus';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  businessId?: string;
}

export interface CreateOrderInput {
  customerId: string;
  businessId?: string | null;
  deliveryAddress: string;
  customerPhone: string;
  notes?: string | null;
  paymentMethod: PaymentMethod;
  items: CreateOrderItemInput[];
}

export interface CreateOrderResult {
  order: Order;
  orders?: Order[];
  batchCode?: string | null;
  isMultiStore?: boolean;
  payment: any;
}

export class CreateOrder {
  constructor(
    private orderRepository: IOrderRepository,
    private businessRepository: IBusinessRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderResult> {
    if (!input.items || input.items.length === 0) {
      throw new Error('El pedido debe incluir al menos un producto');
    }

    // 1. Cargar y validar cada producto desde la base de datos
    const fetchedItems: {
      productId: string;
      quantity: number;
      productName: string;
      unitPrice: number;
      subtotal: number;
      businessId: string;
    }[] = [];

    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw new Error('La cantidad de cada producto debe ser mayor a cero');
      }

      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new Error(`Producto con ID ${item.productId} no encontrado`);
      }

      if (!product.isAvailable) {
        throw new Error(`El producto "${product.name}" no está disponible actualmente`);
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${item.quantity}`
        );
      }

      const subtotal = Number((product.price * item.quantity).toFixed(2));
      fetchedItems.push({
        productId: product.id,
        quantity: item.quantity,
        productName: product.name,
        unitPrice: product.price,
        subtotal,
        businessId: product.businessId,
      });
    }

    // 2. Agrupar items por negocio
    const itemsByBusiness = new Map<string, typeof fetchedItems>();
    for (const item of fetchedItems) {
      const existing = itemsByBusiness.get(item.businessId) || [];
      existing.push(item);
      itemsByBusiness.set(item.businessId, existing);
    }

    const businessIds = Array.from(itemsByBusiness.keys());
    const isMultiStore = businessIds.length > 1;

    // 3. Validar existencia, estado activo y apertura de todos los comercios involucrados
    const businessMap = new Map<string, any>();
    for (const bId of businessIds) {
      const business = await this.businessRepository.findById(bId);
      if (!business) {
        throw new Error(`Comercio con ID ${bId} no encontrado`);
      }

      if (!business.isActive) {
        throw new Error(`El comercio "${business.name}" no se encuentra activo en la plataforma`);
      }

      if (!business.isOpen) {
        throw new Error(
          `El comercio "${business.name}" se encuentra actualmente CERRADO y no puede recibir pedidos`
        );
      }

      businessMap.set(bId, business);
    }

    const batchCode = isMultiStore
      ? `BATCH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      : null;

    // 4. Ejecutar transacción atómica en PostgreSQL
    const createdOrdersData = await prisma.$transaction(async (tx) => {
      // Decrementar stock para todos los productos
      for (const item of fetchedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const createdList: any[] = [];
      let isFirstStore = true;

      for (const bId of businessIds) {
        const storeItems = itemsByBusiness.get(bId)!;
        const storeBusiness = businessMap.get(bId)!;
        const storeItemsSubtotal = Number(
          storeItems.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)
        );

        // La tarifa de delivery base (10.0 Bs) se asigna a la primera orden o de forma compartida
        const deliveryFee = isFirstStore ? 10.0 : 0.0;
        const totalPrice = Number((storeItemsSubtotal + deliveryFee).toFixed(2));
        isFirstStore = false;

        const orderRecord = await tx.order.create({
          data: {
            customerId: input.customerId,
            businessId: bId,
            totalPrice,
            deliveryFee,
            deliveryAddress: input.deliveryAddress,
            customerPhone: input.customerPhone,
            notes: input.notes,
            batchCode,
            status: 'esperando_pago',
            items: {
              create: storeItems.map((v) => ({
                productId: v.productId,
                quantity: v.quantity,
                unitPrice: v.unitPrice,
                subtotal: v.subtotal,
              })),
            },
            tracking: {
              create: {},
            },
            payment: {
              create: {
                method: input.paymentMethod,
                status: 'PENDING',
                amount: totalPrice,
                qrCodeData:
                  input.paymentMethod === 'QR_MANUAL'
                    ? `pago-qr://pedidostrinidad/${storeBusiness.id}/${totalPrice}`
                    : null,
              },
            },
          },
          include: {
            items: { include: { product: true } },
            payment: true,
            tracking: true,
            business: true,
            customer: true,
          },
        });

        createdList.push(orderRecord);
      }

      return createdList;
    });

    // 5. Emitir eventos SSE en tiempo real a las tiendas y tracking
    for (const raw of createdOrdersData) {
      realtimeEventBus.publish(`store:${raw.businessId}`, 'order:created', {
        orderId: raw.id,
        businessId: raw.businessId,
        totalPrice: raw.totalPrice,
        customerName: raw.customer?.name || 'Cliente',
        itemsCount: raw.items?.length || 0,
        status: raw.status,
      });

      realtimeEventBus.publish(`order:${raw.id}`, 'order:created', {
        orderId: raw.id,
        status: raw.status,
      });
    }

    // Mapear a entidades de dominio
    const domainOrders: Order[] = [];
    for (const raw of createdOrdersData) {
      const domainObj = await this.orderRepository.findById(raw.id);
      if (domainObj) {
        domainOrders.push(domainObj);
      }
    }

    const primaryOrder = domainOrders[0] || (await this.orderRepository.findById(createdOrdersData[0].id))!;

    return {
      order: primaryOrder,
      orders: domainOrders,
      batchCode,
      isMultiStore,
      payment: createdOrdersData[0]?.payment,
    };
  }
}
