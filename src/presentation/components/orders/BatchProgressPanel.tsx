'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { ChefHat, Check, Clock, Bike, PackageCheck, CreditCard } from 'lucide-react';
import { Panel, Badge } from '@/presentation/components/ui';
import { statusMeta } from '@/presentation/lib/orderStatus';
import { cn } from '@/presentation/lib/utils';
import { EASE_RUNE } from '@/presentation/lib/motion';

interface BatchInfo {
  total: number;
  listas: number;
  pendientes: number;
  readyForPickup: boolean;
  esperandoA: string[];
  bloqueadoPorPago?: boolean;
  pagosPendientes?: number;
}

/**
 * Avance de un pedido multi-comercio.
 *
 * Por detrás hay una comanda por cocina, pero el cliente pidió UNA sola vez:
 * acá ve qué local ya terminó y a cuál se está esperando, en lugar de creer
 * que tiene dos pedidos sueltos.
 */
export function BatchProgressPanel({
  batch,
  orders,
  selectedId,
  onSelect,
}: {
  batch: BatchInfo;
  orders: any[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (!batch || batch.total <= 1) return null;

  const progreso = batch.total > 0 ? (batch.listas / batch.total) * 100 : 0;
  const yaEnCamino = orders.some((o) => ['en_camino', 'entregado'].includes(o.status));

  return (
    <Panel className="mb-7 overflow-hidden p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-[13px] font-bold text-white">
          <ChefHat className="h-4 w-4 text-warn" />
          Tu pedido en {batch.total} locales
        </h2>
        <Badge tone={batch.readyForPickup ? 'ok' : 'warn'} dot>
          {batch.listas} de {batch.total} listos
        </Badge>
      </div>

      {/* Barra de avance del lote */}
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-violet-500/15">
        <motion.div
          className={cn('h-full rounded-full', batch.readyForPickup ? 'bg-ok' : 'bg-grad-rune')}
          initial={{ width: 0 }}
          animate={{ width: `${progreso}%` }}
          transition={{ duration: 0.8, ease: EASE_RUNE }}
        />
      </div>

      {/* Mensaje de estado del lote */}
      <div
        className={cn(
          'mb-5 flex items-start gap-3 rounded-2xl border p-4 text-[13px]',
          yaEnCamino
            ? 'border-arc/35 bg-arc/10 text-arc-soft'
            : batch.bloqueadoPorPago
              ? 'border-ember/40 bg-ember/10 text-ember-soft'
              : batch.readyForPickup
                ? 'border-ok/35 bg-ok/10 text-ok-soft'
                : 'border-warn/35 bg-warn/10 text-warn-soft'
        )}
      >
        {yaEnCamino ? (
          <Bike className="mt-0.5 h-4 w-4 shrink-0" />
        ) : batch.bloqueadoPorPago ? (
          <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
        ) : batch.readyForPickup ? (
          <PackageCheck className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <p>
          {yaEnCamino ? (
            <>
              <span className="block font-display font-bold text-white">
                Un solo repartidor lleva todo
              </span>
              Recogió en los {batch.total} locales y va en camino a tu dirección.
            </>
          ) : batch.bloqueadoPorPago ? (
            <>
              <span className="block font-display font-bold text-white">
                Falta confirmar tu pago
              </span>
              Las {batch.total} cocinas ya terminaron, pero el pedido no sale hasta que la
              tienda verifique tu comprobante. Adjuntalo más abajo si todavía no lo hiciste.
            </>
          ) : batch.readyForPickup ? (
            <>
              <span className="block font-display font-bold text-white">
                Los {batch.total} locales terminaron
              </span>
              Estamos asignando un repartidor que recoja todo en un solo viaje.
            </>
          ) : (
            <>
              <span className="block font-display font-bold text-white">
                Esperando a {batch.esperandoA.join(' y ')}
              </span>
              El repartidor sale recién cuando estén los {batch.total} locales, así te llega
              todo junto y caliente.
            </>
          )}
        </p>
      </div>

      {/* Detalle por local */}
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {orders.map((o) => {
          const meta = statusMeta(o.status);
          const Icon = meta.icon;
          const lista = ['buscando_driver', 'en_camino', 'entregado'].includes(o.status);
          const seleccionada = o.id === selectedId;

          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onSelect(o.id)}
                aria-pressed={seleccionada}
                className={cn(
                  'w-full cursor-pointer rounded-2xl border p-3.5 text-left transition-all duration-200',
                  seleccionada
                    ? 'border-violet-400/60 bg-violet-500/12 shadow-glow-violet'
                    : 'border-surface-line bg-void-800/50 hover:border-violet-500/35'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                        lista
                          ? 'border-ok/40 bg-ok/15 text-ok'
                          : 'border-warn/40 bg-warn/15 text-warn'
                      )}
                    >
                      {lista ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    </span>
                    <span className="truncate font-display text-[12px] font-bold text-white">
                      {o.business?.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold text-ink-mute tabular">
                    {o.items?.length ?? 0} ítems
                  </span>
                </div>

                <span className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft">
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
