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
    }

    /* En paralelo, no en serie: la base está en otra región y cada consulta
       secuencial suma su latencia completa al tiempo de checkout. */
    const productos = await Promise.all(
      input.items.map((item) => this.productRepository.findById(item.productId))
    );

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      const product = productos[i];

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
    const negocios = await Promise.all(
      businessIds.map((bId) => this.businessRepository.findById(bId))
    );

    for (let i = 0; i < businessIds.length; i++) {
      const bId = businessIds[i];
      const business = negocios[i];

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

    /* 4. Transacción atómica.
     *
     * Se mantiene lo más corta posible: sólo las escrituras. Antes cada
     * `order.create` traía un `include` pesado (items+product, payment,
     * tracking, business, customer), y con dos locales eso pasaba los 5 s de
     * límite de Prisma contra una base remota. Ahora la transacción sólo
     * escribe y devuelve ids; los datos completos se leen después, ya fuera.
     */
    const createdIds = await prisma.$transaction(
      async (tx) => {
        // Descontar stock de todos los productos en paralelo
        await Promise.all(
          fetchedItems.map((item) =>
            tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            })
          )
        );

        let isFirstStore = true;
        const payloads = businessIds.map((bId) => {
          const storeItems = itemsByBusiness.get(bId)!;
          const storeBusiness = businessMap.get(bId)!;
          const storeItemsSubtotal = Number(
            storeItems.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)
          );

          // La tarifa de envío se cobra una sola vez, en la primera comanda
          const deliveryFee = isFirstStore ? 10.0 : 0.0;
          const totalPrice = Number((storeItemsSubtotal + deliveryFee).toFixed(2));
          isFirstStore = false;

          return {
            customerId: input.customerId,
            businessId: bId,
            totalPrice,
            deliveryFee,
            deliveryAddress: input.deliveryAddress,
            customerPhone: input.customerPhone,
            notes: input.notes,
            batchCode,
            status: 'esperando_pago' as const,
            items: {
              create: storeItems.map((v) => ({
                productId: v.productId,
                quantity: v.quantity,
                unitPrice: v.unitPrice,
                subtotal: v.subtotal,
              })),
            },
            tracking: { create: {} },
            payment: {
              create: {
                method: input.paymentMethod,
                status: 'PENDING' as const,
                amount: totalPrice,
                qrCodeData:
                  input.paymentMethod === 'QR_MANUAL'
                    ? `pago-qr://pedidostrinidad/${storeBusiness.id}/${totalPrice}`
                    : null,
              },
            },
          };
        });

        const creadas = await Promise.all(
          payloads.map((data) =>
            tx.order.create({ data, select: { id: true, businessId: true } })
          )
        );

        return creadas;
      },
      // Margen para redes lentas; con las escrituras en paralelo sobra
      { timeout: 20000, maxWait: 10000 }
    );

    // 5. Ya fuera de la transacción: leer todo lo que hace falta de una vez
    const orden = createdIds.map((o) => o.id);
    const encontradas = await prisma.order.findMany({
      where: { id: { in: orden } },
      include: {
        items: { include: { product: true } },
        payment: true,
        tracking: true,
        business: true,
        customer: true,
      },
    });

    /* `findMany` no respeta el orden del `in`, y la primera comanda es la que
       lleva la tarifa de envío: la devolvemos como principal. */
    const createdOrdersData = orden
      .map((id) => encontradas.find((o) => o.id === id))
      .filter((o): o is (typeof encontradas)[number] => Boolean(o));

    // 6. Emitir eventos SSE en tiempo real a las tiendas y al seguimiento
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

    // Mapear a entidades de dominio (en paralelo, no en serie)
    const mapeadas = await Promise.all(
      createdOrdersData.map((raw) => this.orderRepository.findById(raw.id))
    );
    const domainOrders: Order[] = mapeadas.filter((o): o is Order => Boolean(o));

    const primaryOrder = domainOrders[0];
    if (!primaryOrder) {
      throw new Error('No se pudo recuperar el pedido recién creado');
    }

    return {
      order: primaryOrder,
      orders: domainOrders,
      batchCode,
      isMultiStore,
      payment: createdOrdersData[0]?.payment,
    };
  }
}
