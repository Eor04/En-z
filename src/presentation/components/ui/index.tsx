'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Loader2, X, Inbox } from 'lucide-react';
import { cn } from '@/presentation/lib/utils';
import { useIsDesktop } from '@/presentation/hooks/useMediaQuery';
import { EASE_RUNE, popIn, riseIn, stagger, tSpring, fadeIn } from '@/presentation/lib/motion';

/* =========================================================================
 * REVEAL — aparición al entrar en viewport
 * ========================================================================= */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}) {
  const reduce = useReducedMotion();
  const Cmp = motion[as] as typeof motion.div;
  return (
    <Cmp
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: EASE_RUNE, delay }}
    >
      {children}
    </Cmp>
  );
}

/** Lista que escalona la entrada de sus hijos. */
export function StaggerList({
  children,
  className,
  each = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  each?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={stagger(each)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={riseIn} className={className}>
      {children}
    </motion.div>
  );
}

/* =========================================================================
 * BUTTON
 * ========================================================================= */
type Variant = 'primary' | 'ember' | 'ghost' | 'outline' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-grad-rune text-white shadow-glow-violet hover:shadow-glow-arc border border-violet-400/30',
  ember: 'bg-grad-ember text-white shadow-glow-ember border border-ember-soft/30',
  outline:
    'bg-violet-500/5 text-violet-200 border border-violet-400/30 hover:bg-violet-500/15 hover:text-white hover:border-violet-400/60',
  ghost: 'text-ink-soft hover:text-white hover:bg-violet-500/10 border border-transparent',
  subtle:
    'bg-surface-raised/80 text-ink-soft border border-surface-line hover:border-violet-500/40 hover:text-white',
  danger:
    'bg-danger/15 text-danger-soft border border-danger/35 hover:bg-danger/25 hover:text-white',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[12px] gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-[13px] gap-2 rounded-2xl',
  lg: 'h-[52px] px-7 text-sm gap-2.5 rounded-2xl',
  icon: 'h-11 w-11 rounded-2xl justify-center',
};

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'ref'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  href?: string;
  full?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, href, full, className, children, disabled, ...rest },
  ref
) {
  const classes = cn(
    'sheen relative inline-flex items-center justify-center font-display font-semibold tracking-wide',
    'transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-rune',
    'active:scale-[0.97] cursor-pointer select-none',
    'disabled:pointer-events-none disabled:opacity-45',
    VARIANTS[variant],
    SIZES[size],
    full && 'w-full',
    className
  );

  const inner = (
    <>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </>
  );

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} {...rest}>
      {inner}
    </button>
  );
});

/* =========================================================================
 * CARD / PANEL
 * ========================================================================= */
export function Panel({
  children,
  className,
  interactive,
  glow,
  as: As = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  glow?: boolean;
  as?: React.ElementType;
}) {
  return (
    <As
      className={cn(
        'rune-panel rune-edge rounded-3xl',
        interactive &&
          'group cursor-pointer transition-[transform,box-shadow] duration-300 ease-rune hover:-translate-y-1 hover:shadow-rune',
        glow && 'shadow-glow-violet',
        className
      )}
    >
      {children}
    </As>
  );
}

/* =========================================================================
 * BADGE
 * ========================================================================= */
const TONES = {
  violet: 'bg-violet-500/12 text-violet-200 border-violet-400/30',
  arc: 'bg-arc/12 text-arc-soft border-arc/30',
  ember: 'bg-ember/12 text-ember-soft border-ember/30',
  ok: 'bg-ok/12 text-ok-soft border-ok/30',
  warn: 'bg-warn/12 text-warn-soft border-warn/30',
  danger: 'bg-danger/12 text-danger-soft border-danger/30',
  info: 'bg-info/12 text-info-soft border-info/30',
  mute: 'bg-white/5 text-ink-mute border-white/10',
} as const;

export type Tone = keyof typeof TONES;

export function Badge({
  children,
  tone = 'violet',
  className,
  dot,
  icon: Icon,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        TONES[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </span>
  );
}

/** Punto pulsante para estados "en vivo". */
export function LivePulse({ tone = 'ok', className }: { tone?: 'ok' | 'ember'; className?: string }) {
  const c = tone === 'ok' ? 'bg-ok' : 'bg-ember';
  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-70', c)} />
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', c)} />
    </span>
  );
}

/* =========================================================================
 * FORMULARIOS
 * ========================================================================= */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-[12px] font-semibold text-ink-soft"
      >
        {label}
        {required && <span className="text-ember">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[11px] font-medium text-danger-soft">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputBase =
  'w-full rounded-2xl border border-surface-line bg-void-800/70 px-4 text-sm text-white placeholder:text-ink-faint ' +
  'transition-[border-color,box-shadow,background-color] duration-200 ' +
  'hover:border-violet-500/40 focus:border-violet-400 focus:bg-void-700/70 focus:outline-none focus:ring-4 focus:ring-violet-500/15 ' +
  'disabled:opacity-50';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(inputBase, 'h-12', className)} {...rest} />;
  }
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(inputBase, 'py-3 leading-relaxed', className)} {...rest} />;
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cn(inputBase, 'h-12 cursor-pointer pr-10', className)} {...rest}>
      {children}
    </select>
  );
});

