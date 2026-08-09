// Service Worker para Pedidos Trinidad (PWA & Web Push)
const CACHE_NAME = 'pedidos-trinidad-v1';
const OFFLINE_FALLBACK = '/';

self.addEventListener('install', (event) => {
  // Activar inmediatamente el nuevo Service Worker sin esperar a que cierren pestañas
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Tomar control inmediato de todas las pestañas abiertas
      await self.clients.claim();
    })()
  );
});

// 🔔 Manejo de Notificaciones Push entrantes en segundo plano
self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 Pedidos Trinidad',
    body: 'Tienes una nueva actualización de pedido.',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    url: '/',
    tag: 'pedidos-trinidad-notification',
    vibrate: [200, 100, 200, 100, 200, 100, 400],
    data: {},
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const title = data.title || '🔔 Pedidos Trinidad';
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.svg',
    badge: data.badge || '/icons/icon-192x192.svg',
    tag: data.tag || 'pedidos-trinidad-alert',
    renotify: true,
    requireInteraction: true, // Mantener en pantalla hasta que el usuario la toque
    vibrate: data.vibrate || [200, 100, 200, 100, 200, 100, 400],
    data: {
      url: data.url || (data.data && data.data.url) || '/',
      ...data.data,
    },
    actions: [
      {
        action: 'open_order',
        title: '👉 Ver en App',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 👆 Manejo del clic en la notificación nativa
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Si ya hay una pestaña abierta de Pedidos Trinidad, enfocarla y navegar
      for (const client of allClients) {
        if (client.url && 'focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      }

      // Si la app estaba cerrada en segundo plano, abrir una nueva ventana
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })()
  );
});
