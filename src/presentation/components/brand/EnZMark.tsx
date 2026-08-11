'use client';

import * as React from 'react';
import { cn } from '@/presentation/lib/utils';

/**
 * EN Z — Emblema vectorial (respaldo del logo oficial).
 *
 * Se usa cuando `public/brand/en-z-logo.png` no está disponible. Reproduce la
 * estructura del emblema: dos cuadrados girados 45° entre sí, tejidos como un
 * nudo celta de 8 puntas, con el brazo izquierdo oscuro y agrietado por rayos
 * y el derecho luminoso con nebulosa. Encima, la "Z" caligráfica blanca.
 *
 * Al dibujarse con TRAZOS (no rellenos), el fondo se ve entre las bandas,
 * igual que en el logo original.
 */

/* --- Las dos bandas del nudo (lienzo 512×512) --------------------------- */
const SQUARE = 'M96 96 H416 V416 H96 Z'; // cuadrado alineado
const DIAMOND = 'M256 30 L482 256 L256 482 L30 256 Z'; // cuadrado girado 45°

/** Tramos del cuadrado que pasan POR ENCIMA del rombo (ilusión de tejido). */
const OVER = ['M170 96 H210', 'M416 170 V210', 'M342 416 H302', 'M96 342 V302'];

/** Cinta interior del nudo. */
const INNER = 'M256 132 L380 256 L256 380 L132 256 Z';

/** Grietas de energía del brazo izquierdo. */
const CRACKS = [
  'M150 168 L172 206 L152 216 L182 254',
  'M112 262 L146 272 L130 292 L164 306',
  'M200 116 L210 148 L190 156 L206 188',
  'M126 352 L156 344 L150 364 L180 358',
];

/** Motas de nebulosa del brazo derecho. */
const MOTES: Array<[number, number, number]> = [
  [352, 168, 3], [382, 212, 2], [334, 232, 1.7], [396, 288, 2.6],
  [346, 302, 1.9], [366, 346, 2.8], [312, 356, 1.5], [402, 178, 1.5],
  [300, 196, 1.3], [370, 258, 1.6],
];

/**
 * La "Z" caligráfica como contorno cerrado: barra superior → diagonal →
 * barra inferior con cola, y de vuelta por los bordes internos.
 */
const Z_PATH =
  'M178 168 C190 146 226 136 268 134 C306 132 342 136 358 144 C372 151 372 164 360 176 ' +
  'L236 334 C231 341 235 347 246 348 C286 351 322 345 346 332 C360 325 370 332 366 346 ' +
  'C358 372 306 390 256 391 C212 392 182 385 174 372 C166 360 170 348 182 333 ' +
  'L302 180 C307 173 303 167 292 166 C254 163 214 168 194 179 C182 186 172 182 178 168 Z';

export interface EnZMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  /** Añade el resplandor exterior animado. */
  glow?: boolean;
  /** Prefijo único para los ids de <defs> (evita colisiones entre instancias). */
  uid?: string;
}

