'use client';

import React, { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
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
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button, Field, Input, inputBase } from '@/presentation/components/ui';
import { cn } from '@/presentation/lib/utils';
import { EASE_RUNE, tSpring } from '@/presentation/lib/motion';

type AuthTab = 'CUSTOMER' | 'STORE' | 'DRIVER';

/* Las credenciales de prueba no deben publicarse en producción: son cuentas
   reales de la base y cualquiera que abra el login las vería. */
const MOSTRAR_CREDENCIALES_DEMO = process.env.NODE_ENV !== 'production';

const TABS: Array<{
  key: AuthTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentText: string;
  accentBar: string;
}> = [
  {
    key: 'CUSTOMER',
    label: 'Cliente',
    icon: ShoppingBag,
    accentText: 'text-arc',
    accentBar: 'from-violet-500 via-arc to-arc-soft',
  },
  {
    key: 'STORE',
    label: 'Tienda',
    icon: Store,
    accentText: 'text-warn',
    accentBar: 'from-warn-deep via-warn to-warn-soft',
  },
  {
    key: 'DRIVER',
    label: 'Repartidor',
    icon: Bike,
    accentText: 'text-info',
    accentBar: 'from-info-deep via-info to-info-soft',
  },
];

/** Input con icono a la izquierda. */
function IconInput({
  icon: Icon,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
      <input className={cn(inputBase, 'h-12 pl-11', className)} {...rest} />
    </div>
  );
}

