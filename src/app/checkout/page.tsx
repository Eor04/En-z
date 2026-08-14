'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ShoppingBag,
  MapPin,
  Phone,
  CreditCard,
  QrCode,
  Banknote,
  Store,
  ShieldCheck,
  AlertCircle,
  Clock,
  Layers,
  Info,
  Bike,
  LogIn,
  UserX,
} from 'lucide-react';
import { useCart } from '@/presentation/context/CartContext';
import { ClientLocationPicker } from '@/presentation/components/maps/ClientLocationPicker';
import { AddressBook } from '@/presentation/components/maps/AddressBook';
import {
  CheckoutQrPayment,
  type QrGroup,
  type ReceiptEntry,
} from '@/presentation/components/checkout/CheckoutQrPayment';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Panel,
  Reveal,
  Skeleton,
  Textarea,
} from '@/presentation/components/ui';
import { bs, cn } from '@/presentation/lib/utils';
import { EASE_RUNE } from '@/presentation/lib/motion';

/* La pasarela con tarjeta se retiró: en Trinidad casi no se usa y dejaba
   un camino de pago sin probar. El enum de la base la conserva por los
   pedidos históricos. */
type Method = 'CASH' | 'QR_MANUAL';

/** Cabecera numerada reutilizable de cada bloque del checkout. */
function StepHeader({
  n,
  icon: Icon,
  title,
  aside,
}: {
  n: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-3">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/12">
          <Icon className="h-4 w-4 text-violet-300" />
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-violet-400/40 bg-void font-display text-[10px] font-bold text-arc-soft">
            {n}
          </span>
        </span>
        <span className="font-display text-[15px] font-bold text-white">{title}</span>
      </h2>
      {aside}
    </div>
  );
}

const METHODS: Array<{
  value: Method;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  multiTitle?: string;
  text: string;
  multiText?: string;
  accent: string;
  tag?: string;
}> = [
  {
    value: 'QR_MANUAL',
    icon: QrCode,
    title: 'Pago express con QR',
    multiTitle: 'Pago mixto con QR por local',
    text: 'Se genera el QR del comercio para la transferencia (Simple, BCP, BNB, FIE) y adjuntás tu comprobante.',
    multiText:
      'Dividimos las cuentas por restaurante. Transferís a cada local y adjuntás los comprobantes en el seguimiento.',
    accent: 'warn',
    tag: 'Más usado en Trinidad',
  },
  {
    value: 'CASH',
    icon: Banknote,
    title: 'Efectivo al recibir',
    text: 'Pagás en la puerta directamente al repartidor cuando entregue tu pedido.',
    accent: 'ok',
  },
];

const ACCENT: Record<string, string> = {
  warn: 'border-warn/50 bg-warn/10 shadow-[0_0_30px_-14px_rgba(245,158,11,0.7)]',
  info: 'border-info/50 bg-info/10 shadow-[0_0_30px_-14px_rgba(56,189,248,0.7)]',
  ok: 'border-ok/50 bg-ok/10 shadow-[0_0_30px_-14px_rgba(34,197,94,0.7)]',
};

