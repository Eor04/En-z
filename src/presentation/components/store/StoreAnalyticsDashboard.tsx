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
  QR_MANUAL: { label: 'QR Bancario', icon: <QrCode className="w-3 h-3" />, color: 'text-info' },
  GATEWAY_ONLINE: { label: 'Tarjeta Online', icon: <CreditCard className="w-3 h-3" />, color: 'text-arc' },
  CASH: { label: 'Efectivo', icon: <Banknote className="w-3 h-3" />, color: 'text-violet-400' },
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
      <div className="py-20 text-center text-ink-mute">
        <Loader2 className="w-7 h-7 animate-spin text-warn mx-auto mb-3" />
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
            <BarChart2 className="w-5 h-5 text-warn" />
            Resumen de Ganancias
          </h3>
          <p className="text-[11px] text-ink-mute mt-0.5">
            Métricas de rendimiento de <span className="text-warn-soft font-semibold">{businessName || data.business?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-void-700 border border-surface-line rounded-xl p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setPeriod(opt.days)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  period === opt.days
                    ? 'bg-warn text-void shadow-sm'
                    : 'text-ink-mute hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchMetrics(period, true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-void-700 border border-surface-line hover:border-surface-line text-ink-mute hover:text-white transition-all"
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
        <div className="col-span-2 lg:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-warn/10 to-warn/5 border border-warn/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-warn/15 border border-warn/20">
              <DollarSign className="w-4 h-4 text-warn" />
            </div>
            <span className="text-[10px] text-warn/70 font-semibold uppercase tracking-wider">
              {period === 1 ? 'Hoy' : `${period} días`}
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(summary.periodRevenue)}
            </div>
            <div className="text-[11px] text-ink-mute mt-0.5">Ingresos del período</div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-violet-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="font-semibold">{formatCurrency(summary.totalRevenueAllTime)}</span>
            <span className="text-ink-faint">acumulado total</span>
          </div>
        </div>

        {/* Pedidos completados */}
        <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 space-y-2">
          <div className="p-1.5 rounded-xl bg-violet-500/10 border border-violet-500/15 w-fit">
            <CheckCircle2 className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl font-black text-white">{summary.completedOrders}</div>
          <div className="text-[11px] text-ink-mute">Pedidos entregados</div>
          <div className="text-[10px] text-violet-400 font-semibold">{summary.approvalRate}% tasa de éxito</div>
        </div>

        {/* Ticket promedio */}
        <div className="p-4 rounded-2xl bg-info/5 border border-info/20 space-y-2">
          <div className="p-1.5 rounded-xl bg-info/10 border border-info/15 w-fit">
            <TrendingUp className="w-4 h-4 text-info" />
          </div>
          <div className="text-xl font-black text-white">{summary.avgTicket.toFixed(0)} Bs</div>
          <div className="text-[11px] text-ink-mute">Ticket promedio</div>
          <div className="text-[10px] text-info font-semibold">por pedido completado</div>
        </div>

        {/* HOY */}
        <div className="p-4 rounded-2xl bg-arc/5 border border-arc/20 space-y-2">
          <div className="p-1.5 rounded-xl bg-arc/10 border border-arc/15 w-fit">
            <Zap className="w-4 h-4 text-arc" />
          </div>
          <div className="text-xl font-black text-white">{formatCurrency(today.revenue)}</div>
          <div className="text-[11px] text-ink-mute">Hoy</div>
          <div className="text-[10px] text-arc font-semibold">{today.orders} pedidos entregados hoy</div>
        </div>
      </div>

      {/* ═══════════════════════════════════
          ESTADOS DE PEDIDOS
      ═══════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-void-700/60 border border-surface-line text-center">
          <div className="text-lg font-black text-violet-400">{summary.completedOrders}</div>
          <div className="text-[10px] text-ink-mute mt-0.5">Entregados</div>
        </div>
        <div className="p-3 rounded-2xl bg-void-700/60 border border-surface-line text-center">
          <div className="text-lg font-black text-warn">{summary.pendingOrders}</div>
          <div className="text-[10px] text-ink-mute mt-0.5">En proceso</div>
        </div>
        <div className="p-3 rounded-2xl bg-void-700/60 border border-surface-line text-center">
          <div className="text-lg font-black text-ember">{summary.cancelledOrders}</div>
          <div className="text-[10px] text-ink-mute mt-0.5">Cancelados</div>
        </div>
      </div>

      {/* ═══════════════════════════════════
          GRÁFICO DE BARRAS — INGRESOS DIARIOS
      ═══════════════════════════════════ */}
      <div className="p-5 rounded-2xl rune-panel border border-surface-line space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-warn" />
            Ingresos por día
          </h4>
          {bestDay.revenue > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-warn-soft">
              <Star className="w-3 h-3 text-warn" />
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
                  <div className="bg-void-700 border border-surface-line rounded-lg px-2 py-1 text-center whitespace-nowrap shadow-xl">
                    <div className="text-[10px] font-bold text-white">{formatCurrency(day.revenue)}</div>
                    <div className="text-[9px] text-ink-mute">{day.orders} pedidos</div>
                  </div>
                  <div className="w-1.5 h-1.5 bg-void-700 border-r border-b border-surface-line rotate-45 -mt-0.5" />
                </div>

                {/* Barra */}
                <div className="w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isToday
                        ? 'bg-gradient-to-t from-warn-deep to-warn'
                        : day.revenue > 0
                        ? 'bg-gradient-to-t from-surface-high to-surface-high group-hover:from-warn-deep group-hover:to-warn'
                        : 'bg-void-700 border border-dashed border-surface-line'
                    }`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                </div>

                {/* Label día */}
                <div className={`text-[9px] font-bold truncate max-w-full ${
                  isToday ? 'text-warn' : 'text-ink-faint'
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
        <div className="p-5 rounded-2xl rune-panel border border-surface-line space-y-4">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-warn" />
            Platos más vendidos
          </h4>

          {topProducts.length === 0 ? (
            <div className="py-6 text-center text-ink-faint text-xs">
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
                      <span className="flex items-center gap-1.5 text-ink-soft font-medium truncate max-w-[180px]">
                        <span>{medals[i] || `#${i + 1}`}</span>
                        <span className="truncate">{p.name}</span>
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-violet-400 font-bold">{formatCurrency(p.revenue)}</span>
                        <span className="text-[10px] text-ink-faint">{p.qty}x</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          i === 0 ? 'bg-warn' : i === 1 ? 'bg-ink-mute' : i === 2 ? 'bg-warn-deep' : 'bg-surface-high'
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
          <div className="p-5 rounded-2xl rune-panel border border-surface-line space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-info" />
              Métodos de pago usados
            </h4>
            {Object.keys(paymentMethods).length === 0 ? (
              <p className="text-[11px] text-ink-faint">Sin pagos completados aún</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(paymentMethods).map(([method, count]: [string, any]) => {
                  const info = PAYMENT_LABELS[method] || { label: method, icon: <Banknote className="w-3 h-3" />, color: 'text-ink-mute' };
                  const total = Object.values(paymentMethods).reduce((a: number, b: unknown) => a + Number(b), 0);
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={method} className="flex items-center gap-2 text-xs">
                      <span className={`${info.color}`}>{info.icon}</span>
                      <span className="text-ink-soft flex-1">{info.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                          <div className="h-full bg-warn rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-ink-mute w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Premio al mejor día */}
          {bestDay.revenue > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-warn/10 to-warn/5 border border-warn/20 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-warn/15 border border-warn/20 shrink-0">
                <Award className="w-5 h-5 text-warn" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Mejor jornada registrada</div>
                <div className="text-lg font-black text-warn leading-tight">{formatCurrency(bestDay.revenue)}</div>
                <div className="text-[10px] text-ink-mute">
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
              ? 'bg-violet-500/5 border-violet-500/20'
              : 'bg-void-700/60 border-surface-line'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${data.business?.isOpen ? 'bg-violet-400 animate-pulse' : 'bg-surface-high'}`} />
            <div>
              <div className="text-xs font-bold text-white">
                {data.business?.isOpen ? '🟢 Comercio Abierto' : '⚫ Comercio Cerrado'}
              </div>
              <div className="text-[10px] text-ink-mute">Estado actual en la plataforma</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════
          BANNER DE MOTIVACIÓN
      ═══════════════════════════════════ */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-warn/10 via-warn/5 to-transparent border border-warn/20 flex flex-col sm:flex-row items-center gap-4">
        <div className="text-4xl">🚀</div>
        <div>
          <h4 className="text-sm font-black text-white">¡Tu negocio crece en Pedidos Trinidad!</h4>
          <p className="text-[11px] text-ink-mute mt-0.5 max-w-lg">
            Con <strong className="text-warn-soft">{summary.totalRevenueAllTime.toFixed(0)} Bs</strong> en ventas acumuladas y{' '}
            <strong className="text-warn-soft">{summary.completedOrders}</strong> pedidos completados,
            tu presencia digital en Trinidad genera resultados reales. ¡Mantén tu menú actualizado y aumenta tus ventas!
          </p>
        </div>
      </div>
    </div>
  );
}
