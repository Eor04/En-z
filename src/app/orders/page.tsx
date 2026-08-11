'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag, ChevronRight, Store, Package } from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Panel,
  Skeleton,
  Tabs,
} from '@/presentation/components/ui';
import { statusMeta, orderDate } from '@/presentation/lib/orderStatus';
import { bs } from '@/presentation/lib/utils';
import { EASE_RUNE } from '@/presentation/lib/motion';

type Filter = 'all' | 'active' | 'done';

const ACTIVE = new Set(['esperando_pago', 'en_preparacion', 'buscando_driver', 'en_camino']);

export default function OrdersHistoryPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (alive) setOrders(data.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [session]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      active: orders.filter((o) => ACTIVE.has(o.status)).length,
      done: orders.filter((o) => !ACTIVE.has(o.status)).length,
    }),
    [orders]
  );

  const visible = useMemo(() => {
    if (filter === 'active') return orders.filter((o) => ACTIVE.has(o.status));
    if (filter === 'done') return orders.filter((o) => !ACTIVE.has(o.status));
    return orders;
  }, [orders, filter]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <Badge tone="violet" icon={Package}>
          Historial
        </Badge>
        <h1 className="mt-4 font-display text-[30px] font-bold leading-tight tracking-tight text-white sm:text-4xl">
          Mis <span className="text-rune">pedidos</span>
        </h1>
        <p className="mt-2 text-[13px] text-ink-mute sm:text-sm">
          Seguí el estado de cada pedido en tiempo real, desde la cocina hasta tu puerta.
        </p>
      </header>

      {!loading && orders.length > 0 && (
        <div className="mb-6">
          <Tabs
            layoutKey="orders-filter"
            value={filter}
            onChange={setFilter}
            className="w-fit"
            tabs={[
              { value: 'all', label: 'Todos', count: counts.all },
              { value: 'active', label: 'En curso', count: counts.active },
              { value: 'done', label: 'Finalizados', count: counts.done },
            ]}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Todavía no hay pedidos"
          description="Cuando hagas tu primer pedido lo vas a ver acá, con su seguimiento en vivo."
          action={
            <Button href="/spaces" size="md">
              Explorar espacios
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nada en esta vista"
          description="Probá con otro filtro para ver el resto de tus pedidos."
          action={
            <Button variant="outline" size="sm" onClick={() => setFilter('all')}>
              Ver todos
            </Button>
          }
        />
      ) : (
        <motion.div layout className="space-y-4">
          <AnimatePresence mode="popLayout">
            {visible.map((order, i) => {
              const meta = statusMeta(order.status);
              const StatusIcon = meta.icon;
              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: EASE_RUNE, delay: Math.min(i * 0.05, 0.3) }}
                >
                  <Link href={`/orders/${order.id}`} className="block">
                    <Panel
                      interactive
                      className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
                          <Store className="h-5 w-5" />
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-[14px] font-bold text-white">
                              {order.business?.name || 'Comercio'}
                            </span>
                            <Badge tone={meta.tone} icon={StatusIcon}>
                              {meta.label}
                            </Badge>
                          </div>

                          <p className="mt-1.5 line-clamp-1 text-[12px] text-ink-mute">
                            {order.items
                              ?.map((it: any) => `${it.quantity}× ${it.product?.name ?? 'Producto'}`)
                              .join(' · ')}
                          </p>

                          <p className="mt-1.5 text-[11px] text-ink-faint tabular">
                            {orderDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 border-t border-surface-line pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                        <div className="sm:text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                            Total
                          </p>
                          <p className="font-display text-lg font-bold text-arc tabular">
                            {bs(order.totalPrice)} Bs
                          </p>
                        </div>

                        <span className="flex items-center gap-1.5 rounded-2xl border border-surface-line px-4 py-2.5 text-[12px] font-semibold text-white transition-colors group-hover:border-violet-400/50">
                          Seguimiento
                          <ChevronRight className="h-4 w-4 text-violet-300 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Panel>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
