export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { VerifyPaymentReceipt } from '@/application/use-cases/payments/VerifyPaymentReceipt';
import { ListPendingReceipts } from '@/application/use-cases/payments/ListPendingReceipts';
import {
  requireUser,
  requireOwnedBusiness,
  getOwnBusinessId,
  authErrorResponse,
} from '@/infrastructure/services/auth/session-guards';
import prisma from '@/infrastructure/db/prisma';

const paymentRepository = new PrismaPaymentRepository();
const orderRepository = new PrismaOrderRepository();
const verifyPaymentReceipt = new VerifyPaymentReceipt(paymentRepository, orderRepository);
const listPendingReceipts = new ListPendingReceipts();

/**
 * GET — comprobantes pendientes de verificar.
 *
 * Antes `?businessId=` dejaba a cualquiera leer los comprobantes bancarios de
 * cualquier comercio, sin sesión.
 */
export async function GET(req: Request) {
  try {
    const user = await requireUser(['BUSINESS_OWNER', 'ADMIN']);
    const { searchParams } = new URL(req.url);

    let businessId: string | undefined;

    if (user.role === 'ADMIN') {
      businessId = searchParams.get('businessId') || undefined;
    } else {
      const own = await getOwnBusinessId(user);
      if (!own) return NextResponse.json({ receipts: [] });
      businessId = own;
    }

    const receipts = await listPendingReceipts.execute(businessId);
    return NextResponse.json({ receipts });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al obtener comprobantes pendientes' },
      { status: 500 }
    );
  }
}

/**
 * POST — aprobar o rechazar un comprobante.
 *
 * Antes no había control alguno: cualquiera podía dar por pagado un pedido
 * ajeno (quedaba registrado como 'admin-system').
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(['BUSINESS_OWNER', 'ADMIN']);
    const body = await req.json();

    if (!body.paymentId) {
      return NextResponse.json({ error: 'paymentId es requerido' }, { status: 400 });
    }

    // El comprobante debe pertenecer a un pedido del comercio de quien verifica
    const payment = await prisma.payment.findUnique({
      where: { id: body.paymentId },
      select: { order: { select: { businessId: true } } },
    });

    if (!payment?.order) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    await requireOwnedBusiness(user, payment.order.businessId);

    const result = await verifyPaymentReceipt.execute({
      paymentId: body.paymentId,
      verifiedByUserId: user.id,
      approved: Boolean(body.approved),
      rejectionReason: body.rejectionReason,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al procesar verificación del comprobante' },
      { status: 400 }
    );
  }
}
