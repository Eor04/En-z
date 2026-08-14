'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Route, Store, Home, Bike, Phone, Info } from 'lucide-react';
import { RouteMapCanvas, type MapPoint } from '@/presentation/components/maps/RouteMapCanvas';
import { Badge, Panel } from '@/presentation/components/ui';
import { extractCoordinates } from '@/presentation/utils/navigationUrls';
import { EASE_RUNE } from '@/presentation/lib/motion';

/**
 * Mapa de seguimiento para el cliente.
 *
 * Aparece en cuanto el repartidor toma el pedido. Dibuja el recorrido
 * local → domicilio, con una parada por cada cocina si el pedido era
 * multi-comercio.
 *
 * No se dibuja la moto: la posición del repartidor sólo la conoce su propio
 * navegador y hoy no se guarda en el servidor. Preferimos no inventar un punto
 * antes que mostrarle al cliente una ubicación que no es real.
 */
export function OrderRouteTracker({
  order,
  batchOrders,
}: {
  order: any;
  batchOrders?: any[];
}) {
  const driverAsignado = Boolean(order?.driver);
  const entregado = order?.status === 'entregado';

  const paradas = React.useMemo(() => {
    const fuente = batchOrders?.length ? batchOrders : [order];
    return fuente
      .filter((o: any) => o?.business)
      .map((o: any) => {
        const c = extractCoordinates(
          o.business?.space?.name || o.business?.address,
          -14.8315,
          -64.9012
        );
        return {
          lat: c.lat,
          lng: c.lng,
          label: o.business?.name ?? 'Local',
          sublabel: o.business?.space?.name ?? undefined,
        } as MapPoint;
      });
  }, [order, batchOrders]);

  const destino = React.useMemo<MapPoint>(() => {
    const c = extractCoordinates(order?.deliveryAddress, -14.8348, -64.9042);
    return {
      lat: c.lat,
      lng: c.lng,
      label: 'Tu dirección',
      sublabel: order?.deliveryAddress,
    };
  }, [order?.deliveryAddress]);

  if (!driverAsignado || entregado || paradas.length === 0) return null;

  const [primera, ...resto] = paradas;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_RUNE }}
    >
      <Panel className="mb-7 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2.5 font-display text-[13px] font-bold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-arc/30 bg-arc/12 text-arc-soft">
              <Route className="h-4 w-4" />
            </span>
            Recorrido de tu pedido
          </h2>
          <Badge tone="arc" icon={Bike}>
            {order.driver?.name ?? 'Repartidor'} en camino
          </Badge>
        </div>

        <RouteMapCanvas store={primera} extraStops={resto} customer={destino} height={280} />

        {/* Leyenda del recorrido */}
        <ol className="mt-4 space-y-2">
          {paradas.map((p, i) => (
            <li key={`${p.lat}-${p.lng}-${i}`} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-warn/35 bg-warn/12 text-[11px] font-bold text-warn-soft">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 truncate text-[12px] font-bold text-white">
                  <Store className="h-3.5 w-3.5 shrink-0 text-warn" />
                  {p.label}
                </span>
                {p.sublabel && (
                  <span className="block truncate text-[10px] text-ink-faint">{p.sublabel}</span>
                )}
              </span>
            </li>
          ))}

          <li className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ok/35 bg-ok/12 text-ok">
              <Home className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-bold text-white">Tu dirección</span>
              <span className="block truncate text-[10px] text-ink-faint">
                {order.deliveryAddress}
              </span>
            </span>
          </li>
        </ol>

        {order.driver?.phone && (
          <a
            href={`tel:${order.driver.phone}`}
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-info/35 bg-info/12 px-4 py-3 text-[12px] font-bold text-info-soft transition-colors hover:bg-info/20"
          >
            <Phone className="h-4 w-4" />
            Llamar a {order.driver.name}
          </a>
        )}

        <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-ink-faint">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          El mapa muestra el recorrido que hace tu repartidor. La posición exacta de la moto en
          vivo todavía no está disponible.
        </p>
      </Panel>
    </motion.div>
  );
}
