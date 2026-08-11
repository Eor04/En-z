'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { Search, ArrowRight, Bike, Store, Clock } from 'lucide-react';
import { EnZLogo } from '@/presentation/components/brand/EnZLogo';
import { Button } from '@/presentation/components/ui';
import { EASE_RUNE, stagger, riseIn } from '@/presentation/lib/motion';

const SUGGESTIONS = ['Hamburguesas', 'Pollo broaster', 'Licorería 24h', 'Farmacia', 'Sushi', 'Helados'];

export function HomeHero({
  spaceCount,
  businessCount,
}: {
  spaceCount: number;
  businessCount: number;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [q, setQ] = React.useState('');

  const search = (term: string) => {
    const value = term.trim();
    router.push(value ? `/spaces?q=${encodeURIComponent(value)}` : '/spaces');
  };

  const STATS = [
    { icon: Store, value: `${businessCount}+`, label: 'comercios activos' },
    { icon: Bike, value: '25 min', label: 'promedio de entrega' },
    { icon: Clock, value: '24/7', label: 'licorerías y farmacias' },
  ];

  return (
    <section className="halo relative overflow-hidden pb-20 pt-16 lg:pb-28 lg:pt-24">
      {/* Emblema gigante de fondo */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
          initial={{ scale: 0.7, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 0.06 }}
          transition={{ duration: 2, ease: EASE_RUNE, delay: 0.2 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          >
            <EnZLogo size={720} glow={false} />
          </motion.div>
        </motion.div>
      )}

      <motion.div
        variants={stagger(0.09, 0.15)}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8"
      >
        <motion.div variants={riseIn} className="mb-7 flex justify-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-arc opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-arc" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">
              {spaceCount} espacios en Trinidad
            </span>
          </span>
        </motion.div>

        <motion.h1
          variants={riseIn}
          className="font-display text-[38px] font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[72px]"
        >
          Todo Trinidad,
          <br />
          <span className="text-rune">en un solo lugar</span>
        </motion.h1>

        <motion.p
          variants={riseIn}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-mute sm:text-lg"
        >
          Patios de comida, licorerías y farmacias. Pedí en segundos, pagá con QR, tarjeta o
          efectivo, y seguí tu pedido en vivo hasta tu puerta.
        </motion.p>

        {/* Buscador: la barra ES el CTA (patrón Marketplace) */}
        <motion.form
          variants={riseIn}
          onSubmit={(e) => {
            e.preventDefault();
            search(q);
          }}
          className="group relative mx-auto mt-9 max-w-xl"
        >
          <div className="absolute -inset-0.5 rounded-3xl bg-grad-rune opacity-40 blur-lg transition-opacity duration-500 group-focus-within:opacity-70" />
          <div className="relative flex items-center gap-2 rounded-3xl border border-violet-400/25 bg-void-800/90 p-2 backdrop-blur-xl">
            <Search className="ml-3 h-5 w-5 shrink-0 text-violet-300" />
            <label htmlFor="hero-search" className="sr-only">
              Buscar comida, comercios o espacios
            </label>
            <input
              id="hero-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="¿Qué se te antoja hoy?"
              className="h-11 flex-1 bg-transparent text-[15px] text-white placeholder:text-ink-faint focus:outline-none"
            />
            <Button type="submit" size="md" className="shrink-0">
              Buscar
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.form>

        {/* Búsquedas sugeridas */}
        <motion.div
          variants={riseIn}
          className="mt-5 flex flex-wrap items-center justify-center gap-2"
        >
          <span className="text-[11px] font-medium text-ink-faint">Populares:</span>
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={s}
              type="button"
              onClick={() => search(s)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.05, duration: 0.4, ease: EASE_RUNE }}
              className="cursor-pointer rounded-full border border-surface-line bg-void-800/60 px-3 py-1.5 text-[11px] font-medium text-ink-soft transition-colors hover:border-violet-400/50 hover:text-white"
            >
              {s}
            </motion.button>
          ))}
        </motion.div>

        {/* Métricas de confianza */}
        <motion.dl
          variants={riseIn}
          className="mx-auto mt-14 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 + i * 0.08, duration: 0.5, ease: EASE_RUNE }}
              className="rune-panel flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
                <s.icon className="h-[18px] w-[18px]" />
              </span>
              <span>
                <dt className="font-display text-[17px] font-bold leading-none text-white tabular">
                  {s.value}
                </dt>
                <dd className="mt-1 text-[11px] text-ink-faint">{s.label}</dd>
              </span>
            </motion.div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  );
}