export function UnifiedLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab')?.toUpperCase() as AuthTab) || 'CUSTOMER';

  const nextAuthError = searchParams.get('error');
  const errorFromUrl = nextAuthError
    ? nextAuthError === 'OAuthAccountNotLinked'
      ? 'Este correo ya está registrado con contraseña. Usá el formulario de abajo.'
      : nextAuthError === 'OAuthSignin' || nextAuthError === 'OAuthCallback'
        ? 'No pudimos conectar con Google. Revisá la configuración del OAuth.'
        : nextAuthError === 'Configuration'
          ? 'Google OAuth no está configurado en el servidor.'
          : `Error de autenticación: ${nextAuthError}`
    : null;

  /* Volver a donde el usuario quería ir (ej. /checkout tras la puerta de acceso).
     Se restringe a rutas internas para no abrir un open redirect. */
  const rawCallback = searchParams.get('callbackUrl') ?? '';
  const callbackUrl = rawCallback.startsWith('/') && !rawCallback.startsWith('//') ? rawCallback : '/spaces';

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  // /auth/register redirige acá con ?mode=register
  const [isRegistering, setIsRegistering] = useState(
    searchParams.get('mode') === 'register' && initialTab === 'CUSTOMER'
  );
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(errorFromUrl);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [driverCode, setDriverCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const tab = TABS.find((t) => t.key === activeTab)!;

  const handleTabChange = (next: AuthTab) => {
    setActiveTab(next);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsRegistering(false);
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signIn('credentials', { email, password, redirect: false });
      if (res?.error) {
        if (res.error.startsWith('FROZEN:')) {
          router.push(`/auth/frozen?reason=${res.error.replace('FROZEN:', '')}`);
          return;
        }
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('¡Listo! Entrando…');

        /* El destino lo decide el rol real de la cuenta, no la pestaña en la
           que se escribió. Así el admin entra por el formulario de cliente con
           sus credenciales y cae en su consola, sin necesidad de una pestaña
           que anuncie que existe. */
        const sesion = await getSession();
        const rol = (sesion?.user as any)?.role as string | undefined;

        const dest =
          rol === 'ADMIN'
            ? '/admin/dashboard'
            : rol === 'BUSINESS_OWNER'
              ? '/store/dashboard'
              : rol === 'DRIVER'
                ? '/driver/dashboard'
                : callbackUrl;

        setTimeout(() => {
          router.push(dest);
          router.refresh();
        }, 700);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signIn('driver-code', { code: driverCode, redirect: false });
      if (res?.error) {
        if (res.error.startsWith('FROZEN:')) {
          router.push(`/auth/frozen?reason=${res.error.replace('FROZEN:', '')}`);
          return;
        }
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Código validado. Abriendo tu portal…');
        setTimeout(() => {
          router.push('/driver/dashboard');
          router.refresh();
        }, 700);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'No pudimos validar tu código.');
    } finally {
      setLoading(false);
    }
  };

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
      if (!res.ok) throw new Error(data.error || 'No pudimos crear tu cuenta.');

      setSuccessMsg('¡Cuenta creada! Iniciando sesión…');
      const loginRes = await signIn('credentials', { email, password, redirect: false });
      if (loginRes?.error) setErrorMsg(loginRes.error);
      else
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 700);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setErrorMsg(null);
    try {
      await signIn('google', { callbackUrl });
    } catch {
      setErrorMsg('No pudimos conectar con Google. Intentá de nuevo.');
      setLoadingGoogle(false);
    }
  };

  const autofill = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  const passwordField = (label: string) => (
    <Field label={label} htmlFor="password" required>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          id="password"
          type={showPass ? 'text' : 'password'}
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className={cn(inputBase, 'h-12 pl-11 pr-12')}
        />
        <button
          type="button"
          onClick={() => setShowPass((v) => !v)}
          aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-2 text-ink-faint transition-colors hover:text-white"
        >
          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Selector de rol */}
      <div className="mb-6 grid grid-cols-3 gap-1 rounded-2xl border border-surface-line bg-void-800/70 p-1.5 backdrop-blur-xl">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => handleTabChange(t.key)}
              aria-pressed={active}
              className={cn(
                'relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[12px] font-semibold transition-colors duration-200',
                active ? 'text-white' : 'text-ink-mute hover:text-ink-soft'
              )}
            >
              {active && (
                <motion.span
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-xl border border-violet-400/40 bg-violet-500/18 shadow-glow-violet"
                  transition={tSpring}
                />
              )}
              <t.icon className={cn('relative h-4 w-4', active && t.accentText)} />
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tarjeta */}
      <div className="rune-panel rune-edge relative overflow-hidden rounded-[28px] p-6 sm:p-8">
        <motion.div
          key={activeTab}
          layout
          className={cn('absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r', tab.accentBar)}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: EASE_RUNE }}
          style={{ transformOrigin: 'left' }}
        />

        {/* Mensajes */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              key="err"
              role="alert"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2.5 rounded-2xl border border-danger/35 bg-danger/10 p-3.5 text-[12px] text-danger-soft">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              key="ok"
              role="status"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2.5 rounded-2xl border border-ok/35 bg-ok/10 p-3.5 text-[12px] text-ok-soft">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${isRegistering}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.28, ease: EASE_RUNE }}
          >
            {/* ---------- CLIENTE ---------- */}
            {activeTab === 'CUSTOMER' && (
              <>
                <header className="mb-6">
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white">
                    <ShoppingBag className="h-5 w-5 text-arc" />
                    {isRegistering ? 'Crear cuenta' : 'Acceso de clientes'}
                  </h2>
                  <p className="mt-1.5 text-[13px] text-ink-mute">
                    {isRegistering
                      ? 'Registrate para pedir en los patios de comida de Trinidad.'
                      : 'Entrá para pedir, seguir tus envíos y guardar tus direcciones.'}
                  </p>
                </header>

                {!isRegistering && (
                  <>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loadingGoogle}
                      className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white px-4 py-3.5 text-[13px] font-semibold text-gray-800 transition-all hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70"
                    >
                      {loadingGoogle ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                      ) : (
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                        </svg>
                      )}
                      {loadingGoogle ? 'Redirigiendo a Google…' : 'Continuar con Google'}
                    </button>

                    <div className="relative my-6 text-center">
                      <span className="absolute inset-x-0 top-1/2 h-px bg-surface-line" />
                      <span className="relative bg-surface px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
                        o con tu correo
                      </span>
                    </div>
                  </>
                )}

                <form
                  onSubmit={isRegistering ? handleCustomerRegister : handleCredentialsLogin}
                  className="space-y-4"
                >
                  {isRegistering && (
                    <>
                      <Field label="Nombre completo" htmlFor="name" required>
                        <IconInput
                          id="name"
                          icon={User}
                          type="text"
                          required
                          autoComplete="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ej. Mateo Morales"
                        />
                      </Field>

                      <Field label="Teléfono / WhatsApp" htmlFor="phone">
                        <IconInput
                          id="phone"
                          icon={Phone}
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+591 71234567"
                        />
                      </Field>
                    </>
                  )}

                  <Field label="Correo electrónico" htmlFor="email" required>
                    <IconInput
                      id="email"
                      icon={Mail}
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="cliente@gmail.com"
                    />
                  </Field>

                  {passwordField('Contraseña')}

                  <Button type="submit" size="lg" full loading={loading} className="mt-2">
                    {!loading && (isRegistering ? 'Crear mi cuenta' : 'Iniciar sesión')}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[12px]">
                  <button
                    type="button"
                    onClick={() => setIsRegistering((v) => !v)}
                    className="cursor-pointer font-semibold text-arc-soft transition-colors hover:text-white"
                  >
                    {isRegistering ? '¿Ya tenés cuenta? Iniciá sesión' : '¿Sin cuenta? Registrate'}
                  </button>
                  {MOSTRAR_CREDENCIALES_DEMO && (
                    <button
                      type="button"
                      onClick={() => autofill('cliente@gmail.com', 'cliente123')}
                      className="cursor-pointer text-[11px] text-ink-faint underline transition-colors hover:text-ink-soft"
                    >
                      Usar cliente demo
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ---------- TIENDA ---------- */}
            {activeTab === 'STORE' && (
              <>
                <header className="mb-6">
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white">
                    <Store className="h-5 w-5 text-warn" />
                    Portal de tiendas
                  </h2>
                  <p className="mt-1.5 text-[13px] text-ink-mute">
                    Gestioná tu menú, verificá comprobantes QR y controlá tu asistencia diaria.
                  </p>
                </header>

                <form onSubmit={handleCredentialsLogin} className="space-y-4">
                  <Field label="Email de la tienda" htmlFor="email" required>
                    <IconInput
                      id="email"
                      icon={Mail}
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="donpepe@elbosque.com"
                    />
                  </Field>
                  {passwordField('Contraseña')}
                  <Button type="submit" size="lg" full loading={loading} className="mt-2">
                    {!loading && 'Entrar al panel'}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>

                {MOSTRAR_CREDENCIALES_DEMO && (
                <div className="mt-6 border-t border-surface-line pt-5">
                  <p className="mb-2.5 text-[11px] font-semibold text-ink-mute">Cuentas de prueba</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { e: 'donpepe@elbosque.com', n: 'Don Pepe Burgers', s: 'El Bosque' },
                      { e: 'sushiclub@plazaverde.com', n: 'Tokyo Sushi Club', s: 'Plaza Verde' },
                    ].map((d) => (
                      <button
                        key={d.e}
                        type="button"
                        onClick={() => autofill(d.e, 'tienda123')}
                        className="cursor-pointer rounded-xl border border-surface-line bg-void-800/60 p-2.5 text-left transition-colors hover:border-warn/40"
                      >
                        <span className="block text-[12px] font-semibold text-warn-soft">{d.n}</span>
                        <span className="block text-[11px] text-ink-faint">{d.s}</span>
                      </button>
                    ))}
                  </div>
                </div>
                )}
              </>
            )}

            {/* ---------- REPARTIDOR ---------- */}
            {activeTab === 'DRIVER' && (
              <>
                <header className="mb-6">
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white">
                    <Bike className="h-5 w-5 text-info" />
                    Portal de repartidores
                  </h2>
                  <p className="mt-1.5 text-[13px] text-ink-mute">
                    Ingresá con tu código único asignado por la administración.
                  </p>
                </header>

                <form onSubmit={handleDriverLogin} className="space-y-4">
                  <Field
                    label="Código de repartidor"
                    htmlFor="drv"
                    required
                    hint="Formato DRV-XXX"
                  >
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-info" />
                      <input
                        id="drv"
                        type="text"
                        required
                        value={driverCode}
                        onChange={(e) => setDriverCode(e.target.value.toUpperCase())}
                        placeholder="DRV-777"
                        className={cn(
                          inputBase,
                          'h-14 pl-12 font-mono text-lg font-bold uppercase tracking-[0.3em] text-info'
                        )}
                      />
                    </div>
                  </Field>

                  <Button type="submit" size="lg" full loading={loading}>
                    {!loading && 'Entrar como repartidor'}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>

                {MOSTRAR_CREDENCIALES_DEMO && (
                <div className="mt-6 border-t border-surface-line pt-5">
                  <p className="mb-2.5 text-[11px] font-semibold text-ink-mute">
                    Repartidores de prueba
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { c: 'DRV-777', n: 'Carlos Flash' },
                      { c: 'DRV-888', n: 'María Veloz' },
                    ].map((d) => (
                      <button
                        key={d.c}
                        type="button"
                        onClick={() => setDriverCode(d.c)}
                        className="cursor-pointer rounded-xl border border-surface-line bg-void-800/60 p-2.5 text-left transition-colors hover:border-info/40"
                      >
                        <span className="block font-mono text-[12px] font-bold text-info">{d.c}</span>
                        <span className="block text-[11px] text-ink-faint">{d.n}</span>
                      </button>
                    ))}
                  </div>
                </div>
                )}
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
