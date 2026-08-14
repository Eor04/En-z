'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut, signIn } from 'next-auth/react';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'motion/react';
import {
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Zap,
  Menu,
  X,
  MapPin,
  Package,
} from 'lucide-react';
import { EnZLogo } from '@/presentation/components/brand/EnZLogo';
import {
  PwaHeaderActions,
  PwaMenuActions,
} from '@/presentation/components/common/PwaControls';
import { Badge, Button } from '@/presentation/components/ui';
import { cn, initials } from '@/presentation/lib/utils';
import { EASE_RUNE, tSpring } from '@/presentation/lib/motion';

const NAV = [
  { href: '/', label: 'Inicio', icon: Zap },
  { href: '/spaces', label: 'Espacios', icon: MapPin },
  { href: '/orders', label: 'Mis pedidos', icon: Package },
];

/* El acceso 1-click sólo existe fuera de producción: allá el proveedor
   `one-click-demo` ni siquiera está registrado en NextAuth. */
const DEMO_DISPONIBLE = process.env.NODE_ENV !== 'production';

const DEMO_ROLES = [
  {
    role: 'ADMIN',
    name: 'Admin General',
    detail: 'admin@pedidostrinidad.com',
    icon: ShieldCheck,
    color: 'text-ember',
  },
  {
    role: 'BUSINESS_OWNER',
    name: 'Tienda (Don Pepe)',
    detail: 'El Bosque · Patio de comida',
    icon: Store,
    color: 'text-warn',
  },
  {
    role: 'DRIVER',
    name: 'Repartidor Flash',
    detail: 'Código DRV-777',
    icon: Bike,
    color: 'text-info',
  },
  {
    role: 'CUSTOMER',
    name: 'Cliente (Mateo)',
    detail: 'cliente@gmail.com',
    icon: ShoppingBag,
    color: 'text-arc',
  },
] as const;

