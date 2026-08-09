import webpush, { PushSubscription as WebPushSubscription } from 'web-push';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  vibrate?: number[];
  data?: Record<string, any>;
}

export interface StoredSubscription {
  subscription: WebPushSubscription;
  channel: string; // ej: "driver:pool", "store:b4...", "customer:u1...", "admin:all"
  userId?: string;
  role?: string;
  createdAt: string;
  userAgent?: string;
}

// Persistencia en memoria global ante Hot Module Replacement (HMR)
interface GlobalPushState {
  vapidKeys: {
    publicKey: string;
    privateKey: string;
  };
  subscriptions: Map<string, StoredSubscription>; // Key: endpoint
}

declare global {
  // eslint-disable-next-line no-var
  var __globalPushState: GlobalPushState | undefined;
}

function initializeVapidKeys() {
  const envPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const envPrivate = process.env.VAPID_PRIVATE_KEY;

  if (envPublic && envPrivate) {
    return {
      publicKey: envPublic,
      privateKey: envPrivate,
    };
  }

  // Generar par de claves VAPID automático y seguro
  const generated = webpush.generateVAPIDKeys();
  return generated;
}

if (!globalThis.__globalPushState) {
  const vapidKeys = initializeVapidKeys();
  globalThis.__globalPushState = {
    vapidKeys,
    subscriptions: new Map(),
  };

  webpush.setVapidDetails(
    'mailto:soporte@pedidostrinidad.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

export class WebPushService {
  private get state(): GlobalPushState {
    return globalThis.__globalPushState!;
  }

  public getPublicKey(): string {
    return this.state.vapidKeys.publicKey;
  }

  public saveSubscription(stored: StoredSubscription) {
    const endpoint = stored.subscription.endpoint;
    this.state.subscriptions.set(endpoint, stored);
  }

  public removeSubscription(endpoint: string) {
    this.state.subscriptions.delete(endpoint);
  }

  public getSubscriptionsByChannel(channel: string): StoredSubscription[] {
    const list: StoredSubscription[] = [];
    this.state.subscriptions.forEach((sub) => {
      if (sub.channel === channel || channel === 'admin:all' || sub.channel === 'admin:all') {
        list.push(sub);
      }
    });
    return list;
  }

  public async sendNotification(
    subscription: WebPushSubscription,
    payload: PushNotificationPayload
  ): Promise<boolean> {
    try {
      const fullPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-192x192.png',
        url: payload.url || '/',
        tag: payload.tag || 'pedidos-trinidad-alert',
        vibrate: payload.vibrate || [200, 100, 200, 100, 200, 100, 400],
        data: {
          ...payload.data,
          url: payload.url || '/',
          dateOfArrival: Date.now(),
        },
      });

      await webpush.sendNotification(subscription, fullPayload, {
        TTL: 60 * 60, // 1 hora de persistencia si el dispositivo está apagado
        urgency: 'high',
      });
      return true;
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Suscripción expirada o revocada por el navegador
        this.removeSubscription(subscription.endpoint);
      } else {
        console.error('[WebPushService] Error sending push notification:', err);
      }
      return false;
    }
  }

  public async sendNotificationToChannel(
    channel: string,
    payload: PushNotificationPayload
  ): Promise<{ sent: number; failed: number }> {
    const matching = this.getSubscriptionsByChannel(channel);
    let sent = 0;
    let failed = 0;

    await Promise.all(
      matching.map(async (item) => {
        const success = await this.sendNotification(item.subscription, payload);
        if (success) {
          sent += 1;
        } else {
          failed += 1;
        }
      })
    );

    return { sent, failed };
  }

  public async broadcast(payload: PushNotificationPayload): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    const allSubs: StoredSubscription[] = [];
    this.state.subscriptions.forEach((s) => allSubs.push(s));
    await Promise.all(
      allSubs.map(async (item) => {
        const success = await this.sendNotification(item.subscription, payload);
        if (success) {
          sent += 1;
        } else {
          failed += 1;
        }
      })
    );

    return { sent, failed };
  }
}

export const webPushService = new WebPushService();
