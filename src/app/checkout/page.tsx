'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ShoppingBag,
  MapPin,
  Phone,
  CreditCard,
  QrCode,
  Banknote,
  ArrowRight,
  Store,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useCart } from '@/presentation/context/CartContext';
import { ClientLocationPicker } from '@/presentation/components/maps/ClientLocationPicker';
import { AddressBook } from '@/presentation/components/maps/AddressBook';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
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
    '📍 Ubicación GPS: -14.83480, -64.90420 (Trinidad, Beni)'
  );
  const [customerPhone, setCustomerPhone] = useState('77889900');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR_MANUAL' | 'GATEWAY_ONLINE'>(
    'QR_MANUAL'
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="glass-panel rounded-3xl p-8 border border-slate-800">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h2 className="text-xl font-bold text-white mb-2">Tu carrito está vacío</h2>
          <p className="text-xs text-slate-400 mb-6">
            Selecciona productos de tus restaurantes y comercios favoritos antes de proceder al checkout.
          </p>
          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
          >
            <span>Explorar Patios de Comida & Comercios</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!deliveryAddress || !deliveryAddress.trim()) {
      setErrorMessage('Por favor confirma tu ubicación de entrega en el mapa');
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Por favor proporciona un teléfono o WhatsApp de contacto para el repartidor');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        deliveryAddress: deliveryAddress.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim() || undefined,
        paymentMethod,
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          businessId: i.businessId,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el pedido');
      }

      // Limpiar carrito y redirigir a tracking
      clearCart();
      router.push(`/orders/${data.order.id}`);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Checkout Rápido por GPS</span>
          </div>

          {isMultiStore && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Pedido Multi-Comercio Detectado ({businessCount} locales)</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Confirmar Pedido & Ubicación
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isMultiStore
            ? `Tu pedido incluye platos de ${businessCount} negocios diferentes. El sistema generará el pago mixto y comandas independientes para cada cocina.`
            : 'Extrae tu ubicación actual por GPS o marca tu casa en el mapa de Trinidad con un solo toque.'}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error en el pedido: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Ubicación GPS en Mapa Interactivo */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>1. Ubicación de Entrega (GPS en Vivo)</span>
              </h2>
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Auto-Detección
              </span>
            </div>

            <ClientLocationPicker
              onLocationChange={({ formattedAddress }) => {
                setDeliveryAddress(formattedAddress);
              }}
            />

            {/* Libreta de Direcciones Frecuentes */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <AddressBook
                currentAddress={deliveryAddress}
                onSelectAddress={(addr) => setDeliveryAddress(addr)}
              />
            </div>
          </div>

          {/* 2. Datos de Contacto y Notas */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>2. Teléfono / WhatsApp & Notas</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <span>Teléfono o WhatsApp de Contacto</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej. 78901234 o +591 78901234"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 outline-none text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  El repartidor podrá llamarte o escribirte por WhatsApp al llegar a tu puerta.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Notas para el Repartidor (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Portón blanco, tocar timbre dos veces, edificio piso 2..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 outline-none text-xs resize-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Método de Pago & Detección de Pago Mixto */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>3. Método de Pago</span>
              </h2>
              {isMultiStore && (
                <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  Pago Mixto Multi-Local
                </span>
              )}
            </div>

            <div className="space-y-3">
              {/* Option A: QR Manual / Mixto */}
              <label
                className={`p-4 rounded-2xl border flex items-start gap-4 cursor-pointer transition-all ${
                  paymentMethod === 'QR_MANUAL'
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="QR_MANUAL"
                  checked={paymentMethod === 'QR_MANUAL'}
                  onChange={() => setPaymentMethod('QR_MANUAL')}
                  className="mt-1 text-amber-500 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      {isMultiStore ? 'Pago Mixto con QR por Negocio' : 'Pago Express con QR'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Recomendado en Trinidad
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {isMultiStore
                      ? 'El sistema divide las cuentas para cada restaurante. Podrás transferir a la cuenta/QR de cada local de forma directa y adjuntar tus comprobantes en la pantalla de seguimiento.'
                      : 'Se generará el QR del restaurante para transferencia bancaria (Simple/BCP/BNB/FIE) y podrás adjuntar tu comprobante.'}
                  </p>
                </div>
              </label>

              {/* Multi-Store QR Breakdown Preview when QR_MANUAL is selected and isMultiStore */}
              {isMultiStore && paymentMethod === 'QR_MANUAL' && (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-3 animate-in fade-in">
                  <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Desglose de Transferencias por Comercio:</span>
                  </div>
                  <div className="space-y-2">
                    {groupedByBusiness.map((group, idx) => (
                      <div
                        key={group.businessId}
                        className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/20 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-bold text-white">{group.businessName}</div>
                            {group.spaceName && (
                              <div className="text-[10px] text-slate-400">{group.spaceName}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-amber-300">{group.subtotal.toFixed(2)} Bs</div>
                          <span className="text-[9px] text-slate-400">Comanda directa</span>
                        </div>
                      </div>
                    ))}
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                          🛵
                        </div>
                        <div>
                          <div className="font-bold text-white">Tarifa Delivery Trinidad</div>
                          <div className="text-[10px] text-slate-400">Repartidor en moto</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-400">{deliveryFee.toFixed(2)} Bs</div>
                        <span className="text-[9px] text-slate-400">En entrega o QR</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Option B: Online Gateway */}
              <label
                className={`p-4 rounded-2xl border flex items-start gap-4 cursor-pointer transition-all ${
                  paymentMethod === 'GATEWAY_ONLINE'
                    ? 'bg-blue-950/20 border-blue-500/50 shadow-md shadow-blue-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="GATEWAY_ONLINE"
                  checked={paymentMethod === 'GATEWAY_ONLINE'}
                  onChange={() => setPaymentMethod('GATEWAY_ONLINE')}
                  className="mt-1 text-blue-500 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">Pasarela con Tarjeta Online</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Cargo único consolidado de {total.toFixed(2)} Bs con tarjeta de débito/crédito y confirmación instantánea.
                  </p>
                </div>
              </label>

              {/* Option C: Cash */}
              <label
                className={`p-4 rounded-2xl border flex items-start gap-4 cursor-pointer transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH"
                  checked={paymentMethod === 'CASH'}
                  onChange={() => setPaymentMethod('CASH')}
                  className="mt-1 text-emerald-500 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Efectivo al Recibir</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Pagas en efectivo directamente al repartidor cuando entregue todos tus paquetes en tu puerta.
                  </p>
                </div>
              </label>

              {/* Cash Breakdown Preview */}
              {isMultiStore && paymentMethod === 'CASH' && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 animate-in fade-in text-xs">
                  <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Desglose de Efectivo para el Repartidor:</span>
                  </div>
                  {groupedByBusiness.map((g) => (
                    <div key={g.businessId} className="flex justify-between text-slate-300">
                      <span>{g.businessName}:</span>
                      <span className="font-bold text-white">{g.subtotal.toFixed(2)} Bs</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-slate-300">
                    <span>Tarifa Delivery:</span>
                    <span className="font-bold text-emerald-400">{deliveryFee.toFixed(2)} Bs</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">
                  {isMultiStore ? `${businessCount} Locales Asociados` : groupedByBusiness[0]?.businessName}
                </span>
              </div>
              <span className="text-xs text-slate-400">{items.length} productos</span>
            </div>

            {/* Product Items List (Grouped by Business) */}
            <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-1">
              {groupedByBusiness.map((group) => (
                <div
                  key={group.businessId}
                  className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800/60 font-bold">
                    <div className="flex items-center gap-1.5 text-amber-300">
                      <Store className="w-3.5 h-3.5" />
                      <span>{group.businessName}</span>
                    </div>
                    <span className="text-emerald-400">{group.subtotal.toFixed(2)} Bs</span>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="text-white font-medium truncate">
                            {item.quantity}x {item.name}
                          </div>
                          {item.notes && (
                            <div className="text-[10px] text-slate-400 italic truncate">
                              &quot;{item.notes}&quot;
                            </div>
                          )}
                        </div>
                        <span className="text-slate-300 font-bold whitespace-nowrap">
                          {(item.price * item.quantity).toFixed(2)} Bs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 pt-4 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal productos</span>
                <span className="font-semibold text-white">{subtotal.toFixed(2)} Bs</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tarifa Delivery Trinidad</span>
                <span className="font-semibold text-emerald-400">{deliveryFee.toFixed(2)} Bs</span>
              </div>
              <div className="flex justify-between text-base font-black text-white pt-3 border-t border-slate-800">
                <span>Total a Pagar</span>
                <span className="text-emerald-400">{total.toFixed(2)} Bs</span>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Procesando {isMultiStore ? 'Comandas Multi-Comercio...' : 'Pedido...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirmar Pedido ({total.toFixed(2)} Bs)</span>
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Tiempo estimado de entrega: 25 - 40 min</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
