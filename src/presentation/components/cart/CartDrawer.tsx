'use client';

import React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Store,
  Bike,
  Layers,
} from 'lucide-react';
import { useCart } from '@/presentation/context/CartContext';
import { Button, EmptyState } from '@/presentation/components/ui';
import { bs, cn } from '@/presentation/lib/utils';
import { EASE_RUNE, tSpring } from '@/presentation/lib/motion';

export function CartDrawer() {
  const {
    items,
    groupedByBusiness,
    isMultiStore,
    businessCount,
    removeItem,
    removeBusinessItems,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryFee,
    total,
    totalItems,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  // Bloquear scroll de fondo mientras el drawer está abierto
  React.useEffect(() => {
    if (!isCartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsCartOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isCartOpen, setIsCartOpen]);

  return (
    <>
      {/* --- Botón flotante --- */}
      <AnimatePresence>
        {totalItems > 0 && !isCartOpen && (
          <motion.button
            type="button"
            onClick={() => setIsCartOpen(true)}
            initial={{ y: 90, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 90, opacity: 0, scale: 0.9 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.96 }}
            transition={tSpring}
            className="sheen fixed bottom-6 right-4 z-40 flex cursor-pointer items-center gap-3 rounded-2xl border border-violet-300/30 bg-grad-rune px-5 py-3.5 text-white shadow-glow-violet sm:right-6"
          >
            <span className="relative">
              <ShoppingBag className="h-5 w-5" />
              <motion.span
                key={totalItems}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={tSpring}
                className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-void bg-ember text-[10px] font-bold tabular"
              >
                {totalItems}
              </motion.span>
            </span>
            <span className="text-left">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-100">
                Ver pedido
                {isMultiStore && (
                  <span className="rounded-full bg-white/20 px-1.5 py-px text-[9px] font-bold">
                    {businessCount} locales
                  </span>
                )}
              </span>
              <span className="block font-display text-sm font-bold tabular">{bs(total)} Bs</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* --- Drawer --- */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[80] overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-void/85 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
            />

            <motion.aside
              role="dialog"
              aria-label="Carrito de pedido"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 36 }}
              className="rune-glass absolute inset-y-0 right-0 flex w-screen max-w-md flex-col border-l border-surface-line"
            >
              {/* Encabezado */}
              <header className="flex items-center justify-between gap-3 border-b border-surface-line px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/12 text-violet-300">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-[15px] font-bold text-white">Tu pedido</h2>
                    {isMultiStore ? (
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-warn-soft">
                        <Layers className="h-3 w-3" />
                        Multi-comercio · {businessCount} locales
                      </p>
                    ) : groupedByBusiness[0] ? (
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-ink-mute">
                        <Store className="h-3 w-3 text-warn" />
                        {groupedByBusiness[0].businessName}
                      </p>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  aria-label="Cerrar carrito"
                  className="cursor-pointer rounded-xl border border-surface-line p-2 text-ink-mute transition-colors hover:border-ember/40 hover:text-ember"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              {/* Lista */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <EmptyState
                    icon={ShoppingBag}
                    title="Tu carrito está vacío"
                    description="Explorá los patios de comida y sumá tus platos favoritos."
                    action={
                      <Button href="/spaces" size="sm" onClick={() => setIsCartOpen(false)}>
                        Ver espacios
                      </Button>
                    }
                  />
                ) : (
                  <AnimatePresence initial={false} mode="popLayout">
                    {groupedByBusiness.map((group) => (
                      <motion.section
                        key={group.businessId}
                        layout
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3, ease: EASE_RUNE }}
                        className="overflow-hidden rounded-2xl border border-surface-line bg-void-800/60"
                      >
                        <header className="flex items-center justify-between gap-2 border-b border-surface-line bg-void-700/60 px-3.5 py-2.5">
                          <div className="flex min-w-0 items-center gap-2">
                            <Store className="h-3.5 w-3.5 shrink-0 text-warn" />
                            <span className="truncate font-display text-[12px] font-bold text-white">
                              {group.businessName}
                            </span>
                            {group.spaceName && (
                              <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-ink-faint">
                                {group.spaceName}
                              </span>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="font-display text-[12px] font-bold text-violet-300 tabular">
                              {bs(group.subtotal)} Bs
                            </span>
                            {groupedByBusiness.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBusinessItems(group.businessId)}
                                aria-label={`Quitar productos de ${group.businessName}`}
                                className="cursor-pointer rounded-lg p-1 text-ink-faint transition-colors hover:bg-ember/10 hover:text-ember"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </header>

                        <div className="space-y-2 p-2.5">
                          <AnimatePresence initial={false} mode="popLayout">
                            {group.items.map((item) => (
                              <motion.article
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0 }}
                                transition={{ duration: 0.25, ease: EASE_RUNE }}
                                className="flex items-center justify-between gap-3 rounded-xl border border-surface-line/70 bg-surface/60 p-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <h3 className="truncate text-[12px] font-bold text-white">
                                    {item.name}
                                  </h3>
                                  <p className="mt-0.5 text-[11px] font-semibold text-violet-300 tabular">
                                    {bs(item.price)} Bs
                                  </p>
                                  {item.notes && (
                                    <p className="mt-0.5 truncate text-[10px] italic text-ink-faint">
                                      “{item.notes}”
                                    </p>
                                  )}
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                  <div className="flex items-center rounded-xl border border-surface-line bg-void-800 p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      aria-label="Quitar uno"
                                      className="cursor-pointer rounded-lg p-1.5 text-ink-mute transition-colors hover:bg-violet-500/15 hover:text-white"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <motion.span
                                      key={item.quantity}
                                      initial={{ scale: 0.6, opacity: 0.4 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={tSpring}
                                      className="w-6 text-center text-[12px] font-bold text-white tabular"
                                    >
                                      {item.quantity}
                                    </motion.span>
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      aria-label="Agregar uno"
                                      className="cursor-pointer rounded-lg p-1.5 text-ink-mute transition-colors hover:bg-violet-500/15 hover:text-white"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    aria-label={`Eliminar ${item.name}`}
                                    className="cursor-pointer rounded-xl p-2 text-ink-faint transition-colors hover:bg-ember/10 hover:text-ember"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </motion.article>
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.section>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Resumen */}
              {items.length > 0 && (
                <motion.footer
                  layout
                  className="space-y-4 border-t border-surface-line bg-void-800/80 p-5"
                >
                  <dl className="space-y-2 text-[12px]">
                    <div className="flex justify-between text-ink-mute">
                      <dt>Subtotal productos</dt>
                      <dd className="font-semibold text-white tabular">{bs(subtotal)} Bs</dd>
                    </div>
                    <div className="flex justify-between text-ink-mute">
                      <dt className="flex items-center gap-1.5">
                        <Bike className="h-3.5 w-3.5 text-violet-400" />
                        Envío en Trinidad
                      </dt>
                      <dd className="font-semibold text-white tabular">{bs(deliveryFee)} Bs</dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-surface-line pt-3">
                      <dt className="font-display text-sm font-bold text-white">Total</dt>
                      <dd className="font-display text-lg font-bold text-arc tabular">
                        {bs(total)} Bs
                      </dd>
                    </div>
                  </dl>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearCart}
                      aria-label="Vaciar carrito"
                      className="cursor-pointer rounded-2xl border border-surface-line p-3 text-ink-mute transition-colors hover:border-ember/40 hover:text-ember"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <Link
                      href="/checkout"
                      onClick={() => setIsCartOpen(false)}
                      className={cn(
                        'sheen flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl',
                        'border border-violet-300/30 bg-grad-rune px-4 py-3.5 font-display text-[13px] font-bold text-white',
                        'shadow-glow-violet transition-transform duration-200 active:scale-[0.98]'
                      )}
                    >
                      Ir al checkout
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.footer>
              )}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
