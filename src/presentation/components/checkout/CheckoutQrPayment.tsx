'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { QrCode, Store, Check, AlertCircle, Bike } from 'lucide-react';
import { CloudinaryUploader } from '@/presentation/components/common/CloudinaryUploader';
import { Badge, Input } from '@/presentation/components/ui';
import { bs, cn } from '@/presentation/lib/utils';
import { EASE_RUNE } from '@/presentation/lib/motion';

export interface ReceiptEntry {
  receiptUrl: string;
  reference: string;
}

export interface QrGroup {
  businessId: string;
  businessName: string;
  qrCodeUrl?: string | null;
  subtotal: number;
  /** Monto real a transferir: incluye el envío si es el primer local. */
  amount: number;
  carriesDeliveryFee: boolean;
}

/**
 * Pago por QR dentro del checkout.
 *
 * Antes el cliente confirmaba el pedido y recién en la pantalla de seguimiento
 * veía el QR y subía el comprobante. Con dos locales eso eran dos pasos más,
 * y si no los completaba el pedido quedaba parado sin avisar a nadie.
 * Acá transfiere y adjunta todo antes de confirmar.
 */
export function CheckoutQrPayment({
  groups,
  deliveryFee,
  receipts,
  onChange,
}: {
  groups: QrGroup[];
  deliveryFee: number;
  receipts: Record<string, ReceiptEntry>;
  onChange: (businessId: string, entry: ReceiptEntry) => void;
}) {
  const listos = groups.filter((g) => receipts[g.businessId]?.receiptUrl).length;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: EASE_RUNE }}
      className="overflow-hidden"
    >
      <div className="mt-3 space-y-3 rounded-2xl border border-warn/30 bg-warn/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[12px] font-bold text-warn-soft">
            <QrCode className="h-4 w-4" />
            {groups.length > 1
              ? `Transferí a cada local (${groups.length} QR)`
              : 'Transferí y adjuntá tu comprobante'}
          </p>
          <Badge tone={listos === groups.length ? 'ok' : 'warn'} dot>
            {listos} de {groups.length} adjuntos
          </Badge>
        </div>

        {groups.length > 1 && (
          <p className="text-[11px] leading-relaxed text-ink-mute">
            Cada comercio cobra por separado, así que son {groups.length} transferencias
            distintas. El envío de {bs(deliveryFee)} Bs va incluido en el primero.
          </p>
        )}

        {groups.map((g, i) => {
          const entry = receipts[g.businessId] ?? { receiptUrl: '', reference: '' };
          const listo = Boolean(entry.receiptUrl);

          return (
            <div
              key={g.businessId}
              className={cn(
                'rounded-2xl border p-4 transition-colors',
                listo
                  ? 'border-ok/40 bg-ok/5'
                  : 'border-surface-line bg-void-800/70'
              )}
            >
              {/* Cabecera del local */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                      listo
                        ? 'border-ok/40 bg-ok/15 text-ok'
                        : 'border-violet-400/30 bg-violet-500/12 text-violet-300'
                    )}
                  >
                    {listo ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 truncate font-display text-[13px] font-bold text-white">
                      <Store className="h-3.5 w-3.5 shrink-0 text-warn" />
                      {g.businessName}
                    </span>
                    {g.carriesDeliveryFee && (
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] text-ink-faint">
                        <Bike className="h-3 w-3" />
                        Incluye {bs(deliveryFee)} Bs de envío
                      </span>
                    )}
                  </span>
                </span>

                <span className="shrink-0 text-right">
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                    Transferir
                  </span>
                  <span className="font-display text-lg font-bold text-arc tabular">
                    {bs(g.amount)} Bs
                  </span>
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
                {/* QR del comercio */}
                <div className="flex flex-col items-center gap-2">
                  {g.qrCodeUrl ? (
                    <a
                      href={g.qrCodeUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Abrir el QR en grande"
                      className="block overflow-hidden rounded-xl border border-surface-line bg-white p-1.5 transition-transform hover:scale-[1.03]"
                    >
                      <img
                        src={g.qrCodeUrl}
                        alt={`QR de ${g.businessName}`}
                        className="h-[130px] w-[130px] object-contain"
                      />
                    </a>
                  ) : (
                    <div className="flex h-[142px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-warn/40 bg-warn/5 p-3 text-center">
                      <AlertCircle className="h-5 w-5 text-warn" />
                      <span className="text-[10px] leading-tight text-warn-soft">
                        Este local aún no cargó su QR. Coordiná el pago por WhatsApp o
                        elegí efectivo.
                      </span>
                    </div>
                  )}
                  {g.qrCodeUrl && (
                    <span className="text-[10px] text-ink-faint">Tocá para ampliar</span>
                  )}
                </div>

                {/* Comprobante */}
                <div className="space-y-2.5">
                  <CloudinaryUploader
                    value={entry.receiptUrl}
                    onChange={(url) => onChange(g.businessId, { ...entry, receiptUrl: url })}
                    folder="comprobantes"
                    label="Captura de la transferencia"
                    previewHeight={96}
                    aspect="square"
                  />
                  <Input
                    value={entry.reference}
                    onChange={(e) =>
                      onChange(g.businessId, { ...entry, reference: e.target.value })
                    }
                    placeholder="N° de transacción (opcional)"
                    className="h-10 text-[12px]"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
