import { NextRequest } from 'next/server';
import { realtimeEventBus, RealtimeEventPayload } from '@/infrastructure/services/events/realtime-event-bus';
import { getSessionUser, type SessionUser } from '@/infrastructure/services/auth/session-guards';
import prisma from '@/infrastructure/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * ¿Puede este usuario escuchar este canal?
 *
 * Sin este filtro, cualquiera podía suscribirse a `admin:all` (por defecto) o a
 * `order:<id>` / `store:<id>` ajenos y ver en vivo los eventos de toda la
 * plataforma: pedidos, direcciones y cambios de estado.
 */
async function puedeEscuchar(user: SessionUser, channel: string): Promise<boolean> {
  if (user.role === 'ADMIN') return true;

  const [tipo, id] = channel.split(':');

  if (tipo === 'admin') return false;

  if (tipo === 'driver') return user.role === 'DRIVER';

  if (tipo === 'customer') return user.role === 'CUSTOMER';

  if (tipo === 'order') {
    const order = await prisma.order.findUnique({
      where: { id },
      select: { customerId: true, driverId: true, business: { select: { ownerId: true } } },
    });
    if (!order) return false;
    if (user.role === 'CUSTOMER') return order.customerId === user.id;
    if (user.role === 'BUSINESS_OWNER') return order.business?.ownerId === user.id;
    if (user.role === 'DRIVER') return order.driverId === user.id || order.driverId === null;
    return false;
  }

  if (tipo === 'store') {
    if (user.role !== 'BUSINESS_OWNER') return false;
    const business = await prisma.business.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    return business?.ownerId === user.id;
  }

  return false;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Iniciá sesión para continuar.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(req.url);
  const channelsParam = searchParams.get('channels');

  const solicitados = channelsParam
    ? channelsParam
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  if (solicitados.length === 0) {
    return new Response(JSON.stringify({ error: 'Debes especificar al menos un canal' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const permisos = await Promise.all(solicitados.map((c) => puedeEscuchar(user, c)));
  const channels = solicitados.filter((_, i) => permisos[i]);

  if (channels.length === 0) {
    return new Response(JSON.stringify({ error: 'No tenés acceso a esos canales.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Patrón oficial Next.js 14 TransformStream para SSE fluido
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // 1. Mensaje inicial de bienvenida y confirmación de canal
  const initialPayload = JSON.stringify({
    status: 'connected',
    channels,
    connectedAt: new Date().toISOString(),
  });

  writer.write(encoder.encode(`event: system:connected\ndata: ${initialPayload}\n\n`)).catch(() => {});

  // 2. Suscribirse a los eventos del bus singleton
  const onEvent = async (event: RealtimeEventPayload) => {
    try {
      const sseMessage = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
      await writer.write(encoder.encode(sseMessage));
    } catch {
      // Conexión cerrada por el cliente
    }
  };

  const unsubscribe = realtimeEventBus.subscribeMultiple(channels, onEvent);

  // 3. Heartbeat / Keep-alive cada 10 segundos
  const heartbeat = setInterval(async () => {
    try {
      await writer.write(encoder.encode(`: ping ${Date.now()}\n\n`));
    } catch {
      clearInterval(heartbeat);
    }
  }, 10000);

  // 4. Limpieza ante desconexión o aborto del cliente
  req.signal.addEventListener('abort', () => {
    clearInterval(heartbeat);
    unsubscribe();
    try {
      writer.close();
    } catch {}
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Content-Encoding': 'none',
      'X-Accel-Buffering': 'no',
    },
  });
}
