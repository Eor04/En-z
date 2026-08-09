import { NextRequest, NextResponse } from 'next/server';
import { webPushService } from '@/infrastructure/services/push/web-push-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      channel = 'driver:pool',
      title = '🚨 ¡Prueba de Notificación Push!',
      body: text = 'Pedidos Trinidad: Notificación con vibración de 3 pulsos y sonido activado.',
      url = '/driver/dashboard',
    } = body;

    const result = await webPushService.sendNotificationToChannel(channel, {
      title,
      body: text,
      url,
      vibrate: [200, 100, 200, 100, 200, 100, 400],
      tag: 'test-notification',
    });

    return NextResponse.json({
      success: true,
      result,
      message: `Enviado a canal ${channel}. Dispositivos alcanzados: ${result.sent}, fallidos: ${result.failed}`,
    });
  } catch (err: any) {
    console.error('[API Notifications Test] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Error al enviar notificación de prueba' },
      { status: 500 }
    );
  }
}
