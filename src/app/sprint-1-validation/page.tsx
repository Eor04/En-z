'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  ShieldCheck,
  Store,
  Bike,
  ShoppingBag,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  ArrowRight,
  Server,
  Layers,
  Lock,
  Sparkles,
} from 'lucide-react';

export default function Sprint1ValidationPage() {
  const { data: session, status } = useSession();
  const [dbData, setDbData] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState(true);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);

  const fetchDbStatus = async () => {
    setLoadingDb(true);
    try {
      const res = await fetch('/api/sprint-1/status');
      const data = await res.json();
      setDbData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  const handleQuickRoleSwitch = async (role: string) => {
    setSwitchingRole(role);
    try {
      await signIn('one-click-demo', {
        role,
        redirect: false,
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchingRole(null);
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'BUSINESS_OWNER':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'DRIVER':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'CUSTOMER':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 mb-8 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sprint 1 Completado y Listo para Validación</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Base de Datos, Autenticación y Usuarios
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-2">
              Validación modular de la persistencia de datos en PostgreSQL, arquitectura limpia desacoplada y autenticación multi-rol (Admin, Tienda, Repartidor por código y Cliente).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDbStatus}
              disabled={loadingDb}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${loadingDb ? 'animate-spin' : ''}`} />
              <span>Recargar BD</span>
            </button>

            <Link
              href="/auth/login"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Ir al Portal de Login</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Estado de la Sesión + Acceso 1-Click */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Tarjeta 1: Sesión Activa Actual */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Sesión Activa</span>
              </h2>
              {session?.user ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Autenticado
                </span>
              ) : (
                <span className="text-xs text-slate-500">Sin sesión (Anónimo)</span>
              )}
            </div>

            {session?.user ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] text-slate-400">Usuario Identificado</div>
                  <div className="font-bold text-white text-sm truncate">{session.user.name || 'Sin nombre'}</div>
                  <div className="text-xs text-slate-400 truncate">{session.user.email}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Rol de Dominio Asignado</div>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${getRoleColor(
                      (session.user as any).role
                    )}`}
                  >
                    {(session.user as any).role}
                  </span>
                </div>

                {(session.user as any).driverCode && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Código de Repartidor</div>
                    <div className="font-mono font-bold text-emerald-400 text-sm">
                      {(session.user as any).driverCode}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400 mb-4">
                  Inicia sesión o selecciona un rol para probar los permisos de la aplicación.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <span>Iniciar sesión ahora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: '/sprint-1-validation' })}
              className="w-full mt-4 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-xs font-semibold text-rose-300 border border-slate-800 hover:border-rose-800/40 transition-colors"
            >
              Cerrar Sesión Activa
            </button>
          )}
        </div>

        {/* Tarjeta 2: Switcher 1-Click para Pruebas Rápidas de Roles */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Probar Roles del Sistema (1-Click Instant Login)</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Validación Rápida</span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Haz clic en cualquiera de las siguientes tarjetas para asumir instantáneamente un rol y verificar sus privilegios en la base de datos:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Admin */}
            <button
              onClick={() => handleQuickRoleSwitch('ADMIN')}
              disabled={switchingRole !== null}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                (session?.user as any)?.role === 'ADMIN'
                  ? 'bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-500/10'
                  : 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Administrador General</div>
                    <div className="text-[11px] text-slate-400">admin@pedidostrinidad.com</div>
                  </div>
                </div>
                {(session?.user as any)?.role === 'ADMIN' && (
                  <CheckCircle2 className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div className="mt-3 text-[11px] text-slate-400 line-clamp-1">
                Control de espacios, cobro flat 100 Bs y kill-switch de tiendas.
              </div>
            </button>

            {/* 2. Tienda Don Pepe */}
            <button
              onClick={() => handleQuickRoleSwitch('BUSINESS_OWNER')}
              disabled={switchingRole !== null}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                (session?.user as any)?.role === 'BUSINESS_OWNER'
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/80 border-slate-800 hover:border-amber-500/40 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Dueño de Tienda (Don Pepe)</div>
                    <div className="text-[11px] text-slate-400">donpepe@elbosque.com</div>
                  </div>
                </div>
                {(session?.user as any)?.role === 'BUSINESS_OWNER' && (
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="mt-3 text-[11px] text-slate-400 line-clamp-1">
                Catálogo de productos, asistencia abierta/cerrada y comprobantes QR.
              </div>
            </button>

            {/* 3. Repartidor Flash */}
            <button
              onClick={() => handleQuickRoleSwitch('DRIVER')}
              disabled={switchingRole !== null}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                (session?.user as any)?.role === 'DRIVER'
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Repartidor (Flash)</div>
                    <div className="font-mono text-[11px] text-emerald-400">Código: DRV-777</div>
                  </div>
                </div>
                {(session?.user as any)?.role === 'DRIVER' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className="mt-3 text-[11px] text-slate-400 line-clamp-1">
                Aceptación de pedidos, tracking de tiempos y cálculo de ganancias.
              </div>
            </button>

            {/* 4. Cliente Mateo */}
            <button
              onClick={() => handleQuickRoleSwitch('CUSTOMER')}
              disabled={switchingRole !== null}
              className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
                (session?.user as any)?.role === 'CUSTOMER'
                  ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/40 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Cliente (Mateo Morales)</div>
                    <div className="text-[11px] text-slate-400">cliente@gmail.com</div>
                  </div>
                </div>
                {(session?.user as any)?.role === 'CUSTOMER' && (
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="mt-3 text-[11px] text-slate-400 line-clamp-1">
                Filtros por precio/espacio, carrito de compras y checkout QR/Gateway.
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Checklist de Criterios del Sprint 1 */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 mb-8">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Criterios de Aceptación del Sprint 1</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <div className="font-semibold text-white">Esquema de Base de Datos Prisma en PostgreSQL</div>
              <p className="text-slate-400 mt-0.5">
                Modelos relacionales creados: User, Space, Business, Product, Order, OrderItem, Payment, OrderTracking con enums de roles y estados.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <div className="font-semibold text-white">Clean Architecture & Dominio Desacoplado</div>
              <p className="text-slate-400 mt-0.5">
                Entidades puras (User, Business, Order), Casos de uso de aplicación e interfaces de repositorio sin acoplamiento a frameworks.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <div className="font-semibold text-white">Autenticación Multi-Rol (NextAuth.js)</div>
              <p className="text-slate-400 mt-0.5">
                Soporte de credenciales con hashing bcrypt, login rápido de repartidores por código único (DRV-XXX) y Google Provider.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <div className="font-semibold text-white">Portal de Acceso Unificado y Validación Visual</div>
              <p className="text-slate-400 mt-0.5">
                Pestañas dedicadas por rol (/auth/login), validación Zod en API de registro y visor de persistencia en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inspección de Datos en PostgreSQL */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Persistencia en PostgreSQL (Datos Sembrados)</h2>
              <p className="text-xs text-slate-400">
                Registros activos en la base de datos local verificados en vivo
              </p>
            </div>
          </div>

          {dbData && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-slate-900 text-xs font-medium text-slate-300 border border-slate-800">
                👥 {dbData.counts?.users} Usuarios
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-900 text-xs font-medium text-slate-300 border border-slate-800">
                🏛️ {dbData.counts?.spaces} Espacios
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-900 text-xs font-medium text-slate-300 border border-slate-800">
                🏬 {dbData.counts?.businesses} Negocios
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-900 text-xs font-medium text-slate-300 border border-slate-800">
                🍔 {dbData.counts?.products} Productos
              </span>
            </div>
          )}
        </div>

        {loadingDb ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>Consultando PostgreSQL...</span>
          </div>
        ) : dbData ? (
          <div className="space-y-6">
            {/* Tabla de Usuarios Sembrados */}
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Usuarios Registrados & Roles
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="py-2.5 px-3 font-semibold">Nombre / Identificador</th>
                      <th className="py-2.5 px-3 font-semibold">Email</th>
                      <th className="py-2.5 px-3 font-semibold">Rol</th>
                      <th className="py-2.5 px-3 font-semibold">Código Repartidor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {dbData.users?.map((user: any) => (
                      <tr key={user.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-white">{user.name || 'Sin Nombre'}</td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{user.email}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleColor(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">
                          {user.driverCode ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                              {user.driverCode}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Espacios Físicos Configurados */}
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Espacios Físicos Creados (Patios de Comida)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {dbData.spaces?.map((space: any) => (
                  <div
                    key={space.id}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{space.name}</div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{space.description}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 font-medium">
                      {space._count?.businesses || 0} Negocios alojados
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>No se pudieron cargar los datos de PostgreSQL. Asegúrate de que el servidor esté activo.</span>
          </div>
        )}
      </div>
    </div>
  );
}
