import { NextRequest } from 'next/server';
import { realtimeEventBus, RealtimeEventPayload } from '@/infrastructure/services/events/realtime-event-bus';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channelsParam = searchParams.get('channels');

  const channels = channelsParam
    ? channelsParam
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    : ['admin:all'];

  if (channels.length === 0) {
    return new Response(JSON.stringify({ error: 'Debes especificar al menos un canal' }), {
      status: 400,
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
