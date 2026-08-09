'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  ArrowLeft,
  Search,
  Phone,
  QrCode,
  MapPin,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { ProductCard } from '@/presentation/components/menu/ProductCard';
import { ProductModal } from '@/presentation/components/menu/ProductModal';
import { useCart } from '@/presentation/context/CartContext';

export const dynamic = 'force-dynamic';

export default function BusinessMenuPage({
  params,
}: {
  params: { id: string };
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch(`/api/businesses/${params.id}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, [params.id]);

  const { addItem, setIsCartOpen } = useCart();

  const handleAddToCart = (product: any, quantity: number, notes: string) => {
    const success = addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.imageUrl,
      businessId: data.business.id,
      businessName: data.business.name,
      spaceName: data.business.spaceName || data.business.space?.name,
      qrCodeUrl: data.business.qrCodeUrl,
      ownerPhone: data.business.ownerPhone,
      notes,
    });

    if (success) {
      setCartCount((prev) => prev + quantity);
      setNotification(`¡Agregado ${quantity}x "${product.name}" al pedido!`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Cargando menú del restaurante...</p>
      </div>
    );
  }

  if (!data?.business) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
        <p className="text-sm font-semibold text-white">Negocio no encontrado</p>
        <Link href="/spaces" className="text-xs text-emerald-400 hover:underline mt-2 inline-block">
          Volver a explorar espacios
        </Link>
      </div>
    );
  }

  const { business, products, categories } = data;

  const filteredProducts = products.filter((p: any) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || p.categories?.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Business Header Banner */}
      <div className="relative bg-slate-900 border-b border-slate-800">
        {business.bannerUrl && (
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={business.bannerUrl}
              alt={business.name}
              className="w-full h-full object-cover opacity-20 blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/90 to-slate-950" />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Espacios</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-slate-800 border-2 border-slate-700 shadow-xl"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                  <Store className="w-8 h-8" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      business.isOpen && business.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {business.isOpen && business.isActive ? '🟢 Abierto' : '🔴 Cerrado'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {business.category?.replace('_', ' ')}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {business.name}
                </h1>

                <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    {business.ownerPhone}
                  </span>
                  {business.qrCodeUrl && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <QrCode className="w-3.5 h-3.5" />
                      Pago QR Habilitado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Floating Cart Indicator */}
            {cartCount > 0 && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="p-3 rounded-2xl glass-panel border border-emerald-500/30 hover:border-emerald-500/60 flex items-center gap-3 animate-in fade-in transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                  {cartCount}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Pedido en Curso</div>
                  <div className="text-[11px] text-emerald-400">Ver carrito y pagar &rarr;</div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl glass-dropdown border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Menu Catalog Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Search & Categories Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en el menú de este restaurante..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todos los Platos ({products.length})
            </button>

            {categories.map((cat: string) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs glass-panel rounded-3xl border border-slate-800">
            No se encontraron productos que coincidan con la búsqueda o categoría seleccionada.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(prod) => setSelectedProduct(prod)}
                onQuickAdd={(prod) => handleAddToCart(prod, 1, '')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
