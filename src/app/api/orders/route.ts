export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { PrismaBusinessRepository } from '@/infrastructure/repositories/PrismaBusinessRepository';
import { PrismaProductRepository } from '@/infrastructure/repositories/PrismaProductRepository';
import { CreateOrder } from '@/application/use-cases/orders/CreateOrder';
import { ListCustomerOrders } from '@/application/use-cases/orders/ListCustomerOrders';
import { ListBusinessOrders } from '@/application/use-cases/orders/ListBusinessOrders';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';
import prisma from '@/infrastructure/db/prisma';

/**
 * POST /api/orders — crear pedido.
 *
 * Sólo clientes autenticados. El `customerId` se toma SIEMPRE de la sesión:
 * aceptarlo del cuerpo permitiría hacer pedidos a nombre de otra persona.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(['CUSTOMER']);

    const body = await request.json();
    const { businessId, deliveryAddress, customerPhone, notes, paymentMethod = 'CASH', items } = body;

    if (
      !deliveryAddress ||
      !customerPhone ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Faltan datos del pedido (dirección, teléfono o productos).' },
        { status: 400 }
      );
    }

    const createOrderUseCase = new CreateOrder(
      new PrismaOrderRepository(),
      new PrismaBusinessRepository(),
      new PrismaProductRepository()
    );

    const result = await createOrderUseCase.execute({
      customerId: user.id,
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
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error al crear orden:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar el pedido' },
      { status: 400 }
    );
  }
}

/**
 * GET /api/orders — listar pedidos según quién pregunta.
 *
 * El alcance lo decide el rol de la sesión, no los parámetros de la URL:
 * antes cualquiera podía leer el historial completo de otro cliente pasando
 * `?customerId=`, o los pedidos de toda la plataforma sin sesión.
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    if (user.role === 'CUSTOMER') {
      const orders = await new ListCustomerOrders().execute(user.id);
      return NextResponse.json({ orders });
    }

    if (user.role === 'BUSINESS_OWNER') {
      const business = await prisma.business.findFirst({
        where: { ownerId: user.id },
        select: { id: true },
      });
      if (!business) return NextResponse.json({ orders: [] });

      const orders = await new ListBusinessOrders().execute(business.id);
      return NextResponse.json({ orders });
    }

    if (user.role === 'DRIVER') {
      const orders = await prisma.order.findMany({
        where: { driverId: user.id },
        include: {
          business: { select: { id: true, name: true } },
          items: { include: { product: true } },
          payment: true,
          tracking: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ orders });
    }

    // ADMIN: puede filtrar libremente y ver la auditoría global
    const businessId = searchParams.get('businessId');
    const customerId = searchParams.get('customerId');

    if (businessId) {
      const orders = await new ListBusinessOrders().execute(businessId);
      return NextResponse.json({ orders });
    }
    if (customerId) {
      const orders = await new ListCustomerOrders().execute(customerId);
      return NextResponse.json({ orders });
    }

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
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error al listar órdenes:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener órdenes' },
      { status: 500 }
    );
  }
}
