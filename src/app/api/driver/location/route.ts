export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';
import { realtimeEventBus } from '@/infrastructure/services/events/realtime-event-bus';
import prisma from '@/infrastructure/db/prisma';

/**
 * El repartidor reporta dónde está.
 *
 * Se guarda en su usuario (una posición por repartidor, no por pedido) y se
 * reenvía por SSE al canal de cada pedido que lleva encima, para que el cliente
 * vea la moto moverse sin recargar.
 */
export async function POST(req: Request) {
  try {
    const driver = await requireUser(['DRIVER', 'ADMIN']);
    const { lat, lng } = await req.json();

    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return NextResponse.json({ error: 'Coordenadas fuera de rango' }, { status: 400 });
    }

    const now = new Date();

    await prisma.user.update({
      where: { id: driver.id },
      data: { driverLat: latNum, driverLng: lngNum, driverLocationAt: now },
    });

    // Sólo los pedidos que realmente está entregando
    const enCurso = await prisma.order.findMany({
      where: { driverId: driver.id, status: 'en_camino' },
      select: { id: true },
    });

    enCurso.forEach((o) => {
      realtimeEventBus.publish(`order:${o.id}`, 'driver:location', {
        orderId: o.id,
        lat: latNum,
        lng: lngNum,
        at: now.toISOString(),
      });
    });

    return NextResponse.json({ success: true, notificados: enCurso.length });
  } catch (error: any) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    return NextResponse.json(
      { error: error.message || 'Error al reportar ubicación' },
      { status: 400 }
    );
  }
}
