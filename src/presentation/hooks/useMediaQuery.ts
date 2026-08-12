'use client';

import { useEffect, useState } from 'react';

/**
 * Media query reactiva, segura para SSR.
 *
 * Arranca en `false` y se resuelve tras el montaje: así el HTML del servidor y
 * el del cliente coinciden en el primer render (sin errores de hidratación).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** `true` a partir de 768px: usado para activar los efectos caros. */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 768px)');
}
