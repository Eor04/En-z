import { NextRequest, NextResponse } from 'next/server';
import { webPushService } from '@/infrastructure/services/push/web-push-service';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';

export const dynamic = 'force-dynamic';

/**
 * Notificación de prueba.
 *
 * Antes cualquiera podía disparar un push con texto arbitrario a cualquier
 * canal (`driver:pool`, por ejemplo): un vector de spam directo a los teléfonos
 * de toda la flota. Ahora sólo se puede probar sobre el canal propio, y el
 * texto es fijo salvo para ADMIN.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));

    const canalPropio = `${user.role.toLowerCase()}:pool`;
    const channel = user.role === 'ADMIN' ? (body.channel ?? canalPropio) : canalPropio;

    const title =
      user.role === 'ADMIN' && body.title ? body.title : 'En Z · Notificación de prueba';
    const text =
      user.role === 'ADMIN' && body.body
        ? body.body
        : 'Si ves esto, las alertas de tus pedidos están funcionando.';
    const url = user.role === 'ADMIN' && body.url ? body.url : '/orders';

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
      message: `Enviado a ${channel}. Dispositivos alcanzados: ${result.sent}, fallidos: ${result.failed}`,
    });
  } catch (err: any) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    console.error('[API Notifications Test] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Error al enviar notificación de prueba' },
      { status: 500 }
    );
  }
}
