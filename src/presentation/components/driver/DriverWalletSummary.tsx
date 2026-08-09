'use client';

import React, { useState } from 'react';
import {
  Wallet,
  Banknote,
  QrCode,
  TrendingUp,
  Share2,
  Copy,
  CheckCircle2,
  Calendar,
  Bike,
  Store,
  MapPin,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface DriverWalletSummaryProps {
  wallet?: {
    today?: {
      deliveries: number;
      totalEarnings: number;
      cashEarnings: number;
      qrEarnings: number;
      cashOrdersCount?: number;
      qrOrdersCount?: number;
      cashCollectedTotal?: number;
      qrPaidTotal?: number;
    };
    yesterday?: {
      deliveries: number;
      totalEarnings: number;
      cashEarnings: number;
      qrEarnings: number;
    };
    week?: {
      deliveries: number;
      totalEarnings: number;
      cashEarnings: number;
      qrEarnings: number;
    };
    allTime?: {
      deliveries: number;
      totalEarnings: number;
      cashEarnings: number;
      qrEarnings: number;
    };
  };
  completedDeliveries: any[];
  driverName?: string;
  driverCode?: string;
}

type Period = 'today' | 'yesterday' | 'week' | 'allTime';

export function DriverWalletSummary({
  wallet,
  completedDeliveries = [],
  driverName = 'Carlos Repartidor Flash',
  driverCode = 'DRV-777',
}: DriverWalletSummaryProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
  const [copied, setCopied] = useState(false);

  // Fallbacks seguros de métricas
  const todayData = wallet?.today || {
    deliveries: 0,
    totalEarnings: 0,
    cashEarnings: 0,
    qrEarnings: 0,
    cashOrdersCount: 0,
    qrOrdersCount: 0,
    cashCollectedTotal: 0,
    qrPaidTotal: 0,
  };

  const currentStats =
    selectedPeriod === 'today'
      ? todayData
      : selectedPeriod === 'yesterday'
      ? wallet?.yesterday || { deliveries: 0, totalEarnings: 0, cashEarnings: 0, qrEarnings: 0 }
      : selectedPeriod === 'week'
      ? wallet?.week || { deliveries: 0, totalEarnings: 0, cashEarnings: 0, qrEarnings: 0 }
      : wallet?.allTime || { deliveries: 0, totalEarnings: 0, cashEarnings: 0, qrEarnings: 0 };

  // Filtrar pedidos según el período seleccionado para la lista
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 7 * 86400000;

  const filteredOrders = completedDeliveries.filter((order) => {
    const time = new Date(order.updatedAt).getTime();
    if (selectedPeriod === 'today') return time >= todayStart;
    if (selectedPeriod === 'yesterday') return time >= yesterdayStart && time < todayStart;
    if (selectedPeriod === 'week') return time >= weekStart;
    return true; // allTime
  });

  // Generar reporte de cierre de turno
  const generateShiftReport = () => {
    const dateStr = new Date().toLocaleDateString('es-BO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const deliveries = todayData.deliveries;
    const totalEarned = todayData.totalEarnings.toFixed(2);
    const cashEarned = todayData.cashEarnings.toFixed(2);
    const qrEarned = todayData.qrEarnings.toFixed(2);
    const cashCollected = (todayData.cashCollectedTotal || 0).toFixed(2);

    return `🏍️ *CIERRE DE TURNO - REPARTIDOR EN MOTO*
👤 *Repartidor:* ${driverName} (${driverCode})
📅 *Fecha:* ${dateStr}
📍 *Zona:* Trinidad, Beni

━━━━━━━━━━━━━━━━━━━━
📊 *RESUMEN DE ENTREGAS:*
• Entregas completadas: *${deliveries} viajes*
• 💰 *Total ganado (Comisiones):* *${totalEarned} Bs*
• 💵 *En Efectivo:* *${cashEarned} Bs* (${todayData.cashOrdersCount || 0} viajes)
• 📱 *En QR / Digital:* *${qrEarned} Bs* (${todayData.qrOrdersCount || 0} viajes)

━━━━━━━━━━━━━━━━━━━━
💵 *MOVIMIENTO DE CAJA EFECTIVO:*
• Total cobrado a clientes: *${cashCollected} Bs*
• Tu comisión delivery retenida: *${cashEarned} Bs*
• Saldo digital a cobrar por QR: *${qrEarned} Bs*

✅ *Pedidos Trinidad - Delivery Modular Gastronómico*`;
  };

  const handleCopyReport = () => {
    const text = generateShiftReport();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsAppReport = () => {
    const text = generateShiftReport();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. HERO BANNER PRINCIPAL DE BILLETERA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border-2 border-emerald-500/40 p-6 sm:p-8 shadow-2xl shadow-emerald-950/40">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <Wallet className="w-3.5 h-3.5" />
              <span>Billetera del Repartidor • Turno en Vivo</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Resumen de Ganancias del Día
            </h2>

            {/* FRASE DE RESUMEN DEL DÍA DESTACADA */}
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              🛵 Hoy hiciste <strong className="text-emerald-400 font-black">{todayData.deliveries} entregas</strong> •{' '}
              Total ganado:{' '}
              <strong className="text-emerald-300 font-black">{todayData.totalEarnings.toFixed(2)} Bs</strong> •{' '}
              En efectivo:{' '}
              <strong className="text-amber-300 font-black">{todayData.cashEarnings.toFixed(2)} Bs</strong> •{' '}
              En QR: <strong className="text-sky-300 font-black">{todayData.qrEarnings.toFixed(2)} Bs</strong>
            </p>
          </div>

          {/* Botones de Cierre de Turno */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSendWhatsAppReport}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all ring-2 ring-emerald-400/40"
            >
              <Share2 className="w-4 h-4" />
              <span>📲 Enviar Cierre a la Central</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReport}
              className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copiar Resumen de Turno</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. SELECTOR DE PERÍODO */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSelectedPeriod('today')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            selectedPeriod === 'today'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Hoy (Turno Actual)</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedPeriod('yesterday')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            selectedPeriod === 'yesterday'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Ayer</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedPeriod('week')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            selectedPeriod === 'week'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Últimos 7 Días</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedPeriod('allTime')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            selectedPeriod === 'allTime'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Historial Completo</span>
        </button>
      </div>

      {/* 3. TARJETAS DE DESGLOSE FINANCIERO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ganado */}
        <div className="p-5 rounded-3xl bg-slate-950 border border-emerald-500/30 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span className="uppercase tracking-wider">Total Ganado</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {currentStats.totalEarnings.toFixed(2)} <span className="text-lg">Bs</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {currentStats.deliveries} entrega{currentStats.deliveries === 1 ? '' : 's'} completada{currentStats.deliveries === 1 ? '' : 's'}
          </p>
        </div>

        {/* Ganado en Efectivo */}
        <div className="p-5 rounded-3xl bg-slate-950 border border-amber-500/30 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span className="uppercase tracking-wider">En Efectivo (Mano)</span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-300">
            {currentStats.cashEarnings.toFixed(2)} <span className="text-lg">Bs</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Comisiones retenidas en efectivo físico
          </p>
        </div>

        {/* Ganado en QR */}
        <div className="p-5 rounded-3xl bg-slate-950 border border-sky-500/30 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span className="uppercase tracking-wider">En QR / Pasarela</span>
            <div className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-sky-300">
            {currentStats.qrEarnings.toFixed(2)} <span className="text-lg">Bs</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Acreditado en billetera digital
          </p>
        </div>

        {/* Promedio por carrera */}
        <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span className="uppercase tracking-wider">Tarifa Fija Moto</span>
            <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            10.00 <span className="text-lg">Bs</span>
          </div>
          <p className="text-[11px] text-emerald-400 font-semibold">
            100% de la tarifa para el repartidor
          </p>
        </div>
      </div>

      {/* 4. CONTROL DE CAJA Y LIQUIDACIÓN (SI ES HOY) */}
      {selectedPeriod === 'today' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="font-bold text-white text-sm">
                Control de Caja y Rendición de Cuentas (Turno en Trinidad)
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">{driverCode}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Efectivo Recaudado de Clientes
              </span>
              <div className="text-xl font-black text-white">
                {(todayData.cashCollectedTotal || 0).toFixed(2)} Bs
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Dinero total recibido físicamente
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-amber-400 uppercase font-bold block mb-1">
                Comisión Ganada por Viajes
              </span>
              <div className="text-xl font-black text-amber-300">
                {todayData.cashEarnings.toFixed(2)} Bs
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Tu ganancia directa en mano
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-sky-400 uppercase font-bold block mb-1">
                Saldo Digital a Liquidar
              </span>
              <div className="text-xl font-black text-sky-300">
                {todayData.qrEarnings.toFixed(2)} Bs
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Por transferir a tu cuenta bancaria
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. LISTA DETALLADA DE VIAJES CON MÉTODO DE PAGO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Detalle de Viajes ({filteredOrders.length})</span>
          </h4>
          <span className="text-xs text-slate-500 font-mono">
            {selectedPeriod === 'today' ? 'Hoy' : selectedPeriod}
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-400">
            <Bike className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="font-bold text-white">No hay entregas registradas en este período</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isCash = order.payment?.method === 'CASH';
            return (
              <div
                key={order.id}
                className="p-4 rounded-2xl glass-panel border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition-all bg-slate-950/60"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white font-mono">
                      ORD-#{order.id.slice(0, 6).toUpperCase()}
                    </span>

                    {/* BADGE DE MÉTODO DE PAGO */}
                    {isCash ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Banknote className="w-3 h-3" />
                        <span>EFECTIVO (Cobrado en mano)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                        <QrCode className="w-3 h-3" />
                        <span>PAGO QR / DIGITAL</span>
                      </span>
                    )}

                    <span className="text-slate-500 text-[11px]">
                      {new Date(order.updatedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="text-slate-300 text-[11px] flex items-center gap-1.5 flex-wrap">
                    <Store className="w-3 h-3 text-amber-400 shrink-0" />
                    <strong>{order.business?.name}</strong>
                    <span className="text-slate-500">➔</span>
                    <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{order.deliveryAddress}</span>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col items-end justify-between shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Tu Ganancia
                    </div>
                    <div className="text-base font-black text-emerald-400">
                      +{Number(order.deliveryFee || 10).toFixed(2)} Bs
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Total pedido: {Number(order.totalPrice || 0).toFixed(2)} Bs
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
