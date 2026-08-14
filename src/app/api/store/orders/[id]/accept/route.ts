export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { VerifyPaymentReceipt } from '@/application/use-cases/payments/VerifyPaymentReceipt';
import {
  requireUser,
  requireOwnedBusiness,
  authErrorResponse,
} from '@/infrastructure/services/auth/session-guards';
import { realtimeEventBus } from '@/infrastructure/services/events/realtime-event-bus';
import prisma from '@/infrastructure/db/prisma';

/**
 * La tienda acepta el pedido en UN solo paso.
 *
 * Antes eran dos gestos en pestañas distintas: aceptar la comanda en "Cocina"
 * y aprobar el comprobante en "Comprobantes QR". Si sólo se hacía lo primero,
 * el pedido quedaba trabado sin que nadie lo notara.
 *
 * Ahora, al aceptar:
 *  - si el pago es QR y hay comprobante, se aprueba junto con la comanda
 *  - si es efectivo o ya estaba aprobado, sólo se manda a cocina
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(['BUSINESS_OWNER', 'ADMIN']);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'El pedido no existe' }, { status: 404 });
    }

    await requireOwnedBusiness(user, order.businessId);

    if (order.status !== 'esperando_pago') {
      return NextResponse.json(
        { error: `Este pedido ya fue aceptado (está en "${order.status}").` },
        { status: 409 }
      );
    }

    const pago = order.payment;
    const esQr = pago?.method === 'QR_MANUAL';
    const yaAprobado = pago?.status === 'APPROVED';

    // Un QR sin comprobante no se puede dar por cobrado
    if (esQr && !yaAprobado && !pago?.receiptUrl) {
      return NextResponse.json(
        {
          error:
            'El cliente todavía no adjuntó el comprobante. Podés esperarlo o rechazar el pedido.',
          faltaComprobante: true,
        },
        { status: 409 }
      );
    }

    // Caso QR con comprobante: aprobar pago y mandar a cocina de una vez
    if (esQr && !yaAprobado && pago) {
      const resultado = await new VerifyPaymentReceipt(
        new PrismaPaymentRepository(),
        new PrismaOrderRepository()
      ).execute({
        paymentId: pago.id,
        verifiedByUserId: user.id,
        approved: true,
      });

      return NextResponse.json({
        ...resultado,
        success: true,
        pagoAprobado: true,
        message: 'Pedido aceptado y pago confirmado. Ya está en cocina.',
      });
    }

    // Efectivo, tarjeta ya aprobada o QR previamente verificado
    const actualizado = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: params.id },
        data: { status: 'en_preparacion', updatedAt: new Date() },
      });
      await tx.orderTracking.updateMany({
        where: { orderId: params.id },
        data: { acceptedAt: new Date() },
      });
      return o;
    });

    realtimeEventBus.publish(`order:${params.id}`, 'order:status_updated', {
      orderId: params.id,
      status: 'en_preparacion',
      businessId: order.businessId,
    });
    realtimeEventBus.publish(`store:${order.businessId}`, 'order:status_updated', {
      orderId: params.id,
      status: 'en_preparacion',
    });

    return NextResponse.json({
      success: true,
      pagoAprobado: yaAprobado,
      message: esQr
        ? 'Pedido aceptado. El pago ya estaba confirmado.'
        : 'Pedido aceptado. Se cobra en efectivo al entregar.',
      order: actualizado,
    });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al aceptar el pedido' },
      { status: 400 }
    );
  }
}
