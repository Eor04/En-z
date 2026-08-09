'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  KeyRound,
} from 'lucide-react';

type AuthTab = 'CUSTOMER' | 'STORE' | 'DRIVER' | 'ADMIN';

export function UnifiedLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab')?.toUpperCase() as AuthTab) || 'CUSTOMER';

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [driverCode, setDriverCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsRegistering(false);
  };

  // 1. Manejo de Login con Credenciales
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('¡Sesión iniciada exitosamente! Redirigiendo...');
        setTimeout(() => {
          if (activeTab === 'STORE') {
            router.push('/store/dashboard');
          } else if (activeTab === 'DRIVER') {
            router.push('/driver/dashboard');
          } else if (activeTab === 'ADMIN') {
            router.push('/admin/dashboard');
          } else {
            router.push('/spaces');
          }
          router.refresh();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // 2. Manejo de Login con Código de Repartidor
  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await signIn('driver-code', {
        code: driverCode,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('¡Código de repartidor validado con éxito! Redirigiendo a tu portal...');
        setTimeout(() => {
          router.push('/driver/dashboard');
          router.refresh();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al validar código');
    } finally {
      setLoading(false);
    }
  };

  // 3. Manejo de Registro de Cliente
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      setSuccessMsg('¡Cuenta creada con éxito! Iniciando sesión...');
      // Iniciar sesión automáticamente
      const loginRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        setErrorMsg(loginRes.error);
      } else {
        setTimeout(() => {
          router.push('/spaces');
          router.refresh();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Login real con Google OAuth
  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setErrorMsg(null);
    try {
      await signIn('google', {
        callbackUrl: '/spaces',
      });
      // signIn con Google redirige automáticamente — no hay que manejar la respuesta
    } catch (err: any) {
      setErrorMsg('Error al conectar con Google. Inténtalo de nuevo.');
      setLoadingGoogle(false);
    }
  };

  // 5. Autocompletar datos de prueba
  const autofillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Selector de Pestañas por Rol */}
      <div className="grid grid-cols-4 gap-1 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl mb-6 shadow-xl">
        <button
          type="button"
          onClick={() => handleTabChange('CUSTOMER')}
          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'CUSTOMER'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Cliente</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('STORE')}
          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'STORE'
              ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Tienda</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('DRIVER')}
          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'DRIVER'
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Repartidor</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('ADMIN')}
          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ADMIN'
              ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Admin</span>
        </button>
      </div>

      {/* Tarjeta Principal del Formulario */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Header Accent */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
            activeTab === 'CUSTOMER'
              ? 'from-blue-500 via-teal-400 to-emerald-400'
              : activeTab === 'STORE'
              ? 'from-amber-500 via-orange-400 to-yellow-400'
              : activeTab === 'DRIVER'
              ? 'from-emerald-500 via-green-400 to-teal-400'
              : 'from-rose-500 via-purple-500 to-indigo-500'
          }`}
        />

        {/* Mensajes de Notificación */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ----------------- TAB 1: CLIENTE ----------------- */}
        {activeTab === 'CUSTOMER' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
                {isRegistering ? 'Crear Cuenta de Cliente' : 'Acceso de Clientes'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isRegistering
                  ? 'Regístrate para pedir en los mejores patios de comida de Trinidad.'
                  : 'Ingresa para ordenar, seguir tus pedidos y gestionar tus compras.'}
              </p>
            </div>

            {!isRegistering && (
              <>
                {/* Botón Google OAuth Real */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loadingGoogle}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg group disabled:opacity-70 disabled:cursor-wait"
                >
                  {loadingGoogle ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                  )}
                  <span>{loadingGoogle ? 'Redirigiendo a Google...' : 'Continuar con Google'}</span>
                </button>

                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <span className="relative px-3 bg-slate-900 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    o con correo electrónico
                  </span>
                </div>
              </>
            )}

            <form onSubmit={isRegistering ? handleCustomerRegister : handleCredentialsLogin} className="space-y-4">
              {isRegistering && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombre Completo</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Mateo Morales"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Teléfono / WhatsApp</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+591 71234567"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isRegistering ? 'Crear mi Cuenta' : 'Iniciar Sesión'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
              </button>

              <button
                type="button"
                onClick={() => autofillCredentials('cliente@gmail.com', 'cliente123')}
                className="text-[11px] text-slate-500 hover:text-slate-300 underline"
              >
                Autocompletar Cliente Demo
              </button>
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: TIENDA / NEGOCIO ----------------- */}
        {activeTab === 'STORE' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" />
                Portal de Tiendas & Restaurantes
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Administra tu inventario, confirma comprobantes de pago QR y controla tu asistencia diaria.
              </p>
            </div>

            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email de la Tienda</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="donpepe@elbosque.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contraseña de Propietario</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Ingresar al Panel de Tienda</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <p className="text-[11px] font-semibold text-slate-400 mb-2">Cuentas de Negocio de Prueba:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => autofillCredentials('donpepe@elbosque.com', 'tienda123')}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition-colors text-[11px]"
                >
                  <div className="font-semibold text-amber-300">Don Pepe Burgers</div>
                  <div className="text-slate-500">Patio El Bosque</div>
                </button>
                <button
                  type="button"
                  onClick={() => autofillCredentials('sushiclub@plazaverde.com', 'tienda123')}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition-colors text-[11px]"
                >
                  <div className="font-semibold text-amber-300">Tokyo Sushi Club</div>
                  <div className="text-slate-500">Plaza Verde</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 3: REPARTIDOR (DRIVER) ----------------- */}
        {activeTab === 'DRIVER' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Bike className="w-5 h-5 text-emerald-400" />
                Portal de Repartidores (Delivery)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ingreso instantáneo mediante tu Código Único de Repartidor asignado por la administración.
              </p>
            </div>

            <form onSubmit={handleDriverLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Código de Repartidor (Formato: DRV-XXX)
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={driverCode}
                    onChange={(e) => setDriverCode(e.target.value.toUpperCase())}
                    placeholder="DRV-777"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/90 border-2 border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-base font-mono font-bold tracking-widest text-emerald-400 placeholder-slate-600 outline-none uppercase transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar como Repartidor</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400">Repartidores de Prueba Disponibles:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDriverCode('DRV-777')}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors"
                >
                  <div className="font-mono font-bold text-emerald-400 text-xs">DRV-777</div>
                  <div className="text-[11px] text-slate-400">Carlos Flash</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDriverCode('DRV-888')}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors"
                >
                  <div className="font-mono font-bold text-emerald-400 text-xs">DRV-888</div>
                  <div className="text-[11px] text-slate-400">María Veloz</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 4: ADMINISTRADOR ----------------- */}
        {activeTab === 'ADMIN' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-400" />
                Panel de Administración General
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Acceso exclusivo para gestión de Espacios, cobro de suscripción flat (100 Bs) y control de tiendas.
              </p>
            </div>

            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email de Administrador</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@pedidostrinidad.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contraseña Maestra</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 hover:shadow-rose-500/30 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Acceder a la Consola Maestra</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Credenciales del Administrador:</span>
              <button
                type="button"
                onClick={() => autofillCredentials('admin@pedidostrinidad.com', 'admin123')}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-medium underline"
              >
                Autocompletar Admin (admin123)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
