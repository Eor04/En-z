'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Plus, UtensilsCrossed } from 'lucide-react';
import { Badge } from '@/presentation/components/ui';
import { bs, cn } from '@/presentation/lib/utils';
import { EASE_RUNE, tSpring } from '@/presentation/lib/motion';

interface ProductCardProps {
  product: any;
  onSelect: (product: any) => void;
  onQuickAdd?: (product: any) => void;
  index?: number;
}

/* `AnimatePresence mode="popLayout"` mide el hijo saliente: necesita reenviar la ref. */
export const ProductCard = React.forwardRef<HTMLElement, ProductCardProps>(function ProductCard(
  { product, onSelect, onQuickAdd, index = 0 },
  ref
) {
  const available = Boolean(product.isAvailable);

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: EASE_RUNE, delay: Math.min(index * 0.04, 0.28) }}
      whileHover={{ y: -6 }}
      onClick={() => onSelect(product)}
      className={cn(
        'rune-panel rune-edge group flex cursor-pointer flex-col overflow-hidden rounded-3xl',
        'transition-shadow duration-300 hover:shadow-rune',
        !available && 'opacity-70'
      )}
    >
      {/* Imagen */}
      <div className="relative h-44 overflow-hidden bg-void-700">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className={cn(
              'h-full w-full object-cover transition-transform duration-700 group-hover:scale-110',
              !available && 'grayscale'
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950/50 to-void-700">
            <UtensilsCrossed className="h-8 w-8 text-violet-500/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/25 to-transparent" />

        <div className="absolute right-3 top-3">
          <Badge tone={available ? 'ok' : 'danger'} dot>
            {available ? 'Disponible' : 'Agotado'}
          </Badge>
        </div>

        {product.categories?.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {product.categories.slice(0, 2).map((cat: string) => (
              <span
                key={cat}
                className="rounded-lg border border-surface-line bg-void-800/85 px-2 py-0.5 text-[10px] font-medium text-ink-soft backdrop-blur-sm"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-display text-[15px] font-bold text-white transition-colors group-hover:text-arc-soft">
          {product.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-ink-mute">
          {product.description}
        </p>

        <div className="mt-4 flex items-end justify-between gap-3 pt-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Precio
            </p>
            <p className="mt-0.5 font-display text-lg font-bold leading-none text-arc tabular">
              {bs(product.price)}
              <span className="ml-1 text-[11px] font-semibold text-violet-400">Bs</span>
            </p>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.08 }}
            transition={tSpring}
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickAdd && available) onQuickAdd(product);
              else onSelect(product);
            }}
            disabled={!available}
            aria-label={`Agregar ${product.name} al pedido`}
            className={cn(
              'flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border transition-colors duration-200',
              available
                ? 'border-violet-400/35 bg-violet-500/15 text-violet-200 hover:bg-grad-rune hover:text-white'
                : 'cursor-not-allowed border-surface-line bg-surface text-ink-faint'
            )}
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
});