function RoleBadge({ role, driverCode }: { role?: string; driverCode?: string }) {
  switch (role) {
    case 'ADMIN':
      return (
        <Badge tone="ember" icon={ShieldCheck}>
          Admin
        </Badge>
      );
    case 'BUSINESS_OWNER':
      return (
        <Badge tone="warn" icon={Store}>
          Tienda
        </Badge>
      );
    case 'DRIVER':
      return (
        <Badge tone="info" icon={Bike}>
          {driverCode || 'Repartidor'}
        </Badge>
      );
    case 'CUSTOMER':
      return (
        <Badge tone="arc" icon={ShoppingBag}>
          Cliente
        </Badge>
      );
    default:
      return null;
  }
}

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 12));

  const role = (session?.user as any)?.role as string | undefined;
  const driverCode = (session?.user as any)?.driverCode as string | undefined;

  // Cerrar menús al navegar (state-preservation / back-behavior)
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = () => setDropdownOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [dropdownOpen]);

  const handleQuickLogin = async (r: string) => {
    setDemoLoading(r);
    try {
      await signIn('one-click-demo', { role: r, redirect: false });
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setDemoLoading(null);
      setDropdownOpen(false);
    }
  };

  const portal =
    role === 'BUSINESS_OWNER'
      ? { href: '/store/dashboard', label: 'Mi tienda', icon: Store, tone: 'warn' as const }
      : role === 'DRIVER'
        ? { href: '/driver/dashboard', label: 'Modo repartidor', icon: Bike, tone: 'info' as const }
        : role === 'ADMIN'
          ? { href: '/admin/dashboard', label: 'Consola', icon: ShieldCheck, tone: 'ember' as const }
          : null;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE_RUNE, delay: 0.1 }}
        className={cn(
          'sticky top-0 z-40 w-full transition-[background-color,border-color,backdrop-filter] duration-300',
          scrolled
            ? 'border-b border-surface-line bg-void-800/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        )}
      >
        {/* hilo de luz superior */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Marca */}
          <Link href="/" className="group flex items-center gap-3">
            <motion.span whileHover={{ rotate: 90, scale: 1.06 }} transition={tSpring}>
              <EnZLogo size={38} priority />
            </motion.span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-[19px] font-bold tracking-[0.22em] text-white">
                EN<span className="text-arc"> Z</span>
              </span>
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-violet-300/55">
                Trinidad · Beni
              </span>
            </span>
          </Link>

          {/* Navegación central */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors duration-200',
                    active ? 'text-white' : 'text-ink-mute hover:text-white'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl border border-violet-400/30 bg-violet-500/12"
                      transition={tSpring}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}

            {portal && (
              <Link
                href={portal.href}
                className={cn(
                  'ml-1 flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[13px] font-semibold transition-all duration-200',
                  portal.tone === 'warn' &&
                    'border-warn/30 bg-warn/10 text-warn-soft hover:bg-warn/20',
                  portal.tone === 'info' &&
                    'border-info/30 bg-info/10 text-info-soft hover:bg-info/20',
                  portal.tone === 'ember' &&
                    'border-ember/30 bg-ember/10 text-ember-soft hover:bg-ember/20'
                )}
              >
                <portal.icon className="h-3.5 w-3.5" />
                {portal.label}
              </Link>
            )}
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {/* Instalar app + notificaciones (siempre accesibles, no se pierden
                al cerrar el aviso flotante) */}
            <PwaHeaderActions className="hidden lg:flex" />

            {/* Switcher de roles demo (sólo en desarrollo) */}
            {DEMO_DISPONIBLE && (
            <div className="relative hidden sm:block">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen((v) => !v);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-surface-line bg-void-800/70 px-3 py-2 text-[12px] font-semibold text-ink-soft transition-colors hover:border-violet-500/40 hover:text-white"
                title="Cambiar entre los 4 roles para probar el sistema"
              >
                <Zap className="h-3.5 w-3.5 text-warn" />
                <span className="hidden lg:inline">Rol demo</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-ink-faint transition-transform duration-200',
                    dropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: EASE_RUNE }}
                    onClick={(e) => e.stopPropagation()}
                    className="rune-glass absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl py-2"
                  >
                    <p className="border-b border-surface-line px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-faint">
                      Acceso rápido (demo)
                    </p>
                    {DEMO_ROLES.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => handleQuickLogin(r.role)}
                        disabled={demoLoading !== null}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-violet-500/10 disabled:opacity-50"
                      >
                        <span className="flex items-center gap-2.5">
                          <r.icon className={cn('h-4 w-4', r.color)} />
                          <span>
                            <span className="block text-[12px] font-semibold text-white">
                              {r.name}
                            </span>
                            <span className="block text-[10px] text-ink-faint">{r.detail}</span>
                          </span>
                        </span>
                        {role === r.role && <CheckCircle2 className="h-4 w-4 text-ok" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            )}

            {/* Sesión */}
            {status === 'loading' ? (
              <div className="h-9 w-9 animate-pulse rounded-xl bg-surface-raised" />
            ) : session?.user ? (
              <div className="flex items-center gap-2">
                <div className="hidden flex-col items-end lg:flex">
                  <span className="max-w-[160px] truncate text-[12px] font-semibold text-white">
                    {session.user.name || session.user.email}
                  </span>
                  <RoleBadge role={role} driverCode={driverCode} />
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/25 bg-grad-rune font-display text-[13px] font-bold text-white">
                  {initials(session.user.name)}
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  aria-label="Cerrar sesión"
                  className="cursor-pointer rounded-xl border border-surface-line p-2 text-ink-mute transition-colors hover:border-ember/40 hover:bg-ember/10 hover:text-ember"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button href="/auth/login" size="sm" className="hidden sm:inline-flex">
                <UserIcon className="h-3.5 w-3.5" />
                Ingresar
              </Button>
            )}

            {/* Botón móvil */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menú"
              aria-expanded={mobileOpen}
              className="cursor-pointer rounded-xl border border-surface-line p-2.5 text-ink-soft transition-colors hover:border-violet-500/40 hover:text-white lg:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Panel móvil */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-30 bg-void/80 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: EASE_RUNE }}
              className="rune-glass fixed inset-x-3 top-[76px] z-40 max-h-[calc(100dvh-92px)] overflow-y-auto rounded-3xl p-3 lg:hidden"
            >
              {[...NAV, ...(portal ? [portal] : [])].map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.3, ease: EASE_RUNE }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                      isActive(item.href)
                        ? 'border border-violet-400/30 bg-violet-500/12 text-white'
                        : 'text-ink-soft hover:bg-violet-500/10 hover:text-white'
                    )}
                  >
                    <item.icon className="h-4 w-4 text-violet-300" />
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              {!session?.user && (
                <div className="mt-2 border-t border-surface-line pt-3">
                  <Button href="/auth/login" full size="md">
                    <UserIcon className="h-4 w-4" />
                    Ingresar o crear cuenta
                  </Button>
                </div>
              )}

              {/* Instalar app y notificaciones, también acá dentro */}
              <PwaMenuActions onDone={() => setMobileOpen(false)} />
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
