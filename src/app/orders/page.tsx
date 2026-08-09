'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {

export const dynamic = 'force-dynamic';
  ShoppingBag,
  Clock,
  ChevronRight,
  Store,
  CreditCard,
  QrCode,
  Banknote,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function OrdersHistoryPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [session]);

  const getStatusBadge = (orderStatus: string) => {
    switch (orderStatus) {
      case 'esperando_pago':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ⏳ Esperando Pago
          </span>
        );
      case 'en_preparacion':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            🍳 En Cocina
          </span>
        );
      case 'buscando_driver':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            🛵 Buscando Repartidor
          </span>
        );
      case 'en_camino':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            ⚡ En Camino
          </span>
        );
      case 'entregado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ✓ Entregado
          </span>
        );
      case 'cancelado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            ✕ Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
            {orderStatus}
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Historial de Compras</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Mis Pedidos
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Consulta el estado y tracking de todas tus órdenes en PedidosTrinidad.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Cargando tus pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="text-base font-bold text-white mb-2">No tienes pedidos activos</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            Aún no has realizado compras. Explora los mejores restaurantes en nuestros patios de comida.
          </p>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20"
          >
            <span>Explorar Patios de Comida</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-sm">
                      {order.business?.name || 'Local de Comida'}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {order.items?.map((i: any) => `${i.quantity}x ${i.product?.name || 'Plato'}`).join(', ')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {new Date(order.createdAt).toLocaleDateString('es-BO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total</div>
                  <div className="text-base font-black text-emerald-400">
                    {order.totalPrice.toFixed(2)} Bs
                  </div>
                </div>

                <Link
                  href={`/orders/${order.id}`}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-slate-800 text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
                >
                  <span>Ver Tracking</span>
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
