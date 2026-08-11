import type { Transition, Variants } from 'motion/react';

/**
 * EN Z — Lenguaje de movimiento.
 * Un único ritmo para toda la app (regla `motion-consistency` de UI/UX Pro Max):
 * entradas con ease-out expresivo, salidas ~65% más cortas, springs para gestos.
 */

export const EASE_RUNE = [0.16, 1, 0.3, 1] as const;
export const EASE_SNAP = [0.22, 1.2, 0.36, 1] as const;

export const DUR = {
  micro: 0.16,
  base: 0.24,
  slow: 0.42,
  scene: 0.7,
} as const;

export const tEnter: Transition = { duration: DUR.slow, ease: EASE_RUNE };
export const tExit: Transition = { duration: DUR.base, ease: 'easeIn' };
export const tSpring: Transition = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 };
export const tSoftSpring: Transition = { type: 'spring', stiffness: 200, damping: 26 };

/** Aparición vertical estándar (secciones, tarjetas, filas). */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: tEnter },
  exit: { opacity: 0, y: -10, transition: tExit },
};

/** Aparición con escala — para modales y elementos que "nacen" de su origen. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: tSpring },
  exit: { opacity: 0, scale: 0.97, y: 6, transition: tExit },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base } },
  exit: { opacity: 0, transition: { duration: DUR.micro } },
};

/** Contenedor que escalona a sus hijos (30–50ms según la guía de motion). */
export const stagger = (each = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: each, delayChildren: delay } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
});

/** Feedback táctil unificado para todo lo clicable. */
export const pressable = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.97 },
  transition: tSpring,
} as const;

/** Deslizamiento lateral para drawers (carrito, filtros). */
export const slideRight: Variants = {
  hidden: { x: '100%' },
  show: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 34 } },
  exit: { x: '100%', transition: { duration: DUR.base, ease: 'easeIn' } },
};

/** Props listos para usar en secciones que aparecen al hacer scroll. */
export const inViewSection = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.15 },
} as const;
