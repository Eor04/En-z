'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
  QrCode,
  CreditCard,
  Banknote,
  Search,
  PackageCheck,
  MapPin,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  Button,
  Panel,
  SectionHeader,
  Reveal,
  StaggerList,
  StaggerItem,
  Badge,
} from '@/presentation/components/ui';
import { EnZLogo } from '@/presentation/components/brand/EnZLogo';
import { cn } from '@/presentation/lib/utils';
import { EASE_RUNE } from '@/presentation/lib/motion';

export interface SpaceCardData {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  businesses: { id: string; name: string; isOpen: boolean }[];
}

/* ========================================================================
 * ESPACIOS
 * ===================================================================== */
export function SpacesShowcase({ spaces }: { spaces: SpaceCardData[] }) {
  if (spaces.length === 0) return null;

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Espacios físicos"
          title="Patios de comida y galerías"
          subtitle="Cada espacio agrupa varios comercios. Podés armar un pedido con platos de distintos locales del mismo patio."
          action={
            <Button href="/spaces" variant="outline" size="sm">
              Ver todos
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          }
        />

        <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {spaces.map((space) => {
            const openCount = space.businesses.filter((b) => b.isOpen).length;
            return (
              <StaggerItem key={space.id}>
                <Link href={`/spaces/${space.id}`} className="block h-full">
                  <Panel
                    interactive
                    className="flex h-full flex-col justify-between overflow-hidden"
                  >
                    <div className="relative p-5">
                      {/* marca de agua */}
                      <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.07] transition-transform duration-500 group-hover:rotate-45">
                        <EnZLogo size={110} glow={false} />
                      </div>

                      <div className="relative flex items-start justify-between gap-2">
                        <h3 className="font-display text-lg font-bold leading-snug text-white transition-colors group-hover:text-arc-soft">
                          {space.name}
                        </h3>
                        <Badge tone={openCount > 0 ? 'ok' : 'mute'} dot>
                          {openCount > 0 ? `${openCount} abiertos` : 'cerrado'}
                        </Badge>
                      </div>

                      {space.description && (
                        <p className="relative mt-3 line-clamp-3 text-[13px] leading-relaxed text-ink-mute">
                          {space.description}
                        </p>
                      )}

                      {space.address && (
                        <p className="relative mt-3 flex items-center gap-1.5 text-[11px] text-ink-faint">
                          <MapPin className="h-3 w-3 text-violet-400" />
                          <span className="truncate">{space.address}</span>
                        </p>
                      )}
                    </div>

                    <div className="border-t border-surface-line bg-void-800/50 p-4">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                        {space.businesses.length} locales
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {space.businesses.slice(0, 4).map((b) => (
                          <span
                            key={b.id}
                            className="rounded-lg border border-surface-line bg-surface/70 px-2 py-0.5 text-[10px] text-ink-soft"
                          >
                            {b.name}
                          </span>
                        ))}
                        {space.businesses.length > 4 && (
                          <span className="rounded-lg border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                            +{space.businesses.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </Panel>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </div>
    </section>
  );
}

/* ========================================================================
 * CÓMO FUNCIONA
 * ===================================================================== */
const STEPS = [
  {
    icon: Search,
    title: 'Elegí tu espacio',
    text: 'Entrá al patio de comida, licorería o farmacia que quieras y mirá el menú actualizado en vivo.',
  },
  {
    icon: ShoppingBag,
    title: 'Armá tu pedido',
    text: 'Sumá platos de uno o varios locales del mismo espacio. El carrito los agrupa automáticamente.',
  },
  {
    icon: QrCode,
    title: 'Pagá como quieras',
    text: 'QR con comprobante, tarjeta online o efectivo contra entrega. Vos decidís.',
  },
  {
    icon: PackageCheck,
    title: 'Seguilo en vivo',
    text: 'Mirá el estado en tiempo real: preparación, repartidor asignado, en camino y entregado.',
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          center
          eyebrow="Cómo funciona"
          title="Cuatro pasos y listo"
          subtitle="Sin llamadas, sin idas y vueltas por WhatsApp. Todo el flujo dentro de En Z."
        />

        <div className="relative">
          {/* hilo que conecta los pasos */}
          <motion.div
            aria-hidden
            className="absolute left-0 right-0 top-[38px] hidden h-px origin-left bg-gradient-to-r from-transparent via-violet-500/45 to-transparent lg:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: EASE_RUNE }}
          />

          <StaggerList className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" each={0.1}>
            {STEPS.map((s, i) => (
              <StaggerItem key={s.title}>
                <div className="group relative text-center">
                  <div className="relative mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center">
                    <div className="absolute inset-0 rounded-3xl bg-violet-500/20 blur-xl transition-all duration-500 group-hover:bg-arc/30 group-hover:blur-2xl" />
                    <div className="relative flex h-[76px] w-[76px] rotate-45 items-center justify-center rounded-3xl border border-violet-400/30 bg-void-800 transition-transform duration-500 group-hover:rotate-[135deg]">
                      <s.icon className="h-7 w-7 -rotate-45 text-violet-300 transition-transform duration-500 group-hover:-rotate-[135deg]" />
                    </div>
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-violet-400/40 bg-void font-display text-[11px] font-bold text-arc-soft">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-white">{s.title}</h3>
                  <p className="mx-auto mt-2 max-w-[240px] text-[13px] leading-relaxed text-ink-mute">
                    {s.text}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </div>
      </div>
    </section>
  );
}

/* ========================================================================
 * MÉTODOS DE PAGO
 * ===================================================================== */
const PAYMENTS = [
  {
    icon: QrCode,
    title: 'QR con comprobante',
    text: 'Escaneás el QR del comercio, subís la captura de la transferencia y la tienda la verifica al instante.',
    tone: 'from-violet-600/25',
  },
  {
    icon: CreditCard,
    title: 'Tarjeta online',
    text: 'Pasarela integrada con confirmación automática por webhook. Sin esperas ni verificación manual.',
    tone: 'from-info/25',
  },
  {
    icon: Banknote,
    title: 'Efectivo al recibir',
    text: 'Pagás en la puerta directamente al repartidor. Ideal si preferís no usar banca digital.',
    tone: 'from-ok/25',
  },
];

export function PaymentMethods() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          center
          eyebrow="Pagos"
          title="Tres formas de pagar, cero fricción"
          subtitle="Pensado para el mercado local: usá lo que ya usás todos los días."
        />

        <StaggerList className="grid gap-5 md:grid-cols-3">
          {PAYMENTS.map((p) => (
            <StaggerItem key={p.title}>
              <Panel interactive className="relative h-full overflow-hidden p-6">
                <div
                  className={cn(
                    'pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100',
                    p.tone
                  )}
                />
                <span className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="relative font-display text-base font-bold text-white">{p.title}</h3>
                <p className="relative mt-2 text-[13px] leading-relaxed text-ink-mute">{p.text}</p>
              </Panel>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  );
}

/* ========================================================================
 * PORTALES POR ROL
 * ===================================================================== */
const PORTALS = [
  {
    icon: ShoppingBag,
    title: 'Clientes',
    text: 'Login en un clic, filtros por espacio y precio, carrito multi-local y pago flexible.',
    href: '/auth/login?tab=customer',
    cta: 'Entrar como cliente',
    accent: 'arc',
  },
  {
    icon: Store,
    title: 'Tiendas',
    text: 'Abrir/cerrar el local, gestionar el menú, verificar comprobantes QR y ver tus ventas.',
    href: '/auth/login?tab=store',
    cta: 'Entrar como tienda',
    accent: 'warn',
  },
  {
    icon: Bike,
    title: 'Repartidores',
    text: 'Ingreso con tu código DRV, pedidos disponibles, rutas en el mapa y tus ganancias del día.',
    href: '/auth/login?tab=driver',
    cta: 'Entrar como repartidor',
    accent: 'info',
  },
  {
    icon: ShieldCheck,
    title: 'Administración',
    text: 'Alta de espacios y comercios, control de suscripciones y auditoría global de pedidos.',
    href: '/auth/login?tab=admin',
    cta: 'Consola maestra',
    accent: 'ember',
  },
] as const;

const ACCENT: Record<string, { ring: string; text: string; bg: string }> = {
  arc: { ring: 'hover:border-arc/50', text: 'text-arc-soft', bg: 'bg-arc/10 border-arc/25 text-arc-soft' },
  warn: { ring: 'hover:border-warn/50', text: 'text-warn-soft', bg: 'bg-warn/10 border-warn/25 text-warn-soft' },
  info: { ring: 'hover:border-info/50', text: 'text-info-soft', bg: 'bg-info/10 border-info/25 text-info-soft' },
  ember: { ring: 'hover:border-ember/50', text: 'text-ember-soft', bg: 'bg-ember/10 border-ember/25 text-ember-soft' },
};

export function RolePortals() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Ecosistema"
          title="Un portal para cada actor"
          subtitle="En Z no es solo una app de pedidos: es la operación completa, con paneles dedicados para tiendas, repartidores y administración."
        />

        <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PORTALS.map((p) => {
            const a = ACCENT[p.accent];
            return (
              <StaggerItem key={p.title}>
                <Link href={p.href} className="block h-full">
                  <Panel
                    interactive
                    className={cn('flex h-full flex-col justify-between p-6', a.ring)}
                  >
                    <div>
                      <span
                        className={cn(
                          'mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border',
                          a.bg
                        )}
                      >
                        <p.icon className="h-5 w-5" />
                      </span>
                      <h3 className="font-display text-base font-bold text-white">{p.title}</h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-ink-mute">{p.text}</p>
                    </div>
                    <span
                      className={cn(
                        'mt-5 inline-flex items-center gap-1.5 border-t border-surface-line pt-4 text-[12px] font-bold',
                        a.text
                      )}
                    >
                      {p.cta}
                      <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </Panel>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </div>
    </section>
  );
}

/* ========================================================================
 * CTA FINAL
 * ===================================================================== */
export function ClosingCta() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rune-panel rune-edge relative overflow-hidden rounded-[32px] px-6 py-16 text-center sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 h-72 w-[70%] -translate-x-1/2 rounded-full blur-[100px]"
              style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.28), transparent 70%)' }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 opacity-10"
              animate={{ rotate: 360 }}
              transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
            >
              <EnZLogo size={280} glow={false} />
            </motion.div>

            <div className="relative">
              <span className="eyebrow">Empezá ahora</span>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-[44px]">
                Tu próximo pedido está
                <br className="hidden sm:block" /> <span className="text-rune">a un tap</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-mute sm:text-base">
                Creá tu cuenta en segundos y pedí de cualquier comercio de Trinidad. También podés
                sumar tu negocio a la plataforma.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button href="/spaces" size="lg">
                  <Sparkles className="h-4 w-4" />
                  Explorar espacios
                </Button>
                <Button href="/auth/register" variant="outline" size="lg">
                  Crear mi cuenta
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
