import { NextRequest, NextResponse } from 'next/server';
import { webPushService } from '@/infrastructure/services/push/web-push-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, channel, userId, role } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Suscripción inválida. Faltan endpoint o keys.' },
        { status: 400 }
      );
    }

    const targetChannel = channel || (role ? `${role.toLowerCase()}:pool` : 'customer:general');

    webPushService.saveSubscription({
      subscription,
      channel: targetChannel,
      userId,
      role,
      createdAt: new Date().toISOString(),
      userAgent: req.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Suscripción registrada correctamente para el canal ${targetChannel}`,
      channel: targetChannel,
    });
  } catch (err: any) {
    console.error('[API Notifications Subscribe] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Error al procesar la suscripción' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');

    if (endpoint) {
      webPushService.removeSubscription(endpoint);
    }

    return NextResponse.json({ success: true, message: 'Suscripción eliminada' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
