'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut, signIn } from 'next-auth/react';
import {
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';

export function Navbar() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const handleQuickLogin = async (role: string) => {
    setDemoLoading(role);
    try {
      await signIn('one-click-demo', {
        role,
        redirect: false,
      });
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setDemoLoading(null);
      setDropdownOpen(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" /> Admin General
          </span>
        );
      case 'BUSINESS_OWNER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Store className="w-3.5 h-3.5 text-amber-400" /> Tienda / Negocio
          </span>
        );
      case 'DRIVER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Bike className="w-3.5 h-3.5 text-emerald-400" /> Repartidor ({(session?.user as any)?.driverCode || 'DRV'})
          </span>
        );
      case 'CUSTOMER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <ShoppingBag className="w-3.5 h-3.5 text-blue-400" /> Cliente
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white">Pedidos</span>
              <span className="text-lg font-extrabold text-emerald-400">Trinidad</span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">Modular Delivery System</p>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-medium">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Inicio
          </Link>

          <Link
            href="/spaces"
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Patios & Restaurantes
          </Link>

          <Link
            href="/orders"
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            Mis Pedidos
          </Link>

          {(session?.user as any)?.role === 'BUSINESS_OWNER' && (
            <Link
              href="/store/dashboard"
              className="px-3 py-1.5 rounded-lg text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Mi Tienda</span>
            </Link>
          )}

          {(session?.user as any)?.role === 'DRIVER' && (
            <Link
              href="/driver/dashboard"
              className="px-3 py-1.5 rounded-lg text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
            >
              <Bike className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modo Repartidor</span>
            </Link>
          )}

          {(session?.user as any)?.role === 'ADMIN' && (
            <Link
              href="/admin/dashboard"
              className="px-3 py-1.5 rounded-lg text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>Panel Admin</span>
            </Link>
          )}
        </nav>

        {/* Right Actions & Session Info */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
              title="Cambiar rápidamente entre los 4 roles para probar el sistema"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span className="hidden sm:inline font-medium">Probar Rol Demo</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 glass-dropdown rounded-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Acceso Rápido 1-Click (Demo)
                </div>
                <button
                  onClick={() => handleQuickLogin('ADMIN')}
                  disabled={demoLoading !== null}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                    <div>
                      <div className="font-semibold text-white">Admin General</div>
                      <div className="text-[10px] text-slate-400">admin@pedidostrinidad.com</div>
                    </div>
                  </div>
                  {(session?.user as any)?.role === 'ADMIN' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>

                <button
                  onClick={() => handleQuickLogin('BUSINESS_OWNER')}
                  disabled={demoLoading !== null}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold text-white">Tienda (Don Pepe)</div>
                      <div className="text-[10px] text-slate-400">El Bosque (Food Court)</div>
                    </div>
                  </div>
                  {(session?.user as any)?.role === 'BUSINESS_OWNER' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>

                <button
                  onClick={() => handleQuickLogin('DRIVER')}
                  disabled={demoLoading !== null}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-white">Repartidor Flash</div>
                      <div className="text-[10px] text-slate-400">Código: DRV-777</div>
                    </div>
                  </div>
                  {(session?.user as any)?.role === 'DRIVER' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>

                <button
                  onClick={() => handleQuickLogin('CUSTOMER')}
                  disabled={demoLoading !== null}
                  className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800/80 text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-semibold text-white">Cliente (Mateo)</div>
                      <div className="text-[10px] text-slate-400">cliente@gmail.com</div>
                    </div>
                  </div>
                  {(session?.user as any)?.role === 'CUSTOMER' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* User Session State */}
          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
          ) : session?.user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col items-end">
                <div className="text-xs font-semibold text-white">{session.user.name || session.user.email}</div>
                {getRoleBadge((session.user as any).role)}
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-sm shadow-inner">
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 hover:bg-rose-950/30 transition-all"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Ingresar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