export function EnZMark({ size = 40, glow = true, uid = 'ez', className, ...rest }: EnZMarkProps) {
  const id = (n: string) => `${uid}-${n}`;

  /** Banda: contorno oscuro + relleno con degradado. */
  const band = (d: string, key: string) => (
    <g key={key}>
      <path
        d={d}
        fill="none"
        stroke="#080312"
        strokeWidth="62"
        strokeLinejoin="miter"
        strokeMiterlimit="10"
      />
      <path
        d={d}
        fill="none"
        stroke={`url(#${id('band')})`}
        strokeWidth="48"
        strokeLinejoin="miter"
        strokeMiterlimit="10"
      />
      <path
        d={d}
        fill="none"
        stroke={`url(#${id('sheen')})`}
        strokeWidth="14"
        strokeLinejoin="miter"
        strokeMiterlimit="10"
        opacity="0.5"
      />
    </g>
  );

  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role="img"
      aria-label="En Z"
      className={cn('shrink-0 overflow-visible', className)}
      {...rest}
    >
      <defs>
        {/* Oscuro arriba-izquierda → luminoso abajo-derecha, como el logo */}
        <linearGradient id={id('band')} x1="0.12" y1="0.05" x2="0.9" y2="0.95">
          <stop offset="0%" stopColor="#1C0B36" />
          <stop offset="34%" stopColor="#3B1A7A" />
          <stop offset="62%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#C4A2FF" />
        </linearGradient>

        {/* Brillo interior de las bandas */}
        <linearGradient id={id('sheen')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.15" />
          <stop offset="55%" stopColor="#E9D5FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.55" />
        </linearGradient>

        <radialGradient id={id('nebula')} cx="0.7" cy="0.34" r="0.55">
          <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.45" />
          <stop offset="55%" stopColor="#A855F7" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={id('zink')} x1="0.1" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#F6F0FF" />
          <stop offset="100%" stopColor="#D8C8FF" />
        </linearGradient>

        <filter id={id('soft')} x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="11" />
        </filter>

        {/* La nebulosa sólo se ve sobre las bandas del lado derecho */}
        <clipPath id={id('clipRight')}>
          <path d={`${SQUARE} ${DIAMOND}`} />
        </clipPath>
      </defs>

      {glow && (
        <g className="animate-pulse-glow" style={{ transformOrigin: '256px 256px' }}>
          <circle
            cx="256"
            cy="256"
            r="196"
            fill="#7C3AED"
            opacity="0.3"
            filter={`url(#${id('soft')})`}
          />
        </g>
      )}

      {/* --- Nudo tejido --- */}
      {band(SQUARE, 'sq')}
      {band(DIAMOND, 'di')}

      {/* Tramos del cuadrado que vuelven a pasar por encima del rombo */}
      <g>
        {OVER.map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke="#080312" strokeWidth="62" strokeLinecap="butt" />
            <path
              d={d}
              fill="none"
              stroke={`url(#${id('band')})`}
              strokeWidth="48"
              strokeLinecap="butt"
            />
          </g>
        ))}
      </g>

      {/* Cinta interior */}
      <path d={INNER} fill="none" stroke="#080312" strokeWidth="26" strokeLinejoin="miter" />
      <path
        d={INNER}
        fill="none"
        stroke={`url(#${id('band')})`}
        strokeWidth="16"
        strokeLinejoin="miter"
      />

      {/* --- Nebulosa y motas (brazo derecho) --- */}
      <g clipPath={`url(#${id('clipRight')})`}>
        <circle cx="336" cy="216" r="200" fill={`url(#${id('nebula')})`} />
        {MOTES.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#F8F5FF" opacity={0.55 + (i % 3) * 0.15} />
        ))}
      </g>

      {/* --- Grietas de energía (brazo izquierdo) --- */}
      <g className="animate-arc-flicker" clipPath={`url(#${id('clipRight')})`}>
        {CRACKS.map((d, i) => (
          <g key={i}>
            <path
              d={d}
              fill="none"
              stroke="#7C3AED"
              strokeWidth={i === 0 ? 9 : 7}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
            <path
              d={d}
              fill="none"
              stroke="#EDE0FF"
              strokeWidth={i === 0 ? 4 : 3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}
      </g>

      {/* --- La Z --- */}
      <path
        d={Z_PATH}
        fill="none"
        stroke="#12061F"
        strokeWidth="18"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <path d={Z_PATH} fill={`url(#${id('zink')})`} />
    </svg>
  );
}

/** Marca compuesta: emblema + palabra "EN Z". */
export function EnZWordmark({
  size = 34,
  className,
  compact = false,
}: {
  size?: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <EnZMark size={size} uid="wm" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-[0.2em] text-white">
          EN<span className="text-arc"> Z</span>
        </span>
        {!compact && (
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.3em] text-violet-300/60">
            Delivery
          </span>
        )}
      </span>
    </span>
  );
}

/* Geometría exportada por si otro componente necesita animar el emblema */
export const MARK_PATHS = { SQUARE, DIAMOND, INNER, OVER, Z_PATH, CRACKS, MOTES };
