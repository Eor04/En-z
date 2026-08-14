'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import {
  Bike,
  MapPin,
  Phone,
  Store,
  DollarSign,
  CheckCircle2,
  Clock,
  Navigation,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Award,
  AlertCircle,
  ExternalLink,
  Power,
  Banknote,
  Bell,
  Volume2,
  VolumeX,
  MessageSquare,
  Route,
  Star,
  Wallet,
  Compass,
} from 'lucide-react';
import { DriverRouteMapModal } from '@/presentation/components/maps/DriverRouteMapModal';
import { DriverDeliveryMap } from '@/presentation/components/maps/DriverDeliveryMap';
import { DriverRatingModal } from '@/presentation/components/driver/DriverRatingModal';
import { DriverWalletSummary } from '@/presentation/components/driver/DriverWalletSummary';
import {
  extractCoordinates,
  getGoogleMapsNavigationUrl,
  getGoogleMapsCompleteRouteUrl,
  getWazeNavigationUrl,
  getDriverWhatsAppMessageUrl,
} from '@/presentation/utils/navigationUrls';
import {
  playDriverNewDeliveryAlert,
  playSuccessChimeAlert,
} from '@/presentation/utils/audioAlerts';
import { useRealtimeEvents } from '@/presentation/hooks/useRealtimeEvents';
import { usePushNotifications } from '@/presentation/hooks/usePushNotifications';
import { AnimatePresence, motion } from 'motion/react';
import {
  Badge,
  Button,
  Panel,
  Stat,
  StaggerList,
  Tabs,
} from '@/presentation/components/ui';
import { bs } from '@/presentation/lib/utils';

