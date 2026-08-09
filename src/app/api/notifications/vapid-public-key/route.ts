import { NextResponse } from 'next/server';
import { webPushService } from '@/infrastructure/services/push/web-push-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const publicKey = webPushService.getPublicKey();
  return NextResponse.json({ publicKey });
}
