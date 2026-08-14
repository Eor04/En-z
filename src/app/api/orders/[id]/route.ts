export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { GetOrderDetails } from '@/application/use-cases/orders/GetOrderDetails';
import { realtimeEventBus } from '@/infrastructure/services/events/realtime-event-bus';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';
import { getBatchProgress } from '@/application/services/order-batch';
import prisma from '@/infrastructure/db/prisma';
import type { SessionUser } from '@/infrastructure/services/auth/session-guards';

/**
 * ¿Este usuario puede ver o tocar este pedido?
 *
 * - ADMIN: todo
 * - CUSTOMER: sólo los suyos
 * - BUSINESS_OWNER: sólo los de su comercio
 * - DRIVER: el que tiene asignado, o cualquiera sin repartidor (para aceptarlo)
 */
async function canAccessOrder(user: SessionUser, orderId: string) {
  if (user.role === 'ADMIN') return true;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { customerId: true, driverId: true, business: { select: { ownerId: true } } },
  });
  if (!order) return false;

  if (user.role === 'CUSTOMER') return order.customerId === user.id;
  if (user.role === 'BUSINESS_OWNER') return order.business?.ownerId === user.id;
  if (user.role === 'DRIVER') return order.driverId === user.id || order.driverId === null;

  return false;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    if (!(await canAccessOrder(user, params.id))) {
      return NextResponse.json({ error: 'Este pedido no es tuyo.' }, { status: 403 });
    }

    const order = await new GetOrderDetails(new PrismaOrderRepository()).execute(params.id);
    return NextResponse.json({ order });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error al obtener orden:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener orden' },
      { status: error.message === 'Orden no encontrada' ? 404 : 500 }
    );
  }
}

/**
 * PATCH — cambiar el estado del pedido.
 *
 * Antes lo podía hacer cualquiera sin sesión: bastaba conocer el id para
 * marcar un pedido como entregado o cancelarlo.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(['ADMIN', 'BUSINESS_OWNER', 'DRIVER', 'CUSTOMER']);

    if (!(await canAccessOrder(user, params.id))) {
      return NextResponse.json({ error: 'Este pedido no es tuyo.' }, { status: 403 });
    }

    const body = await request.json();
    const { status, notesAppend } = body;

    if (!status) {
      return NextResponse.json({ error: 'El campo status es requerido' }, { status: 400 });
    }

    // El cliente sólo puede cancelar, y sólo mientras no haya salido de cocina
    if (user.role === 'CUSTOMER') {
      const current = await prisma.order.findUnique({
        where: { id: params.id },
        select: { status: true },
      });
      const cancelable = ['esperando_pago', 'en_preparacion'];
      if (status !== 'cancelado' || !cancelable.includes(current?.status ?? '')) {
        return NextResponse.json(
          { error: 'Sólo podés cancelar el pedido antes de que salga del local.' },
          { status: 403 }
        );
      }
    }

    const orderRepository = new PrismaOrderRepository();
    const updatedOrder = await orderRepository.updateStatus(params.id, status);

    if (notesAppend) {
      const currentOrder = await orderRepository.findById(params.id);
      const newNotes = currentOrder?.notes
        ? `${currentOrder.notes} [Motivo: ${notesAppend}]`
        : `[Motivo: ${notesAppend}]`;

      await prisma.order.update({
        where: { id: params.id },
        data: { notes: newNotes },
      });
    }

    const orderJson = updatedOrder.toJSON();

    // Estado del lote completo (para un pedido de un solo local, total = 1)
    const batch = await getBatchProgress(params.id);

    const eventType =
      status === 'buscando_driver' ? 'order:ready_for_pickup' : 'order:status_updated';

    // El cliente sigue el lote entero: le mandamos también cuántas cocinas
    // terminaron y a cuáles falta esperar.
    for (const hermana of batch.siblings) {
      realtimeEventBus.publish(`order:${hermana.id}`, eventType, {
        orderId: params.id,
        status,
        businessId: updatedOrder.businessId,
        batch: {
          total: batch.total,
          listas: batch.listas,
          pendientes: batch.pendientes,
          readyForPickup: batch.readyForPickup,
          esperandoA: batch.esperandoA,
        },
      });
    }

    realtimeEventBus.publish(`store:${updatedOrder.businessId}`, 'order:status_updated', {
      orderId: params.id,
      status,
    });

    /* Sólo se libera al pool de repartidores cuando TODAS las cocinas del lote
       terminaron. Antes cada comanda se anunciaba por su cuenta y el
       repartidor terminaba yendo dos veces al mismo patio. */
    if (status === 'buscando_driver' && batch.readyForPickup) {
      realtimeEventBus.publish('driver:pool', 'order:ready_for_pickup', {
        orderId: params.id,
        orderIds: batch.siblings.map((s) => s.id),
        businessId: updatedOrder.businessId,
        status: 'buscando_driver',
        deliveryAddress: updatedOrder.deliveryAddress,
        isMultiStore: batch.isMultiStore,
        pickupCount: batch.total,
      });
    }

    return NextResponse.json({ success: true, order: orderJson, batch });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error al actualizar estado de orden:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar orden' },
      { status: 500 }
    );
  }
}
