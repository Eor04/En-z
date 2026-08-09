'use client';

import { useState, useEffect, useCallback } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface UsePushNotificationsOptions {
  channel?: string;
  role?: string;
  userId?: string;
  autoRegisterServiceWorker?: boolean;
}

export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const {
    channel,
    role,
    userId,
    autoRegisterServiceWorker = true,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // 1. Detectar soporte y registrar Service Worker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported =
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission);

    if (autoRegisterServiceWorker) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(async (reg) => {
          setSwRegistration(reg);
          const existingSub = await reg.pushManager.getSubscription();
          setIsSubscribed(!!existingSub);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    }
  }, [autoRegisterServiceWorker]);

  // 2. Suscribirse a Push Notifications
  const subscribe = useCallback(
    async (overrideChannel?: string): Promise<boolean> => {
      if (!isSupported) {
        alert('Las notificaciones Push no están soportadas en este navegador.');
        return false;
      }

      setLoading(true);

      try {
        // Pedir permiso nativo al usuario
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm !== 'granted') {
          setLoading(false);
          return false;
        }

        // Obtener el Service Worker Registration
        let reg = swRegistration;
        if (!reg) {
          reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          setSwRegistration(reg);
        }
        await navigator.serviceWorker.ready;

        // Obtener la clave pública VAPID del servidor
        const resKey = await fetch('/api/notifications/vapid-public-key');
        const { publicKey } = await resKey.json();

        if (!publicKey) {
          throw new Error('No se pudo obtener la clave VAPID pública del servidor.');
        }

        const applicationServerKey = urlBase64ToUint8Array(publicKey);

        // Suscribir en el PushManager del navegador
        let subscription = await reg.pushManager.getSubscription();
        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
        }

        // Registrar la suscripción en el backend
        const targetChannel =
          overrideChannel ||
          channel ||
          (role ? `${role.toLowerCase()}:pool` : 'customer:general');

        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            channel: targetChannel,
            role,
            userId,
          }),
        });

        setIsSubscribed(true);
        setLoading(false);
        return true;
      } catch (err) {
        console.error('[PWA Push Hook] Error during subscribe:', err);
        setLoading(false);
        return false;
      }
    },
    [isSupported, swRegistration, channel, role, userId]
  );

  // 3. Probar envío de notificación
  const sendTestPush = useCallback(
    async (titleOrChannel?: string, customBody?: string) => {
      try {
        let targetChannel = channel || (role ? `${role.toLowerCase()}:pool` : 'driver:pool');
        let pushTitle = '🔔 Pedidos Trinidad - Alerta Push';
        let pushBody = '¡Notificación en segundo plano con vibración de alerta funcionando al 100%!';

        if (titleOrChannel && customBody) {
          pushTitle = titleOrChannel;
          pushBody = customBody;
        } else if (titleOrChannel && !customBody) {
          if (titleOrChannel.includes(':')) {
            targetChannel = titleOrChannel;
          } else {
            pushTitle = titleOrChannel;
          }
        }

        const res = await fetch('/api/notifications/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: targetChannel,
            title: pushTitle,
            body: pushBody,
            url: typeof window !== 'undefined' ? window.location.pathname : '/',
          }),
        });
        const data = await res.json();
        return data;
      } catch (err) {
        console.error('[PWA Push Hook] Error sending test push:', err);
        return null;
      }
    },
    [channel, role]
  );

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    sendTestPush,
  };
}
