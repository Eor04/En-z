'use client';

import React, { useState } from 'react';
import { Star, X, CheckCircle2, ThumbsUp, MessageSquare, Bike, Award } from 'lucide-react';

interface DriverRatingModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rating: number, review: string) => Promise<void>;
  isSubmitting: boolean;
}

const QUICK_TAGS = [
  '🚀 Entrega Super Rápida',
  '🛵 Pedido Intacto y Caliente',
  '😊 Repartidor Muy Amable',
  '📍 Llegó a la Ubicación Exacta',
  '💯 Excelente Servicio',
];

export const DriverRatingModal: React.FC<DriverRatingModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');

  if (!isOpen || !order) return null;

  const handleTagClick = (tag: string) => {
    if (review.includes(tag)) {
      setReview(review.replace(tag, '').replace(/,\s*,/g, ',').trim());
    } else {
      setReview(review ? `${review}, ${tag}` : tag);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(rating, review);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-void-700 border border-violet-500/30 shadow-2xl shadow-violet-950/50 p-6 overflow-hidden">
        {/* Glow background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-warn/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-surface-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500/20 to-arc/20 border border-violet-500/40 text-violet-400 flex items-center justify-center shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Confirmar Entrega en Puerta</h3>
              <p className="text-xs text-ink-mute">
                Calificación del servicio del repartidor • Pedido #{order.id.slice(0, 6).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-ink-mute hover:text-white hover:bg-surface-raised transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delivery Details Summary */}
        <div className="my-4 p-3.5 rounded-2xl bg-void/60 border border-surface-line/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-ink-mute block uppercase font-bold">Cliente en Trinidad</span>
            <strong className="text-white text-sm">{order.customer?.name || 'Cliente'}</strong>
            <span className="text-ink-mute block text-[11px] truncate max-w-xs">{order.deliveryAddress}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-ink-mute block uppercase font-bold">Ganancia</span>
            <span className="text-base font-black text-violet-400">+{order.deliveryFee || 10} Bs</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating Selector */}
          <div className="text-center py-2 bg-void/40 rounded-2xl border border-surface-line/60 p-4">
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">
              ⭐ Calificación del Servicio (1 a 5 Estrellas)
            </label>

            <div className="flex items-center justify-center gap-2 my-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        active
                          ? 'text-warn fill-warn drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-ink-faint hover:text-ink-faint'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-bold text-warn-soft mt-1">
              {rating === 5 && '🌟 ¡Servicio Excelente (5/5)!'}
              {rating === 4 && '👍 Muy Buen Servicio (4/5)'}
              {rating === 3 && '👌 Servicio Aceptable (3/5)'}
              {rating === 2 && '⚠️ Regular (2/5)'}
              {rating === 1 && '❌ Deficiente (1/5)'}
            </div>
          </div>

          {/* Quick compliment tags */}
          <div>
            <label className="block text-[11px] font-bold text-ink-mute uppercase mb-1.5 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5 text-violet-400" />
              <span>Aspectos Destacados (Opcional):</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => {
                const isSelected = review.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className={`text-[11px] py-1 px-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-violet-500/20 border-violet-500/50 text-violet-300 font-bold'
                        : 'bg-surface-raised/60 border-surface-line/60 text-ink-mute hover:text-ink hover:bg-surface-raised'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional review comment */}
          <div>
            <label className="block text-[11px] font-bold text-ink-mute uppercase mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-warn" />
              <span>Reseña u Opinión del Cliente (Opcional):</span>
            </label>
            <textarea
              rows={2}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Ej: Entrega puntual en puerta, repartidor muy amable y respetuoso..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-void border border-surface-line text-xs text-white placeholder-ink-faint focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-arc-deep hover:from-violet-500 hover:to-arc text-white font-black text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando entrega...' : '✓ Confirmar Entrega con Calificación'}</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onConfirm(5, '')}
              className="py-3 px-4 rounded-xl bg-surface-raised hover:bg-surface-high text-ink-soft text-xs font-semibold transition-all disabled:opacity-50"
            >
              Confirmar 5★ Rápido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
