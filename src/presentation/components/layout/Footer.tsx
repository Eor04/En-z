'use client';

import Link from 'next/link';
import { MapPin, QrCode, Banknote, Phone } from 'lucide-react';
import { EnZLogo } from '@/presentation/components/brand/EnZLogo';
import { Reveal } from '@/presentation/components/ui';

const COLUMNS = [
  {
    title: 'Explorar',
    links: [
      { href: '/spaces', label: 'Espacios y patios' },
      { href: '/orders', label: 'Mis pedidos' },
      { href: '/checkout', label: 'Finalizar compra' },
    ],
  },
  {
    title: 'Portales',
    links: [
      { href: '/auth/login?tab=customer', label: 'Clientes' },
      { href: '/auth/login?tab=store', label: 'Tiendas' },
      { href: '/auth/login?tab=driver', label: 'Repartidores' },
    ],
  },
];

const PAYMENTS = [
  { icon: QrCode, label: 'QR con comprobante' },
  { icon: Banknote, label: 'Efectivo al recibir' },
];

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-surface-line bg-void-800/60">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[80vw] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.18), transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
          <Reveal>
            <div className="flex items-center gap-3">
              <EnZLogo size={44} />
              <span className="flex flex-col leading-none">
                <span className="font-display text-xl font-bold tracking-[0.22em] text-white">
                  EN<span className="text-arc"> Z</span>
                </span>
                <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-violet-300/55">
                  Delivery
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-mute">
              Patios de comida, licorerías y farmacias de Trinidad, en un solo lugar. Pedís, pagás
              como quieras y seguís tu pedido en vivo.
            </p>
            <p className="mt-5 flex items-center gap-2 text-[12px] text-ink-faint">
              <MapPin className="h-3.5 w-3.5 text-violet-400" />
              Trinidad, Beni · Bolivia
            </p>
            <a
              href="tel:77848278"
              className="mt-2 flex w-fit items-center gap-2 text-[12px] text-ink-faint transition-colors hover:text-violet-300"
            >
              <Phone className="h-3.5 w-3.5 text-violet-400" />
              Soporte 77848278
            </a>
          </Reveal>

          {COLUMNS.map((col, i) => (
            <Reveal key={col.title} delay={0.06 * (i + 1)}>
              <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-white">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-2 text-[13px] text-ink-mute transition-colors hover:text-white"
                    >
                      <span className="h-px w-0 bg-violet-400 transition-all duration-300 group-hover:w-3" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}

          <Reveal delay={0.2}>
            <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-white">
              Formas de pago
            </h3>
            <ul className="mt-4 space-y-3">
              {PAYMENTS.map((p) => (
                <li
                  key={p.label}
                  className="flex items-center gap-3 rounded-2xl border border-surface-line bg-void-700/50 px-3.5 py-2.5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
                    <p.icon className="h-4 w-4" />
                  </span>
                  <span className="text-[12px] font-medium text-ink-soft">{p.label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-surface-line pt-6 text-[11px] text-ink-faint sm:flex-row">
          <p>© {new Date().getFullYear()} En Z. Todos los derechos reservados.</p>
          <p className="tracking-[0.18em]">HECHO EN TRINIDAD · BENI</p>
        </div>
      </div>
    </footer>
  );
}
