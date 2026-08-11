'use client';

import React, { useState } from 'react';
import { Star, ThumbsUp, MessageSquare, CheckCircle2, Bike, Award } from 'lucide-react';

interface OrderDriverRatingCardProps {
  orderId: string;
  driver?: {
    id: string;
    name?: string | null;
    driverCode?: string | null;
  } | null;
  initialRating?: number | null;
  initialReview?: string | null;
  isDelivered: boolean;
}

const QUICK_TAGS = [
  '🚀 Súper Rápido',
  '🛵 Pedido Caliente',
  '😊 Muy Educado y Amable',
  '📍 Llegó a la Ubicación Exacta',
  '💯 Servicio Impecable',
];

export const OrderDriverRatingCard: React.FC<OrderDriverRatingCardProps> = ({
  orderId,
  driver,
  initialRating,
  initialReview,
  isDelivered,
}) => {
  const [rating, setRating] = useState<number>(initialRating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [review, setReview] = useState<string>(initialReview || '');
  const [isSaved, setIsSaved] = useState<boolean>(Boolean(initialRating));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isDelivered || !driver) return null;

  const handleTagClick = (tag: string) => {
    if (review.includes(tag)) {
      setReview(review.replace(tag, '').replace(/,\s*,/g, ',').trim());
    } else {
      setReview(review ? `${review}, ${tag}` : tag);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar la calificación');

      setIsSaved(true);
      setFeedback('¡Muchas gracias por tu reseña! Ayuda a mejorar el servicio en Trinidad.');
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-void-700/90 border border-warn/30 shadow-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-warn/20 text-warn border border-warn/40 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-white text-sm">Califica a tu Repartidor</h4>
            <p className="text-xs text-ink-mute">
              {driver.name || 'Repartidor en moto'} {driver.driverCode ? `(${driver.driverCode})` : ''}
            </p>
          </div>
        </div>
        {isSaved && (
          <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Calificado</span>
          </span>
        )}
      </div>

      {isSaved ? (
        <div className="p-4 rounded-2xl bg-void/60 border border-surface-line space-y-2 text-xs">
          <div className="flex items-center gap-1 text-warn">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= rating
                    ? 'fill-warn text-warn'
                    : 'text-ink-faint'
                }`}
              />
            ))}
            <span className="ml-2 font-bold text-white text-sm">{rating}.0 / 5.0</span>
          </div>
          {review && (
            <p className="text-ink-soft italic bg-void-700/60 p-2.5 rounded-xl border border-surface-line">
              &quot;{review}&quot;
            </p>
          )}
          {feedback && <p className="text-violet-400 font-bold">{feedback}</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center py-2 bg-void/50 rounded-2xl border border-surface-line p-4">
            <span className="block text-xs font-bold text-ink-soft uppercase mb-2">
              ¿Cómo calificarías la entrega en puerta?
            </span>
            <div className="flex items-center justify-center gap-2 my-1">
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
                      className={`w-7 h-7 transition-colors ${
                        active
                          ? 'text-warn fill-warn drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-ink-faint hover:text-ink-faint'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-warn-soft block mt-1">
              {rating === 5 && '🌟 ¡Excelente servicio!'}
              {rating === 4 && '👍 Muy buen servicio'}
              {rating === 3 && '👌 Aceptable'}
              {rating === 2 && '⚠️ Regular'}
              {rating === 1 && '❌ Mal servicio'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={`text-[11px] py-1 px-2.5 rounded-xl border transition-all ${
                  review.includes(tag)
                    ? 'bg-warn/20 border-warn/50 text-warn-soft font-bold'
                    : 'bg-surface-raised/60 border-surface-line/60 text-ink-mute hover:text-ink'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div>
            <textarea
              rows={2}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Deja un comentario o felicitación opcional..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-void border border-surface-line text-xs text-white placeholder-ink-faint focus:outline-none focus:border-warn/60 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-warn to-warn hover:from-warn hover:to-warn text-void font-black text-xs shadow-lg shadow-warn/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Star className="w-4 h-4 fill-void" />
            <span>{isSubmitting ? 'Enviando...' : 'Guardar Calificación del Repartidor'}</span>
          </button>
        </form>
      )}
    </div>
  );
};
