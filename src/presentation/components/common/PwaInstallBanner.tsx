'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, Bell, X, Smartphone, CheckCircle, Share, Plus } from 'lucide-react';
import { usePwa } from '@/presentation/context/PwaContext';
import { EASE_RUNE } from '@/presentation/lib/motion';

/**
 * Aviso flotante para instalar la PWA y activar notificaciones.
 *
 * Si el usuario lo cierra no se pierde nada: las mismas acciones viven en la
 * barra superior (escritorio) y en el menú de tres líneas (móvil).
 */
export function PwaInstallBanner() {
  const {
    canInstall,
    isInstalled,
    isIOS,
    showIOSHelp,
    promptInstall,
    pushSupported,
    pushSubscribed,
    pushPermission,
    pushLoading,
    enablePush,
    bannerDismissed,
    dismissBanner,
  } = usePwa();

  const [pushMessage, setPushMessage] = React.useState<string | null>(null);

  const handleEnablePush = async () => {
    const ok = await enablePush();
    if (ok) {
      setPushMessage('Alertas activadas.');
      window.setTimeout(() => setPushMessage(null), 4000);
    }
  };

  const needsPush = pushSupported && !pushSubscribed && pushPermission !== 'denied';
  const visible = !bannerDismissed && (canInstall || needsPush);

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ duration: 0.45, ease: EASE_RUNE, delay: 1.2 }}
          className="rune-glass fixed bottom-4 left-3 right-3 z-[70] rounded-3xl p-4 sm:left-auto sm:right-6 sm:max-w-sm"
        >
          <button
            onClick={dismissBanner}
            aria-label="Cerrar aviso"
            className="absolute right-3 top-3 cursor-pointer rounded-lg p-1.5 text-ink-faint transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-300/25 bg-grad-rune text-white shadow-glow-violet">
              <Smartphone className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1 pr-5">
              <h3 className="flex items-center gap-2 font-display text-[13px] font-bold text-white">
                Instalá En Z
                <span className="rounded-md border border-violet-400/30 bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold text-violet-300">
                  PWA
                </span>
              </h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-mute">
                Sumala a tu pantalla de inicio y recibí alertas con vibración aunque tengas el
                celular bloqueado.
              </p>

              <AnimatePresence>
                {pushMessage && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 flex items-center gap-1.5 overflow-hidden rounded-lg border border-ok/25 bg-ok/10 p-2 text-[11px] font-semibold text-ok-soft"
                  >
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    {pushMessage}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {canInstall && (
                  <button
                    type="button"
                    onClick={promptInstall}
                    className="sheen flex cursor-pointer items-center gap-1.5 rounded-xl border border-violet-300/30 bg-grad-rune px-3 py-2 text-[11px] font-bold text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Instalar
                  </button>
                )}

                {needsPush && (
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    disabled={pushLoading}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-[11px] font-bold text-warn-soft transition-colors hover:bg-warn/20 disabled:opacity-50"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {pushLoading ? 'Activando…' : 'Activar alertas'}
                  </button>
                )}
              </div>

              <p className="mt-2.5 text-[10px] leading-relaxed text-ink-faint">
                Si lo cerrás, seguís teniendo estas opciones en el menú de arriba.
              </p>

              <AnimatePresence>
                {showIOSHelp && isIOS && !isInstalled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2.5 overflow-hidden"
                  >
                    <div className="rounded-xl border border-surface-line bg-void-800/70 p-3 text-[11px] text-ink-soft">
                      <p className="font-bold text-white">Instalar en iPhone / iPad</p>
                      <ol className="mt-1.5 space-y-1 text-ink-mute">
                        <li className="flex items-center gap-1.5">
                          <Share className="h-3 w-3 shrink-0 text-violet-300" />
                          Tocá <strong className="text-white">Compartir</strong>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Plus className="h-3 w-3 shrink-0 text-violet-300" />
                          Elegí <strong className="text-white">Agregar a inicio</strong>
                        </li>
                      </ol>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
