'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import {
  Store,
  Sparkles,
  Package,
  Layers,
  Power,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  QrCode,
  ChefHat
} from 'lucide-react';
import { AttendanceToggle } from '@/presentation/components/store/AttendanceToggle';
import { ProductManager } from '@/presentation/components/store/ProductManager';
import { StoreReceiptsManager } from '@/presentation/components/payments/StoreReceiptsManager';
import { StoreLiveOrdersManager } from '@/presentation/components/store/StoreLiveOrdersManager';

export default function StoreDashboardPage() {
  const { data: session, status } = useSession();
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'receipts' | 'products'>('orders');

  const fetchBusiness = async () => {
    try {
      const res = await fetch('/api/store/me');
      const data = await res.json();
      
      if (data.business) {
        const menuRes = await fetch(`/api/businesses/${data.business.id}`);
        const menuData = await menuRes.json();
        setBusinessData(menuData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'loading') {
      fetchBusiness();
    }
  }, [status, session]);

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Cargando panel de control comercial...</p>
      </div>
    );
  }

  const userRole = (session?.user as any)?.role;
  if (!session?.user || (userRole !== 'BUSINESS_OWNER' && userRole !== 'ADMIN')) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="glass-panel rounded-3xl p-8 border border-amber-500/30 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Store className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Portal de Propietarios de Tienda</h2>
          <p className="text-xs text-slate-400 mb-6">
            Inicia sesión con tu cuenta de comercio o con el usuario de demostración de Don Pepe para gestionar tu local.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => signIn('credentials', { email: 'tienda@pedidostrinidad.com', password: 'password123', callbackUrl: '/store/dashboard' })}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Acceder con cuenta Demo (Don Pepe)</span>
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

  const { business, products } = businessData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>Panel de Gestión Comercial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {business?.name || 'Mi Negocio'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Revisa pedidos entrantes, valida disponibilidad en cocina, verifica pagos QR y administra tu catálogo en Trinidad.
          </p>
        </div>

        {business && (
          <Link
            href={`/businesses/${business.id}`}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-xs font-semibold text-slate-200 hover:text-emerald-400 flex items-center gap-2 transition-all shrink-0"
          >
            <span>Ver Menú Público</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Real-time Attendance / Open-Close Toggle */}
      {business && (
        <div className="mb-8">
          <AttendanceToggle
            businessId={business.id}
            initialIsOpen={business.isOpen}
            businessName={business.name}
          />
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>Comandas & Cocina en Vivo</span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'receipts'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Comprobantes QR Bancarios</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'products'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catálogo de Platos ({products?.length || 0})</span>
        </button>
      </div>

      {/* TAB CONTENT 1: COMANDAS & COCINA EN VIVO */}
      {activeTab === 'orders' && business && (
        <div className="space-y-6">
          <StoreLiveOrdersManager
            businessId={business.id}
            onOrderUpdated={fetchBusiness}
          />
        </div>
      )}

      {/* TAB CONTENT 2: COMPROBANTES QR */}
      {activeTab === 'receipts' && business && (
        <div className="space-y-6">
          <StoreReceiptsManager
            businessId={business.id}
            onReceiptVerified={fetchBusiness}
          />
        </div>
      )}

      {/* TAB CONTENT 3: PRODUCTOS */}
      {activeTab === 'products' && business && (
        <div className="space-y-6">
          <ProductManager
            businessId={business.id}
            initialProducts={products || []}
          />
        </div>
      )}
    </div>
  );
}
