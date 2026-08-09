'use client';

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

export const dynamic = 'force-dynamic';

export default function DriverDashboardPage() {
  const { data: session, status } = useSession();
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'wallet' | 'history'>('available');
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<any[]>([]);
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
      // 1. Pedidos disponibles
      const availRes = await fetch('/api/driver/orders/available');
      const availData = await availRes.json();
      if (availRes.ok && availData.orders) {
        if (availData.orders.length > prevAvailCount.current && soundEnabled && isOnline) {
          playDriverNewDeliveryAlert();
        }
        prevAvailCount.current = availData.orders.length;
        setAvailableOrders(availData.orders || []);
      }

      // 2. Entregas activas, historial y billetera
      const delivRes = await fetch(`/api/driver/deliveries?driverId=${driverId}`);
      const delivData = await delivRes.json();
      if (delivRes.ok) {
        setActiveDeliveries(delivData.activeDeliveries || []);
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
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Cargando panel de repartidor...</p>
      </div>
    );
  }

  // Si no está autenticado como DRIVER o ADMIN, mostrar acceso guiado
  const userRole = (session?.user as any)?.role;
  if (!session?.user || (userRole !== 'DRIVER' && userRole !== 'ADMIN')) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="glass-panel rounded-3xl p-8 border border-emerald-500/30 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Bike className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Portal de Repartidores en Moto</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
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
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Acceder como Carlos Repartidor (Demo Moto)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/auth/login"
              className="block w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-semibold"
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
      {/* Driver Header Profile & Availability */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 p-6 rounded-3xl border border-emerald-500/30">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Bike className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Moto Driver
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {user?.driverCode ? `Código: ${user.driverCode}` : 'Trinidad Express (DRV-777)'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {user?.name || 'Carlos Repartidor Flash'}
            </h1>
            <p className="text-xs text-slate-400">
              {user?.phone ? `Tel: ${user.phone}` : '+591 78901234'} • Trinidad, Beni
            </p>
          </div>
        </div>

        {/* Toggle Online/Offline & Sound */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playDriverNewDeliveryAlert();
            }}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              soundEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Alertas de sonido para nuevos pedidos"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sonido Activo' : 'Silencio'}</span>
          </button>

          {/* Botón de Notificaciones Push Web con pantalla bloqueada */}
          {!pushSubscribed && pushPermission !== 'granted' ? (
            <button
              type="button"
              onClick={() => subscribePush()}
              disabled={pushLoading}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all animate-pulse"
              title="Activar notificaciones push en segundo plano para moto"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Activar Notificaciones Push</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => sendTestPush('🛵 ¡Alerta de Prueba Repartidor!', 'Notificación push en segundo plano funcionando en Trinidad.')}
              className="px-3 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5"
              title="Notificaciones push activas"
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Push OK</span>
            </button>
          )}

          {/* Botón de Acceso Rápido a Billetera */}
          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            title="Ver Billetera y Cierre de Turno"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>{todayEarningsVal.toFixed(2)} Bs Hoy</span>
          </button>

          {/* Toggle Online */}
          <button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg ${
              isOnline
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnline ? 'EN SERVICIO (ONLINE)' : 'DESCONECTADO'}</span>
          </button>
        </div>
      </div>

      {/* Banner de Pedidos Disponibles Esperando */}
      {availableOrders.length > 0 && isOnline && activeTab !== 'available' && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-900/60 to-slate-900 border-2 border-emerald-500/60 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 animate-bounce">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-slate-950 uppercase tracking-wider">
                  ¡Nuevos Pedidos!
                </span>
                <span className="text-xs text-emerald-300 font-semibold">
                  {availableOrders.length} pedido{availableOrders.length > 1 ? 's' : ''} disponible{availableOrders.length > 1 ? 's' : ''} para entrega (+10.00 Bs c/u)
                </span>
              </div>
              <h4 className="text-base font-black text-white mt-0.5">
                Hay restaurantes en Trinidad esperando recojo. Acepta el pedido para iniciar la ruta.
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all shrink-0"
          >
            <span>Ver Pedidos en Espera</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div
          onClick={() => setActiveTab('wallet')}
          className="p-4 rounded-2xl glass-panel border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all bg-slate-950/60"
        >
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex items-center justify-between">
            <span>Ganancias Hoy</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {todayEarningsVal.toFixed(2)} Bs
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">10 Bs por viaje • Ver Billetera ➔</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-slate-950/60">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Entregas Hoy
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {stats.todayDeliveries}
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">+{todayEarningsVal.toFixed(2)} Bs ganados</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-slate-950/60">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Total Entregas
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {stats.totalDeliveries}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Completadas con éxito</div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-slate-950/60">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Calificación
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-1">
            <span>{stats.rating}</span>
            <span className="text-sm font-normal text-slate-400">/ 5.0 ⭐</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Excelente servicio</div>
        </div>
      </div>

      {feedback && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'available'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Pedidos Disponibles ({availableOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'active'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Mi Entrega en Curso ({activeDeliveries.length})</span>
        </button>

        {/* PESTAÑA DE BILLETERA Y RESUMEN DEL DÍA */}
        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'wallet'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>💼 Billetera & Turno ({todayEarningsVal.toFixed(0)} Bs)</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Historial ({completedDeliveries.length})</span>
        </button>
      </div>

      {/* TAB 1: PEDIDOS DISPONIBLES (LISTOS PARA RECOGER) */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          {!isOnline ? (
            <div className="p-8 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-400">
              <Power className="w-8 h-8 mx-auto mb-2 text-rose-400" />
              <p className="font-bold text-white">Estás actualmente desconectado</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Activa tu estado &quot;En Servicio&quot; en la parte superior para recibir y tomar pedidos en tu moto.
              </p>
            </div>
          ) : availableOrders.length === 0 ? (
            <div className="p-8 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400/60" />
              <p className="font-bold text-white">No hay pedidos pendientes de repartidor</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Cuando una cocina termine de preparar y marcar listo un pedido, aparecerá aquí con sonido de alerta al instante.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableOrders.map((order) => {
                const isActing = actionLoading === order.id;
                const storeCoords = extractCoordinates(order.business?.space?.name || order.business?.address);

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-3xl glass-panel border-2 border-emerald-500/40 hover:border-emerald-500/80 transition-all space-y-4 shadow-xl bg-gradient-to-b from-slate-900/90 to-slate-900/60"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            ORD-#{order.id.slice(0, 6).toUpperCase()}
                          </span>
                          {order.batchCode && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              Lote Multi-Local
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-white text-base mt-1.5 flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-amber-400" />
                          <span>{order.business?.name}</span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {order.business?.space?.name || 'Patio Gastronómico'} • {order.business?.space?.location || 'Trinidad'}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tu Ganancia</div>
                        <div className="text-xl font-black text-emerald-400">+10.00 Bs</div>
                        <span className="text-[10px] text-slate-500">Tarifa fija moto</span>
                      </div>
                    </div>

                    {/* Delivery Destination */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2.5">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Destino de Entrega:</span>
                          <p className="font-black text-white text-xs mt-0.5">{order.deliveryAddress}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                        <span>Cliente: <strong className="text-slate-200">{order.customer?.name}</strong></span>
                        <span>{order.items?.length || 0} platos ({order.totalPrice.toFixed(2)} Bs)</span>
                      </div>

                      {order.notes && (
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] italic">
                          Nota cliente: &quot;{order.notes}&quot;
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMapOrder(order)}
                        className="py-3 px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        title="Ver ruta en mapa interactivo"
                      >
                        <Route className="w-4 h-4" />
                        <span>Ver Mapa</span>
                      </button>

                      {/* BOTÓN PRINCIPAL PARA EL REPARTIDOR: ACEPTAR PEDIDO PARA IR A RECOGER */}
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleAcceptOrder(order.id)}
                        className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 ring-2 ring-emerald-400/40"
                      >
                        <Bike className="w-4 h-4" />
                        <span>{isActing ? 'Asignando...' : '🏍️ Aceptar Pedido (+10.00 Bs)'}</span>
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
          {activeDeliveries.length === 0 ? (
            <div className="p-8 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-400">
              <Bike className="w-8 h-8 mx-auto mb-2 text-slate-500" />
              <p className="font-bold text-white">No tienes entregas activas en este momento</p>
              <p className="text-[11px] text-slate-500 mt-1 mb-4">
                Revisa la pestaña de pedidos disponibles para tomar una entrega.
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Ver Pedidos Disponibles
              </button>
            </div>
          ) : (
            activeDeliveries.map((order) => {
              const isActing = actionLoading === order.id;
              const isCash = order.payment?.method === 'CASH';
              const cleanPhone = (order.customerPhone || order.customer?.phone || '').replace(/\D/g, '');
              
              const customerCoords = extractCoordinates(order.deliveryAddress, -14.8348, -64.9042);
              const storeCoords = extractCoordinates(order.business?.space?.name || order.business?.address, -14.8315, -64.9012);

              const navigateToCustomerGpsUrl = getGoogleMapsNavigationUrl({
                lat: customerCoords.lat,
                lng: customerCoords.lng,
                address: order.deliveryAddress,
                name: order.customer?.name,
              });

              const navigateToStoreGpsUrl = getGoogleMapsNavigationUrl({
                lat: storeCoords.lat,
                lng: storeCoords.lng,
                name: order.business?.name,
              });

              const whatsAppUrl = getDriverWhatsAppMessageUrl({
                phone: cleanPhone,
                customerName: order.customer?.name,
                orderId: order.id,
                deliveryAddress: order.deliveryAddress,
              });

              return (
                <div
                  key={order.id}
                  className="p-6 rounded-3xl glass-panel border-2 border-emerald-500/50 space-y-5 shadow-2xl shadow-emerald-950/20 bg-slate-950"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                        <Bike className="w-3.5 h-3.5 animate-pulse" />
                        <span>Entrega en Curso • En Ruta</span>
                      </div>
                      <h3 className="text-lg font-black text-white">
                        Pedido ORD-#{order.id.slice(0, 6).toUpperCase()}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedMapOrder(order)}
                        className="py-2 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <Route className="w-4 h-4 text-emerald-400" />
                        <span>🗺️ Abrir Mapa Interactivo</span>
                      </button>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase">Tarifa Delivery</span>
                        <div className="text-xl font-black text-emerald-400">+10.00 Bs</div>
                      </div>
                    </div>
                  </div>

                  {/* 1. BOTÓN GIGANTE DIRECTO A GOOGLE MAPS GPS HABLADO */}
                  <div className="space-y-2">
                    <a
                      href={navigateToCustomerGpsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-sm sm:text-base font-black shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2.5 transition-all ring-2 ring-emerald-400/50 transform active:scale-98"
                    >
                      <Navigation className="w-5 h-5 animate-pulse text-slate-950 shrink-0" />
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
                        className="py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        <Store className="w-3.5 h-3.5 shrink-0" />
                        <span>GPS a Cocina</span>
                      </a>

                      <a
                        href={navigateToCustomerGpsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>GPS a Cliente</span>
                      </a>

                      {cleanPhone && (
                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {cleanPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>Llamar</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Cash collection alert if applicable */}
                  {isCash ? (
                    <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <strong className="block text-white">Cobro en Efectivo contra Entrega:</strong>
                          <span>Debes cobrar <strong className="text-amber-400 font-bold">{order.totalPrice.toFixed(2)} Bs</strong> en efectivo al cliente al entregar.</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 text-blue-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                      <div>
                        <strong className="block text-white">Pago Digital Previsto:</strong>
                        <span>El cliente ya pagó mediante QR/Tarjeta. <strong className="text-white font-bold">NO cobrar en efectivo</strong>.</span>
                      </div>
                    </div>
                  )}

                  {/* Two Step Route Details: Pickup -> Dropoff */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Step 1: Restaurant Pickup */}
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Store className="w-4 h-4" />
                        <span>1. Punto de Retiro (Cocina del Comercio)</span>
                      </div>
                      <div className="text-sm font-black text-white">{order.business?.name}</div>
                      <p className="text-slate-400 text-[11px]">
                        {order.business?.space?.name || 'Local'} • {order.business?.space?.location || 'Trinidad'}
                      </p>
                      <div className="pt-1">
                        <a
                          href={navigateToStoreGpsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-amber-400 hover:underline font-bold text-[11px]"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Abrir GPS al Local</span>
                        </a>
                      </div>
                    </div>

                    {/* Step 2: Customer Delivery */}
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>2. Destino de Entrega (Domicilio del Cliente)</span>
                      </div>
                      <div className="text-sm font-black text-white">{order.deliveryAddress}</div>
                      
                      {order.notes && (
                        <p className="text-amber-300 text-[11px] bg-amber-950/30 p-2 rounded-xl border border-amber-500/20 italic">
                          Nota: &quot;{order.notes}&quot;
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-slate-300 text-[11px] pt-1">
                        <span>Cliente: <strong>{order.customer?.name}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Items breakdown */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">Detalle de Platos a Entregar:</span>
                    <div className="space-y-1">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="text-slate-300 flex justify-between">
                          <span>• {item.quantity}x {item.product?.name || 'Plato'}</span>
                          <span className="font-semibold text-slate-400">{item.subtotal.toFixed(2)} Bs</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confirm delivery button */}
                  <button
                    type="button"
                    disabled={isActing}
                    onClick={() => setRatingModalOrder(order)}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>✓ Confirmar Entrega en Puerta del Cliente (Calificar)</span>
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
            <div className="p-8 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-500" />
              <p className="font-bold text-white">Aún no has completado entregas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedDeliveries.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">ORD-#{order.id.slice(0, 6).toUpperCase()}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          Entregado
                        </span>
                        {order.driverRating && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-300" />
                            <span>{order.driverRating}.0 ★</span>
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1">
                        {order.business?.name} ➔ {order.deliveryAddress}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-emerald-400 text-sm">+{Number(order.deliveryFee || 10).toFixed(2)} Bs</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {order.driverReview && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 italic flex items-start gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>&quot;{order.driverReview}&quot;</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Sección de Reseñas de Clientes si existen */}
          {stats.reviews && stats.reviews.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <h4 className="font-bold text-white text-sm">Reseñas y Felicitaciones de Clientes</h4>
                </div>
                <span className="text-xs font-bold text-amber-400">{stats.reviews.length} opiniones registradas</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {stats.reviews.map((rev: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{rev.customerName}</span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.review ? (
                      <p className="text-slate-300 italic text-[11px]">&quot;{rev.review}&quot;</p>
                    ) : (
                      <p className="text-slate-500 text-[11px]">Calificación con 5 estrellas en puerta</p>
                    )}
                    <span className="text-[10px] text-slate-500 block">
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
