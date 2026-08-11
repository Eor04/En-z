'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { EnZLogo } from './EnZLogo';
import { EASE_RUNE } from '@/presentation/lib/motion';

const SESSION_KEY = 'enz:splash-seen';
const WORD = ['E', 'N', 'Z'];

/* ---------------------------------------------------------------------------
 * Geometría del aura (lienzo 400×400, emblema centrado con radio ~118)
 * Todo fijo, sin Math.random(), para no romper la hidratación.
 * ------------------------------------------------------------------------ */

/** Rayos radiales: [ángulo°, largo, grosor, retardo] */
const RAYS: Array<[number, number, number, number]> = [
  [8, 74, 2.4, 0], [26, 44, 1.4, 0.18], [52, 62, 1.8, 0.07], [74, 38, 1.2, 0.25],
  [96, 80, 2.6, 0.04], [118, 48, 1.6, 0.21], [140, 66, 2, 0.11], [163, 40, 1.3, 0.3],
  [186, 86, 2.8, 0.02], [208, 46, 1.5, 0.24], [231, 60, 1.9, 0.13], [253, 36, 1.2, 0.28],
  [275, 78, 2.5, 0.06], [297, 44, 1.4, 0.2], [320, 64, 2, 0.09], [343, 38, 1.3, 0.26],
];

/** Descargas eléctricas: recorridos quebrados que salen del emblema hacia afuera. */
const BOLTS = [
  'M126 150 L104 132 L116 120 L88 96 L98 86 L72 62',
  'M120 214 L92 210 L100 226 L66 232 L74 244 L44 254',
  'M156 122 L146 92 L160 88 L146 54',
  'M278 262 L306 274 L296 288 L330 300 L322 312 L352 328',
  'M286 190 L318 184 L310 170 L344 162',
  'M244 292 L252 322 L238 326 L250 358',
];

/** Chispas de nebulosa: [x, y, r, retardo] */
const SPARKS: Array<[number, number, number, number]> = [
  [268, 132, 2.2, 0], [296, 166, 1.6, 0.3], [254, 176, 1.3, 0.55], [312, 214, 2.4, 0.15],
  [268, 232, 1.5, 0.45], [288, 268, 2.2, 0.62], [238, 276, 1.2, 0.35], [322, 138, 1.2, 0.5],
  [206, 108, 1.4, 0.7], [340, 246, 1.8, 0.25], [180, 314, 1.3, 0.58], [126, 96, 1.5, 0.4],
];

const polar = (deg: number, r: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [200 + Math.cos(rad) * r, 200 + Math.sin(rad) * r] as const;
};

