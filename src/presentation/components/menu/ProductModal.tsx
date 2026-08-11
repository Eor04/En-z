'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Plus, Minus, ShoppingBag, Check, UtensilsCrossed } from 'lucide-react';
import { Badge, Textarea } from '@/presentation/components/ui';
import { bs, cn } from '@/presentation/lib/utils';
import { popIn, tSpring } from '@/presentation/lib/motion';

interface ProductModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: any, quantity: number, notes: string) => void;
}

export function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [added, setAdded] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Reiniciar el estado al abrir otro producto
  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setNotes('');
      setAdded(false);
    }
  }, [isOpen, product?.id]);

  const handleAdd = () => {
    onAddToCart?.(product, quantity, notes);
    setAdded(true);
    window.setTimeout(onClose, 750);
  };

  const total = (product?.price ?? 0) * quantity;

  return (
    <AnimatePresence>
      {isOpen && product && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-void/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            variants={popIn}
            initial="hidden"
            animate="show"
            exit="exit"
            className="rune-glass relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px]"
          >
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-4 top-4 z-20 cursor-pointer rounded-xl border border-surface-line bg-void-800/85 p-2 text-ink-soft backdrop-blur-md transition-colors hover:border-ember/40 hover:text-ember"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="overflow-y-auto">
              {/* Imagen */}
              <div className="relative h-56 w-full overflow-hidden bg-void-700">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950/50 to-void-700">
                    <UtensilsCrossed className="h-12 w-12 text-violet-500/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-void via-void/30 to-transparent" />

                {product.categories?.length > 0 && (
                  <div className="absolute bottom-4 left-5 flex flex-wrap gap-1.5">
                    {product.categories.map((cat: string) => (
                      <Badge key={cat} tone="violet">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-display text-xl font-bold leading-tight text-white">
                    {product.name}
                  </h2>
                  <p className="shrink-0 font-display text-xl font-bold text-arc tabular">
                    {bs(product.price)} <span className="text-sm text-violet-400">Bs</span>
                  </p>
                </div>

                <p className="mt-3 text-[13px] leading-relaxed text-ink-mute">
                  {product.description}
                </p>

                <div className="mt-6">
                  <label
                    htmlFor="product-notes"
                    className="mb-1.5 block text-[12px] font-semibold text-ink-soft"
                  >
                    Instrucciones especiales{' '}
                    <span className="font-normal text-ink-faint">(opcional)</span>
                  </label>
                  <Textarea
                    id="product-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. sin cebolla, aderezos aparte, salsa picante…"
                    className="resize-none text-[13px]"
                  />
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-3 border-t border-surface-line bg-void-800/70 p-5">
              <div className="flex items-center rounded-2xl border border-surface-line bg-void-800 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Quitar uno"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-ink-mute transition-colors hover:bg-violet-500/15 hover:text-white disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <motion.span
                  key={quantity}
                  initial={{ scale: 0.6, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={tSpring}
                  className="w-9 text-center font-display text-sm font-bold text-white tabular"
                >
                  {quantity}
                </motion.span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Agregar uno"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-ink-mute transition-colors hover:bg-violet-500/15 hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <motion.button
                type="button"
                onClick={handleAdd}
                disabled={added || !product.isAvailable}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'sheen flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3.5',
                  'font-display text-[13px] font-bold transition-colors duration-300',
                  added
                    ? 'border border-ok/40 bg-ok/20 text-ok-soft'
                    : product.isAvailable
                      ? 'border border-violet-300/30 bg-grad-rune text-white shadow-glow-violet'
                      : 'cursor-not-allowed border border-surface-line bg-surface text-ink-faint'
                )}
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" />
                    ¡Agregado!
                  </>
                ) : product.isAvailable ? (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    Agregar · {bs(total)} Bs
                  </>
                ) : (
                  'No disponible'
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
