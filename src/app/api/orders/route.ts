export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/infrastructure/services/auth/auth-options';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { PrismaBusinessRepository } from '@/infrastructure/repositories/PrismaBusinessRepository';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { CreateOrder } from '@/application/use-cases/orders/CreateOrder';
import { ListCustomerOrders } from '@/application/use-cases/orders/ListCustomerOrders';
import { ListBusinessOrders } from '@/application/use-cases/orders/ListBusinessOrders';
import prisma from '@/infrastructure/db/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const {
      businessId,
      deliveryAddress,
      customerPhone,
      notes,
      paymentMethod = 'CASH',
      items,
      customerId: customCustomerId,
    } = body;

    // Obtener ID del cliente (de la sesión o custom si es prueba/demo)
    let customerId = (session?.user as any)?.id || customCustomerId;

    if (!customerId) {
      // Si no hay sesión, buscar al usuario cliente Mateo demo
      const demoCustomer = await prisma.user.findFirst({
        where: { role: 'CUSTOMER' },
      });
      customerId = demoCustomer?.id;
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión para realizar un pedido' },
        { status: 401 }
      );
    }

    if (!deliveryAddress || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Campos requeridos faltantes (deliveryAddress, customerPhone, items)' },
        { status: 400 }
      );
    }

    const orderRepository = new PrismaOrderRepository();
    const businessRepository = new PrismaBusinessRepository();
    const productRepository = new PrismaProductRepository();

    const createOrderUseCase = new CreateOrder(
      orderRepository,
      businessRepository,
      productRepository
    );

    const result = await createOrderUseCase.execute({
      customerId,
      businessId,
      deliveryAddress,
      customerPhone,
      notes,
      paymentMethod,
      items,
    });

    return NextResponse.json(
      {
        success: true,
        order: result.order.toJSON(),
        orders: result.orders ? result.orders.map((o) => o.toJSON()) : [result.order.toJSON()],
        batchCode: result.batchCode,
        isMultiStore: result.isMultiStore,
        payment: result.payment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error al crear orden:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el pedido' },
      { status: 400 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const customerId = searchParams.get('customerId');

    const user = session?.user as any;

    // Si se especifica businessId o el usuario es tienda
    if (businessId || user?.role === 'BUSINESS_OWNER') {
      const targetBusinessId = businessId || (await prisma.business.findFirst({ where: { ownerId: user?.id } }))?.id;
      if (targetBusinessId) {
        const useCase = new ListBusinessOrders();
        const orders = await useCase.execute(targetBusinessId);
        return NextResponse.json({ orders });
      }
    }

    // Si se especifica customerId o el usuario es cliente
    const targetCustomerId = customerId || user?.id;
    if (targetCustomerId) {
      const useCase = new ListCustomerOrders();
      const orders = await useCase.execute(targetCustomerId);
      return NextResponse.json({ orders });
    }

    // Si es ADMIN o sin filtro
    const orders = await prisma.order.findMany({
      include: {
        business: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
        items: { include: { product: true } },
        payment: true,
        tracking: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error al listar órdenes:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener órdenes' },
      { status: 500 }
    );
  }
}
