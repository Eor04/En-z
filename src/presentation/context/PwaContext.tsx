'use client';

import * as React from 'react';
import { usePushNotifications } from '@/presentation/hooks/usePushNotifications';

/**
 * Estado PWA compartido.
 *
 * `beforeinstallprompt` se dispara UNA sola vez y muy temprano: si cada
 * componente lo escuchara por su cuenta, el que monte tarde se lo pierde.
 * Por eso lo capturamos acá arriba y lo repartimos a la barra superior, al
 * menú móvil y al aviso flotante.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaValue {
  /** Se puede lanzar el diálogo nativo de instalación. */
  canInstall: boolean;
  /** La app ya corre en modo standalone. */
  isInstalled: boolean;
  isIOS: boolean;
  /** iOS no expone API de instalación: hay que explicar el paso a mano. */
  showIOSHelp: boolean;
  setShowIOSHelp: (v: boolean) => void;
  promptInstall: () => Promise<void>;

  pushSupported: boolean;
  pushSubscribed: boolean;
  pushPermission: NotificationPermission;
  pushLoading: boolean;
  enablePush: () => Promise<boolean>;
  testPush: () => void;

  /** El aviso flotante fue cerrado; los controles del header siguen disponibles. */
  bannerDismissed: boolean;
  dismissBanner: () => void;
}

const Ctx = React.createContext<PwaValue | null>(null);

const DISMISS_KEY = 'enz_pwa_dismissed';

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [showIOSHelp, setShowIOSHelp] = React.useState(false);
  const [bannerDismissed, setBannerDismissed] = React.useState(true);

  const push = usePushNotifications({ autoRegisterServiceWorker: true });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(standalone);

    setIsIOS(/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()));

    try {
      setBannerDismissed(localStorage.getItem(DISMISS_KEY) === 'true');
    } catch {
      setBannerDismissed(false);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = React.useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setIsInstalled(true);
      setDeferred(null);
      return;
    }
    if (isIOS) setShowIOSHelp(true);
  }, [deferred, isIOS]);

  const dismissBanner = React.useCallback(() => {
    setBannerDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      /* modo privado */
    }
  }, []);

  const value = React.useMemo<PwaValue>(
    () => ({
      canInstall: (Boolean(deferred) || isIOS) && !isInstalled,
      isInstalled,
      isIOS,
      showIOSHelp,
      setShowIOSHelp,
      promptInstall,
      pushSupported: push.isSupported,
      pushSubscribed: push.isSubscribed,
      pushPermission: push.permission,
      pushLoading: push.loading,
      enablePush: push.subscribe,
      testPush: push.sendTestPush,
      bannerDismissed,
      dismissBanner,
    }),
    [
      deferred,
      isInstalled,
      isIOS,
      showIOSHelp,
      promptInstall,
      push.isSupported,
      push.isSubscribed,
      push.permission,
      push.loading,
      push.subscribe,
      push.sendTestPush,
      bannerDismissed,
      dismissBanner,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePwa() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('usePwa debe usarse dentro de <PwaProvider>');
  return ctx;
}
