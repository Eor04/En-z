'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/presentation/lib/utils';

/**
 * Lienzo de mapa con la ruta del pedido.
 *
 * Se usa en dos lugares con el mismo dibujo: dentro del modal del repartidor y
 * embebido en las tarjetas de entrega en curso y en el seguimiento del cliente.
 *
 * El marcador del repartidor es opcional: sólo el propio repartidor conoce su
 * posición (la lee de su navegador). Para el cliente se dibuja el tramo
 * local → domicilio, sin inventar dónde va la moto.
 */

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
}

export interface RouteMapCanvasProps {
  store: MapPoint;
  customer: MapPoint;
  /** Posición del repartidor, si se conoce. */
  driver?: MapPoint | null;
  /** Paradas extra en pedidos de varios locales. */
  extraStops?: MapPoint[];
  className?: string;
  /** Alto en px del contenedor del mapa. */
  height?: number;
}

const PIN = {
  driver: { bg: '#38bdf8', emoji: '🏍️', shadow: 'rgba(56,189,248,0.7)' },
  store: { bg: '#f59e0b', emoji: '🏬', shadow: 'rgba(245,158,11,0.7)' },
  customer: { bg: '#22c55e', emoji: '🏠', shadow: 'rgba(34,197,94,0.7)' },
};

function iconHtml(kind: keyof typeof PIN, index?: number) {
  const p = PIN[kind];
  const badge =
    index != null
      ? `<span style="position:absolute;top:-6px;right:-6px;background:#7c3aed;color:#fff;
          width:18px;height:18px;border-radius:50%;border:2px solid #fff;font-size:10px;
          font-weight:700;display:flex;align-items:center;justify-content:center;">${index}</span>`
      : '';

  return `
    <div style="position:relative;background:${p.bg};width:36px;height:36px;border-radius:50%;
      border:3px solid #ffffff;box-shadow:0 4px 14px ${p.shadow};display:flex;
      align-items:center;justify-content:center;font-size:16px;">
      ${p.emoji}${badge}
    </div>`;
}

export function RouteMapCanvas({
  store,
  customer,
  driver,
  extraStops = [],
  className,
  height = 260,
}: RouteMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (typeof window === 'undefined' || !containerRef.current) return;
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      const mk = (point: MapPoint, kind: keyof typeof PIN, index?: number) =>
        L.marker([point.lat, point.lng], {
          icon: L.divIcon({
            className: `${kind}-marker`,
            html: iconHtml(kind, index),
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          }),
        })
          .addTo(map)
          .bindPopup(
            `<b>${point.label}</b>${
              point.sublabel
                ? `<br><span style="font-size:11px;color:#64748b">${point.sublabel}</span>`
                : ''
            }`
          );

      const ruta: Array<[number, number]> = [];

      if (driver) {
        mk(driver, 'driver');
        ruta.push([driver.lat, driver.lng]);
      }

      const paradas = [store, ...extraStops];
      paradas.forEach((p, i) => {
        mk(p, 'store', paradas.length > 1 ? i + 1 : undefined);
        ruta.push([p.lat, p.lng]);
      });

      mk(customer, 'customer');
      ruta.push([customer.lat, customer.lng]);

      L.polyline(ruta, {
        color: '#a855f7',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      map.fitBounds(L.latLngBounds(ruta), { padding: [40, 40], maxZoom: 16 });

      mapRef.current = map;

      // El contenedor suele montarse dentro de un panel que aún se está
      // animando: sin esto Leaflet calcula mal el tamaño y quedan tiles grises.
      setTimeout(() => map.invalidateSize(), 250);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [store, customer, driver, extraStops]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className={cn(
        'w-full overflow-hidden rounded-2xl border border-surface-line bg-void-800',
        className
      )}
    />
  );
}
