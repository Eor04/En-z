export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import prisma from '@/infrastructure/db/prisma';

async function getSpacesData() {
  try {
    return await prisma.space.findMany({
      include: {
        businesses: {
          select: {
            id: true,
            name: true,
            category: true,
            isOpen: true,
            isActive: true,
          },
        },
      },
    });
  } catch (error) {
    return [];
  }
}

export default async function HomePage() {
  const spaces = await getSpacesData();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Background glow elements */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-600/15 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6 animate-float">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Plataforma Delivery Modular • Arquitectura Limpia</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight sm:leading-none">
              Tus Patios de Comida favoritos en{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
                Trinidad
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed">
              Explora restaurantes agrupados por espacios físicos como <strong>El Bosque</strong>, <strong>Plaza Verde</strong> o <strong>Aloha</strong>, además de Licorerías 24h y Farmacias express. Pide por QR con comprobante, tarjeta online o efectivo.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/spaces"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 hover:shadow-emerald-500/35 transition-all flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explorar Patios de Comida</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/orders"
                className="px-6 py-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white font-semibold text-sm transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Rastrear Mis Pedidos</span>
              </Link>

              <Link
                href="/auth/login"
                className="px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-sm transition-all flex items-center gap-2"
              >
                <span>Iniciar Sesión / Registro</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Portales por Rol */}
      <section className="py-12 bg-slate-950/60 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Arquitectura Modular y Portales Dedicados
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Cada actor del ecosistema cuenta con un portal adaptado a su caso de uso
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Clientes */}
            <div className="glass-panel rounded-3xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Portal Clientes</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Google Login 1-click, filtros avanzados por patio físico y precio, carrito interactivo y pago por QR/Pasarela.
                </p>
              </div>
              <Link
                href="/auth/login?tab=customer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 pt-3 border-t border-slate-800"
              >
                <span>Entrar como Cliente</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 2. Tiendas */}
            <div className="glass-panel rounded-3xl p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Portal Tiendas</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Control de asistencia (Abierto/Cerrado), gestión de menú por productos con categorías y verificación de comprobantes QR.
                </p>
              </div>
              <Link
                href="/auth/login?tab=store"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 pt-3 border-t border-slate-800"
              >
                <span>Entrar como Tienda</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 3. Repartidores */}
            <div className="glass-panel rounded-3xl p-6 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Bike className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Portal Delivery</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Ingreso rápido con código único de repartidor (DRV-XXX), tracking detallado de tiempos y resumen de ganancias netas.
                </p>
              </div>
              <Link
                href="/auth/login?tab=driver"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 pt-3 border-t border-slate-800"
              >
                <span>Entrar como Repartidor</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 4. Administrador */}
            <div className="glass-panel rounded-3xl p-6 border border-rose-500/20 hover:border-rose-500/40 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Admin General</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Creación de espacios físicos, alta de comercios, control de suscripción mensual flat (100 Bs) y botón de kill-switch.
                </p>
              </div>
              <Link
                href="/auth/login?tab=admin"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 pt-3 border-t border-slate-800"
              >
                <span>Consola Maestra</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Espacios Gastronómicos Registrados */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Espacios Físicos</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Patios de Comida & Galerías en Trinidad
              </h2>
            </div>
            <Link
              href="/spaces"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Ver todos los espacios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="glass-panel rounded-3xl overflow-hidden border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {space.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {space.businesses.length} tiendas
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">{space.description}</p>
                </div>

                <div className="p-4 bg-slate-900/60 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Locales destacados:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {space.businesses.map((biz) => (
                      <span
                        key={biz.id}
                        className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[10px] border border-slate-700"
                      >
                        {biz.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Métodos de Pago Soportados */}
      <section className="py-12 bg-slate-900/40 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Pasarela de Pagos Integrada y Flexible
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Diseñado para el mercado local con 3 opciones de cobro seguras y eficientes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl glass-panel-light border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Pago Express por QR</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Generación de QR y dropzone para subir captura del comprobante bancario verificado por la tienda.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-panel-light border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Pasarela Online (Gateway)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Cobro con tarjeta y confirmación automática en tiempo real mediante Webhook (/api/webhooks/payments).
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-panel-light border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Efectivo al Recibir</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Pago contra entrega directa al repartidor en la puerta del domicilio del cliente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
