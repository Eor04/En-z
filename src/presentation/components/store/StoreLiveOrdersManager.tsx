'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Bike,
  Phone,
  MapPin,
  RefreshCw,
  Sparkles,
  QrCode,
  CreditCard,
  Banknote,
  Check,
  X,
  Eye,
  ExternalLink,
  Volume2,
  VolumeX,
  Bell,
  Layers,
  Info,
  Navigation,
} from 'lucide-react';
import {
  playCommerceNewOrderAlert,
  playDriverAssignedToStoreAlert,
  playSuccessChimeAlert,
} from '@/presentation/utils/audioAlerts';
import { useRealtimeEvents } from '@/presentation/hooks/useRealtimeEvents';
import { usePushNotifications } from '@/presentation/hooks/usePushNotifications';

interface StoreLiveOrdersManagerProps {
  businessId: string;
  onOrderUpdated?: () => void;
}

export function StoreLiveOrdersManager({ businessId, onOrderUpdated }: StoreLiveOrdersManagerProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'cooking' | 'ready' | 'history'>('pending');
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Sin stock disponible de los ingredientes');

  const prevPendingCount = useRef(0);
  const prevOrderStatusMap = useRef<Map<string, string>>(new Map());
  const isFirstLoad = useRef(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders?businessId=${businessId}`);
      const data = await res.json();
      if (res.ok && data.orders) {
        const pending = data.orders.filter((o: any) => o.status === 'esperando_pago');

        if (!isFirstLoad.current && soundEnabled) {
          // 1. 🔔 Alerta si entran nuevos pedidos pendientes
          if (pending.length > prevPendingCount.current) {
            playCommerceNewOrderAlert();
          }

          // 2. 🛵 Alerta si un repartidor aceptó la orden y va hacia el local
          data.orders.forEach((order: any) => {
            const previousStatus = prevOrderStatusMap.current.get(order.id);
            if (previousStatus === 'buscando_driver' && order.status === 'en_camino') {
              playDriverAssignedToStoreAlert();
              setFeedback({
                type: 'success',
                message: `🛵 ¡Repartidor ${order.driver?.name || 'en moto'} aceptó el pedido #${order.id.slice(0, 6).toUpperCase()} y va en camino a tu local a recogerlo!`,
              });
            }
          });
        }

        // Actualizar memoria previa
        prevPendingCount.current = pending.length;
        const newMap = new Map<string, string>();
        data.orders.forEach((o: any) => newMap.set(o.id, o.status));
        prevOrderStatusMap.current = newMap;
        isFirstLoad.current = false;

        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Error al cargar órdenes de la tienda:', err);
    } finally {
      setLoading(false);
    }
  };

  // Suscripción en tiempo real vía Server-Sent Events (SSE)
  const { connectionStatus, reconnect } = useRealtimeEvents({
    channels: businessId ? [`store:${businessId}`] : [],
    enabled: Boolean(businessId),
    enableAudioAlerts: soundEnabled,
    onOrderCreated: (data) => {
      fetchOrders();
      setFeedback({
        type: 'success',
        message: '🔔 ¡Nueva comanda recibida en tiempo real! Revisa la pestaña de pendientes.',
      });
    },
    onOrderPaid: (data) => {
      fetchOrders();
      setFeedback({
        type: 'success',
        message: '💳 ¡Pago aprobado y verificado! La comanda avanzó a preparación.',
      });
    },
    onOrderDriverAssigned: (data) => {
      fetchOrders();
      setFeedback({
        type: 'success',
        message: `🛵 ¡Repartidor ${data.driverName || 'en moto'} aceptó el pedido #${data.orderId?.slice(0, 6).toUpperCase()} y va hacia tu local!`,
      });
    },
    onOrderStatusUpdated: () => {
      fetchOrders();
    },
    onOrderDelivered: (data) => {
      fetchOrders();
      setFeedback({
        type: 'success',
        message: `✅ ¡Pedido #${data.orderId?.slice(0, 6).toUpperCase()} fue entregado al cliente con éxito!`,
      });
    },
  });

  // Notificaciones Push Web para cocina (alertas con pantalla bloqueada o app en segundo plano)
  const {
    isSubscribed: pushSubscribed,
    permission: pushPermission,
    loading: pushLoading,
    subscribe: subscribePush,
    sendTestPush,
  } = usePushNotifications({
    channel: businessId ? `store:${businessId}` : undefined,
    role: 'BUSINESS_OWNER',
  });

  useEffect(() => {
    if (businessId) {
      fetchOrders();
      // Fallback ligero cada 25s
      const interval = setInterval(fetchOrders, 25000);
      return () => clearInterval(interval);
    }
  }, [businessId]);

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string, notesAppend?: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          notesAppend: notesAppend,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (nextStatus === 'en_preparacion') {
          setFeedback({
            type: 'success',
            message: '✓ Pedido ACEPTADO y enviado a Cocina. Se notificó al cliente.',
          });
          setActiveSubTab('cooking');
        } else if (nextStatus === 'buscando_driver') {
          setFeedback({
            type: 'success',
            message: '✓ Platos marcados como LISTOS. Pedido habilitado para repartidores en moto.',
          });
          setActiveSubTab('ready');
        } else if (nextStatus === 'cancelado') {
          setFeedback({
            type: 'error',
            message: `✗ Pedido RECHAZADO: "${notesAppend || 'Sin stock disponible'}".`,
          });
          setRejectingOrder(null);
        }

        await fetchOrders();
        if (onOrderUpdated) onOrderUpdated();
      } else {
        setFeedback({
          type: 'error',
          message: `Error: ${data.error || 'No se pudo actualizar el estado del pedido'}`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Error de red: ${err.message}`,
      });
    } finally {
      setProcessingId(null);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'esperando_pago');
  const cookingOrders = orders.filter((o) => o.status === 'en_preparacion');
  const readyAndEnRouteOrders = orders.filter(
    (o) => o.status === 'buscando_driver' || o.status === 'en_camino'
  );
  const completedOrders = orders.filter(
    (o) => o.status === 'entregado' || o.status === 'cancelado'
  );

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl ${
            feedback.type === 'success'
              ? 'bg-violet-950/90 border-violet-500 text-violet-300 shadow-violet-500/20'
              : 'bg-violet-950/90 border-ember text-ember-soft shadow-ember/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-ember shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-surface-raised/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 🚨 NOTIFICACIÓN / ALERTA DE NUEVO PEDIDO ENTRANTE */}
      {pendingOrders.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-warn/25 via-ember/20 to-warn/25 border-2 border-warn/80 shadow-2xl shadow-warn/20 animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-12 h-12 rounded-2xl bg-warn text-void flex items-center justify-center font-black shadow-lg shadow-warn/40 shrink-0">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-warn text-void text-[10px] font-black uppercase tracking-wider">
                  ¡Atención Urgente!
                </span>
                <span className="text-xs text-warn-soft font-semibold">
                  {pendingOrders.length} pedido{pendingOrders.length > 1 ? 's' : ''} nuevo{pendingOrders.length > 1 ? 's' : ''} esperando validación
                </span>
              </div>
              <h4 className="text-base font-black text-white mt-0.5">
                Valida stock de productos y acepta o rechaza las comandas entrantes.
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveSubTab('pending')}
            className="px-5 py-2.5 rounded-xl bg-warn hover:bg-warn text-void text-xs font-black shadow-lg shadow-warn/30 flex items-center gap-2 transition-all shrink-0"
          >
            <span>Ver {pendingOrders.length} Comanda(s) Pendiente(s)</span>
            <ChefHat className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Status Bar & Sound Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-void-700/80 border border-surface-line">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warn/20 text-warn flex items-center justify-center">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Control de Comandas & Cocina en Vivo</h3>
            <p className="text-xs text-ink-mute">
              Valida existencias en local, autoriza preparación y despacha a repartidores en Trinidad.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Toggle de Sonido */}
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playCommerceNewOrderAlert();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              soundEnabled
                ? 'bg-warn/20 text-warn-soft border-warn/40 hover:bg-warn/30'
                : 'bg-surface-raised text-ink-mute border-surface-line hover:text-white'
            }`}
            title="Activar/Desactivar alerta sonora para nuevos pedidos"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Timbre Comandas: {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Push Notifications para Cocina en Pantalla Bloqueada */}
          {!pushSubscribed && pushPermission !== 'granted' ? (
            <button
              type="button"
              onClick={() => subscribePush()}
              disabled={pushLoading}
              className="px-3 py-2 rounded-xl bg-warn/10 hover:bg-warn/20 text-warn-soft border border-warn/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Recibir alertas de comandas aunque la pantalla del celular esté apagada"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{pushLoading ? 'Activando...' : '🔔 Alertas Push Cocina'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => sendTestPush(`store:${businessId}`)}
              className="px-2.5 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
              title="Notificaciones Push activas para este local. Toca para probar vibración."
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Push ON 📳</span>
            </button>
          )}

          {soundEnabled && (
            <button
              type="button"
              onClick={() => playCommerceNewOrderAlert()}
              className="px-2.5 py-2 rounded-xl bg-warn/10 hover:bg-warn/20 text-warn-soft border border-warn/20 text-[11px] font-semibold flex items-center gap-1 transition-all"
              title="Probar sonido del timbre de comandas"
            >
              <Bell className="w-3 h-3 text-warn" />
              <span>Probar</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-surface-raised hover:bg-surface-high text-xs font-semibold text-ink-soft hover:text-white flex items-center gap-2 transition-all shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs for Kitchen Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeSubTab === 'pending'
              ? 'bg-warn/25 border-warn shadow-lg shadow-warn/15 ring-2 ring-warn/40'
              : 'bg-void-700/40 border-surface-line hover:border-surface-line'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-warn">
              1. Por Validar / Aceptar
            </span>
            <span
              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                pendingOrders.length > 0
                  ? 'bg-warn text-void animate-bounce'
                  : 'bg-surface-raised text-ink-mute'
              }`}
            >
              {pendingOrders.length}
            </span>
          </div>
          <p className="text-xs text-ink-soft font-semibold">Validar Stock & Pago</p>
        </button>

        <button
          onClick={() => setActiveSubTab('cooking')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeSubTab === 'cooking'
              ? 'bg-info/25 border-info shadow-lg shadow-info/15 ring-2 ring-info/40'
              : 'bg-void-700/40 border-surface-line hover:border-surface-line'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-info">
              2. En Cocina
            </span>
            <span className="w-6 h-6 rounded-full bg-info/20 text-info-soft text-xs font-bold flex items-center justify-center">
              {cookingOrders.length}
            </span>
          </div>
          <p className="text-xs text-ink-soft font-semibold">Preparando Platos</p>
        </button>

        <button
          onClick={() => setActiveSubTab('ready')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeSubTab === 'ready'
              ? 'bg-arc/25 border-arc shadow-lg shadow-arc/15 ring-2 ring-arc/40'
              : 'bg-void-700/40 border-surface-line hover:border-surface-line'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-arc">
              3. Listos / Delivery
            </span>
            <span className="w-6 h-6 rounded-full bg-arc/20 text-arc-soft text-xs font-bold flex items-center justify-center">
              {readyAndEnRouteOrders.length}
            </span>
          </div>
          <p className="text-xs text-ink-soft font-semibold">Despacho en Moto</p>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeSubTab === 'history'
              ? 'bg-violet-500/25 border-violet-500 shadow-lg shadow-violet-500/15 ring-2 ring-violet-500/40'
              : 'bg-void-700/40 border-surface-line hover:border-surface-line'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
              4. Entregados
            </span>
            <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold flex items-center justify-center">
              {completedOrders.length}
            </span>
          </div>
          <p className="text-xs text-ink-soft font-semibold">Historial del Turno</p>
        </button>
      </div>

      {/* STAGE 1: PENDING ORDERS - PANEL DE NOTIFICACIÓN Y DECISIÓN DE PEDIDOS */}
      {activeSubTab === 'pending' && (
        <div className="space-y-4">
          {pendingOrders.length === 0 ? (
            <div className="rune-panel rounded-3xl p-12 text-center border border-surface-line">
              <CheckCircle2 className="w-10 h-10 text-violet-400 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-white">¡No hay pedidos pendientes de confirmación!</h4>
              <p className="text-xs text-ink-mute mt-1 max-w-md mx-auto">
                Tu local está al día. Cuando un cliente realice un pedido desde Trinidad, sonará la alerta y aparecerá la comanda aquí para que verifiques el stock.
              </p>
            </div>
          ) : (
            pendingOrders.map((order) => (
              <div
                key={order.id}
                className="rune-panel rounded-3xl p-6 border-2 border-warn/50 hover:border-warn/80 shadow-2xl transition-all space-y-5 bg-gradient-to-b from-void-700/90 to-void-700/60"
              >
                {/* Header Comanda */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-line">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-warn/20 text-warn-soft border border-warn/40 font-mono">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    {order.batchCode && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-arc/20 text-arc-soft border border-arc/40 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-arc" />
                        <span>Lote Multi-Local</span>
                      </span>
                    )}
                    <span className="text-xs text-ink-soft font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-warn" />
                      <span>Recibido hace un momento ({new Date(order.createdAt).toLocaleTimeString()})</span>
                    </span>
                  </div>

                  {/* Método de pago badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-mute">Pago:</span>
                    {order.payment?.method === 'QR' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-info/20 text-info-soft border border-info/40">
                        <QrCode className="w-3.5 h-3.5 text-info" />
                        <span>QR Bancario</span>
                        {order.payment?.status === 'APPROVED' ? (
                          <span className="text-[10px] text-violet-400 font-extrabold ml-1 bg-violet-500/20 px-1.5 py-0.5 rounded">PAGADO ✓</span>
                        ) : order.payment?.receiptUrl ? (
                          <span className="text-[10px] text-warn-soft font-extrabold ml-1 bg-warn/20 px-1.5 py-0.5 rounded">COMPROBANTE ADJUNTO</span>
                        ) : (
                          <span className="text-[10px] text-ember-soft font-extrabold ml-1 bg-ember/20 px-1.5 py-0.5 rounded">PENDIENTE DE PAGO</span>
                        )}
                      </span>
                    ) : order.payment?.method === 'CARD' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-arc/20 text-arc-soft border border-arc/40">
                        <CreditCard className="w-3.5 h-3.5 text-arc" />
                        <span>Tarjeta Online</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                        <Banknote className="w-3.5 h-3.5 text-violet-400" />
                        <span>Efectivo contra Entrega</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Items & Stock verification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <h5 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-warn" />
                        <span>1. Verificar Disponibilidad de Platos ({order.items?.length})</span>
                      </span>
                      <span className="text-[10px] text-ink-mute font-normal">Revisar stock en cocina</span>
                    </h5>
                    
                    <div className="space-y-2">
                      {order.items?.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-void-700/90 border border-surface-line flex items-center justify-between"
                        >
                          <div>
                            <div className="font-extrabold text-white text-sm">
                              {item.quantity}x {item.product?.name}
                            </div>
                            <div className="text-[11px] text-ink-mute mt-0.5 flex items-center gap-2">
                              <span>Precio unit: {item.unitPrice.toFixed(2)} Bs</span>
                              <span className="text-violet-400 font-semibold">• En catálogo: Disponible ✓</span>
                            </div>
                          </div>
                          <span className="font-black text-violet-400 text-sm">{item.subtotal.toFixed(2)} Bs</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-violet-400" />
                      <span>2. Datos del Cliente & Destino</span>
                    </h5>
                    
                    <div className="p-3.5 rounded-2xl bg-void-700/70 border border-surface-line space-y-2">
                      <div className="text-ink">
                        <strong className="text-white text-sm">{order.customer?.name}</strong> •{' '}
                        <a href={`tel:${order.customerPhone}`} className="text-violet-400 hover:underline font-bold">
                          {order.customerPhone}
                        </a>
                      </div>
                      <div className="text-ink-soft flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <strong className="text-ink-mute">Entrega:</strong> {order.deliveryAddress}
                        </div>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(
                            order.deliveryAddress.replace(/📍 Ubicación GPS:\s*/i, '')
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-violet-400 hover:underline font-bold text-[10px] bg-violet-500/10 px-2 py-0.5 rounded-lg border border-violet-500/20"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Ver en Maps</span>
                        </a>
                      </div>
                      {order.notes && (
                        <div className="text-warn-soft/90 bg-warn/10 p-2 rounded-xl border border-warn/20 text-[11px]">
                          <strong>Instrucciones del cliente:</strong> &quot;{order.notes}&quot;
                        </div>
                      )}
                    </div>

                    {/* Comprobante QR si existe */}
                    {order.payment?.receiptUrl && (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-violet-950/50 border border-info/40">
                        <div className="flex items-center gap-2 text-info-soft">
                          <QrCode className="w-4 h-4 text-info shrink-0" />
                          <span className="text-[11px] font-bold">
                            Comprobante QR ({order.payment.paymentReference || 'Transferencia'})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptUrl(order.payment.receiptUrl)}
                          className="px-3 py-1.5 rounded-xl bg-info-deep hover:bg-info text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-info-deep/20"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Imagen</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTONES PRINCIPALES DE DECISIÓN: ACEPTAR O RECHAZAR */}
                <div className="pt-4 border-t border-surface-line flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-ink-soft text-xs text-center sm:text-left">
                    <span>Monto Total a Cobrar: </span>
                    <span className="text-violet-400 text-lg font-black">{order.totalPrice.toFixed(2)} Bs</span>
                    <span className="text-[11px] text-ink-faint ml-1">(Incluye 10.00 Bs delivery)</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Botón Rechazar */}
                    <button
                      type="button"
                      onClick={() => setRejectingOrder(order)}
                      disabled={processingId === order.id}
                      className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-ember/15 hover:bg-ember/25 border border-ember/40 text-ember-soft hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <X className="w-4 h-4 text-ember" />
                      <span>Rechazar Pedido</span>
                    </button>

                    {/* Botón Aceptar e Iniciar Cocina */}
                    <button
                      type="button"
                      onClick={() => handleUpdateOrderStatus(order.id, 'en_preparacion')}
                      disabled={processingId === order.id}
                      className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-arc hover:from-violet-400 hover:to-arc text-white text-xs font-black shadow-lg shadow-violet-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ring-2 ring-violet-400/40"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>{processingId === order.id ? 'Aceptando...' : '✓ Aceptar Pedido e Iniciar Cocina'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* STAGE 2: COOKING IN KITCHEN */}
      {activeSubTab === 'cooking' && (
        <div className="space-y-4">
          {cookingOrders.length === 0 ? (
            <div className="rune-panel rounded-3xl p-12 text-center border border-surface-line">
              <ChefHat className="w-10 h-10 text-info mx-auto mb-3" />
              <h4 className="text-sm font-bold text-white">No hay comandas en cocción en este momento.</h4>
              <p className="text-xs text-ink-mute mt-1">
                Cuando aceptes pedidos pendientes, pasarán a esta sección para control de cocina.
              </p>
            </div>
          ) : (
            cookingOrders.map((order) => (
              <div
                key={order.id}
                className="rune-panel rounded-3xl p-6 border border-info/40 shadow-xl transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-line">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-info/20 text-info-soft border border-info/40 font-mono">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs text-info-soft font-bold flex items-center gap-1.5 animate-pulse">
                      <ChefHat className="w-4 h-4 text-info" />
                      <span>Cocinando en este momento...</span>
                    </span>
                  </div>

                  <div className="text-xs text-ink-mute">
                    Cliente: <strong className="text-white">{order.customer?.name}</strong> •{' '}
                    <span className="text-violet-400 font-bold">{order.customerPhone}</span>
                  </div>
                </div>

                {/* Items to prepare */}
                <div>
                  <h5 className="font-bold text-white text-xs mb-2">Comanda de Platos a Preparar:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {order.items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-void-700/90 border border-surface-line flex items-center justify-between text-xs"
                      >
                        <span className="font-extrabold text-white text-sm">
                          {item.quantity}x {item.product?.name}
                        </span>
                        <span className="text-ink-mute">{item.subtotal.toFixed(2)} Bs</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mark as ready button */}
                <div className="pt-3 border-t border-surface-line flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-ink-mute text-center sm:text-left">
                    Al terminar la cocción, marca como listo para que aparezca a los repartidores en moto en Trinidad.
                  </span>

                  <button
                    type="button"
                    onClick={() => handleUpdateOrderStatus(order.id, 'buscando_driver')}
                    disabled={processingId === order.id}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-warn to-warn-deep hover:from-warn hover:to-warn text-void text-xs font-black shadow-lg shadow-warn/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Bike className="w-4 h-4" />
                    <span>{processingId === order.id ? 'Notificando...' : '✓ Platos Listos (Buscar Repartidor en Moto) →'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* STAGE 3: READY / SEARCHING DRIVER / EN ROUTE */}
      {activeSubTab === 'ready' && (
        <div className="space-y-4">
          {readyAndEnRouteOrders.length === 0 ? (
            <div className="rune-panel rounded-3xl p-12 text-center border border-surface-line">
              <Bike className="w-10 h-10 text-arc mx-auto mb-3" />
              <h4 className="text-sm font-bold text-white">No hay pedidos en despacho delivery en este momento.</h4>
            </div>
          ) : (
            readyAndEnRouteOrders.map((order) => (
              <div
                key={order.id}
                className="rune-panel rounded-3xl p-6 border border-arc/40 shadow-xl transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-line">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-arc/20 text-arc-soft border border-arc/40 font-mono">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-arc-soft flex items-center gap-1.5">
                      <Bike className="w-4 h-4 text-arc" />
                      {order.status === 'buscando_driver'
                        ? 'Esperando que un repartidor tome el pedido...'
                        : 'Repartidor en camino a la casa del cliente'}
                    </span>
                  </div>

                  <span className="text-sm font-black text-violet-400">{order.totalPrice.toFixed(2)} Bs</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-ink-mute block mb-1">Destino de Entrega:</span>
                    <span className="font-semibold text-white">{order.deliveryAddress}</span>
                  </div>

                  <div>
                    <span className="text-ink-mute block mb-1">Repartidor Asignado:</span>
                    {order.driver ? (
                      <span className="font-bold text-violet-400 flex items-center gap-1.5">
                        <Bike className="w-4 h-4" />
                        {order.driver.name} ({order.driver.driverCode}) • Tel: {order.driver.phone || 'N/A'}
                      </span>
                    ) : (
                      <span className="text-warn font-semibold animate-pulse">
                        Esperando asignación de moto en Trinidad...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* STAGE 4: HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-3">
          {completedOrders.length === 0 ? (
            <div className="rune-panel rounded-3xl p-12 text-center border border-surface-line">
              <p className="text-xs text-ink-mute">Aún no hay órdenes finalizadas en el historial.</p>
            </div>
          ) : (
            completedOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-void-700/60 border border-surface-line flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">
                    #{order.id.slice(0, 8).toUpperCase()} • {order.customer?.name}
                  </div>
                  <div className="text-ink-mute text-[11px] mt-0.5">
                    {order.items?.length} platos • {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-violet-400 text-sm">{order.totalPrice.toFixed(2)} Bs</div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      order.status === 'entregado'
                        ? 'bg-violet-500/20 text-violet-300'
                        : 'bg-ember/20 text-ember-soft'
                    }`}
                  >
                    {order.status === 'entregado' ? 'Entregado ✓' : 'Cancelado ✗'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL PARA RECHAZAR PEDIDO */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-void/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rune-panel max-w-md w-full rounded-3xl p-6 border border-ember/40 shadow-2xl space-y-4 bg-void">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-ember font-black text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Rechazar Pedido #{rejectingOrder.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="p-1 rounded-lg text-ink-mute hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-ink-soft">
              Selecciona el motivo por el cual no puedes preparar este pedido para notificar al cliente:
            </p>

            <div className="space-y-2 text-xs">
              {[
                'Sin stock disponible de los ingredientes',
                'Local saturado con alta demanda en cocina',
                'Comprobante QR no recibido o no coincide el monto',
                'Fuera del horario de atención del restaurante',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    rejectionReason === reason
                      ? 'bg-ember/20 border-ember/60 text-white'
                      : 'bg-void-700 border-surface-line text-ink-mute hover:border-surface-line'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={rejectionReason === reason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="accent-ember"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-void-700 hover:bg-surface-raised text-ink-soft font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleUpdateOrderStatus(rejectingOrder.id, 'cancelado', rejectionReason)}
                disabled={processingId === rejectingOrder.id}
                className="flex-1 py-2.5 rounded-xl bg-ember-deep hover:bg-ember text-white font-black text-xs shadow-lg shadow-ember-deep/30"
              >
                {processingId === rejectingOrder.id ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver comprobante QR */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-void/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rune-panel max-w-lg w-full rounded-3xl p-6 border border-surface-line shadow-2xl space-y-4 bg-void">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm">Comprobante de Transferencia QR</h4>
              <button
                type="button"
                onClick={() => setSelectedReceiptUrl(null)}
                className="p-1 rounded-lg text-ink-mute hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-surface-line max-h-96 flex items-center justify-center bg-void-700">
              <img
                src={selectedReceiptUrl}
                alt="Comprobante QR"
                className="max-h-96 w-auto object-contain"
              />
            </div>

            <button
              type="button"
              onClick={() => setSelectedReceiptUrl(null)}
              className="w-full py-2.5 rounded-xl bg-surface-raised hover:bg-surface-high text-white font-bold text-xs"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
