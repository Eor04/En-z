'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  ShoppingBag,
  CheckCircle2,
  MapPin,
  Phone,
  Bike,
  ArrowLeft,
  RefreshCw,
  Layers,
  ChefHat,
  Volume2,
  VolumeX,
  Bell,
  X,
  Hash,
} from 'lucide-react';
import { PaymentVerificationCard } from '@/presentation/components/payments/PaymentVerificationCard';
import { OrderDriverRatingCard } from '@/presentation/components/orders/OrderDriverRatingCard';
import { BatchProgressPanel } from '@/presentation/components/orders/BatchProgressPanel';
import { OrderRouteTracker } from '@/presentation/components/orders/OrderRouteTracker';
import {
  playCustomerKitchenStartedAlert,
  playCustomerOrderInRouteAlert,
  playCustomerOrderArrivedDoorAlert,
} from '@/presentation/utils/audioAlerts';
import { useRealtimeEvents } from '@/presentation/hooks/useRealtimeEvents';
import {
  Badge,
  Button,
  EmptyState,
  LivePulse,
  Panel,
  Skeleton,
} from '@/presentation/components/ui';
import { TIMELINE, statusMeta } from '@/presentation/lib/orderStatus';
import { bs, cn } from '@/presentation/lib/utils';
import { EASE_RUNE, tSpring } from '@/presentation/lib/motion';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBatchOrderId, setSelectedBatchOrderId] = useState<string>(params.id);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveBanner, setLiveBanner] = useState<{ title: string; desc: string } | null>(null);
  /* Posición del repartidor en vivo, por SSE. Se guarda aparte del pedido para
     no volver a pedir toda la orden cada vez que la moto se mueve. */
  const [driverPosition, setDriverPosition] = useState<{
    lat: number;
    lng: number;
    at?: string;
  } | null>(null);

  const prevStatusMap = React.useRef<Map<string, string>>(new Map());
  const isFirstLoad = React.useRef(true);

  const fetchOrder = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      if (res.ok && data.order) {
        const fetched = data.order;
        const batch: any[] = fetched.batchOrders || [fetched];

        if (!isFirstLoad.current && soundEnabled) {
          batch.forEach((sub: any) => {
            const prev = prevStatusMap.current.get(sub.id);
            if (prev && prev !== sub.status) {
              if (sub.status === 'en_preparacion') {
                playCustomerKitchenStartedAlert();
                setLiveBanner({
                  title: 'El local aceptó tu pedido',
                  desc: `${sub.business?.name || 'El comercio'} ya está preparando tus platos.`,
                });
              } else if (sub.status === 'en_camino') {
                playCustomerOrderInRouteAlert();
                setLiveBanner({
                  title: 'Tu repartidor va en camino',
                  desc: `${sub.driver?.name || 'El repartidor'} recogió tu pedido y va hacia tu ubicación.`,
                });
              } else if (sub.status === 'entregado') {
                playCustomerOrderArrivedDoorAlert();
                setLiveBanner({
                  title: '¡Pedido en tu puerta!',
                  desc: 'Entregado con éxito. Calificá la atención de tu repartidor.',
                });
              }
            }
          });
        }

        const next = new Map<string, string>();
        batch.forEach((o: any) => next.set(o.id, o.status));
        prevStatusMap.current = next;
        isFirstLoad.current = false;

        setOrder(fetched);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const { connectionStatus } = useRealtimeEvents({
    channels: [`order:${params.id}`],
    enabled: Boolean(params.id),
    enableAudioAlerts: soundEnabled,
    onOrderStatusUpdated: (data) => {
      fetchOrder();
      if (data.status === 'en_preparacion') {
        setLiveBanner({
          title: 'El local aceptó tu pedido',
          desc: 'Ya están preparando tus platos en cocina.',
        });
      }
    },
    onOrderDriverAssigned: (data) => {
      fetchOrder();
      setLiveBanner({
        title: 'Repartidor asignado',
        desc: `${data.driverName || 'Tu repartidor'} recogió tu comanda.`,
      });
    },
    onOrderInRoute: () => {
      fetchOrder();
      setLiveBanner({ title: 'Pedido en camino', desc: 'El repartidor ya está en ruta.' });
    },
    onOrderDelivered: () => {
      fetchOrder();
      setLiveBanner({
        title: '¡Pedido entregado!',
        desc: 'Calificá la atención de tu repartidor.',
      });
    },
    onDriverLocation: (data) => {
      // Sólo mueve el marcador: no hace falta recargar el pedido entero
      if (typeof data?.lat === 'number' && typeof data?.lng === 'number') {
        setDriverPosition({ lat: data.lat, lng: data.lng, at: data.at });
      }
    },
  });

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 25000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  /* -------------------- Carga / error -------------------- */
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-7 px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-40 rounded-[32px]" />
        <Skeleton className="h-56 rounded-[32px]" />
        <div className="grid gap-7 md:grid-cols-12">
          <Skeleton className="h-72 rounded-[32px] md:col-span-7" />
          <Skeleton className="h-72 rounded-[32px] md:col-span-5" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <EmptyState
          title="No encontramos este pedido"
          description="Puede que el enlace sea incorrecto o que el pedido ya no exista."
          action={
            <Button href="/orders" size="sm">
              Ver mis pedidos
            </Button>
          }
        />
      </div>
    );
  }

  const batchOrders: any[] = order.batchOrders || [order];
  const isMultiStore = batchOrders.length > 1;
  const current = batchOrders.find((o) => o.id === selectedBatchOrderId) || order;
  const meta = statusMeta(current.status);
  const StatusIcon = meta.icon;
  const combinedTotal = batchOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const isCancelled = current.status === 'cancelado';

  const batchInfo = order.batch ?? {
    total: batchOrders.length,
    listas: 0,
    pendientes: 0,
    readyForPickup: true,
    esperandoA: [],
  };

  /* La línea de tiempo describe el PEDIDO, no una comanda suelta: mientras
     alguna cocina siga trabajando el pedido no avanza a "buscando repartidor",
     aunque este local ya haya terminado lo suyo. */
  const rawStep = TIMELINE.indexOf(current.status);
  const esperandoOtraCocina =
    isMultiStore && !batchInfo.readyForPickup && current.status === 'buscando_driver';

  /* Las cocinas terminaron pero el comprobante sigue sin verificar: el pedido
     no se despacha, así que no podemos decir "buscando repartidor". */
  const esperandoPago =
    Boolean(batchInfo.bloqueadoPorPago) && current.status === 'buscando_driver';

  const currentStep =
    esperandoOtraCocina || esperandoPago ? TIMELINE.indexOf('en_preparacion') : rawStep;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/orders"
        className="group mb-6 inline-flex items-center gap-2 text-[12px] font-semibold text-ink-mute transition-colors hover:text-violet-300"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        Volver a mis pedidos
      </Link>

      {/* ---------------- Cabecera ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_RUNE }}
      >
        <Panel className="relative mb-7 overflow-hidden p-6 sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-[90px]"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.3), transparent 70%)' }}
          />

          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone="violet" icon={Hash}>
                  <span className="font-mono">{current.id.slice(0, 8).toUpperCase()}</span>
                </Badge>
                {isMultiStore && (
                  <Badge tone="warn" icon={Layers}>
                    {batchOrders.length} locales
                  </Badge>
                )}
                <span className="flex items-center gap-1.5 rounded-full border border-surface-line bg-void-800/70 px-2.5 py-1 text-[11px] font-semibold text-ink-mute">
                  <LivePulse tone={connectionStatus === 'connected' ? 'ok' : 'ember'} />
                  {connectionStatus === 'connected' ? 'En vivo' : 'Reconectando'}
                </span>
              </div>

              <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-white sm:text-4xl">
                Seguimiento <span className="text-rune">en vivo</span>
              </h1>
              <p className="mt-2 text-[13px] text-ink-mute">
                <span className="font-semibold text-white">{current.business?.name}</span>
                {current.business?.space?.name && (
                  <> · <span className="text-arc-soft">{current.business.space.name}</span></>
                )}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) playCustomerOrderArrivedDoorAlert();
                }}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors',
                  soundEnabled
                    ? 'border-ok/35 bg-ok/10 text-ok-soft hover:bg-ok/20'
                    : 'border-surface-line bg-void-800/70 text-ink-mute hover:text-white'
                )}
                title="Avisos sonoros del pedido"
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                Sonido {soundEnabled ? 'on' : 'off'}
              </button>

              {soundEnabled && (
                <button
                  type="button"
                  onClick={() => playCustomerOrderArrivedDoorAlert()}
                  aria-label="Probar timbre"
                  className="cursor-pointer rounded-xl border border-surface-line p-2.5 text-violet-300 transition-colors hover:border-violet-400/50 hover:text-white"
                  title="Probar timbre de llegada"
                >
                  <Bell className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={fetchOrder}
                aria-label="Actualizar estado"
                className="cursor-pointer rounded-xl border border-surface-line p-2.5 text-ink-mute transition-colors hover:border-violet-400/50 hover:text-white"
              >
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              </button>

              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  {isMultiStore ? 'Esta comanda' : 'Total'}
                </p>
                <p className="font-display text-2xl font-bold text-arc tabular">
                  {bs(current.totalPrice)} Bs
                </p>
                {isMultiStore && (
                  <p className="text-[10px] text-ink-faint tabular">
                    Lote completo: {bs(combinedTotal)} Bs
                  </p>
                )}
              </div>
            </div>
          </div>
        </Panel>
      </motion.div>

      {/* ---------------- Aviso en vivo ---------------- */}
      <AnimatePresence>
        {liveBanner && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -16, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto', marginBottom: 28 }}
            exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.35, ease: EASE_RUNE }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-arc/45 bg-arc/10 p-4 shadow-glow-arc">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-arc/40 bg-arc/15 text-arc-soft">
                  <StatusIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-[13px] font-bold text-white">{liveBanner.title}</p>
                  <p className="mt-0.5 text-[12px] text-arc-soft">{liveBanner.desc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLiveBanner(null)}
                aria-label="Cerrar aviso"
                className="cursor-pointer rounded-xl border border-surface-line p-2 text-ink-mute transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Avance por local (pedido multi-comercio) ---------------- */}
      {/* Recorrido en el mapa, desde que el repartidor toma el pedido */}
      <OrderRouteTracker
        order={current}
        batchOrders={batchOrders}
        driverPosition={driverPosition}
      />

      <BatchProgressPanel
        batch={batchInfo}
        orders={batchOrders}
        selectedId={current.id}
        onSelect={setSelectedBatchOrderId}
      />

      {/* ---------------- Línea de tiempo ---------------- */}
      <Panel className="mb-7 p-6 sm:p-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-[13px] font-bold text-white">
            <StatusIcon className="h-4 w-4 text-violet-300" />
            Estado de la comanda
          </h2>
          <Badge tone={meta.tone} icon={StatusIcon}>
            {meta.label}
          </Badge>
        </div>

        {isCancelled ? (
          <div className="flex items-center gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-[13px] text-danger-soft">
            <StatusIcon className="h-5 w-5 shrink-0" />
            <p>{meta.hint}</p>
          </div>
        ) : (
          <>
            <div className="relative">
              {/* riel */}
              <div className="absolute left-5 top-5 hidden h-[calc(100%-40px)] w-px bg-surface-line sm:left-0 sm:top-5 sm:h-px sm:w-full" />
              <motion.div
                className="absolute left-5 top-5 hidden w-px origin-top bg-grad-rune sm:left-0 sm:top-5 sm:h-px sm:w-full sm:origin-left"
                initial={{ scaleX: 0, scaleY: 0 }}
                animate={{
                  scaleX: Math.max(currentStep, 0) / (TIMELINE.length - 1),
                  scaleY: Math.max(currentStep, 0) / (TIMELINE.length - 1),
                }}
                transition={{ duration: 0.9, ease: EASE_RUNE }}
                style={{ height: '100%' }}
              />

              <ol className="relative grid gap-4 sm:grid-cols-5">
                {TIMELINE.map((key, idx) => {
                  const m = statusMeta(key);
                  const Icon = m.icon;
                  const done = currentStep > idx;
                  const active = currentStep === idx;
                  return (
                    <li key={key} className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                      <motion.span
                        initial={false}
                        animate={
                          active
                            ? { scale: [1, 1.12, 1] }
                            : { scale: 1 }
                        }
                        transition={active ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : tSpring}
                        className={cn(
                          'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors duration-300',
                          done && 'border-violet-400/50 bg-violet-500/20 text-violet-200',
                          active && 'border-arc/60 bg-arc/20 text-arc-bright shadow-glow-arc',
                          !done && !active && 'border-surface-line bg-void-800 text-ink-faint'
                        )}
                      >
                        {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </motion.span>

                      <span className="sm:mt-3">
                        <span
                          className={cn(
                            'block font-display text-[12px] font-bold',
                            active ? 'text-white' : done ? 'text-ink-soft' : 'text-ink-faint'
                          )}
                        >
                          {m.short}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-ink-faint">
                          Paso {idx + 1}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="mt-7 border-t border-surface-line pt-5">
              <motion.div
                key={current.status}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE_RUNE }}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border p-4 text-[13px]',
                  meta.tone === 'ok'
                    ? 'border-ok/35 bg-ok/10 text-ok-soft'
                    : meta.tone === 'warn'
                      ? 'border-warn/35 bg-warn/10 text-warn-soft'
                      : meta.tone === 'info'
                        ? 'border-info/35 bg-info/10 text-info-soft'
                        : 'border-arc/35 bg-arc/10 text-arc-soft'
                )}
              >
                <StatusIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  <span className="block font-display font-bold text-white">
                    {esperandoPago
                      ? 'Falta confirmar tu pago'
                      : esperandoOtraCocina
                        ? `${current.business?.name} ya terminó`
                        : meta.label}
                  </span>
                  {esperandoPago
                    ? 'La comida ya está lista, pero el pedido no sale hasta que la tienda verifique tu comprobante. Adjuntalo más abajo si todavía no lo hiciste.'
                    : esperandoOtraCocina
                      ? `Falta que termine ${batchInfo.esperandoA.join(' y ')}. Cuando estén los ${batchInfo.total} locales, un repartidor recoge todo junto.`
                      : current.status === 'en_camino' && current.driver?.name
                        ? `${current.driver.name} va en camino a ${current.deliveryAddress}.`
                        : meta.hint}
                </p>
              </motion.div>
            </div>
          </>
        )}
      </Panel>

      {/* ---------------- Detalle ---------------- */}
      <div className="grid grid-cols-1 gap-7 md:grid-cols-12">
        <Panel className="p-6 md:col-span-7">
          <h3 className="mb-4 flex items-center gap-2 font-display text-[13px] font-bold text-white">
            <ShoppingBag className="h-4 w-4 text-violet-300" />
            Productos de {current.business?.name}
          </h3>

          <ul className="mb-5 space-y-2.5">
            {current.items?.map((item: any) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-surface-line bg-void-800/60 p-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-white">
                    <span className="tabular">{item.quantity}×</span> {item.product?.name || 'Producto'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-faint tabular">
                    {bs(item.unitPrice)} Bs c/u
                  </p>
                </div>
                <p className="shrink-0 font-display text-[14px] font-bold text-arc tabular">
                  {bs(item.subtotal)} Bs
                </p>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-surface-line pt-4 text-[12px]">
            <div className="flex justify-between text-ink-mute">
              <dt>Subtotal productos</dt>
              <dd className="font-semibold text-white tabular">
                {bs(current.totalPrice - current.deliveryFee)} Bs
              </dd>
            </div>
            <div className="flex justify-between text-ink-mute">
              <dt>Envío</dt>
              <dd className="font-semibold text-white tabular">{bs(current.deliveryFee)} Bs</dd>
            </div>
            <div className="flex items-center justify-between border-t border-surface-line pt-3">
              <dt className="font-display text-[14px] font-bold text-white">Total comanda</dt>
              <dd className="font-display text-xl font-bold text-arc tabular">
                {bs(current.totalPrice)} Bs
              </dd>
            </div>
          </dl>
        </Panel>

        <div className="space-y-6 md:col-span-5">
          <Panel className="p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-[13px] font-bold text-white">
              <MapPin className="h-4 w-4 text-violet-300" />
              Entrega
            </h3>

            <dl className="space-y-3.5 text-[13px]">
              <div>
                <dt className="text-[11px] text-ink-faint">Ubicación</dt>
                <dd className="mt-0.5 font-medium text-white">{current.deliveryAddress}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-faint">Contacto</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-white">
                  <Phone className="h-3.5 w-3.5 text-violet-400" />
                  <span className="tabular">{current.customerPhone}</span>
                </dd>
              </div>
              {current.notes && (
                <div>
                  <dt className="text-[11px] text-ink-faint">Notas</dt>
                  <dd className="mt-0.5 italic text-ink-soft">“{current.notes}”</dd>
                </div>
              )}
            </dl>
          </Panel>

          {current.driver && (
            <Panel glow className="p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-display text-[13px] font-bold text-white">
                  <Bike className="h-4 w-4 text-info" />
                  Tu repartidor
                </h3>
                <Badge tone="info">
                  <span className="font-mono">{current.driver.driverCode || 'DRV'}</span>
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-bold text-white">
                    {current.driver.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">Moto · Trinidad</p>
                </div>

                {current.driver.phone && (
                  <a
                    href={`tel:${current.driver.phone}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-info/35 bg-info/15 px-3.5 py-2.5 text-[12px] font-bold text-info-soft transition-colors hover:bg-info/25"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Llamar
                  </a>
                )}
              </div>
            </Panel>
          )}

          {current.driver && (
            <OrderDriverRatingCard
              orderId={current.id}
              driver={current.driver}
              initialRating={current.driverRating}
              initialReview={current.driverReview}
              isDelivered={current.status === 'entregado'}
            />
          )}

          <PaymentVerificationCard order={current} onPaymentUpdated={fetchOrder} />
        </div>
      </div>
    </div>
  );
}
