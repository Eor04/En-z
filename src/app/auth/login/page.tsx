export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UnifiedLoginForm } from '@/presentation/components/auth/UnifiedLoginForm';
import { EnZLogo } from '@/presentation/components/brand/EnZLogo';
import { Skeleton } from '@/presentation/components/ui';

export const metadata = {
  title: 'Iniciar sesión',
  description:
    'Portal unificado de En Z para clientes, tiendas, repartidores y administración.',
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[calc(100dvh-68px)] flex-col justify-center overflow-hidden py-14 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.22), transparent 70%)' }}
      />

      <header className="relative mb-8 text-center">
        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2 text-[12px] font-semibold text-ink-mute transition-colors hover:text-violet-300"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Volver al inicio
        </Link>

        <div className="flex flex-col items-center gap-3">
          <EnZLogo size={64} className="animate-float" />
          <span className="font-display text-3xl font-bold tracking-[0.3em] text-white">
            EN<span className="text-arc"> Z</span>
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-300/60">
            Acceso por roles
          </p>
        </div>
      </header>

      <div className="relative px-4 sm:px-0">
        <Suspense
          fallback={
            <div className="mx-auto w-full max-w-xl space-y-6">
              <Skeleton className="h-[74px] rounded-2xl" />
              <Skeleton className="h-[420px] rounded-[28px]" />
            </div>
          }
        >
          <UnifiedLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
