'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, Sparkles, Check } from 'lucide-react';

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

  if (!isOpen || !product) return null;

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity, notes);
    }
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
      setQuantity(1);
      setNotes('');
    }, 800);
  };

  const totalPrice = (product.price * quantity).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 animate-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Image */}
        {product.imageUrl && (
          <div className="relative w-full h-56 bg-slate-900 overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-3 left-4 flex flex-wrap gap-1.5">
              {product.categories?.map((cat: string) => (
                <span
                  key={cat}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h2 className="text-xl font-bold text-white leading-tight">{product.name}</h2>
            <div className="text-xl font-black text-emerald-400 whitespace-nowrap">
              {product.price.toFixed(2)} Bs
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-6">
            {product.description}
          </p>

          {/* Special Instructions Notes */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Instrucciones o preferencias especiales (opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Sin cebolla, aderezos aparte, salsa picante..."
              className="w-full p-3 rounded-xl bg-slate-900/90 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-white placeholder-slate-500 outline-none resize-none transition-all"
            />
          </div>

          {/* Quantity and Add to Cart Bar */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
            {/* Quantity Selector */}
            <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center font-bold text-sm text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add Button */}
            <button
              type="button"
              onClick={handleAdd}
              disabled={added || !product.isAvailable}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                added
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : product.isAvailable
                  ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-600/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Agregado al Carrito!</span>
                </>
              ) : product.isAvailable ? (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Agregar al Pedido • {totalPrice} Bs</span>
                </>
              ) : (
                <span>Agotado / No disponible</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
