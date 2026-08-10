'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Snowflake, Phone, ArrowLeft, MessageCircle } from 'lucide-react';
import Link from 'next/link';

// Componente interno que usa useSearchParams (requiere Suspense en Next.js 14)
function FrozenContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Fondo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card principal */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10 text-center">
          {/* Icono */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Snowflake className="w-12 h-12 text-blue-400 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-black">!</span>
              </div>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-black text-white mb-2 tracking-tight">
            Cuenta Congelada
          </h1>
          <p className="text-blue-300/80 text-sm font-medium mb-6">
            Tu acceso a Pedidos Trinidad ha sido suspendido temporalmente.
          </p>

          {/* Motivo */}
          {reason && (
            <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-left">
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">Motivo:</p>
              <p className="text-sm text-slate-300">{decodeURIComponent(reason)}</p>
            </div>
          )}

          {/* Separador */}
          <div className="w-full h-px bg-slate-800 mb-6" />

          {/* CTA contactar soporte */}
          <p className="text-slate-400 text-xs mb-4">
            Para resolver esta situación, contacta a nuestro equipo de soporte:
          </p>

          <div className="space-y-3">
            <a
              href="https://wa.me/59177848278?text=Hola,%20mi%20cuenta%20en%20Pedidos%20Trinidad%20fue%20congelada%20y%20necesito%20ayuda."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm shadow-lg shadow-green-600/20 transition-all hover:shadow-green-500/30 hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5" />
              <span>WhatsApp Soporte</span>
            </a>

            <a
              href="tel:+59177848278"
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm transition-all"
            >
              <Phone className="w-5 h-5 text-blue-400" />
              <span>77848278</span>
            </a>
          </div>

          {/* Horario */}
          <p className="text-slate-600 text-[11px] mt-4">
            Atención: Lun – Sáb · 8:00 am – 8:00 pm
          </p>

          {/* Volver al inicio */}
          <Link
            href="/auth/login"
            className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al inicio de sesión
          </Link>
        </div>

        {/* Logo pie */}
        <p className="text-center text-slate-600 text-[11px] mt-4">
          Pedidos Trinidad © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

// Página exportada con Suspense boundary (requerido por Next.js 14 para useSearchParams)
export default function FrozenAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FrozenContent />
    </Suspense>
  );
}