export default function DriverDashboardPage() {
  const { data: session, status } = useSession();
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'wallet' | 'history'>('available');
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  /* Entregas agrupadas por viaje: un pedido multi-comercio es UNA tarjeta */
  const [activeGroups, setActiveGroups] = useState<any[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalDeliveries: 0,
    totalEarnings: 0,
    todayDeliveries: 0,
    todayEarnings: 0,
    rating: 5.0,
    totalReviews: 0,
    reviews: [],
  });
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedMapOrder, setSelectedMapOrder] = useState<any | null>(null);
  const [ratingModalOrder, setRatingModalOrder] = useState<any | null>(null);

  const prevAvailCount = useRef(0);

  const user = session?.user as any;
  const driverId = user?.id || 'demo-driver-carlos';

  // Notificaciones Push Web para repartidores (Vibración y Alertas con pantalla bloqueada)
  const {
    isSubscribed: pushSubscribed,
    permission: pushPermission,
    loading: pushLoading,
    subscribe: subscribePush,
    sendTestPush,
  } = usePushNotifications({
    channel: 'driver:pool',
    role: 'DRIVER',
    userId: driverId,
  });

  const fetchData = async () => {
    try {
      // 1. Pedidos disponibles, ya agrupados por lote (un viaje = un grupo)
      const availRes = await fetch('/api/driver/orders/available');
      const availData = await availRes.json();
      if (availRes.ok && availData.groups) {
        if (availData.groups.length > prevAvailCount.current && soundEnabled && isOnline) {
          playDriverNewDeliveryAlert();
        }
        prevAvailCount.current = availData.groups.length;
        setAvailableOrders(availData.groups || []);
      }

      // 2. Entregas activas, historial y billetera
      const delivRes = await fetch('/api/driver/deliveries');
      const delivData = await delivRes.json();
      if (delivRes.ok) {
        setActiveGroups(delivData.activeGroups || []);
        setCompletedDeliveries(delivData.completedDeliveries || []);
        if (delivData.stats) setStats(delivData.stats);
        if (delivData.wallet) setWallet(delivData.wallet);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Conexión en tiempo real SSE para el pool de repartidores
  const { connectionStatus, reconnect } = useRealtimeEvents({
    channels: ['driver:pool', driverId ? `driver:${driverId}` : ''],
    enabled: isOnline,
    enableAudioAlerts: soundEnabled && isOnline,
    onOrderReadyForPickup: (data) => {
      fetchData();
      setFeedback('🛵 ¡Nuevo pedido listo para recojo en cocina! Apareció en tus pedidos disponibles.');
    },
    onOrderDriverAssigned: () => {
      fetchData();
    },
    onOrderDelivered: () => {
      fetchData();
    },
    onOrderStatusUpdated: () => {
      fetchData();
    },
  });

  useEffect(() => {
    if (status !== 'loading') {
      fetchData();
      // Fallback ligero cada 25s
      const interval = setInterval(fetchData, 25000);
      return () => clearInterval(interval);
    }
  }, [status, session, isOnline]);

  // Acción: Aceptar pedido para ir a recoger
  const handleAcceptOrder = async (orderId: string) => {
    setActionLoading(orderId);
    setFeedback(null);
    try {
      const res = await fetch('/api/driver/orders/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, driverId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al aceptar el pedido');

      playSuccessChimeAlert();
      setFeedback(`✓ ¡Pedido aceptado con éxito! Inicia tu ruta en Google Maps para recoger los platos.`);
      setActiveTab('active');
      await fetchData();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Acción: Confirmar Entrega en Puerta con Calificación
  const handleCompleteDelivery = async (orderId: string, rating: number = 5, review: string = '') => {
    setActionLoading(orderId);
    setFeedback(null);
    try {
      const res = await fetch('/api/driver/orders/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          driverId,
          notes: 'Entregado conforme en puerta al cliente en Trinidad',
          rating,
          review,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al confirmar entrega');

      playSuccessChimeAlert();
      setRatingModalOrder(null);
      setFeedback(`🎉 ¡Excelente! Entrega confirmada con ${rating}★ y +10.00 Bs sumados a tu Billetera.`);
      await fetchData();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-ink-mute">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Cargando panel de repartidor...</p>
      </div>
    );
  }

  // Si no está autenticado como DRIVER o ADMIN, mostrar acceso guiado
  const userRole = (session?.user as any)?.role;
  if (!session?.user || (userRole !== 'DRIVER' && userRole !== 'ADMIN')) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="rune-panel rounded-3xl p-8 border border-violet-500/30 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center mx-auto mb-4">
            <Bike className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Portal de Repartidores en Moto</h2>
          <p className="text-xs text-ink-mute mb-6 leading-relaxed">
            Inicia sesión con tu cuenta de repartidor o utiliza el usuario de demostración de Carlos Repartidor para recibir, recoger y entregar pedidos en Trinidad.
          </p>
          <div className="space-y-3">
            <button
              onClick={() =>
                signIn('credentials', {
                  email: 'repartidor@pedidostrinidad.com',
                  password: 'password123',
                  callbackUrl: '/driver/dashboard',
                })
              }
              className="w-full py-3 px-4 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-xs font-bold shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Acceder como Carlos Repartidor (Demo Moto)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/auth/login"
              className="block w-full py-3 px-4 rounded-xl bg-void-700 border border-surface-line hover:border-surface-line text-ink-soft text-xs font-semibold"
            >
              Iniciar sesión con otra cuenta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const todayEarningsVal = wallet?.today?.totalEarnings ?? stats.todayEarnings ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Perfil del repartidor y disponibilidad */}
      <Panel className="mb-8 flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-info/35 bg-info/12 text-info">
            <Bike className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">Repartidor</Badge>
              <span className="font-mono text-[11px] text-ink-mute">
                {user?.driverCode || 'DRV-777'}
              </span>
            </div>
            <h1 className="mt-1.5 truncate font-display text-xl font-bold text-white sm:text-2xl">
              {user?.name || 'Repartidor'}
            </h1>
            <p className="mt-0.5 text-[12px] text-ink-mute">
              {user?.phone || '+591 78901234'} · Trinidad, Beni
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playDriverNewDeliveryAlert();
            }}
            title="Alertas sonoras de nuevos pedidos"
            className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2.5 text-[12px] font-semibold transition-colors ${
              soundEnabled
                ? 'border-ok/35 bg-ok/10 text-ok-soft hover:bg-ok/20'
                : 'border-surface-line bg-void-800/70 text-ink-mute hover:text-white'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sonido' : 'Silencio'}</span>
          </button>

          {!pushSubscribed && pushPermission !== 'granted' ? (
            <button
              type="button"
              onClick={() => subscribePush()}
              disabled={pushLoading}
              title="Activar notificaciones en segundo plano"
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-warn/35 bg-warn/12 px-3.5 py-2.5 text-[12px] font-semibold text-warn-soft transition-colors hover:bg-warn/20 disabled:opacity-50"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Activar push</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                sendTestPush(
                  'Alerta de prueba',
                  'Las notificaciones en segundo plano funcionan correctamente.'
                )
              }
              title="Notificaciones activas"
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-ok/35 bg-ok/10 px-3 py-2.5 text-[12px] font-semibold text-ok-soft"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Push ok</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            title="Billetera y cierre de turno"
            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-violet-400/35 bg-violet-500/12 px-3.5 py-2.5 text-[12px] font-semibold text-violet-200 transition-colors hover:bg-violet-500/20"
          >
            <Wallet className="h-4 w-4" />
            <span className="tabular">{bs(todayEarningsVal)} Bs hoy</span>
          </button>

          <motion.button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            whileTap={{ scale: 0.96 }}
            className={`sheen flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 font-display text-[12px] font-bold transition-colors ${
              isOnline
                ? 'border border-ok/40 bg-ok/20 text-ok-soft shadow-glow-ok'
                : 'border border-ember/40 bg-ember/15 text-ember-soft'
            }`}
          >
            <Power className="h-4 w-4" />
            {isOnline ? 'En servicio' : 'Desconectado'}
          </motion.button>
        </div>
      </Panel>

      {/* Aviso de pedidos esperando */}
      <AnimatePresence>
        {availableOrders.length > 0 && isOnline && activeTab !== 'available' && (
          <motion.div
            initial={{ opacity: 0, y: -14, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-arc/45 bg-arc/10 p-4 shadow-glow-arc sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <motion.span
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-arc/40 bg-arc/20 text-arc-bright"
                >
                  <Bike className="h-5 w-5" />
                </motion.span>
                <div>
                  <p className="flex flex-wrap items-center gap-2">
                    <Badge tone="arc" dot>
                      Nuevos pedidos
                    </Badge>
                    <span className="text-[12px] font-semibold text-arc-soft">
                      {availableOrders.length} disponible
                      {availableOrders.length > 1 ? 's' : ''} · +10,00 Bs c/u
                    </span>
                  </p>
                  <p className="mt-1 font-display text-[14px] font-bold text-white">
                    Hay locales esperando recojo. Aceptá para iniciar la ruta.
                  </p>
                </div>
              </div>

              <Button size="sm" onClick={() => setActiveTab('available')} className="shrink-0">
                Ver pedidos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Métricas */}
      <StaggerList className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div onClick={() => setActiveTab('wallet')} className="cursor-pointer">
          <Stat
            label="Ganancias hoy"
            value={`${bs(todayEarningsVal)} Bs`}
            sub="10 Bs por viaje · ver billetera"
            icon={Wallet}
            tone="arc"
          />
        </div>
        <Stat
          label="Entregas hoy"
          value={stats.todayDeliveries}
          sub={`+${bs(todayEarningsVal)} Bs ganados`}
          icon={Bike}
          tone="violet"
        />
        <Stat
          label="Total entregas"
          value={stats.totalDeliveries}
          sub="Completadas con éxito"
          icon={CheckCircle2}
          tone="ok"
        />
        <Stat
          label="Calificación"
          value={`${stats.rating} / 5`}
          sub={`${stats.totalReviews || 0} reseñas`}
          icon={Star}
          tone="warn"
        />
      </StaggerList>

      <AnimatePresence>
        {feedback && (
          <motion.div
            role="status"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2.5 rounded-2xl border border-violet-400/35 bg-violet-500/10 p-4 text-[13px] text-violet-200">
              <Sparkles className="h-4 w-4 shrink-0" />
              {feedback}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pestañas */}
      <div className="mb-6">
        <Tabs
          layoutKey="driver-tabs"
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { value: 'available', label: 'Disponibles', icon: ShoppingBag, count: availableOrders.length },
            { value: 'active', label: 'En curso', icon: Bike, count: activeGroups.length },
            { value: 'wallet', label: 'Billetera', icon: Wallet },
            { value: 'history', label: 'Historial', icon: Clock, count: completedDeliveries.length },
          ]}
        />
      </div>

      {/* TAB 1: PEDIDOS DISPONIBLES (LISTOS PARA RECOGER) */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {!isOnline ? (
            <div className="p-8 rounded-2xl rune-panel border border-surface-line text-center text-xs text-ink-mute">
              <Power className="w-8 h-8 mx-auto mb-2 text-ember" />
              <p className="font-bold text-white">Estás actualmente desconectado</p>
              <p className="text-[11px] text-ink-faint mt-1">
                Activa tu estado &quot;En Servicio&quot; en la parte superior para recibir y tomar pedidos en tu moto.
              </p>
            </div>
          ) : availableOrders.length === 0 ? (
            <div className="p-8 rounded-2xl rune-panel border border-surface-line text-center text-xs text-ink-mute">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-violet-400/60" />
              <p className="font-bold text-white">No hay pedidos pendientes de repartidor</p>
              <p className="text-[11px] text-ink-faint mt-1">
                Cuando una cocina termine de preparar y marcar listo un pedido, aparecerá aquí con sonido de alerta al instante.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableOrders.map((group) => {
                /* Cada grupo es UN viaje. Si el pedido era multi-comercio trae
                   varias paradas y sólo llega acá cuando todas las cocinas
                   terminaron, así el repartidor no va dos veces al mismo patio. */
                const primera = group.orders?.[0] ?? group;
                const isActing = actionLoading === primera.id;
                const paradas = group.pickups ?? [];

                return (
                  <div
                    key={group.groupId ?? primera.id}
                    className="p-5 rounded-3xl rune-panel border-2 border-violet-500/40 hover:border-violet-500/80 transition-all space-y-4 shadow-xl bg-gradient-to-b from-void-700/90 to-void-700/60"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/40">
                            ORD-#{primera.id.slice(0, 6).toUpperCase()}
                          </span>
                          {group.isMultiStore && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-arc/20 text-arc-soft border border-arc/40">
                              {group.pickupCount} paradas
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-white text-base mt-1.5 flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-warn shrink-0" />
                          <span className="truncate">
                            {group.isMultiStore
                              ? `Recoger en ${group.pickupCount} locales`
                              : paradas[0]?.businessName || primera.business?.name}
                          </span>
                        </h4>
                        {!group.isMultiStore && (
                          <p className="text-[11px] text-ink-mute truncate">
                            {paradas[0]?.spaceName || 'Patio gastronómico'} · Trinidad
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-ink-mute uppercase tracking-wider font-semibold">Tu ganancia</div>
                        <div className="text-xl font-black text-violet-400 tabular">+10.00 Bs</div>
                        <span className="text-[10px] text-ink-faint">Tarifa fija moto</span>
                      </div>
                    </div>

                    {/* Paradas de recojo, en orden */}
                    <div className="space-y-2">
                      {paradas.map((p: any, i: number) => (
                        <div
                          key={p.orderId}
                          className="p-3 rounded-2xl bg-void-700/80 border border-surface-line"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/20 border border-violet-400/40 text-[10px] font-black text-violet-300">
                                {i + 1}
                              </span>
                              <span className="truncate text-xs font-black text-white">
                                {p.businessName}
                              </span>
                            </span>
                            <span className="shrink-0 text-[11px] font-bold text-violet-300 tabular">
                              {p.subtotal.toFixed(2)} Bs
                            </span>
                          </div>
                          <p className="mt-1 pl-7 text-[10px] text-ink-mute truncate">
                            {p.spaceName ? `${p.spaceName} · ` : ''}
                            {p.items.map((it: any) => `${it.quantity}× ${it.name}`).join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Destino */}
                    <div className="p-3.5 rounded-2xl bg-void-700/80 border border-surface-line text-xs space-y-2.5">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-ember shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-ink-mute uppercase font-bold">Destino de entrega</span>
                          <p className="font-black text-white text-xs mt-0.5">{group.deliveryAddress}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-surface-line text-[11px] text-ink-mute">
                        <span>Cliente: <strong className="text-ink">{group.customer?.name}</strong></span>
                        <span className="tabular">{group.totalPrice.toFixed(2)} Bs</span>
                      </div>

                      {group.notes && (
                        <div className="p-2 rounded-xl bg-warn/10 border border-warn/20 text-warn-soft text-[11px] italic">
                          Nota cliente: &quot;{group.notes}&quot;
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMapOrder(primera)}
                        className="py-3 px-3.5 rounded-2xl bg-void-700 hover:bg-surface-raised border border-violet-500/40 text-violet-400 hover:text-violet-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        title="Ver ruta en mapa interactivo"
                      >
                        <Route className="w-4 h-4" />
                        <span>Ver mapa</span>
                      </button>

                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleAcceptOrder(primera.id)}
                        className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-500 to-arc hover:from-violet-400 hover:to-arc text-white text-xs font-black shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 ring-2 ring-violet-400/40"
                      >
                        <Bike className="w-4 h-4" />
                        <span>
                          {isActing
                            ? 'Asignando…'
                            : group.isMultiStore
                              ? `Aceptar las ${group.pickupCount} paradas (+10.00 Bs)`
                              : 'Aceptar pedido (+10.00 Bs)'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MI ENTREGA EN CURSO */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {activeGroups.length === 0 ? (
            <div className="p-8 rounded-2xl rune-panel border border-surface-line text-center text-xs text-ink-mute">
              <Bike className="w-8 h-8 mx-auto mb-2 text-ink-faint" />
              <p className="font-bold text-white">No tienes entregas activas en este momento</p>
              <p className="text-[11px] text-ink-faint mt-1 mb-4">
                Revisa la pestaña de pedidos disponibles para tomar una entrega.
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="px-4 py-2 rounded-xl bg-violet-500 text-white font-bold text-xs"
              >
                Ver Pedidos Disponibles
              </button>
            </div>
          ) : (
            activeGroups.map((order) => {
              /* `order` es el VIAJE: una comanda suelta o varias del mismo lote.
                 Se confirma la entrega una sola vez para todas. */
              const principal = order.orders?.[0] ?? order;
              const paradas = order.pickups ?? [];
              const isActing = actionLoading === principal.id;
              const isCash = order.cashToCollect > 0;
              const cleanPhone = (order.customerPhone || order.customer?.phone || '').replace(/\D/g, '');

              const customerCoords = extractCoordinates(order.deliveryAddress, -14.8348, -64.9042);
              const storeCoords = extractCoordinates(
                paradas[0]?.spaceName || paradas[0]?.address,
                -14.8315,
                -64.9012
              );

              const navigateToCustomerGpsUrl = getGoogleMapsNavigationUrl({
                lat: customerCoords.lat,
                lng: customerCoords.lng,
                address: order.deliveryAddress,
                name: order.customer?.name,
              });

              const navigateToStoreGpsUrl = getGoogleMapsNavigationUrl({
                lat: storeCoords.lat,
                lng: storeCoords.lng,
                name: paradas[0]?.businessName,
              });

              const whatsAppUrl = getDriverWhatsAppMessageUrl({
                phone: cleanPhone,
                customerName: order.customer?.name,
                orderId: principal.id,
                deliveryAddress: order.deliveryAddress,
              });

              return (
                <div
                  key={order.groupId}
                  className="p-6 rounded-3xl rune-panel border-2 border-violet-500/50 space-y-5 shadow-2xl shadow-violet-950/20 bg-void"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-line">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 mb-2">
                        <Bike className="w-3.5 h-3.5 animate-pulse" />
                        <span>Entrega en Curso • En Ruta</span>
                      </div>
                      <h3 className="text-lg font-black text-white">
                        Pedido ORD-#{principal.id.slice(0, 6).toUpperCase()}
                      </h3>
                      {order.isMultiStore && (
                        <p className="text-[11px] font-bold text-arc-soft mt-0.5">
                          Recogé en {order.pickupCount} locales antes de entregar
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedMapOrder(principal)}
                        className="py-2 px-3.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <Route className="w-4 h-4 text-violet-400" />
                        <span>🗺️ Abrir Mapa Interactivo</span>
                      </button>

                      <div className="text-right">
                        <span className="text-[10px] text-ink-mute uppercase">Tarifa Delivery</span>
                        <div className="text-xl font-black text-violet-400">+10.00 Bs</div>
                      </div>
                    </div>
                  </div>

                  {/* Mapa siempre visible: el recorrido a la vista sin abrir el modal */}
                  <DriverDeliveryMap order={order} />

                  {/* 1. BOTÓN GIGANTE DIRECTO A GOOGLE MAPS GPS HABLADO */}
                  <div className="space-y-2">
                    <a
                      href={navigateToCustomerGpsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-violet-500 via-arc to-violet-400 hover:from-violet-400 hover:to-arc-soft text-white text-sm sm:text-base font-black shadow-xl shadow-violet-500/30 flex items-center justify-center gap-2.5 transition-all ring-2 ring-violet-400/50 transform active:scale-98"
                    >
                      <Navigation className="w-5 h-5 animate-pulse text-void shrink-0" />
                      <span className="uppercase tracking-wide font-black">
                        🧭 Iniciar Ruta en Google Maps (GPS Hablado)
                      </span>
                    </a>

                    {/* Acciones Rápidas secundarias para el repartidor */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <a
                        href={navigateToStoreGpsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-warn/10 hover:bg-warn/20 border border-warn/30 text-warn-soft text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        <Store className="w-3.5 h-3.5 shrink-0" />
                        <span>GPS a Cocina</span>
                      </a>

                      <a
                        href={navigateToCustomerGpsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>GPS a Cliente</span>
                      </a>

                      {cleanPhone && (
                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {cleanPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="py-2.5 px-3 rounded-xl bg-void-700 hover:bg-surface-raised border border-surface-line text-ink text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>Llamar</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Cash collection alert if applicable */}
                  {isCash ? (
                    <div className="p-4 rounded-2xl bg-violet-950/40 border border-warn/40 text-warn-soft text-xs flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-warn shrink-0" />
                        <div>
                          <strong className="block text-white">Cobro en Efectivo contra Entrega:</strong>
                          <span>Debes cobrar <strong className="text-warn font-bold">{order.totalPrice.toFixed(2)} Bs</strong> en efectivo al cliente al entregar.</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-violet-950/40 border border-info/40 text-info-soft text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-info shrink-0" />
                      <div>
                        <strong className="block text-white">Pago Digital Previsto:</strong>
                        <span>El cliente ya pagó mediante QR/Tarjeta. <strong className="text-white font-bold">NO cobrar en efectivo</strong>.</span>
                      </div>
                    </div>
                  )}

                  {/* Two Step Route Details: Pickup -> Dropoff */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Paso 1: cocinas de las que hay que recoger */}
                    <div className="p-4 rounded-2xl bg-void-700/80 border border-surface-line space-y-3">
                      <div className="font-bold text-warn flex items-center gap-1.5">
                        <Store className="w-4 h-4" />
                        <span>
                          {paradas.length > 1
                            ? `1. Retirar en ${paradas.length} cocinas`
                            : '1. Punto de Retiro (Cocina del Comercio)'}
                        </span>
                      </div>

                      {paradas.map((p: any, i: number) => {
                        const c = extractCoordinates(p.spaceName || p.address, -14.8315, -64.9012);
                        const gps = getGoogleMapsNavigationUrl({
                          lat: c.lat,
                          lng: c.lng,
                          name: p.businessName,
                        });
                        return (
                          <div
                            key={p.orderId}
                            className={paradas.length > 1 ? 'pt-2 border-t border-surface-line first:pt-0 first:border-0' : ''}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-black text-white flex items-center gap-1.5">
                                  {paradas.length > 1 && (
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warn/20 border border-warn/40 text-[10px] text-warn-soft">
                                      {i + 1}
                                    </span>
                                  )}
                                  <span className="truncate">{p.businessName}</span>
                                </div>
                                <p className="text-ink-mute text-[11px]">
                                  {p.spaceName || 'Local'} • Trinidad
                                </p>
                              </div>
                              <span className="shrink-0 text-[11px] font-bold text-violet-300 tabular">
                                {p.subtotal.toFixed(2)} Bs
                              </span>
                            </div>

                            <p className="text-[10px] text-ink-faint mt-1 truncate">
                              {p.items.map((it: any) => `${it.quantity}× ${it.name}`).join(', ')}
                            </p>

                            <a
                              href={gps}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-warn hover:underline font-bold text-[11px] mt-1.5"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Abrir GPS a {p.businessName}</span>
                            </a>
                          </div>
                        );
                      })}
                    </div>

                    {/* Step 2: Customer Delivery */}
                    <div className="p-4 rounded-2xl bg-void-700/80 border border-surface-line space-y-2">
                      <div className="font-bold text-violet-400 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>2. Destino de Entrega (Domicilio del Cliente)</span>
                      </div>
                      <div className="text-sm font-black text-white">{order.deliveryAddress}</div>
                      
                      {order.notes && (
                        <p className="text-warn-soft text-[11px] bg-violet-950/30 p-2 rounded-xl border border-warn/20 italic">
                          Nota: &quot;{order.notes}&quot;
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-ink-soft text-[11px] pt-1">
                        <span>Cliente: <strong>{order.customer?.name}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Detalle de todo lo que lleva el viaje */}
                  <div className="p-3.5 rounded-2xl bg-void-700/60 border border-surface-line text-xs space-y-2.5">
                    <span className="text-[11px] font-bold text-ink-mute block">
                      Detalle de Platos a Entregar:
                    </span>
                    {paradas.map((p: any) => (
                      <div key={p.orderId}>
                        {paradas.length > 1 && (
                          <span className="block text-[10px] font-bold text-warn-soft mb-0.5">
                            {p.businessName}
                          </span>
                        )}
                        <div className="space-y-1">
                          {p.items.map((item: any, k: number) => (
                            <div key={k} className="text-ink-soft flex justify-between gap-3">
                              <span className="truncate">• {item.quantity}x {item.name}</span>
                              <span className="font-semibold text-ink-mute shrink-0 tabular">
                                {item.subtotal.toFixed(2)} Bs
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-surface-line pt-2 font-bold text-white">
                      <span>Total del pedido</span>
                      <span className="tabular">{order.totalPrice.toFixed(2)} Bs</span>
                    </div>
                  </div>

                  {/* Confirm delivery button */}
                  <button
                    type="button"
                    disabled={isActing}
                    onClick={() => setRatingModalOrder(principal)}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-arc-deep hover:from-violet-500 hover:to-arc text-white font-black text-sm shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      {order.isMultiStore
                        ? `✓ Confirmar entrega de las ${order.pickupCount} cocinas`
                        : '✓ Confirmar Entrega en Puerta del Cliente (Calificar)'}
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: BILLETERA DEL REPARTIDOR & RESUMEN DEL DÍA */}
      {activeTab === 'wallet' && (
        <DriverWalletSummary
          wallet={wallet}
          completedDeliveries={completedDeliveries}
          driverName={user?.name || 'Carlos Repartidor Flash'}
          driverCode={user?.driverCode || (user?.id ? `DRV-${user.id.slice(0, 4).toUpperCase()}` : 'DRV-777')}
        />
      )}

      {/* TAB 4: HISTORIAL DE ENTREGAS & RESEÑAS */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {completedDeliveries.length === 0 ? (
            <div className="p-8 rounded-2xl rune-panel border border-surface-line text-center text-xs text-ink-mute">
              <Clock className="w-8 h-8 mx-auto mb-2 text-ink-faint" />
              <p className="font-bold text-white">Aún no has completado entregas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedDeliveries.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl rune-panel border border-surface-line space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">ORD-#{order.id.slice(0, 6).toUpperCase()}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300">
                          Entregado
                        </span>
                        {order.driverRating && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-warn/20 text-warn-soft border border-warn/40 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-warn-soft" />
                            <span>{order.driverRating}.0 ★</span>
                          </span>
                        )}
                      </div>
                      <p className="text-ink-mute text-[11px] mt-1">
                        {order.business?.name} ➔ {order.deliveryAddress}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-violet-400 text-sm">+{Number(order.deliveryFee || 10).toFixed(2)} Bs</div>
                      <div className="text-[10px] text-ink-faint">
                        {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {order.driverReview && (
                    <div className="mt-2 p-2.5 rounded-xl bg-void/60 border border-surface-line text-[11px] text-ink-soft italic flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-warn shrink-0 mt-0.5" />
                      <span>&quot;{order.driverReview}&quot;</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Sección de Reseñas de Clientes si existen */}
          {stats.reviews && stats.reviews.length > 0 && (
            <div className="p-6 rounded-3xl bg-void-700/80 border border-warn/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-warn" />
                  <h4 className="font-bold text-white text-sm">Reseñas y Felicitaciones de Clientes</h4>
                </div>
                <span className="text-xs font-bold text-warn">{stats.reviews.length} opiniones registradas</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {stats.reviews.map((rev: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-void/70 border border-surface-line/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{rev.customerName}</span>
                      <div className="flex items-center gap-0.5 text-warn">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s <= rev.rating ? 'fill-warn text-warn' : 'text-ink-faint'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.review ? (
                      <p className="text-ink-soft italic text-[11px]">&quot;{rev.review}&quot;</p>
                    ) : (
                      <p className="text-ink-faint text-[11px]">Calificación con 5 estrellas en puerta</p>
                    )}
                    <span className="text-[10px] text-ink-faint block">
                      {new Date(rev.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Calificación al Confirmar Entrega en Puerta */}
      {ratingModalOrder && (
        <DriverRatingModal
          order={ratingModalOrder}
          isOpen={Boolean(ratingModalOrder)}
          onClose={() => setRatingModalOrder(null)}
          onConfirm={async (rating, review) => {
            await handleCompleteDelivery(ratingModalOrder.id, rating, review);
          }}
          isSubmitting={actionLoading === ratingModalOrder.id}
        />
      )}

      {/* Modal Interactivo de Mapa de Ruta para el Repartidor */}
      {selectedMapOrder && (
        <DriverRouteMapModal
          order={selectedMapOrder}
          onClose={() => setSelectedMapOrder(null)}
        />
      )}
    </div>
  );
}
