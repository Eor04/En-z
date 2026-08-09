export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { GetOrderDetails } from '@/application/use-cases/orders/GetOrderDetails';
import { realtimeEventBus } from '@/infrastructure/services/events/realtime-event-bus';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderRepository = new PrismaOrderRepository();
    const useCase = new GetOrderDetails(orderRepository);

    const order = await useCase.execute(params.id);

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error al obtener orden:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener orden' },
      { status: error.message === 'Orden no encontrada' ? 404 : 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, notesAppend } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'El campo status es requerido' },
        { status: 400 }
      );
    }

    const orderRepository = new PrismaOrderRepository();
    const updatedOrder = await orderRepository.updateStatus(params.id, status);

    if (notesAppend) {
      const currentOrder = await orderRepository.findById(params.id);
      const newNotes = currentOrder?.notes
        ? `${currentOrder.notes} [Motivo: ${notesAppend}]`
        : `[Motivo: ${notesAppend}]`;

      const prisma = (await import('@/infrastructure/db/prisma')).default;
      await prisma.order.update({
        where: { id: params.id },
        data: { notes: newNotes },
      });
    }

    // Emitir eventos SSE en tiempo real
    const orderJson = updatedOrder.toJSON();
    const eventType = status === 'buscando_driver' ? 'order:ready_for_pickup' : 'order:status_updated';

    // Notificar al cliente en su pantalla de seguimiento
    realtimeEventBus.publish(`order:${params.id}`, eventType, {
      orderId: params.id,
      status,
      businessId: updatedOrder.businessId,
    });

    // Notificar a la tienda
    realtimeEventBus.publish(`store:${updatedOrder.businessId}`, 'order:status_updated', {
      orderId: params.id,
      status,
    });

    // Si está listo para recojo (buscando repartidor), avisar a todos los repartidores
    if (status === 'buscando_driver') {
      realtimeEventBus.publish('driver:pool', 'order:ready_for_pickup', {
        orderId: params.id,
        businessId: updatedOrder.businessId,
        status: 'buscando_driver',
        deliveryAddress: updatedOrder.deliveryAddress,
      });
    }

    return NextResponse.json({
      success: true,
      order: orderJson,
    });
  } catch (error: any) {
    console.error('Error al actualizar estado de orden:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar orden' },
      { status: 500 }
    );
  }
}
