'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Snowflake, Phone, ArrowLeft, MessageCircle, Clock } from 'lucide-react';
import { EnZLogo } from '@/presentation/components/brand/EnZLogo';
import { Panel, Skeleton } from '@/presentation/components/ui';
import { EASE_RUNE } from '@/presentation/lib/motion';

function FrozenContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || '';

  return (
    <div className="relative flex min-h-[calc(100dvh-68px)] items-center justify-center px-4 py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.18), transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE_RUNE }}
        className="relative w-full max-w-md"
      >
        <Panel className="p-8 text-center">
          {/* Emblema congelado */}
          <div className="mb-7 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-info/20 blur-2xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-info/30 bg-info/10">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                  className="text-info"
                >
                  <Snowflake className="h-11 w-11" />
                </motion.span>
              </div>
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-void bg-ember font-display text-[12px] font-bold text-white">
                !
              </span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            Cuenta congelada
          </h1>
          <p className="mt-2 text-[13px] text-info-soft">
            Tu acceso a En Z está suspendido temporalmente.
          </p>

          {reason && (
            <div className="mt-6 rounded-2xl border border-info/30 bg-info/10 p-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-info">Motivo</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                {decodeURIComponent(reason)}
              </p>
            </div>
          )}

          <div className="my-7 h-px bg-surface-line" />

          <p className="mb-4 text-[12px] text-ink-mute">
            Escribinos y lo resolvemos:
          </p>

          <div className="space-y-3">
            <a
              href="https://wa.me/59177848278?text=Hola,%20mi%20cuenta%20en%20En%20Z%20fue%20congelada%20y%20necesito%20ayuda."
              target="_blank"
              rel="noopener noreferrer"
              className="sheen flex w-full items-center justify-center gap-3 rounded-2xl border border-ok/35 bg-ok/15 px-6 py-3.5 font-display text-[13px] font-bold text-ok-soft transition-all hover:-translate-y-0.5 hover:bg-ok/25"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp soporte
            </a>

            <a
              href="tel:+59177848278"
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-surface-line bg-void-800/70 px-6 py-3.5 font-display text-[13px] font-bold text-white transition-colors hover:border-violet-400/40"
            >
              <Phone className="h-5 w-5 text-violet-300" />
              <span className="tabular">77848278</span>
            </a>
          </div>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-ink-faint">
            <Clock className="h-3.5 w-3.5" />
            Lun a sáb · 8:00 – 20:00
          </p>

          <Link
            href="/auth/login"
            className="group mt-7 flex items-center justify-center gap-2 text-[12px] text-ink-mute transition-colors hover:text-violet-300"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            Volver al inicio de sesión
          </Link>
        </Panel>

        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-ink-faint">
          <EnZLogo size={18} glow={false} />
          En Z © {new Date().getFullYear()}
        </div>
      </motion.div>
    </div>
  );
}

export default function FrozenAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60dvh] items-center justify-center px-4">
          <Skeleton className="h-[520px] w-full max-w-md rounded-[28px]" />
        </div>
      }
    >
      <FrozenContent />
    </Suspense>
  );
}
