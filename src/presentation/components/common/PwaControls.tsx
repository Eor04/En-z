'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, Bell, BellRing, BellOff, Check, Share, Plus } from 'lucide-react';
import { usePwa } from '@/presentation/context/PwaContext';
import { cn } from '@/presentation/lib/utils';
import { EASE_RUNE } from '@/presentation/lib/motion';

/* =========================================================================
 * Barra superior (escritorio): botones compactos con sólo icono
 * ====================================================================== */
export function PwaHeaderActions({ className }: { className?: string }) {
  const {
    canInstall,
    promptInstall,
    pushSupported,
    pushSubscribed,
    pushPermission,
    pushLoading,
    enablePush,
    testPush,
  } = usePwa();

  const showBell = pushSupported && (!pushSubscribed ? pushPermission !== 'denied' : true);

  if (!canInstall && !showBell) return null;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {canInstall && (
        <motion.button
          type="button"
          onClick={promptInstall}
          whileTap={{ scale: 0.94 }}
          title="Instalar En Z en tu dispositivo"
          aria-label="Instalar la aplicación"
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-500/10 px-2.5 text-[12px] font-semibold text-violet-200 transition-colors hover:bg-violet-500/20 hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Instalar app</span>
        </motion.button>
      )}

      {showBell && (
        <motion.button
          type="button"
          onClick={() => (pushSubscribed ? testPush() : enablePush())}
          disabled={pushLoading}
          whileTap={{ scale: 0.94 }}
          title={
            pushSubscribed
              ? 'Notificaciones activas · tocá para probar'
              : 'Activar notificaciones de tus pedidos'
          }
          aria-label={pushSubscribed ? 'Probar notificación' : 'Activar notificaciones'}
          className={cn(
            'relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border transition-colors disabled:opacity-50',
            pushSubscribed
              ? 'border-ok/35 bg-ok/10 text-ok-soft hover:bg-ok/20'
              : 'border-surface-line bg-void-800/70 text-ink-mute hover:border-warn/40 hover:text-warn-soft'
          )}
        >
          {pushSubscribed ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {!pushSubscribed && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-warn" />
          )}
        </motion.button>
      )}
    </div>
  );
}

/* =========================================================================
 * Menú de 3 líneas (móvil): filas anchas y táctiles
 * ====================================================================== */
export function PwaMenuActions({ onDone }: { onDone?: () => void }) {
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
    testPush,
  } = usePwa();

  const showBell = pushSupported && (!pushSubscribed ? pushPermission !== 'denied' : true);
  /* Si el permiso fue denegado no alcanza con ocultar el botón: el usuario
     necesita saber por qué no le llegan avisos y cómo revertirlo. */
  const pushBlocked = pushSupported && !pushSubscribed && pushPermission === 'denied';

  if (!canInstall && !showBell && !isInstalled && !pushBlocked) return null;

  return (
    <div className="mt-2 space-y-2 border-t border-surface-line pt-3">
      <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
        Aplicación
      </p>

      {canInstall && (
        <button
          type="button"
          onClick={promptInstall}
          className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 text-left text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-500/20"
        >
          <Download className="h-4 w-4 shrink-0 text-violet-300" />
          <span className="flex-1">
            Instalar aplicación
            <span className="mt-0.5 block text-[11px] font-normal text-ink-mute">
              Acceso directo en tu pantalla de inicio
            </span>
          </span>
        </button>
      )}

      {isInstalled && (
        <div className="flex w-full items-center gap-3 rounded-2xl border border-ok/25 bg-ok/10 px-4 py-3 text-sm font-semibold text-ok-soft">
          <Check className="h-4 w-4 shrink-0" />
          Aplicación instalada
        </div>
      )}

      {showBell && (
        <button
          type="button"
          onClick={() => {
            if (pushSubscribed) testPush();
            else enablePush().then(() => onDone?.());
          }}
          disabled={pushLoading}
          className={cn(
            'flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors disabled:opacity-50',
            pushSubscribed
              ? 'border-ok/25 bg-ok/10 text-ok-soft hover:bg-ok/20'
              : 'border-warn/25 bg-warn/10 text-warn-soft hover:bg-warn/20'
          )}
        >
          {pushSubscribed ? (
            <BellRing className="h-4 w-4 shrink-0" />
          ) : (
            <Bell className="h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">
            {pushLoading
              ? 'Activando…'
              : pushSubscribed
                ? 'Probar notificación'
                : 'Activar notificaciones'}
            <span className="mt-0.5 block text-[11px] font-normal text-ink-mute">
              {pushSubscribed
                ? 'Ya recibís avisos de tus pedidos'
                : 'Avisos con vibración aunque tengas la pantalla apagada'}
            </span>
          </span>
        </button>
      )}

      {pushBlocked && (
        <div className="flex w-full items-start gap-3 rounded-2xl border border-surface-line bg-void-800/70 px-4 py-3 text-left">
          <BellOff className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
          <span className="text-sm font-semibold text-ink-soft">
            Notificaciones bloqueadas
            <span className="mt-0.5 block text-[11px] font-normal leading-relaxed text-ink-mute">
              Las bloqueaste para este sitio. Activalas desde el candado de la barra de
              direcciones → Notificaciones → Permitir.
            </span>
          </span>
        </div>
      )}

      {/* iOS no tiene diálogo de instalación: hay que explicar el gesto */}
      <AnimatePresence>
        {showIOSHelp && isIOS && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: EASE_RUNE }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-surface-line bg-void-800/70 p-3.5 text-[12px] text-ink-soft">
              <p className="font-bold text-white">Instalar en iPhone o iPad</p>
              <ol className="mt-2 space-y-1.5 text-ink-mute">
                <li className="flex items-center gap-2">
                  <Share className="h-3.5 w-3.5 shrink-0 text-violet-300" />
                  Tocá <strong className="text-white">Compartir</strong> en Safari
                </li>
                <li className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5 shrink-0 text-violet-300" />
                  Elegí <strong className="text-white">Agregar a inicio</strong>
                </li>
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
