'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Star,
  Clock,
  Award,
  BarChart2,
  RefreshCw,
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
  Flame,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  ArrowUpRight,
  Zap,
} from 'lucide-react';

interface StoreAnalyticsDashboardProps {
  businessId: string;
  businessName?: string;
}

const PERIOD_OPTIONS = [
  { label: 'Hoy', days: 1 },
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
];

const PAYMENT_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  QR_MANUAL: { label: 'QR Bancario', icon: <QrCode className="w-3 h-3" />, color: 'text-blue-400' },
  GATEWAY_ONLINE: { label: 'Tarjeta Online', icon: <CreditCard className="w-3 h-3" />, color: 'text-purple-400' },
  CASH: { label: 'Efectivo', icon: <Banknote className="w-3 h-3" />, color: 'text-emerald-400' },
};

export function StoreAnalyticsDashboard({ businessId, businessName }: StoreAnalyticsDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async (days: number, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/store/metrics?period=${days}`);
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics(period);
  }, [period]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <Loader2 className="w-7 h-7 animate-spin text-amber-400 mx-auto mb-3" />
        <p className="text-xs">Cargando tu resumen de ganancias...</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, today, bestDay, topProducts, dailySales, paymentMethods } = data;

  // Calcular máximo para el gráfico de barras
  const maxRevenue = Math.max(...dailySales.map((d: any) => d.revenue), 1);

  const formatCurrency = (n: number) =>
    n >= 1000
      ? `${(n / 1000).toFixed(1)}K Bs`
      : `${n.toFixed(2)} Bs`;

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header con selector de período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            Resumen de Ganancias
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Métricas de rendimiento de <span className="text-amber-300 font-semibold">{businessName || data.business?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setPeriod(opt.days)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  period === opt.days
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchMetrics(period, true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════
          KPI CARDS — FILA PRINCIPAL
      ═══════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Ingresos del período */}
        <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/20">
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-[10px] text-amber-400/70 font-semibold uppercase tracking-wider">
              {period === 1 ? 'Hoy' : `${period} días`}
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(summary.periodRevenue)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Ingresos del período</div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="font-semibold">{formatCurrency(summary.totalRevenueAllTime)}</span>
            <span className="text-slate-500">acumulado total</span>
          </div>
        </div>

        {/* Pedidos completados */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 w-fit">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white">{summary.completedOrders}</div>
          <div className="text-[11px] text-slate-400">Pedidos entregados</div>
          <div className="text-[10px] text-emerald-400 font-semibold">{summary.approvalRate}% tasa de éxito</div>
        </div>

        {/* Ticket promedio */}
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
          <div className="p-1.5 rounded-xl bg-blue-500/10 border border-blue-500/15 w-fit">
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-white">{summary.avgTicket.toFixed(0)} Bs</div>
          <div className="text-[11px] text-slate-400">Ticket promedio</div>
          <div className="text-[10px] text-blue-400 font-semibold">por pedido completado</div>
        </div>

        {/* HOY */}
        <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2">
          <div className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/15 w-fit">
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-black text-white">{formatCurrency(today.revenue)}</div>
          <div className="text-[11px] text-slate-400">Hoy</div>
          <div className="text-[10px] text-purple-400 font-semibold">{today.orders} pedidos entregados hoy</div>
        </div>
      </div>

      {/* ═══════════════════════════════════
          ESTADOS DE PEDIDOS
      ═══════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-lg font-black text-emerald-400">{summary.completedOrders}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Entregados</div>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-lg font-black text-amber-400">{summary.pendingOrders}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">En proceso</div>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
          <div className="text-lg font-black text-rose-400">{summary.cancelledOrders}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cancelados</div>
        </div>
      </div>

      {/* ═══════════════════════════════════
          GRÁFICO DE BARRAS — INGRESOS DIARIOS
      ═══════════════════════════════════ */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
            Ingresos por día
          </h4>
          {bestDay.revenue > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-300">
              <Star className="w-3 h-3 text-amber-400" />
              <span>Mejor día: <strong>{formatCurrency(bestDay.revenue)}</strong></span>
            </div>
          )}
        </div>

        <div className="flex items-end gap-1 h-28">
          {dailySales.map((day: any) => {
            const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
            const isToday = day.date === todayStr;
            const date = new Date(day.date + 'T12:00:00');
            const label = period <= 7
              ? date.toLocaleDateString('es-BO', { weekday: 'short' })
              : date.getDate().toString();

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1 group relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                  <div className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center whitespace-nowrap shadow-xl">
                    <div className="text-[10px] font-bold text-white">{formatCurrency(day.revenue)}</div>
                    <div className="text-[9px] text-slate-400">{day.orders} pedidos</div>
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-slate-700 rotate-45 -mt-0.5" />
                </div>

                {/* Barra */}
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isToday
                        ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                        : day.revenue > 0
                        ? 'bg-gradient-to-t from-slate-700 to-slate-600 group-hover:from-amber-700 group-hover:to-amber-500'
                        : 'bg-slate-900 border border-dashed border-slate-800'
                    }`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                </div>

                {/* Label día */}
                <div className={`text-[9px] font-bold truncate max-w-full ${
                  isToday ? 'text-amber-400' : 'text-slate-500'
                }`}>
                  {isToday ? 'Hoy' : label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════
          PRODUCTOS MÁS VENDIDOS + MÉTODOS DE PAGO
      ═══════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Productos */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Platos más vendidos
          </h4>

          {topProducts.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">
              <Package className="w-6 h-6 mx-auto mb-1 opacity-40" />
              Sin datos de ventas en este período
            </div>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p: any, i: number) => {
                const maxQty = topProducts[0]?.qty || 1;
                const pct = (p.qty / maxQty) * 100;
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium truncate max-w-[180px]">
                        <span>{medals[i] || `#${i + 1}`}</span>
                        <span className="truncate">{p.name}</span>
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-emerald-400 font-bold">{formatCurrency(p.revenue)}</span>
                        <span className="text-[10px] text-slate-500">{p.qty}x</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-600' : 'bg-slate-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Métodos de Pago + Resumen rápido */}
        <div className="space-y-3">
          {/* Métodos de pago */}
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              Métodos de pago usados
            </h4>
            {Object.keys(paymentMethods).length === 0 ? (
              <p className="text-[11px] text-slate-500">Sin pagos completados aún</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(paymentMethods).map(([method, count]: [string, any]) => {
                  const info = PAYMENT_LABELS[method] || { label: method, icon: <Banknote className="w-3 h-3" />, color: 'text-slate-400' };
                  const total = Object.values(paymentMethods).reduce((a: number, b: unknown) => a + Number(b), 0);
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={method} className="flex items-center gap-2 text-xs">
                      <span className={`${info.color}`}>{info.icon}</span>
                      <span className="text-slate-300 flex-1">{info.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-slate-400 w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Premio al mejor día */}
          {bestDay.revenue > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/20 shrink-0">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Mejor jornada registrada</div>
                <div className="text-lg font-black text-amber-400 leading-tight">{formatCurrency(bestDay.revenue)}</div>
                <div className="text-[10px] text-slate-400">
                  {new Date(bestDay.date + 'T12:00:00').toLocaleDateString('es-BO', {
                    weekday: 'long', day: 'numeric', month: 'short'
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Estado del negocio */}
          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            data.business?.isOpen
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${data.business?.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <div>
              <div className="text-xs font-bold text-white">
                {data.business?.isOpen ? '🟢 Comercio Abierto' : '⚫ Comercio Cerrado'}
              </div>
              <div className="text-[10px] text-slate-400">Estado actual en la plataforma</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════
          BANNER DE MOTIVACIÓN
      ═══════════════════════════════════ */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-center gap-4">
        <div className="text-4xl">🚀</div>
        <div>
          <h4 className="text-sm font-black text-white">¡Tu negocio crece en Pedidos Trinidad!</h4>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-lg">
            Con <strong className="text-amber-300">{summary.totalRevenueAllTime.toFixed(0)} Bs</strong> en ventas acumuladas y{' '}
            <strong className="text-amber-300">{summary.completedOrders}</strong> pedidos completados,
            tu presencia digital en Trinidad genera resultados reales. ¡Mantén tu menú actualizado y aumenta tus ventas!
          </p>
        </div>
      </div>
    </div>
  );
}
