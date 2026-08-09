'use client';

import React from 'react';
import { Plus, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProductCardProps {
  product: any;
  onSelect: (product: any) => void;
  onQuickAdd?: (product: any) => void;
}

export function ProductCard({ product, onSelect, onQuickAdd }: ProductCardProps) {
  return (
    <div
      onClick={() => onSelect(product)}
      className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:shadow-xl hover:shadow-emerald-950/20"
    >
      <div>
        {/* Product Image & Tags */}
        <div className="relative w-full h-44 bg-slate-900 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700">
              <Eye className="w-8 h-8 opacity-40" />
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

          {/* Availability Badge */}
          <div className="absolute top-3 right-3">
            {product.isAvailable ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                Disponible
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 backdrop-blur-md">
                Agotado
              </span>
            )}
          </div>

          {/* Category Chips */}
          <div className="absolute bottom-2.5 left-3 flex flex-wrap gap-1">
            {product.categories?.slice(0, 2).map((cat: string) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-900/80 text-slate-300 border border-slate-700/60 backdrop-blur-sm"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Price & Action Footer */}
      <div className="p-4 pt-0 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Precio</div>
          <div className="text-base font-black text-emerald-400">
            {product.price.toFixed(2)} <span className="text-xs font-bold text-emerald-500">Bs</span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onQuickAdd && product.isAvailable) {
              onQuickAdd(product);
            } else {
              onSelect(product);
            }
          }}
          disabled={!product.isAvailable}
          className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-400 transition-all shadow-sm group/btn disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
          title="Agregar al pedido"
        >
          <Plus className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}
