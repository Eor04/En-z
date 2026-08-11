'use client';

import * as React from 'react';
import { EnZMark } from './EnZMark';
import { cn } from '@/presentation/lib/utils';

/**
 * EN Z — Logo oficial (imagen real).
 *
 * El archivo vive en `public/brand/en-z-logo.png` y está sobre fondo negro puro.
 * Usamos `mix-blend-mode: screen` para que ese negro desaparezca: así el emblema
 * se apoya sobre cualquier fondo y el aura animada puede verse por detrás.
 *
 * Si el archivo todavía no existe, cae automáticamente al emblema vectorial
 * (`EnZMark`), de modo que la app nunca queda sin marca.
 */

export const LOGO_SRC = '/brand/en-z-logo.png';

export interface EnZLogoProps {
  size?: number;
  className?: string;
  /** Resplandor violeta detrás del emblema. */
  glow?: boolean;
  priority?: boolean;
  /** Ocupa todo el contenedor padre en lugar de un tamaño fijo. */
  fill?: boolean;
}

export function EnZLogo({ size = 40, className, glow = true, priority, fill }: EnZLogoProps) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center',
          fill && 'h-full w-full',
          className
        )}
        style={fill ? undefined : { width: size, height: size }}
      >
        <EnZMark
          size={fill ? undefined : size}
          glow={glow}
          uid="fallback"
          className={fill ? 'h-full w-full' : undefined}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        fill && 'h-full w-full',
        className
      )}
      style={fill ? undefined : { width: size, height: size }}
    >
      {glow && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full blur-xl"
          style={{
            background:
              'radial-gradient(circle, rgba(168,85,247,0.55) 0%, rgba(124,58,237,0.25) 45%, transparent 72%)',
          }}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_SRC}
        alt="En Z"
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
        className="relative h-full w-full object-contain mix-blend-screen"
        draggable={false}
      />
    </span>
  );
}
