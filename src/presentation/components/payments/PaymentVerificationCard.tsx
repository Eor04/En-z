'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  QrCode,
  CreditCard,
  Banknote,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Lock,
  Image as ImageIcon,
  Loader2,
  Link,
  X,
} from 'lucide-react';

interface PaymentVerificationCardProps {
  order: any;
  onPaymentUpdated: () => void;
}

export function PaymentVerificationCard({
  order,
  onPaymentUpdated,
}: PaymentVerificationCardProps) {
  const payment = order.payment;
  const business = order.business;

  const [receiptUrl, setReceiptUrl] = useState(payment?.receiptUrl || '');
  const [transactionRef, setTransactionRef] = useState(payment?.transactionId || '');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imgTab, setImgTab] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const uploadReceiptImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Solo se permiten imágenes (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('La imagen no puede superar 8MB.');
      return;
    }
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setErrorMessage('Cloudinary no configurado. Usa la pestaña URL.');
      setImgTab('url');
      return;
    }
    setUploadingImg(true);
    setErrorMessage(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      fd.append('folder', 'pedidos_trinidad/receipts');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST', body: fd,
      });
      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      setReceiptUrl(data.secure_url);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al subir imagen');
    } finally {
      setUploadingImg(false);
    }
  }, [CLOUD_NAME, UPLOAD_PRESET]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadReceiptImage(file);
  }, [uploadReceiptImage]);

  // Estados para pago con tarjeta
  const [cardNumber, setCardNumber] = useState('4500 1234 5678 9010');
  const [cardHolder, setCardHolder] = useState('JUAN PEREZ TRINIDAD');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('888');
  const [processingCard, setProcessingCard] = useState(false);

  const handleUploadReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const finalReceiptUrl =
      receiptUrl.trim() ||
      `https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80`;

    setUploading(true);
    try {
      const res = await fetch('/api/payments/upload-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          receiptUrl: finalReceiptUrl,
          transactionReference: transactionRef.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al adjuntar comprobante');

      setUploadSuccess(true);
      onPaymentUpdated();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleProcessCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setProcessingCard(true);

    try {
      const res = await fetch('/api/payments/process-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          cardNumber,
          cardHolder,
          expiry,
          cvv,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar el pago con tarjeta');

      onPaymentUpdated();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setProcessingCard(false);
    }
  };

  if (!payment) return null;

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          {payment.method === 'QR_MANUAL' && <QrCode className="w-4 h-4 text-amber-400" />}
          {payment.method === 'GATEWAY_ONLINE' && <CreditCard className="w-4 h-4 text-blue-400" />}
          {payment.method === 'CASH' && <Banknote className="w-4 h-4 text-emerald-400" />}
          <span>Gestión y Verificación del Pago</span>
        </h3>

        <div className="text-xs">
          {payment.status === 'APPROVED' ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pago Aprobado ✓</span>
            </span>
          ) : payment.status === 'REJECTED' ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Comprobante Rechazado</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Pendiente de Pago</span>
            </span>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* CASO 1: PAGO CON QR SIMPLE EXPRESS */}
      {payment.method === 'QR_MANUAL' && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            {/* QR Code visual preview */}
            <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-white text-slate-950 shadow-lg text-center">
              <img
                src={
                  business?.qrCodeUrl ||
                  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=pago-qr-pedidostrinidad-${order.id}-${payment.amount}`
                }
                alt="QR de Pago"
                className="w-32 h-32 object-contain mx-auto"
              />
              <span className="text-[10px] font-black tracking-wider uppercase mt-1 text-slate-700">
                Simple QR Express
              </span>
              <span className="text-xs font-extrabold text-emerald-600">
                {payment.amount.toFixed(2)} Bs
              </span>
            </div>

            {/* Bank details info */}
            <div className="sm:col-span-8 space-y-2 text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Instrucciones para Transferencia QR:</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Escanea el código QR desde tu app bancaria (Banco Unión, BCP, BNB, FIE, Fassil o Simple) por el total de <strong className="text-emerald-400 font-bold">{payment.amount.toFixed(2)} Bs</strong>.
              </p>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 font-mono">
                <div>Comercio: <span className="text-white font-bold">{business?.name}</span></div>
                <div>Referencia: <span className="text-amber-400 font-bold">ORD-{order.id.slice(0, 6).toUpperCase()}</span></div>
              </div>
            </div>
          </div>

          {/* Formulario de comprobante para el cliente */}
          {payment.status !== 'APPROVED' && (
            <form onSubmit={handleUploadReceipt} className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Adjuntar Comprobante de Transferencia Bancaria</span>
              </div>

              {/* Uploader de comprobante */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] text-slate-400">Foto del comprobante de pago</label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setImgTab('upload')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                        imgTab === 'upload' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-500 hover:text-slate-300'
                      }`}>
                      <Upload className="w-3 h-3 inline mr-0.5" />Subir
                    </button>
                    <button type="button" onClick={() => setImgTab('url')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                        imgTab === 'url' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-500 hover:text-slate-300'
                      }`}>
                      <Link className="w-3 h-3 inline mr-0.5" />URL
                    </button>
                  </div>
                </div>

                {imgTab === 'upload' ? (
                  <div className="space-y-2">
                    {receiptUrl && (
                      <div className="relative group w-full h-28 rounded-xl overflow-hidden border border-slate-700">
                        <img src={receiptUrl} alt="Comprobante" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setReceiptUrl('')}
                          className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-2 left-2 text-[9px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                          Comprobante cargado ✓
                        </span>
                      </div>
                    )}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1.5 py-4 transition-all ${
                        isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-emerald-600/50 hover:bg-slate-800/30'
                      } ${uploadingImg ? 'pointer-events-none opacity-60' : ''}`}
                    >
                      {uploadingImg ? (
                        <><Loader2 className="w-5 h-5 text-emerald-400 animate-spin" /><span className="text-[11px] text-slate-400">Subiendo comprobante...</span></>
                      ) : (
                        <><ImageIcon className="w-5 h-5 text-slate-500" />
                        <span className="text-[11px] text-slate-400 text-center">
                          {receiptUrl ? 'Cambiar comprobante' : 'Arrastra tu foto de comprobante aquí'}<br />
                          <span className="text-slate-600">o haz clic · JPG, PNG · máx 8MB</span>
                        </span></>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadReceiptImage(f); }} />
                    </div>
                  </div>
                ) : (
                  <input
                    type="url"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    placeholder="https://ejemplo.com/comprobante.jpg"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-emerald-500 outline-none"
                  />
                )}
              </div>

              {/* Referencia bancaria */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Nº de Operación / Referencia Bancaria (opcional)
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="Ej. OP-7829410"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={uploading || uploadingImg}
                  className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{uploading ? 'Enviando comprobante...' : 'Enviar Comprobante al Restaurante'}</span>
                </button>

                {payment.receiptUrl && (
                  <span className="text-[11px] text-amber-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Comprobante registrado en sistema</span>
                  </span>
                )}
              </div>
            </form>
          )}

          {payment.receiptUrl && (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Captura de comprobante enviada:</span>
              <a
                href={payment.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 font-bold text-xs"
              >
                <span>Ver Comprobante Adjunto</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* CASO 2: PASARELA CON TARJETA ONLINE */}
      {payment.method === 'GATEWAY_ONLINE' && (
        <div className="space-y-4 pt-2">
          {payment.status === 'APPROVED' ? (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 space-y-1">
              <div className="font-bold flex items-center gap-2 text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Transacción Aprobada por Pasarela Online</span>
              </div>
              <p className="text-slate-400">ID de Autorización Bancaria: <span className="font-mono text-white font-bold">{payment.transactionId}</span></p>
            </div>
          ) : (
            <form onSubmit={handleProcessCardPayment} className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pasarela Segura (Encriptación TLS 256-bit)</span>
                  </span>
                  <span className="text-emerald-400 font-black">{payment.amount.toFixed(2)} Bs</span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Número de Tarjeta (Débito / Crédito)</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Titular de la Tarjeta</label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Vencimiento</label>
                      <input
                        type="text"
                        required
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/AA"
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-center font-mono text-xs focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">CVV</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="***"
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-center font-mono text-xs focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={processingCard}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {processingCard ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Conectando con Pasarela Bancaria...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pagar {payment.amount.toFixed(2)} Bs Ahora</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* CASO 3: EFECTIVO */}
      {payment.method === 'CASH' && (
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1.5">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-emerald-400" />
            <span>Pago en Efectivo contra Entrega</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Ten a mano el monto exacto de <strong className="text-emerald-400 font-bold">{payment.amount.toFixed(2)} Bs</strong> para entregarlo al repartidor cuando llegue a tu domicilio en Trinidad.
          </p>
        </div>
      )}
    </div>
  );
}
