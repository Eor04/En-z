'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  Store,
  ArrowLeft,
  Search,
  Phone,
  QrCode,
  ShoppingBag,
  CheckCircle2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { ProductCard } from '@/presentation/components/menu/ProductCard';
import { ProductModal } from '@/presentation/components/menu/ProductModal';
import { useCart } from '@/presentation/context/CartContext';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  Skeleton,
  Panel,
} from '@/presentation/components/ui';
import { cn } from '@/presentation/lib/utils';
import { EASE_RUNE, tSpring } from '@/presentation/lib/motion';

export default function BusinessMenuPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const { addItem, setIsCartOpen } = useCart();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/businesses/${params.id}`);
        const result = await res.json();
        if (alive) setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [params.id]);

  const handleAddToCart = (product: any, quantity: number, notes: string) => {
    const ok = addItem({
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

    if (ok) {
      setCartCount((n) => n + quantity);
      setToast(`${quantity}× ${product.name} agregado`);
      window.setTimeout(() => setToast(null), 3000);
    }
  };

  const business = data?.business;
  const products: any[] = data?.products ?? [];
  const categories: string[] = data?.categories ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchTerm =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.description ?? '').toLowerCase().includes(term);
      const matchCat = category === 'ALL' || p.categories?.includes(category);
      return matchTerm && matchCat;
    });
  }, [products, search, category]);

  /* ---------------- Estados de carga / error ---------------- */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-44 rounded-[32px]" />
        <div className="mb-8 flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-2xl" />
          <Skeleton className="h-12 w-64 rounded-2xl" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          icon={Store}
          title="No encontramos este comercio"
          description="Puede que haya sido dado de baja o que el enlace esté mal."
          action={
            <Button href="/spaces" size="sm">
              Volver a los espacios
            </Button>
          }
        />
      </div>
    );
  }

  const isOpen = business.isOpen && business.isActive;

  return (
    <div className="pb-24">
      {/* ---------------- Cabecera del comercio ---------------- */}
      <header className="relative overflow-hidden border-b border-surface-line">
        {business.bannerUrl && (
          <div className="absolute inset-0">
            <img
              src={business.bannerUrl}
              alt=""
              aria-hidden
              className="h-full w-full object-cover opacity-25 blur-[2px]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-void/70 via-void/90 to-void" />
          </div>
        )}

        <div className="relative mx-auto max-w-7xl px-4 pb-9 pt-6 sm:px-6 lg:px-8">
          <Link
            href="/spaces"
            className="group mb-6 inline-flex items-center gap-2 text-[12px] font-semibold text-ink-mute transition-colors hover:text-violet-300"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Volver a espacios
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_RUNE }}
            className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-4">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="h-20 w-20 rounded-3xl border border-violet-400/25 object-cover shadow-glow-violet"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
                  <Store className="h-8 w-8" />
                </div>
              )}

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone={isOpen ? 'ok' : 'danger'} dot>
                    {isOpen ? 'Abierto ahora' : 'Cerrado'}
                  </Badge>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                    {business.category?.replace(/_/g, ' ')}
                  </span>
                </div>

                <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-white sm:text-4xl">
                  {business.name}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] text-ink-mute">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-violet-400" />
                    {business.ownerPhone}
                  </span>
                  {business.qrCodeUrl && (
                    <span className="flex items-center gap-1.5 text-warn-soft">
                      <QrCode className="h-3.5 w-3.5" />
                      Pago QR habilitado
                    </span>
                  )}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {cartCount > 0 && (
                <motion.button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -3 }}
                  transition={tSpring}
                  className="rune-panel rune-edge flex cursor-pointer items-center gap-3 rounded-2xl p-3 text-left"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-grad-rune font-display text-[13px] font-bold text-white shadow-glow-violet tabular">
                    {cartCount}
                  </span>
                  <span>
                    <span className="block text-[12px] font-bold text-white">Pedido en curso</span>
                    <span className="block text-[11px] text-arc-soft">Ver carrito →</span>
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </header>

      {/* ---------------- Catálogo ---------------- */}
      <div className="mx-auto max-w-7xl px-4 pt-9 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300" />
            <label htmlFor="menu-search" className="sr-only">
              Buscar en el menú
            </label>
            <Input
              id="menu-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en este menú…"
              className="pl-11 pr-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Limpiar"
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-ink-faint transition-colors hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Carrusel de categorías */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-surface-line bg-void-800/60 p-1.5">
            {[{ key: 'ALL', label: `Todo (${products.length})` }, ...categories.map((c) => ({ key: c, label: c }))].map(
              (c) => {
                const active = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={cn(
                      'relative shrink-0 cursor-pointer whitespace-nowrap rounded-xl px-3.5 py-2 text-[12px] font-semibold transition-colors',
                      active ? 'text-white' : 'text-ink-mute hover:text-ink-soft'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="menu-cat"
                        className="absolute inset-0 rounded-xl border border-violet-400/40 bg-violet-500/20 shadow-glow-violet"
                        transition={tSpring}
                      />
                    )}
                    <span className="relative">{c.label}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="Nada por acá"
            description="No hay platos que coincidan con tu búsqueda o categoría."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setCategory('ALL');
                }}
              >
                Ver todo el menú
              </Button>
            }
          />
        ) : (
          <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  onSelect={setSelectedProduct}
                  onQuickAdd={(p) => handleAddToCart(p, 1, '')}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ---------------- Toast ---------------- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={tSpring}
            className="rune-glass fixed bottom-24 left-1/2 z-[110] flex -translate-x-1/2 items-center gap-2.5 rounded-2xl border-ok/35 px-4 py-3 text-[12px] font-semibold text-ok-soft sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <ProductModal
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
