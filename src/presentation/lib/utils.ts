import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Combina clases de Tailwind resolviendo conflictos (última gana). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea un monto en bolivianos con separadores locales y 2 decimales. */
export function bs(amount: number | string | null | undefined) {
  const n = Number(amount ?? 0);
  return n.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Iniciales para avatares (máx. 2 letras). */
export function initials(name?: string | null) {
  if (!name) return 'EZ';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
