'use client';

import React, { useState, useEffect } from 'react';
import { Download, Bell, X, Smartphone, CheckCircle, Sparkles } from 'lucide-react';
import { usePushNotifications } from '@/presentation/hooks/usePushNotifications';

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

    // Detectar si ya está en modo standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Detectar iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Escuchar evento de instalación PWA en Android/Chrome
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Escuchar cuando ya se instaló
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    const dismissed = localStorage.getItem('pedidos_trinidad_pwa_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSPrompt(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pedidos_trinidad_pwa_dismissed', 'true');
  };

  const handleActivatePush = async () => {
    const success = await subscribe();
    if (success) {
      setPushStatusMessage('¡Notificaciones Push activadas con éxito! 🔔✨');
      setTimeout(() => setPushStatusMessage(null), 4000);
    }
  };

  // Si el usuario cerró el banner, no mostrar nada más
  if (isDismissed) {
    return null;
  }

  // Si ya está instalada y con permisos push concedidos
  if (isInstalled && isSubscribed) {
    return null;
  }

  // Si no hay evento de instalación ni soporte push
  if (!deferredPrompt && !isIOS && isSubscribed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 text-white relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          title="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="flex-1 pr-4">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-white">Instalar App & Alertas</h4>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Instala Pedidos Trinidad en tu celular para recibir alertas con vibración aunque tengas la pantalla apagada.
            </p>

            {pushStatusMessage && (
              <div className="mt-2 text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{pushStatusMessage}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {/* Botón de Instalación */}
              {(deferredPrompt || isIOS) && !isInstalled && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalar en Celular</span>
                </button>
              )}

              {/* Botón de Notificaciones Push */}
              {isSupported && !isSubscribed && permission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleActivatePush}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{loading ? 'Activando...' : 'Activar Alertas Push'}</span>
                </button>
              )}

              {/* Si ya tiene permisos, botón de prueba */}
              {isSubscribed && (
                <button
                  type="button"
                  onClick={() => sendTestPush()}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Probar Vibración</span>
                </button>
              )}
            </div>

            {/* Instrucción para iOS Safari */}
            {showIOSPrompt && isIOS && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 space-y-1">
                <p className="font-bold text-white">Cómo instalar en iPhone/iPad:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
                  <li>Toca el botón <strong>Compartir (icono del cuadrado con flecha ⎋)</strong> abajo.</li>
                  <li>Desliza y selecciona <strong>&quot;Agregar a Inicio ➕&quot;</strong>.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
