// Utilidades para navegación GPS nativa en Google Maps y Waze para repartidores en moto en Trinidad, Beni

export const TRINIDAD_DEFAULT_COORDS = {
  lat: -14.833,
  lng: -64.903,
};

export const TRINIDAD_SPACES_COORDS: Record<string, { lat: number; lng: number }> = {
  'El Bosque': { lat: -14.8315, lng: -64.9012 },
  'Plaza Verde': { lat: -14.839, lng: -64.9065 },
  'Aloha Food Park': { lat: -14.828, lng: -64.898 },
  'Mercado Central': { lat: -14.836, lng: -64.903 },
  'Plaza Principal': { lat: -14.8335, lng: -64.9025 },
};

/**
 * Extrae coordenadas de un texto o devuelve coordenadas por defecto de Trinidad
 */
export function extractCoordinates(
  addressOrText?: string,
  fallbackLat = TRINIDAD_DEFAULT_COORDS.lat,
  fallbackLng = TRINIDAD_DEFAULT_COORDS.lng
): { lat: number; lng: number } {
  if (!addressOrText) return { lat: fallbackLat, lng: fallbackLng };

  const match = addressOrText.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (match) {
    return {
      lat: parseFloat(match[1]),
      lng: parseFloat(match[2]),
    };
  }

  // Buscar coincidencia por nombre de patio conocido
  for (const [name, coords] of Object.entries(TRINIDAD_SPACES_COORDS)) {
    if (addressOrText.toLowerCase().includes(name.toLowerCase())) {
      return coords;
    }
  }

  return { lat: fallbackLat, lng: fallbackLng };
}

/**
 * Genera la URL de Google Maps para iniciar directamente el modo de NAVEGACIÓN GPS con voz
 * Funciona abriendo la app nativa en Android/iOS o la web si está en escritorio.
 */
export function getGoogleMapsNavigationUrl(destination: {
  lat?: number;
  lng?: number;
  address?: string;
  name?: string;
}): string {
  if (destination.lat && destination.lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving&dir_action=navigate`;
  }

  const query = encodeURIComponent(
    `${destination.name || ''} ${destination.address || ''} Trinidad, Beni, Bolivia`.trim()
  );
  return `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving&dir_action=navigate`;
}

/**
 * Genera la URL de Google Maps con ruta de 2 paradas:
 * Repartidor (origen) ➔ Local / Cocina (Punto de Recojo) ➔ Domicilio del Cliente (Destino Final)
 */
export function getGoogleMapsCompleteRouteUrl(params: {
  originLat?: number;
  originLng?: number;
  storeLat?: number;
  storeLng?: number;
  storeName?: string;
  customerLat?: number;
  customerLng?: number;
  customerAddress?: string;
}): string {
  const origin =
    params.originLat && params.originLng
      ? `${params.originLat},${params.originLng}`
      : `${TRINIDAD_DEFAULT_COORDS.lat},${TRINIDAD_DEFAULT_COORDS.lng}`;

  const waypoint =
    params.storeLat && params.storeLng
      ? `${params.storeLat},${params.storeLng}`
      : encodeURIComponent(`${params.storeName || 'Comercio'} Trinidad Beni`);

  const destination =
    params.customerLat && params.customerLng
      ? `${params.customerLat},${params.customerLng}`
      : encodeURIComponent(`${params.customerAddress || 'Cliente'} Trinidad Beni`);

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoint}&travelmode=driving`;
}

/**
 * Genera enlace de Waze con inicio de navegación directa
 */
export function getWazeNavigationUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

/**
 * Genera mensaje de WhatsApp listo para avisar al cliente
 */
export function getDriverWhatsAppMessageUrl(params: {
  phone?: string;
  customerName?: string;
  orderId?: string;
  driverName?: string;
  deliveryAddress?: string;
  notes?: string;
}): string {
  const cleanPhone = (params.phone || '').replace(/\D/g, '');
  if (!cleanPhone) return '#';

  const fullPhone = cleanPhone.startsWith('591') ? cleanPhone : `591${cleanPhone}`;
  const shortId = (params.orderId || '').slice(0, 6).toUpperCase();

  const message = `🏍️ *PEDIDOS TRINIDAD - DELIVERY*\n\n¡Hola *${
    params.customerName || 'estimado/a cliente'
  }*! Te saluda *${
    params.driverName || 'tu repartidor en moto'
  }*.\n\n📦 Llevo tu pedido *#${shortId}* en camino a:\n📍 _${
    params.deliveryAddress || 'tu dirección'
  }_\n\n⏱️ Estaré en tu puerta en unos minutos. ¡Por favor estate atento/a al timbre o llamada! 🛵💨`;

  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}
