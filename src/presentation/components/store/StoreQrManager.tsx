'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { QrCode, CheckCircle2, AlertCircle, Info, Smartphone } from 'lucide-react';
import { CloudinaryUploader } from '@/presentation/components/common/CloudinaryUploader';
import { Badge, Button, Panel, Skeleton } from '@/presentation/components/ui';
import { EASE_RUNE } from '@/presentation/lib/motion';

/**
 * QR de cobro del comercio.
 *
 * Esta pestaña solía listar comprobantes para verificarlos uno por uno. Desde
 * que la tienda acepta el pedido y el pago en un solo botón, esa lista quedó
 * de más: acá sólo se administra el QR que ven los clientes al pagar.
 */
export function StoreQrManager({ businessName }: { businessName?: string }) {
  const [qrUrl, setQrUrl] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/store/me');
        const data = await res.json();
        if (alive && data.business?.qrCodeUrl) {
          setQrUrl(data.business.qrCodeUrl);
          setSaved(data.business.qrCodeUrl);
        }
      } catch {
        /* silencioso: el uploader queda vacío */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const guardar = async (url: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/store/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeUrl: url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'No se pudo guardar el QR');
      }
      setSaved(url);
      setFeedback({
        type: 'ok',
        text: 'QR actualizado. Tus clientes ya lo ven al pagar en el checkout.',
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-80 rounded-3xl" />;
  }

  const sinGuardar = qrUrl !== saved && Boolean(qrUrl);

  return (
    <Panel className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 font-display text-[15px] font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/12 text-violet-300">
            <QrCode className="h-4 w-4" />
          </span>
          Mi QR de cobro
        </h3>
        <Badge tone={saved ? 'ok' : 'warn'} dot>
          {saved ? 'Publicado' : 'Sin cargar'}
        </Badge>
      </div>

      <p className="mb-5 text-[13px] leading-relaxed text-ink-mute">
        Es el QR de tu cuenta bancaria{businessName ? ` de ${businessName}` : ''}. Los clientes
        que elijan pago por QR lo van a ver en el checkout junto al monto exacto a transferir, y
        vos aprobás el comprobante al aceptar el pedido.
      </p>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Vista previa tal como lo ve el cliente */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Así lo ve el cliente
          </p>
          {saved ? (
            <div className="rounded-2xl border border-surface-line bg-white p-2">
              <img
                src={saved}
                alt="QR de cobro del comercio"
                className="h-[200px] w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-[216px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-warn/40 bg-warn/5 p-4 text-center">
              <AlertCircle className="h-6 w-6 text-warn" />
              <p className="text-[11px] leading-relaxed text-warn-soft">
                Sin QR cargado, tus clientes no pueden pagarte por transferencia.
              </p>
            </div>
          )}
        </div>

        {/* Carga */}
        <div className="space-y-4">
          <CloudinaryUploader
            value={qrUrl}
            onChange={setQrUrl}
            folder="pedidos_trinidad/qr_codes"
            label="Imagen del QR"
            previewHeight={140}
            aspect="square"
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="md"
              loading={saving}
              disabled={!qrUrl || (!sinGuardar && !saving)}
              onClick={() => guardar(qrUrl)}
            >
              {!saving && <CheckCircle2 className="h-4 w-4" />}
              {saved ? 'Actualizar QR' : 'Publicar QR'}
            </Button>

            {sinGuardar && (
              <span className="text-[11px] font-semibold text-warn-soft">
                Tenés cambios sin guardar
              </span>
            )}
          </div>

          <AnimatePresence>
            {feedback && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE_RUNE }}
                className={`overflow-hidden rounded-xl border p-3 text-[12px] font-semibold ${
                  feedback.type === 'ok'
                    ? 'border-ok/30 bg-ok/10 text-ok-soft'
                    : 'border-danger/30 bg-danger/10 text-danger-soft'
                }`}
              >
                {feedback.text}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex items-start gap-2.5 rounded-2xl border border-surface-line bg-void-800/60 p-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
            <p className="text-[11px] leading-relaxed text-ink-mute">
              Sacá la captura desde tu app bancaria (Simple, BCP, BNB, FIE) con el QR bien
              visible y sin recortar. Si cambiás de cuenta, actualizalo acá y el cambio se
              aplica al instante.
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border border-info/25 bg-info/10 p-3.5">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-info" />
            <p className="text-[11px] leading-relaxed text-info-soft">
              Los comprobantes ya no se revisan en esta pestaña: aparecen dentro de cada
              pedido en <strong>Comandas &amp; cocina</strong>, y se aprueban con el mismo
              botón que acepta el pedido.
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
