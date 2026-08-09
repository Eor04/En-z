import { EventEmitter } from 'events';
import { webPushService } from '@/infrastructure/services/push/web-push-service';

export type RealtimeEventType =
  | 'order:created'
  | 'order:paid'
  | 'order:status_updated'
  | 'order:ready_for_pickup'
  | 'order:driver_assigned'
  | 'order:in_route'
  | 'order:delivered'
  | 'order:cancelled'
  | 'system:ping';

export interface RealtimeEventPayload {
  id: string;
  type: RealtimeEventType;
  channel: string;
  timestamp: string;
  data: any;
}

export type RealtimeEventListener = (event: RealtimeEventPayload) => void;

class RealtimeEventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(2000);
  }

  /**
   * Publica un evento en un canal específico y envía notificación Web Push en segundo plano si aplica
   */
  public publish(channel: string, type: RealtimeEventType, data: any): void {
    const eventPayload: RealtimeEventPayload = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      channel,
      timestamp: new Date().toISOString(),
      data,
    };

    // 1. Emitir al canal específico en memoria (SSE)
    this.emitter.emit(channel, eventPayload);

    // 2. Emitir a los canales globales
    if (channel !== 'admin:all') {
      this.emitter.emit('admin:all', eventPayload);
    }

    // 3. Despachar Notificación Push Web en segundo plano (no bloqueante)
    this.dispatchPushNotification(channel, type, data).catch((err) => {
      console.warn('[RealtimeEventBus] Error dispatching push notification:', err);
    });
  }

  private async dispatchPushNotification(
    channel: string,
    type: RealtimeEventType,
    data: any
  ): Promise<void> {
    try {
      const orderId = data?.orderId || data?.id || '';
      const orderCode = data?.orderNumber || (orderId ? `#${String(orderId).slice(0, 6)}` : '');

      switch (type) {
        case 'order:created':
          await webPushService.sendNotificationToChannel(channel, {
            title: `🍳 ¡Nuevo Pedido ${orderCode}!`,
            body: `Tienes una comanda nueva por Bs ${data?.totalAmount || ''}. Toca para autorizar y preparar.`,
            url: '/store/dashboard',
            tag: `order-created-${orderId}`,
            vibrate: [200, 100, 200, 100, 300],
          });
          break;

        case 'order:paid':
          await webPushService.sendNotificationToChannel(channel, {
            title: `💰 ¡Pago Aprobado ${orderCode}!`,
            body: 'Comprobante verificado. Prepara la orden para despacho.',
            url: '/store/dashboard',
            tag: `order-paid-${orderId}`,
            vibrate: [150, 100, 150],
          });
          break;

        case 'order:ready_for_pickup':
          // Notificar a la flota de repartidores
          await webPushService.sendNotificationToChannel('driver:pool', {
            title: `🛵 ¡Pedido Listo para Recojo ${orderCode}!`,
            body: `Comida lista en ${data?.businessName || 'local'}. Toca para tomar la entrega.`,
            url: '/driver/dashboard',
            tag: `order-pickup-${orderId}`,
            vibrate: [300, 150, 300, 150, 400],
          });
          break;

        case 'order:driver_assigned':
          // Notificar a cliente y a cocina
          await webPushService.sendNotificationToChannel(channel, {
            title: `🛵 ¡Repartidor Asignado ${orderCode}!`,
            body: `Repartidor en camino a retirar el pedido.`,
            url: orderId ? `/orders/${orderId}` : '/driver/dashboard',
            tag: `driver-assigned-${orderId}`,
            vibrate: [200, 100, 200],
          });
          break;

        case 'order:in_route':
          await webPushService.sendNotificationToChannel(channel, {
            title: `🚀 ¡Tu Pedido va en Camino ${orderCode}!`,
            body: 'El repartidor ya recogió tu pedido y se dirige a tu puerta.',
            url: orderId ? `/orders/${orderId}` : '/',
            tag: `in-route-${orderId}`,
            vibrate: [200, 100, 200, 100, 200],
          });
          break;

        case 'order:delivered':
          await webPushService.sendNotificationToChannel(channel, {
            title: `🎉 ¡Pedido Entregado ${orderCode}!`,
            body: 'Tu pedido llegó a tu puerta. ¡Gracias por ordenar con nosotros!',
            url: orderId ? `/orders/${orderId}` : '/',
            tag: `delivered-${orderId}`,
            vibrate: [200, 100, 400],
          });
          break;

        default:
          break;
      }
    } catch (err) {
      // Ignorar errores push silenciosamente
    }
  }

  public subscribe(channel: string, listener: RealtimeEventListener): () => void {
    this.emitter.on(channel, listener);
    return () => {
      this.emitter.off(channel, listener);
    };
  }

  public subscribeMultiple(channels: string[], listener: RealtimeEventListener): () => void {
    const unsubscribes = channels.map((ch) => this.subscribe(ch, listener));
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }
}

const globalForEvents = globalThis as unknown as {
  realtimeEventBus: RealtimeEventBus | undefined;
};

export const realtimeEventBus =
  globalForEvents.realtimeEventBus ?? new RealtimeEventBus();

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.realtimeEventBus = realtimeEventBus;
}

export default realtimeEventBus;
