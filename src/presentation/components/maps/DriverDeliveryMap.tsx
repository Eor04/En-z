'use client';

import * as React from 'react';
import { RouteMapCanvas, type MapPoint } from './RouteMapCanvas';
import { extractCoordinates, TRINIDAD_DEFAULT_COORDS } from '@/presentation/utils/navigationUrls';

/**
 * Mapa embebido en la tarjeta de entrega en curso del repartidor.
 *
 * A diferencia del mapa del cliente, acá sí se dibuja la moto: la posición
 * sale del GPS del propio navegador del repartidor.
 */
export function DriverDeliveryMap({ order }: { order: any }) {
  const [driver, setDriver] = React.useState<MapPoint | null>(null);

  /* Última posición enviada al servidor: sirve para no spamear el endpoint
     cuando el GPS reporta micro-variaciones estando la moto detenida. */
  const ultimoEnvio = React.useRef<{ lat: number; lng: number; t: number } | null>(null);

  React.useEffect(() => {
    if (!navigator.geolocation) return;

    const reportar = async (lat: number, lng: number) => {
      const prev = ultimoEnvio.current;
      const ahora = Date.now();

      if (prev) {
        // ~11 m por cada 0.0001 grados; por debajo de eso no vale el viaje
        const movio =
          Math.abs(prev.lat - lat) > 0.0001 || Math.abs(prev.lng - lng) > 0.0001;
        const pasoTiempo = ahora - prev.t > 20000;
        if (!movio && !pasoTiempo) return;
      }

      ultimoEnvio.current = { lat, lng, t: ahora };
      try {
        await fetch('/api/driver/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng }),
        });
      } catch {
        /* si falla se reintenta en la próxima lectura del GPS */
      }
    };

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setDriver({ lat: latitude, lng: longitude, label: 'Tu posición' });
        reportar(latitude, longitude);
      },
      () => setDriver(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const store = React.useMemo<MapPoint>(() => {
    const c = extractCoordinates(
      order?.business?.space?.name || order?.business?.address,
      -14.8315,
      -64.9012
    );
    return {
      lat: c.lat,
      lng: c.lng,
      label: order?.business?.name ?? 'Local',
      sublabel: order?.business?.space?.name ?? undefined,
    };
  }, [order?.business]);

  const customer = React.useMemo<MapPoint>(() => {
    const c = extractCoordinates(
      order?.deliveryAddress,
      TRINIDAD_DEFAULT_COORDS.lat,
      TRINIDAD_DEFAULT_COORDS.lng
    );
    return {
      lat: c.lat,
      lng: c.lng,
      label: order?.customer?.name ?? 'Cliente',
      sublabel: order?.deliveryAddress,
    };
  }, [order?.deliveryAddress, order?.customer]);

  return (
    <div className="space-y-2">
      <RouteMapCanvas store={store} customer={customer} driver={driver} height={240} />
      {!driver && (
        <p className="text-center text-[10px] text-ink-faint">
          Activá la ubicación del navegador para ver tu moto en el mapa.
        </p>
      )}
    </div>
  );
}
