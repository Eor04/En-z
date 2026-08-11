'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, Bell, X, Smartphone, CheckCircle, Zap } from 'lucide-react';
import { usePushNotifications } from '@/presentation/hooks/usePushNotifications';
import { EASE_RUNE } from '@/presentation/lib/motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);

  const { isSupported, isSubscribed, permission, loading, subscribe, sendTestPush } =
    usePushNotifications({ autoRegisterServiceWorker: true });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    if (localStorage.getItem('enz_pwa_dismissed') === 'true') setIsDismissed(true);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSPrompt(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('enz_pwa_dismissed', 'true');
  };

  const handleActivatePush = async () => {
    const ok = await subscribe();
    if (ok) {
      setPushStatusMessage('Alertas activadas.');
      setTimeout(() => setPushStatusMessage(null), 4000);
    }
  };

  const hidden =
    isDismissed || (isInstalled && isSubscribed) || (!deferredPrompt && !isIOS && isSubscribed);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.aside
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ duration: 0.45, ease: EASE_RUNE, delay: 1.2 }}
          className="rune-glass fixed bottom-4 left-4 right-4 z-[70] rounded-3xl p-4 sm:left-auto sm:right-6 sm:max-w-sm"
        >
          <button
            onClick={handleDismiss}
            aria-label="Cerrar aviso"
            className="absolute right-3 top-3 cursor-pointer rounded-lg p-1.5 text-ink-faint transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-300/25 bg-grad-rune text-white shadow-glow-violet">
              <Smartphone className="h-5 w-5" />
            </span>

            <div className="flex-1 pr-5">
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
                {pushStatusMessage && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 flex items-center gap-1.5 overflow-hidden rounded-lg border border-ok/25 bg-ok/10 p-2 text-[11px] font-semibold text-ok-soft"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {pushStatusMessage}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(deferredPrompt || isIOS) && !isInstalled && (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="sheen flex cursor-pointer items-center gap-1.5 rounded-xl border border-violet-300/30 bg-grad-rune px-3 py-2 text-[11px] font-bold text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Instalar
                  </button>
                )}

                {isSupported && !isSubscribed && permission !== 'granted' && (
                  <button
                    type="button"
                    onClick={handleActivatePush}
                    disabled={loading}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-[11px] font-bold text-warn-soft transition-colors hover:bg-warn/20 disabled:opacity-50"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {loading ? 'Activando…' : 'Activar alertas'}
                  </button>
                )}

                {isSubscribed && (
                  <button
                    type="button"
                    onClick={() => sendTestPush()}
                    className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-surface-line px-3 py-2 text-[11px] font-medium text-ink-soft transition-colors hover:border-violet-400/40 hover:text-white"
                  >
                    <Zap className="h-3 w-3 text-warn" />
                    Probar vibración
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showIOSPrompt && isIOS && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2.5 overflow-hidden"
                  >
                    <div className="rounded-xl border border-surface-line bg-void-800/70 p-3 text-[11px] text-ink-soft">
                      <p className="font-bold text-white">Instalar en iPhone / iPad</p>
                      <ol className="mt-1 list-inside list-decimal space-y-0.5 text-ink-mute">
                        <li>Tocá el botón <strong>Compartir</strong> del navegador.</li>
                        <li>Elegí <strong>“Agregar a inicio”</strong>.</li>
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
