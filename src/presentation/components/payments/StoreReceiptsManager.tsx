'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Phone,
  Clock,
  RefreshCw,
  ShoppingBag,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface StoreReceiptsManagerProps {
  businessId?: string;
  onReceiptVerified?: () => void;
}

export function StoreReceiptsManager({
  businessId,
  onReceiptVerified,
}: StoreReceiptsManagerProps) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const url = businessId
        ? `/api/payments/verify?businessId=${businessId}`
        : `/api/payments/verify`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setReceipts(data.receipts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [businessId]);

  const handleVerify = async (paymentId: string, approved: boolean, reason?: string) => {
    setActionLoading(paymentId);
    setFeedback(null);

    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          approved,
          rejectionReason: reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al verificar comprobante');

      setFeedback(
        approved
          ? '✓ Comprobante APROBADO: El pedido ha pasado automáticamente a cocina.'
          : 'Comprobante rechazado correctamente.'
      );
      setRejectingId(null);
      setRejectReason('');
      await fetchReceipts();
      if (onReceiptVerified) onReceiptVerified();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Validación de Comprobantes QR Simple</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Verifica los comprobantes bancarios subidos por tus clientes antes de enviar a cocina.
          </p>
        </div>

        <button
          onClick={fetchReceipts}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Buscando comprobantes pendientes...</span>
        </div>
      ) : receipts.length === 0 ? (
        <div className="p-8 rounded-2xl glass-panel border border-slate-800 text-center text-xs text-slate-400">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400/60" />
          <p className="font-bold text-white">No hay comprobantes pendientes de revisión</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Los nuevos pagos QR con comprobante adjunto aparecerán aquí en tiempo real.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {receipts.map((payment) => {
            const order = payment.order;
            const isActing = actionLoading === payment.id;
            const isRejecting = rejectingId === payment.id;

            return (
              <div
                key={payment.id}
                className="p-5 rounded-3xl glass-panel border border-amber-500/30 hover:border-amber-500/50 transition-all space-y-4 shadow-xl shadow-amber-950/10"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ORD-#{order?.id?.slice(0, 6)?.toUpperCase()}
                    </span>
                    <h4 className="font-bold text-white text-xs mt-1.5">
                      Cliente: {order?.customer?.name || 'Cliente'}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{order?.customerPhone || order?.customer?.phone}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Monto a Verificar</div>
                    <div className="text-base font-black text-emerald-400">
                      {payment.amount.toFixed(2)} Bs
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300">
                  <div className="font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" />
                    <span>Platos del Pedido:</span>
                  </div>
                  {order?.items?.map((item: any) => (
                    <div key={item.id} className="truncate">
                      • {item.quantity}x {item.product?.name || 'Plato'}
                    </div>
                  ))}
                </div>

                {/* Receipt Screenshot Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">Comprobante Adjunto:</span>
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Abrir imagen completa</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="h-40 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative group">
                    <img
                      src={payment.receiptUrl}
                      alt="Comprobante de Pago"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {payment.transactionId && (
                    <div className="text-[11px] text-slate-400">
                      Ref / Operación: <span className="font-mono text-white font-bold">{payment.transactionId}</span>
                    </div>
                  )}
                </div>

                {/* Rejection Form Input */}
                {isRejecting && (
                  <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/80 space-y-2 text-xs">
                    <label className="block text-[11px] font-bold text-rose-300">
                      Motivo del rechazo:
                    </label>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Ej. Monto incompleto, no se ve la fecha..."
                      className="w-full p-2 rounded-xl bg-slate-950 border border-rose-700 text-white text-xs outline-none focus:border-rose-500"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleVerify(payment.id, false, rejectReason)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                      >
                        Confirmar Rechazo
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!isRejecting && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleVerify(payment.id, true)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isActing ? 'Aprobando...' : 'Aprobar Pago ✓'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => setRejectingId(payment.id)}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-rose-500 hover:text-rose-400 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
