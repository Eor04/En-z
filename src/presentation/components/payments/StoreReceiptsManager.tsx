'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Phone,
  Clock,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Loader2,
  Link,
  X,
  Camera,
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

  // --- QR del comercio ---
  const [currentQrUrl, setCurrentQrUrl] = useState<string | null>(null);
  const [qrUploading, setQrUploading] = useState(false);
  const [qrDragging, setQrDragging] = useState(false);
  const [qrTab, setQrTab] = useState<'upload' | 'url'>('upload');
  const [qrUrlInput, setQrUrlInput] = useState('');
  const [qrFeedback, setQrFeedback] = useState<string | null>(null);
  const qrFileRef = useRef<HTMLInputElement>(null);

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // Cargar QR actual del negocio
  useEffect(() => {
    async function loadBusiness() {
      try {
        const res = await fetch('/api/store/me');
        const data = await res.json();
        if (data.business?.qrCodeUrl) {
          setCurrentQrUrl(data.business.qrCodeUrl);
          setQrUrlInput(data.business.qrCodeUrl);
        }
      } catch (e) { /* silencioso */ }
    }
    loadBusiness();
  }, []);

  const uploadQrImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setQrFeedback('❌ Solo se permiten imágenes (JPG, PNG, WEBP).');
      return;
    }
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setQrFeedback('❌ Cloudinary no configurado. Usa la pestaña URL.');
      setQrTab('url');
      return;
    }
    setQrUploading(true);
    setQrFeedback(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      fd.append('folder', 'pedidos_trinidad/qr_codes');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST', body: fd,
      });
      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      const url = data.secure_url;
      // Guardar en BD
      await saveQrUrl(url);
    } catch (err: any) {
      setQrFeedback(`❌ ${err.message || 'Error al subir imagen'}`);
    } finally {
      setQrUploading(false);
    }
  }, [CLOUD_NAME, UPLOAD_PRESET]);

  const saveQrUrl = async (url: string) => {
    try {
      const res = await fetch('/api/store/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeUrl: url }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setCurrentQrUrl(url);
      setQrUrlInput(url);
      setQrFeedback('✅ Código QR actualizado correctamente. Los clientes ya pueden escanearlo.');
      setTimeout(() => setQrFeedback(null), 5000);
    } catch (err: any) {
      setQrFeedback(`❌ ${err.message}`);
    }
  };

  const handleQrDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setQrDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadQrImage(file);
  }, [uploadQrImage]);

  // --- Comprobantes ---
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
    <div className="space-y-6">

      {/* ════════════════════════════════════════
          SECCIÓN 1: QR DEL COMERCIO
      ════════════════════════════════════════ */}
      <div className="p-5 rounded-3xl glass-panel border border-blue-500/20 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Camera className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Tu Código QR Bancario</h3>
            <p className="text-[11px] text-slate-400">
              Sube la imagen de tu QR — los clientes lo verán cuando paguen por QR en su pedido.
            </p>
          </div>
        </div>

        {qrFeedback && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            qrFeedback.startsWith('✅')
              ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border border-rose-800 text-rose-300'
          }`}>
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{qrFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {/* Preview del QR actual */}
          <div className="sm:col-span-2 flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-700 text-center">
            {currentQrUrl ? (
              <>
                <img src={currentQrUrl} alt="Tu QR" className="w-28 h-28 object-contain mx-auto" />
                <span className="text-[10px] font-black uppercase mt-1 text-slate-600">Tu QR Actual</span>
              </>
            ) : (
              <>
                <QrCode className="w-16 h-16 text-slate-300 mx-auto" />
                <span className="text-[10px] text-slate-400 mt-1">Sin QR configurado</span>
              </>
            )}
          </div>

          {/* Uploader */}
          <div className="sm:col-span-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-semibold">Imagen del código QR</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => setQrTab('upload')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    qrTab === 'upload' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40' : 'text-slate-500 hover:text-slate-300'
                  }`}>
                  <Upload className="w-3 h-3 inline mr-0.5" />Subir
                </button>
                <button type="button" onClick={() => setQrTab('url')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                    qrTab === 'url' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40' : 'text-slate-500 hover:text-slate-300'
                  }`}>
                  <Link className="w-3 h-3 inline mr-0.5" />URL
                </button>
              </div>
            </div>

            {qrTab === 'upload' ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setQrDragging(true); }}
                onDragLeave={() => setQrDragging(false)}
                onDrop={handleQrDrop}
                onClick={() => qrFileRef.current?.click()}
                className={`w-full rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 py-6 transition-all ${
                  qrDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-blue-600/50 hover:bg-slate-800/30'
                } ${qrUploading ? 'pointer-events-none opacity-60' : ''}`}
              >
                {qrUploading ? (
                  <><Loader2 className="w-5 h-5 text-blue-400 animate-spin" /><span className="text-[11px] text-slate-400">Subiendo QR...</span></>
                ) : (
                  <><ImageIcon className="w-5 h-5 text-slate-500" />
                  <span className="text-[11px] text-slate-400 text-center">
                    {currentQrUrl ? 'Reemplazar imagen del QR' : 'Arrastra la foto de tu QR aquí'}<br />
                    <span className="text-slate-600">o haz clic · JPG, PNG · máx 8MB</span>
                  </span></>
                )}
                <input ref={qrFileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadQrImage(f); }} />
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="url"
                  value={qrUrlInput}
                  onChange={(e) => setQrUrlInput(e.target.value)}
                  placeholder="https://ejemplo.com/mi-qr.png"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => { if (qrUrlInput.trim()) saveQrUrl(qrUrlInput.trim()); }}
                  disabled={!qrUrlInput.trim() || qrUploading}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Guardar URL del QR
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SECCIÓN 2: VALIDACIÓN DE COMPROBANTES
      ════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Validación de Comprobantes QR</span>
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
    </div>
  );
}
