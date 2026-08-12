export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { PrismaOrderRepository } from '@/infrastructure/repositories/PrismaOrderRepository';
import { HandleGatewayWebhook } from '@/application/use-cases/payments/HandleGatewayWebhook';

const paymentRepository = new PrismaPaymentRepository();
const orderRepository = new PrismaOrderRepository();
const handleGatewayWebhook = new HandleGatewayWebhook(paymentRepository, orderRepository);

/**
 * Webhook de la pasarela de pagos.
 *
 * No lleva sesión (lo llama un servidor externo), así que la única defensa es
 * la firma HMAC del cuerpo. Antes el campo `signature` se recibía y se
 * ignoraba: bastaba un POST con `{orderId, event:'payment.completed'}` para
 * dar por pagado cualquier pedido sin haber pagado nada.
 *
 * Requiere PAYMENT_WEBHOOK_SECRET. Sin ese secreto el endpoint rechaza todo
 * (falla cerrado): en un endpoint de cobros es preferible perder un webhook
 * que aceptar uno falso.
 */
function firmaValida(rawBody: string, recibida: string | null): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || !recibida) return false;

  const esperada = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(esperada, 'utf8');
  const b = Buffer.from(recibida.replace(/^sha256=/, ''), 'utf8');

  // timingSafeEqual exige longitudes iguales
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  try {
    if (!process.env.PAYMENT_WEBHOOK_SECRET) {
      console.error(
        '[webhook] PAYMENT_WEBHOOK_SECRET no está configurado: se rechazan todos los webhooks.'
      );
      return NextResponse.json(
        { error: 'Webhook no configurado en el servidor.' },
        { status: 503 }
      );
    }

    // Hay que leer el cuerpo crudo: el JSON reserializado no coincidiría con la firma
    const rawBody = await req.text();
    const firma = req.headers.get('x-webhook-signature') ?? req.headers.get('x-signature');

    if (!firmaValida(rawBody, firma)) {
      return NextResponse.json({ error: 'Firma inválida.' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    const result = await handleGatewayWebhook.execute({
      event: payload.event || 'payment.completed',
      orderId: payload.orderId,
      transactionId: payload.transactionId || `TX-WH-${Date.now()}`,
      amount: payload.amount,
      currency: payload.currency || 'BOB',
      signature: firma ?? undefined,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al procesar webhook de pago' },
      { status: 400 }
    );
  }
}