/* =========================================================================
 * ENCABEZADO DE SECCIÓN
 * ========================================================================= */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
  center,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  center?: boolean;
}) {
  return (
    <Reveal
      className={cn(
        'mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        center && 'sm:flex-col sm:items-center sm:text-center',
        className
      )}
    >
      <div className={cn('max-w-2xl', center && 'mx-auto text-center')}>
        {eyebrow && (
          <div className={cn('mb-2 flex items-center gap-2', center && 'justify-center')}>
            <span className="h-px w-6 bg-gradient-to-r from-transparent to-violet-400/60" />
            <span className="eyebrow">{eyebrow}</span>
            <span className="h-px w-6 bg-gradient-to-l from-transparent to-violet-400/60" />
          </div>
        )}
        <h2 className="font-display text-2xl font-bold leading-tight text-white sm:text-[32px]">
          {title}
        </h2>
        {subtitle && <p className="mt-2.5 text-sm leading-relaxed text-ink-mute">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}

/* =========================================================================
 * ESTADOS
 * ========================================================================= */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function EmptyState({
  icon: Icon = Inbox,
  iconNode,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  /** Alternativa a `icon` para Server Components (las funciones no son serializables). */
  iconNode?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="show"
      className={cn(
        'rune-panel flex flex-col items-center rounded-3xl px-6 py-14 text-center',
        className
      )}
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-3xl bg-violet-500/20 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
          {iconNode ?? <Icon className="h-7 w-7" />}
        </div>
      </div>
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-mute">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}

/* =========================================================================
 * MÉTRICA
 * ========================================================================= */
export function Stat({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'violet',
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  className?: string;
}) {
  return (
    <motion.div
      variants={riseIn}
      className={cn('rune-panel rune-edge group relative overflow-hidden rounded-3xl p-5', className)}
    >
      <div
        className={cn(
          'absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40',
          tone === 'ember' ? 'bg-ember' : tone === 'ok' ? 'bg-ok' : tone === 'warn' ? 'bg-warn' : 'bg-violet-500'
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
            {label}
          </p>
          <p className="mt-2 font-display text-[26px] font-bold leading-none text-white tabular">
            {value}
          </p>
          {sub && <p className="mt-2 text-[11px] text-ink-faint">{sub}</p>}
        </div>
        {Icon && (
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border',
              TONES[tone]
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* =========================================================================
 * TABS con indicador compartido (layoutId)
 * ========================================================================= */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  layoutKey = 'tabs',
}: {
  tabs: Array<{ value: T; label: React.ReactNode; count?: number; icon?: React.ComponentType<{ className?: string }> }>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
  layoutKey?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-surface-line bg-void-800/60 p-1.5',
        className
      )}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'relative shrink-0 cursor-pointer rounded-xl px-4 py-2 text-[12px] font-semibold transition-colors duration-200',
              active ? 'text-white' : 'text-ink-mute hover:text-ink-soft'
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutKey}
                className="absolute inset-0 rounded-xl border border-violet-400/40 bg-violet-500/20 shadow-glow-violet"
                transition={tSpring}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {t.icon && <t.icon className="h-3.5 w-3.5" />}
              {t.label}
              {typeof t.count === 'number' && (
                <span
                  className={cn(
                    'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] tabular',
                    active ? 'bg-white/15 text-white' : 'bg-white/5 text-ink-faint'
                  )}
                >
                  {t.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================================
 * MODAL
 * ========================================================================= */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.div
            className="absolute inset-0 bg-void/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            variants={popIn}
            initial="hidden"
            animate="show"
            exit="exit"
            className={cn(
              'rune-glass relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl',
              widths[size]
            )}
          >
            {title && (
              <div className="flex items-center justify-between gap-4 border-b border-surface-line px-6 py-4">
                <h3 className="font-display text-base font-bold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="cursor-pointer rounded-xl border border-surface-line p-2 text-ink-mute transition-colors hover:border-ember/40 hover:text-ember"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t border-surface-line px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* =========================================================================
 * FONDO AMBIENTAL — nebulosa + malla rúnica
 * ========================================================================= */
/**
 * Nebulosa de fondo.
 *
 * En móvil los blobs se pintan estáticos y sin `filter: blur` (el degradado
 * radial ya da el difuminado): animar tres capas desenfocadas a pantalla
 * completa cuesta decenas de ms por frame en gama media. En escritorio sí
 * derivan lentamente.
 */
export function AuroraBackground() {
  const reduce = useReducedMotion();
  const isDesktop = useIsDesktop();
  const animate = isDesktop && !reduce;

  const blobs = [
    {
      className: 'absolute -left-[15%] top-[-10%] h-[52vmax] w-[52vmax]',
      color: 'rgba(124,58,237,0.30)',
      motion: { x: [0, 60, 0], y: [0, 40, 0] },
      duration: 26,
    },
    {
      className: 'absolute right-[-18%] top-[18%] h-[46vmax] w-[46vmax]',
      color: 'rgba(168,85,247,0.22)',
      motion: { x: [0, -50, 0], y: [0, 60, 0] },
      duration: 32,
    },
    {
      className: 'absolute bottom-[-20%] left-[25%] h-[44vmax] w-[44vmax]',
      color: 'rgba(46,16,101,0.55)',
      motion: { x: [0, 40, 0] },
      duration: 38,
    },
  ];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void">
      <div className="rune-grid absolute inset-0 opacity-70" />

      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={cn(b.className, 'rounded-full', isDesktop && 'blur-[110px]')}
          style={{
            background: `radial-gradient(circle, ${b.color}, transparent 65%)`,
            willChange: animate ? 'transform' : undefined,
          }}
          animate={animate ? b.motion : undefined}
          transition={{ duration: b.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_35%,#06040D_85%)]" />
    </div>
  );
}
