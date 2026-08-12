import { NextRequest, NextResponse } from 'next/server';
import { webPushService } from '@/infrastructure/services/push/web-push-service';
import { requireUser, authErrorResponse } from '@/infrastructure/services/auth/session-guards';

export const dynamic = 'force-dynamic';

/**
 * Registra la suscripción push del dispositivo.
 *
 * `userId` y `role` salen de la sesión: antes venían en el cuerpo, así que
 * cualquiera podía registrarse en el canal de otro rol (por ejemplo
 * `driver:pool`) y recibir los avisos de pedidos de toda la flota.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { subscription, channel } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Suscripción inválida. Faltan endpoint o keys.' },
        { status: 400 }
      );
    }

    const canalPropio = `${user.role.toLowerCase()}:pool`;
    // Sólo se acepta el canal propio del rol o uno personal del usuario
    const targetChannel =
      channel === `user:${user.id}` || channel === canalPropio ? channel : canalPropio;

    webPushService.saveSubscription({
      subscription,
      channel: targetChannel,
      userId: user.id,
      role: user.role,
      createdAt: new Date().toISOString(),
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Suscripción registrada correctamente para el canal ${targetChannel}`,
      channel: targetChannel,
    });
  } catch (err: any) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    console.error('[API Notifications Subscribe] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Error al procesar la suscripción' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireUser();

    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');

    if (endpoint) {
      webPushService.removeSubscription(endpoint);
    }

    return NextResponse.json({ success: true, message: 'Suscripción eliminada' });
  } catch (err: any) {
    const authResponse = authErrorResponse(err);
    if (authResponse) return authResponse;

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
