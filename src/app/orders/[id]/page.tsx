'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Store,
  Bike,
  QrCode,
  CreditCard,
  Banknote,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Upload,
  Check,
  Layers,
  ExternalLink,
  Flame,
  ChefHat,
  Star,
  Volume2,
  VolumeX,
  Bell,
} from 'lucide-react';
import { PaymentVerificationCard } from '@/presentation/components/payments/PaymentVerificationCard';
import { OrderDriverRatingCard } from '@/presentation/components/orders/OrderDriverRatingCard';
import {
  playCustomerKitchenStartedAlert,
  playCustomerOrderInRouteAlert,
  playCustomerOrderArrivedDoorAlert,
  playSuccessChimeAlert,
} from '@/presentation/utils/audioAlerts';
import { useRealtimeEvents } from '@/presentation/hooks/useRealtimeEvents';
import { LiveConnectionBadge } from '@/presentation/components/common/LiveConnectionBadge';

const STATUS_STEPS = [
  { key: 'esperando_pago', label: 'Esperando Pago', desc: 'Validación de pago' },
  { key: 'en_preparacion', label: 'En Cocina', desc: 'Preparando platos' },
  { key: 'buscando_driver', label: 'Buscando Repartidor', desc: 'Empacado listo' },
  { key: 'en_camino', label: 'En Camino', desc: 'Repartidor en ruta' },
  { key: 'entregado', label: 'Entregado', desc: 'Pedido recibido' },
];

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBatchOrderId, setSelectedBatchOrderId] = useState<string>(params.id);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveBanner, setLiveBanner] = useState<{ title: string; desc: string; icon: string } | null>(null);

  const prevStatusMap = React.useRef<Map<string, string>>(new Map());
  const isFirstLoad = React.useRef(true);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      if (res.ok && data.order) {
        const fetchedOrder = data.order;
        const currentBatch: any[] = fetchedOrder.batchOrders || [fetchedOrder];

        if (!isFirstLoad.current && soundEnabled) {
          currentBatch.forEach((subOrder: any) => {
            const prev = prevStatusMap.current.get(subOrder.id);
            if (prev && prev !== subOrder.status) {
              if (subOrder.status === 'en_preparacion') {
                playCustomerKitchenStartedAlert();
                setLiveBanner({
                  icon: '👨‍🍳',
                  title: '¡Comercio Aceptó tu Pedido!',
                  desc: `${subOrder.business?.name || 'El local'} comenzó a preparar tus platos en cocina.`,
                });
              } else if (subOrder.status === 'en_camino') {
                playCustomerOrderInRouteAlert();
                setLiveBanner({
                  icon: '🛵',
                  title: '¡Tu Repartidor va en Camino!',
                  desc: `${subOrder.driver?.name || 'Tu repartidor'} recogió tu comanda y se dirige a tu ubicación.`,
                });
              } else if (subOrder.status === 'entregado') {
                playCustomerOrderArrivedDoorAlert();
                setLiveBanner({
                  icon: '🚪',
                  title: '¡Ding-Dong! Pedido en Puerta',
                  desc: '¡Tu pedido fue entregado con éxito! Por favor califica la atención de tu repartidor.',
                });
              }
            }
          });
        }

        // Actualizar mapa previo
        const newMap = new Map<string, string>();
        currentBatch.forEach((o: any) => newMap.set(o.id, o.status));
        prevStatusMap.current = newMap;
        isFirstLoad.current = false;

        setOrder(fetchedOrder);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Suscripción en tiempo real SSE para el pedido
  const { connectionStatus, reconnect } = useRealtimeEvents({
    channels: [`order:${params.id}`],
    enabled: Boolean(params.id),
    enableAudioAlerts: soundEnabled,
    onOrderStatusUpdated: (data) => {
      fetchOrder();
      if (data.status === 'en_preparacion') {
        setLiveBanner({
          icon: '👨‍🍳',
          title: '¡Comercio Aceptó tu Pedido!',
          desc: 'El local comenzó a preparar tus platos en cocina.',
        });
      }
    },
    onOrderDriverAssigned: (data) => {
      fetchOrder();
      setLiveBanner({
        icon: '🛵',
        title: '¡Tu Repartidor va en Camino!',
        desc: `${data.driverName || 'Tu repartidor'} recogió tu comanda y se dirige a tu ubicación.`,
      });
    },
    onOrderInRoute: (data) => {
      fetchOrder();
      setLiveBanner({
        icon: '🚀',
        title: '¡Pedido en Camino!',
        desc: 'El repartidor ya está en ruta hacia tu dirección.',
      });
    },
    onOrderDelivered: (data) => {
      fetchOrder();
      setLiveBanner({
        icon: '🚪',
        title: '¡Ding-Dong! Pedido en Puerta',
        desc: '¡Tu pedido fue entregado con éxito! Por favor califica la atención de tu repartidor.',
      });
    },
  });

  useEffect(() => {
    fetchOrder();
    // Fallback ligero cada 25s
    const interval = setInterval(fetchOrder, 25000);
    return () => clearInterval(interval);
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Cargando estado del pedido en tiempo real...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="glass-panel rounded-3xl p-8 border border-slate-800">
          <p className="text-sm font-semibold text-white mb-4">Pedido no encontrado</p>
          <Link
            href="/spaces"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            Volver a inicio
          </Link>
        </div>
      </div>
    );
  }

  const batchOrders: any[] = order.batchOrders || [order];
  const isMultiStore = batchOrders.length > 1;
  const currentDisplayedOrder =
    batchOrders.find((o) => o.id === selectedBatchOrderId) || order;

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === currentDisplayedOrder.status);

  // Calcular total combinado de todo el lote
  const combinedTotal = batchOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Link */}
      <Link
        href="/spaces"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Patios & Comercios</span>
      </Link>

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Comanda #{currentDisplayedOrder.id.slice(0, 8).toUpperCase()}</span>
              </div>

              {isMultiStore && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lote Multi-Comercio ({batchOrders.length} Locales)</span>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Seguimiento en Tiempo Real
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Comercio:{' '}
              <span className="font-bold text-white">{currentDisplayedOrder.business?.name}</span> •
              Espacio:{' '}
              <span className="text-emerald-400">
                {currentDisplayedOrder.business?.space?.name || 'Patio Gastronómico'}
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 flex-wrap">
            {/* Control de Alertas Sonoras para el Cliente */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) playCustomerOrderArrivedDoorAlert();
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                  soundEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Activar/Desactivar avisos de sonido (timbre de llegada, inicio de cocina, repartidor en camino)"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>Sonido: {soundEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {soundEnabled && (
                <button
                  type="button"
                  onClick={() => playCustomerOrderArrivedDoorAlert()}
                  className="px-2.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1 transition-all"
                  title="Probar sonido de timbre de puerta de entrega"
                >
                  <Bell className="w-3 h-3 text-emerald-400" />
                  <span>Probar Timbre 🚪</span>
                </button>
              )}
            </div>

            <button
              onClick={fetchOrder}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-all"
              title="Actualizar estado"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="text-right">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">
                {isMultiStore ? 'Total de Comanda' : 'Total del Pedido'}
              </div>
              <div className="text-xl font-black text-emerald-400">
                {currentDisplayedOrder.totalPrice.toFixed(2)} Bs
              </div>
              {isMultiStore && (
                <div className="text-[10px] text-slate-400">
                  (Total {batchOrders.length} locales: {combinedTotal.toFixed(2)} Bs)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Banner de Notificación en Vivo con Sonido */}
      {liveBanner && (
        <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-slate-900 to-emerald-500/20 border-2 border-emerald-500 shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{liveBanner.icon}</div>
            <div>
              <h4 className="font-bold text-white text-sm">{liveBanner.title}</h4>
              <p className="text-xs text-emerald-300">{liveBanner.desc}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLiveBanner(null)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Multi-Store Kitchens Selector Cards (if batch) */}
      {isMultiStore && (
        <div className="glass-panel rounded-3xl p-6 border border-amber-500/30 bg-amber-950/10 mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-amber-400" />
              <span>Cocinas Activas en tu Pedido ({batchOrders.length} Restaurantes)</span>
            </h2>
            <span className="text-[10px] text-slate-400">Selecciona para ver detalles</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {batchOrders.map((bo) => {
              const isSelected = bo.id === currentDisplayedOrder.id;
              const stepInfo = STATUS_STEPS.find((s) => s.key === bo.status) || STATUS_STEPS[0];

              return (
                <button
                  key={bo.id}
                  type="button"
                  onClick={() => setSelectedBatchOrderId(bo.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-white truncate max-w-[150px]">
                      {bo.business?.name}
                    </span>
                    <span className="text-xs font-black text-emerald-400">
                      {bo.totalPrice.toFixed(2)} Bs
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{stepInfo.label}</span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 truncate">
                    {bo.items?.length || 0} platos • {bo.business?.space?.name || 'Local'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Progress Timeline */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>
              Estado de la Comanda ({currentDisplayedOrder.business?.name})
            </span>
          </h2>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {currentDisplayedOrder.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div
                key={step.key}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10 scale-102'
                    : isCompleted
                    ? 'bg-slate-900/60 border-slate-700/80 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800/40 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Paso {idx + 1}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  )}
                </div>
                <div
                  className={`font-bold text-xs ${
                    isCurrent ? 'text-emerald-300' : isCompleted ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{step.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Live Status Description Banner for Client */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          {currentDisplayedOrder.status === 'esperando_pago' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-300 text-xs">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
              <div>
                <span className="font-bold block text-white">1. Esperando Confirmación del Comercio & Pago</span>
                <span>
                  {currentDisplayedOrder.business?.name} está revisando tu orden para verificar disponibilidad de los platos. Si pagas por QR, recuerda adjuntar tu comprobante abajo.
                </span>
              </div>
            </div>
          )}

          {currentDisplayedOrder.status === 'en_preparacion' && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 text-blue-300 text-xs">
              <Store className="w-5 h-5 text-blue-400 shrink-0 animate-bounce" />
              <div>
                <span className="font-bold block text-white">2. ¡Pedido Aceptado! Cocinando en este momento</span>
                <span>
                  El restaurante {currentDisplayedOrder.business?.name} ha verificado tu pedido y está preparando tus platos en cocina.
                </span>
              </div>
            </div>
          )}

          {currentDisplayedOrder.status === 'buscando_driver' && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-3 text-purple-300 text-xs">
              <Bike className="w-5 h-5 text-purple-400 shrink-0 animate-pulse" />
              <div>
                <span className="font-bold block text-white">3. Platos Listos • Buscando Repartidor en Moto</span>
                <span>
                  Tu comida ya está empacada y caliente. Asignando al repartidor más cercano en Trinidad para el despacho.
                </span>
              </div>
            </div>
          )}

          {currentDisplayedOrder.status === 'en_camino' && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
              <Bike className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block text-white">4. ¡Repartidor en Camino a tu Domicilio!</span>
                <span>
                  {currentDisplayedOrder.driver?.name || 'Tu repartidor'} va en camino a {currentDisplayedOrder.deliveryAddress}. Ten a mano tu teléfono o el efectivo si aplica.
                </span>
              </div>
            </div>
          )}

          {currentDisplayedOrder.status === 'entregado' && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block text-white">5. Pedido Entregado con Éxito</span>
                <span>¡Gracias por pedir en PedidosTrinidad! Esperamos que disfrutes tu comida.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Grid (Items & Delivery Info) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Items receipt (7 cols) */}
        <div className="md:col-span-7 glass-panel rounded-3xl p-6 border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>
              Platos de {currentDisplayedOrder.business?.name} ({currentDisplayedOrder.items?.length})
            </span>
          </h3>

          <div className="space-y-3 mb-6">
            {currentDisplayedOrder.items?.map((item: any) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-white">
                    {item.quantity}x {item.product?.name || 'Producto'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Precio unitario: {item.unitPrice.toFixed(2)} Bs
                  </div>
                </div>
                <div className="font-bold text-emerald-400 text-sm">
                  {item.subtotal.toFixed(2)} Bs
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal platos</span>
              <span className="font-semibold text-white">
                {(currentDisplayedOrder.totalPrice - currentDisplayedOrder.deliveryFee).toFixed(2)} Bs
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tarifa de Envío Delivery</span>
              <span className="font-semibold text-emerald-400">
                {currentDisplayedOrder.deliveryFee.toFixed(2)} Bs
              </span>
            </div>
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
              <span>Total Comanda</span>
              <span className="text-emerald-400">
                {currentDisplayedOrder.totalPrice.toFixed(2)} Bs
              </span>
            </div>
          </div>
        </div>

        {/* Delivery & Payment Info (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          {/* Delivery Details */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Dirección de Entrega</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Ubicación GPS:</span>
                <span className="font-semibold text-white">{currentDisplayedOrder.deliveryAddress}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Teléfono de contacto:</span>
                <span className="font-semibold text-white flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {currentDisplayedOrder.customerPhone}
                </span>
              </div>

              {currentDisplayedOrder.notes && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Notas para el Repartidor:</span>
                  <span className="text-slate-300 italic">&quot;{currentDisplayedOrder.notes}&quot;</span>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Driver Card if present */}
          {currentDisplayedOrder.driver && (
            <div className="glass-panel rounded-3xl p-6 border border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 to-slate-900/50 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Bike className="w-4 h-4 text-emerald-400" />
                  <span>Tu Repartidor Asignado</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  {currentDisplayedOrder.driver.driverCode || 'DRV-777'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <h4 className="font-bold text-white text-sm">{currentDisplayedOrder.driver.name}</h4>
                  <p className="text-[11px] text-slate-400">Motocicleta Honda 150cc • Trinidad</p>
                </div>

                {currentDisplayedOrder.driver.phone && (
                  <a
                    href={`tel:${currentDisplayedOrder.driver.phone}`}
                    className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Llamar</span>
                  </a>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {currentDisplayedOrder.status === 'en_camino'
                    ? 'Tu pedido está en camino a tu dirección.'
                    : currentDisplayedOrder.status === 'entregado'
                    ? '¡Pedido entregado con éxito por tu repartidor!'
                    : 'Repartidor asignado esperando salida de cocina.'}
                </span>
              </div>
            </div>
          )}

          {/* Calificación del Repartidor al ser Entregado */}
          {currentDisplayedOrder.driver && (
            <OrderDriverRatingCard
              orderId={currentDisplayedOrder.id}
              driver={currentDisplayedOrder.driver}
              initialRating={currentDisplayedOrder.driverRating}
              initialReview={currentDisplayedOrder.driverReview}
              isDelivered={currentDisplayedOrder.status === 'entregado'}
            />
          )}

          {/* Payment Verification Card for Current Displayed Order */}
          <PaymentVerificationCard
            order={currentDisplayedOrder}
            onPaymentUpdated={fetchOrder}
          />
        </div>
      </div>
    </div>
  );
}