const ACCENT_ICON: Record<string, string> = {
  warn: 'text-warn',
  info: 'text-info',
  ok: 'text-ok',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const {
    items,
    groupedByBusiness,
    isMultiStore,
    businessCount,
    subtotal,
    deliveryFee,
    total,
    clearCart,
  } = useCart();

  const [deliveryAddress, setDeliveryAddress] = useState(
    'Ubicación GPS: -14.83480, -64.90420 (Trinidad, Beni)'
  );
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Method>('QR_MANUAL');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* Comprobantes por local, cargados antes de confirmar el pedido */
  const [receipts, setReceipts] = useState<Record<string, ReceiptEntry>>({});

  /* La tarifa de envío se cobra una sola vez, en el primer local: el mismo
     criterio que usa CreateOrder al repartir los montos. */
  const qrGroups: QrGroup[] = groupedByBusiness.map((g, i) => ({
    businessId: g.businessId,
    businessName: g.businessName,
    qrCodeUrl: g.qrCodeUrl,
    subtotal: g.subtotal,
    amount: g.subtotal + (i === 0 ? deliveryFee : 0),
    carriesDeliveryFee: i === 0,
  }));

  const role = (session?.user as any)?.role as string | undefined;

  /* --- Puerta de acceso: hacer un pedido exige sesión de cliente --- */
  if (sessionStatus === 'loading') {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <EmptyState
          icon={LogIn}
          title="Iniciá sesión para pedir"
          description="Necesitamos tu cuenta para asociarte el pedido, avisarte cuando avance y que puedas seguirlo en vivo. Tu carrito te espera."
          action={
            <Button href="/auth/login?tab=customer&callbackUrl=/checkout" size="md">
              <LogIn className="h-4 w-4" />
              Iniciar sesión o registrarme
            </Button>
          }
        />
      </div>
    );
  }

  if (role !== 'CUSTOMER') {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <EmptyState
          icon={UserX}
          title="Entrá con una cuenta de cliente"
          description="Tu sesión actual es de otro tipo de usuario. Los pedidos sólo pueden hacerse desde una cuenta de cliente."
          action={
            <Button href="/auth/login?tab=customer&callbackUrl=/checkout" size="md">
              Cambiar de cuenta
            </Button>
          }
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <EmptyState
          icon={ShoppingBag}
          title="Tu carrito está vacío"
          description="Elegí productos de tus comercios favoritos antes de pasar por el checkout."
          action={
            <Button href="/spaces" size="md">
              Explorar espacios
            </Button>
          }
        />
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!deliveryAddress.trim()) {
      setErrorMessage('Confirmá tu ubicación de entrega en el mapa.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Necesitamos un teléfono o WhatsApp para que el repartidor te ubique.');
      return;
    }

    // Con QR el pago se resuelve acá: sin comprobante el pedido quedaría trabado
    if (paymentMethod === 'QR_MANUAL') {
      const faltantes = qrGroups.filter((g) => !receipts[g.businessId]?.receiptUrl);
      if (faltantes.length > 0) {
        setErrorMessage(
          faltantes.length === qrGroups.length
            ? 'Adjuntá la captura de tu transferencia para continuar.'
            : `Falta el comprobante de ${faltantes.map((f) => f.businessName).join(' y ')}.`
        );
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress: deliveryAddress.trim(),
          customerPhone: customerPhone.trim(),
          notes: notes.trim() || undefined,
          paymentMethod,
          items: items.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
            businessId: i.businessId,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No pudimos procesar tu pedido.');

      /* Adjuntar cada comprobante a la comanda de su local. Se hace acá, en el
         mismo envío, para que la tienda lo vea junto con el pedido. */
      if (paymentMethod === 'QR_MANUAL') {
        const creadas: any[] = data.orders ?? [data.order];
        const resultados = await Promise.all(
          creadas.map((o) => {
            const entry = receipts[o.businessId];
            if (!entry?.receiptUrl) return Promise.resolve(true);
            return fetch('/api/payments/upload-receipt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: o.id,
                receiptUrl: entry.receiptUrl,
                transactionReference: entry.reference?.trim() || undefined,
              }),
            }).then((r) => r.ok);
          })
        );

        // El pedido ya existe: si algún comprobante falla se reintenta desde
        // el seguimiento, no tiene sentido bloquear al cliente acá.
        if (resultados.some((ok) => !ok)) {
          console.warn('Algún comprobante no se pudo adjuntar; se puede reintentar en el seguimiento.');
        }
      }

      clearCart();
      router.push(`/orders/${data.order.id}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <Reveal className="mb-9">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge tone="violet" icon={ShieldCheck}>
            Checkout seguro
          </Badge>
          {isMultiStore && (
            <Badge tone="warn" icon={Layers}>
              Pedido multi-comercio · {businessCount} locales
            </Badge>
          )}
        </div>
        <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight text-white sm:text-4xl">
          Confirmá tu <span className="text-rune">pedido</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-mute sm:text-sm">
          {isMultiStore
            ? `Tu pedido incluye platos de ${businessCount} negocios. Generamos una comanda independiente para cada cocina y un pago mixto.`
            : 'Marcá tu ubicación con GPS o tocá el mapa de Trinidad, y elegí cómo querés pagar.'}
        </p>
      </Reveal>

      {/* Error */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25, ease: EASE_RUNE }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-[13px] text-danger-soft">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 gap-7 lg:grid-cols-12">
        {/* ---------- Columna izquierda ---------- */}
        <div className="space-y-6 lg:col-span-7">
          <Reveal>
            <Panel className="p-6">
              <StepHeader
                n={1}
                icon={MapPin}
                title="Ubicación de entrega"
                aside={<Badge tone="ok" dot>GPS en vivo</Badge>}
              />
              <ClientLocationPicker
                onLocationChange={({ formattedAddress }) => setDeliveryAddress(formattedAddress)}
              />
              <div className="mt-5 border-t border-surface-line pt-5">
                <AddressBook
                  currentAddress={deliveryAddress}
                  onSelectAddress={setDeliveryAddress}
                />
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={0.06}>
            <Panel className="p-6">
              <StepHeader n={2} icon={Phone} title="Contacto y notas" />
              <div className="space-y-5">
                <Field
                  required
                  htmlFor="phone"
                  label="Teléfono o WhatsApp"
                  hint="El repartidor te va a escribir o llamar al llegar."
                >
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej. 78901234"
                  />
                </Field>

                <Field
                  htmlFor="notes"
                  label="Notas para el repartidor"
                  hint="Opcional, pero ayuda mucho a encontrarte."
                >
                  <Textarea
                    id="notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej. portón blanco, tocar timbre dos veces, piso 2…"
                    className="resize-none"
                  />
                </Field>
              </div>
            </Panel>
          </Reveal>

          <Reveal delay={0.12}>
            <Panel className="p-6">
              <StepHeader
                n={3}
                icon={CreditCard}
                title="Método de pago"
                aside={isMultiStore ? <Badge tone="warn">Pago mixto</Badge> : undefined}
              />

              <div role="radiogroup" aria-label="Método de pago" className="space-y-3">
                {METHODS.map((m) => {
                  const active = paymentMethod === m.value;
                  return (
                    <div key={m.value}>
                      <label
                        className={cn(
                          'flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-all duration-200',
                          active
                            ? ACCENT[m.accent]
                            : 'border-surface-line bg-void-800/50 hover:border-violet-500/35'
                        )}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={m.value}
                          checked={active}
                          onChange={() => setPaymentMethod(m.value)}
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            active ? 'border-current' : 'border-surface-line',
                            active && ACCENT_ICON[m.accent]
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId="pay-dot"
                              className="h-2.5 w-2.5 rounded-full bg-current"
                            />
                          )}
                        </span>

                        <span className="flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <m.icon className={cn('h-4 w-4', ACCENT_ICON[m.accent])} />
                            <span className="font-display text-[13px] font-bold text-white">
                              {isMultiStore && m.multiTitle ? m.multiTitle : m.title}
                            </span>
                            {m.tag && (
                              <span className="rounded-full border border-warn/30 bg-warn/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-warn-soft">
                                {m.tag}
                              </span>
                            )}
                          </span>
                          <span className="mt-1.5 block text-[12px] leading-relaxed text-ink-mute">
                            {isMultiStore && m.multiText ? m.multiText : m.text}
                          </span>
                        </span>
                      </label>

                      {/* Pago por QR ahí mismo: un QR por local + comprobante */}
                      <AnimatePresence>
                        {active && m.value === 'QR_MANUAL' && (
                          <CheckoutQrPayment
                            groups={qrGroups}
                            deliveryFee={deliveryFee}
                            receipts={receipts}
                            onChange={(businessId, entry) =>
                              setReceipts((prev) => ({ ...prev, [businessId]: entry }))
                            }
                          />
                        )}
                      </AnimatePresence>

                      {/* Desglose multi-comercio */}
                      <AnimatePresence>
                        {isMultiStore && active && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: EASE_RUNE }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 space-y-2 rounded-2xl border border-surface-line bg-void-800/70 p-4">
                              <p className="flex items-center gap-1.5 text-[11px] font-bold text-violet-300">
                                <Info className="h-3.5 w-3.5" />
                                {m.value === 'QR_MANUAL'
                                  ? 'Transferencias por comercio'
                                  : 'Efectivo a entregar'}
                              </p>
                              {groupedByBusiness.map((g, idx) => (
                                <div
                                  key={g.businessId}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-surface-line/70 bg-surface/60 px-3 py-2.5"
                                >
                                  <span className="flex min-w-0 items-center gap-2.5">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/12 font-display text-[10px] font-bold text-violet-300">
                                      {idx + 1}
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block truncate text-[12px] font-bold text-white">
                                        {g.businessName}
                                      </span>
                                      {g.spaceName && (
                                        <span className="block text-[10px] text-ink-faint">
                                          {g.spaceName}
                                        </span>
                                      )}
                                    </span>
                                  </span>
                                  <span className="shrink-0 font-display text-[13px] font-bold text-warn-soft tabular">
                                    {bs(g.subtotal)} Bs
                                  </span>
                                </div>
                              ))}
                              <div className="flex items-center justify-between gap-3 rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2.5">
                                <span className="flex items-center gap-2.5">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
                                    <Bike className="h-3 w-3" />
                                  </span>
                                  <span className="text-[12px] font-bold text-white">
                                    Envío en Trinidad
                                  </span>
                                </span>
                                <span className="font-display text-[13px] font-bold text-arc tabular">
                                  {bs(deliveryFee)} Bs
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </Reveal>
        </div>

        {/* ---------- Resumen ---------- */}
        <div className="lg:col-span-5">
          <Reveal delay={0.08}>
            <Panel className="sticky top-24 p-6">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-surface-line pb-4">
                <span className="flex min-w-0 items-center gap-2">
                  <Store className="h-4 w-4 shrink-0 text-warn" />
                  <span className="truncate font-display text-[13px] font-bold text-white">
                    {isMultiStore
                      ? `${businessCount} locales`
                      : groupedByBusiness[0]?.businessName}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-ink-faint tabular">
                  {items.length} productos
                </span>
              </div>

              <div className="mb-5 max-h-72 space-y-3 overflow-y-auto pr-1">
                {groupedByBusiness.map((group) => (
                  <div
                    key={group.businessId}
                    className="space-y-2 rounded-2xl border border-surface-line bg-void-800/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-surface-line/70 pb-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-bold text-warn-soft">
                        <Store className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{group.businessName}</span>
                      </span>
                      <span className="shrink-0 font-display text-[12px] font-bold text-violet-300 tabular">
                        {bs(group.subtotal)} Bs
                      </span>
                    </div>

                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 text-[12px]">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-ink-soft">
                            <span className="font-semibold text-white tabular">{item.quantity}×</span>{' '}
                            {item.name}
                          </span>
                          {item.notes && (
                            <span className="block truncate text-[10px] italic text-ink-faint">
                              “{item.notes}”
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 font-semibold text-ink-soft tabular">
                          {bs(item.price * item.quantity)} Bs
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <dl className="space-y-2 border-t border-surface-line pt-4 text-[12px]">
                <div className="flex justify-between text-ink-mute">
                  <dt>Subtotal productos</dt>
                  <dd className="font-semibold text-white tabular">{bs(subtotal)} Bs</dd>
                </div>
                <div className="flex justify-between text-ink-mute">
                  <dt>Envío en Trinidad</dt>
                  <dd className="font-semibold text-white tabular">{bs(deliveryFee)} Bs</dd>
                </div>
                <div className="flex items-center justify-between border-t border-surface-line pt-3">
                  <dt className="font-display text-[15px] font-bold text-white">Total</dt>
                  <dd className="font-display text-2xl font-bold text-arc tabular">
                    {bs(total)} Bs
                  </dd>
                </div>
              </dl>

              <Button type="submit" size="lg" full loading={loading} className="mt-6">
                {!loading && <ShieldCheck className="h-4 w-4" />}
                {loading
                  ? isMultiStore
                    ? 'Generando comandas…'
                    : 'Procesando pedido…'
                  : `Confirmar · ${bs(total)} Bs`}
              </Button>

              <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-ink-faint">
                <Clock className="h-3.5 w-3.5" />
                Entrega estimada: 25 – 40 min
              </p>
            </Panel>
          </Reveal>
        </div>
      </form>
    </div>
  );
}