export function EnZSplash() {
  const reduce = useReducedMotion();
  const [visible, setVisible] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const dismiss = React.useCallback(() => {
    setVisible(false);
    document.documentElement.style.overflow = '';
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* almacenamiento bloqueado */
    }
  }, []);

  React.useEffect(() => {
    setMounted(true);
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      /* mostramos igual */
    }
    if (seen) return;

    setVisible(true);
    document.documentElement.style.overflow = 'hidden';

    const t = window.setTimeout(dismiss, reduce ? 800 : 3200);
    return () => {
      window.clearTimeout(t);
      document.documentElement.style.overflow = '';
    };
  }, [reduce, dismiss]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="enz-splash"
          role="status"
          aria-label="Cargando En Z"
          onClick={dismiss}
          className="fixed inset-0 z-[200] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-void"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.14,
            filter: 'blur(14px)',
            transition: { duration: 0.6, ease: EASE_RUNE },
          }}
        >
          {/* =============== AURA + RAYOS + LOGO =============== */}
          <div className="relative flex h-[62vmin] max-h-[440px] w-[62vmin] max-w-[440px] items-center justify-center">
            {/* Bruma violeta de fondo */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-[-30%] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(124,58,237,0.42) 0%, rgba(88,28,180,0.16) 42%, transparent 70%)',
              }}
              initial={{ opacity: 0, scale: 0.55 }}
              animate={
                reduce
                  ? { opacity: 1, scale: 1 }
                  : { opacity: [0, 1, 0.82, 1], scale: [0.55, 1.06, 0.98, 1.03] }
              }
              transition={{ duration: 3, ease: EASE_RUNE, times: [0, 0.45, 0.72, 1] }}
            />

            {/* Aura giratoria: los "brazos" de energía de los costados */}
            {!reduce && (
              <>
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-[-12%] rounded-full opacity-70 blur-2xl"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0deg, rgba(168,85,247,0.55) 40deg, transparent 90deg, transparent 180deg, rgba(196,181,253,0.45) 220deg, transparent 270deg)',
                  }}
                  initial={{ opacity: 0, rotate: -60 }}
                  animate={{ opacity: 0.7, rotate: 300 }}
                  transition={{
                    opacity: { duration: 1.2 },
                    rotate: { duration: 14, ease: 'linear', repeat: Infinity },
                  }}
                />
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-[-4%] rounded-full opacity-50 blur-xl"
                  style={{
                    background:
                      'conic-gradient(from 180deg, transparent 0deg, rgba(124,58,237,0.5) 55deg, transparent 120deg)',
                  }}
                  initial={{ opacity: 0, rotate: 120 }}
                  animate={{ opacity: 0.5, rotate: -240 }}
                  transition={{
                    opacity: { duration: 1.2, delay: 0.2 },
                    rotate: { duration: 20, ease: 'linear', repeat: Infinity },
                  }}
                />
              </>
            )}

            {/* Anillos de energía que se expanden */}
            {!reduce &&
              [0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="pointer-events-none absolute rounded-full border border-arc/35"
                  style={{ inset: '4%' }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: [0, 0.55, 0], scale: [0.85, 1.5, 1.75] }}
                  transition={{
                    duration: 2.6,
                    delay: 0.9 + i * 0.45,
                    ease: 'easeOut',
                    repeat: Infinity,
                    repeatDelay: 0.6,
                  }}
                />
              ))}

            {/* Capa vectorial: rayos radiales, descargas y chispas */}
            <svg
              viewBox="0 0 400 400"
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            >
              <defs>
                <linearGradient id="ray-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                </linearGradient>
                <filter id="bolt-glow" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="3" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Rayos radiales que laten hacia afuera */}
              <g>
                {RAYS.map(([angle, len, w, delay], i) => {
                  const [x1, y1] = polar(angle, 122);
                  const [x2, y2] = polar(angle, 122 + len);
                  return (
                    <motion.line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="url(#ray-grad)"
                      strokeWidth={w}
                      strokeLinecap="round"
                      initial={{ opacity: 0, pathLength: 0 }}
                      animate={
                        reduce
                          ? { opacity: 0.5, pathLength: 1 }
                          : { opacity: [0, 0.9, 0.35, 0.75], pathLength: 1 }
                      }
                      transition={{
                        pathLength: { delay: 0.75 + delay, duration: 0.7, ease: EASE_RUNE },
                        opacity: {
                          delay: 0.75 + delay,
                          duration: 2.4,
                          repeat: Infinity,
                          repeatType: 'mirror',
                        },
                      }}
                    />
                  );
                })}
              </g>

              {/* Descargas eléctricas (los rayos del logo, saliendo hacia afuera) */}
              <g filter="url(#bolt-glow)">
                {BOLTS.map((d, i) => (
                  <motion.path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#E9D5FF"
                    strokeWidth={i % 2 === 0 ? 2.6 : 1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={
                      reduce
                        ? { pathLength: 1, opacity: 0.7 }
                        : { pathLength: 1, opacity: [0, 1, 0.15, 0.9, 0.3, 0.8] }
                    }
                    transition={{
                      pathLength: { delay: 0.95 + i * 0.09, duration: 0.32, ease: 'easeOut' },
                      opacity: {
                        delay: 0.95 + i * 0.09,
                        duration: 2.8,
                        repeat: Infinity,
                        repeatType: 'mirror',
                      },
                    }}
                  />
                ))}
              </g>

              {/* Chispas de nebulosa */}
              <g>
                {SPARKS.map(([cx, cy, r, delay], i) => (
                  <motion.circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="#F5F3FF"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={
                      reduce
                        ? { opacity: 0.7, scale: 1 }
                        : { opacity: [0, 0.95, 0.35, 0.9], scale: [0, 1, 0.8, 1], y: [0, -8, 0] }
                    }
                    transition={{
                      delay: 1.15 + delay,
                      duration: 3.2,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </g>
            </svg>

            {/* Destello del encendido */}
            {!reduce && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full bg-arc-bright blur-2xl"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: [0, 0.75, 0], scale: [0.3, 1.35, 1.8] }}
                transition={{ delay: 0.62, duration: 0.85, ease: 'easeOut' }}
              />
            )}

            {/* ===== EL LOGO REAL ===== */}
            <motion.div
              className="relative z-10 flex h-[64%] w-[64%] items-center justify-center"
              initial={
                reduce
                  ? { opacity: 0, scale: 1 }
                  : { opacity: 0, scale: 0.42, rotate: -170, filter: 'blur(14px)' }
              }
              animate={{ opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)' }}
              transition={{ duration: reduce ? 0.4 : 1.5, ease: EASE_RUNE }}
            >
              <motion.div
                className="h-full w-full"
                animate={reduce ? undefined : { scale: [1, 1.035, 1] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              >
                <EnZLogo fill glow={false} priority />
              </motion.div>
            </motion.div>
          </div>

          {/* =============== MARCA =============== */}
          <div className="relative -mt-2 flex items-end gap-[0.35em] font-display text-4xl font-bold tracking-[0.35em] text-white sm:text-5xl">
            {WORD.map((ch, i) => (
              <motion.span
                key={ch}
                initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  delay: (reduce ? 0.1 : 2.05) + i * 0.09,
                  duration: 0.6,
                  ease: EASE_RUNE,
                }}
                className={i === 2 ? 'text-arc' : undefined}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          <motion.p
            className="mt-3 text-[11px] font-semibold uppercase tracking-[0.42em] text-violet-300/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0.2 : 2.4, duration: 0.5 }}
          >
            Delivery · Trinidad
          </motion.p>

          <div className="mt-9 h-[3px] w-44 overflow-hidden rounded-full bg-violet-500/15">
            <motion.div
              className="h-full rounded-full bg-grad-rune"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: reduce ? 0.6 : 3.05, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>

          <motion.span
            className="absolute bottom-8 text-[10px] uppercase tracking-[0.3em] text-ink-faint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 0.6 }}
          >
            toca para entrar
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
