'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Store,
  Layers,
  Database,
  CreditCard,
  QrCode,
  Banknote,
  Bike,
  ExternalLink,
} from 'lucide-react';

export default function Sprint3ValidationPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR_MANUAL' | 'GATEWAY_ONLINE'>(
    'QR_MANUAL'
  );

  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Cargar lista de negocios y sus productos
  const loadData = async () => {
    try {
      const res = await fetch('/api/spaces');
      const data = await res.json();
      const allBusinesses: any[] = [];
      data.spaces?.forEach((s: any) => {
        s.businesses?.forEach((b: any) => allBusinesses.push(b));
      });
      setBusinesses(allBusinesses);

      if (allBusinesses.length > 0) {
        // Cargar detalle del primer negocio (Don Pepe)
        const bRes = await fetch(`/api/businesses/${allBusinesses[0].id}`);
        const bData = await bRes.json();
        setSelectedBusiness(bData.business);
        if (bData.products?.length > 0) {
          setSelectedProduct(bData.products[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectBusiness = async (bId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${bId}`);
      const data = await res.json();
      setSelectedBusiness(data.business);
      if (data.products?.length > 0) {
        setSelectedProduct(data.products[0]);
      } else {
        setSelectedProduct(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Test 1: Crear orden válida con decremento de stock
  const handleTestCreateOrder = async () => {
    if (!selectedBusiness || !selectedProduct) return;
    setLoading(true);
    setTestResult(null);
    setTestError(null);

    const initialStock = selectedProduct.stock;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          deliveryAddress: 'Barrio Pompeya, Calle Cochabamba #450, Trinidad',
          customerPhone: '77889900',
          notes: 'Test automatizado de Sprint 3 - Validación de Stock',
          paymentMethod,
          items: [{ productId: selectedProduct.id, quantity: orderQuantity }],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear orden');
      }

      // Re-consultar producto para comprobar que el stock disminuyó en DB
      const bRes = await fetch(`/api/businesses/${selectedBusiness.id}`);
      const bData = await bRes.json();
      const updatedProd = bData.products?.find((p: any) => p.id === selectedProduct.id);

      setSelectedProduct(updatedProd);

      setTestResult({
        type: 'SUCCESS',
        title: '¡Orden Creada y Stock Descontado en PostgreSQL!',
        orderId: data.order.id,
        status: data.order.status,
        total: data.order.totalPrice,
        initialStock,
        newStock: updatedProd?.stock,
        decremented: initialStock - (updatedProd?.stock ?? 0),
      });
    } catch (err: any) {
      setTestError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Forzar error de negocio cerrado
  const handleTestClosedBusiness = async () => {
    if (!selectedBusiness || !selectedProduct) return;
    setLoading(true);
    setTestResult(null);
    setTestError(null);

    try {
      // 1. Apagar el negocio temporalmente
      await fetch(`/api/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: false }),
      });

      // 2. Intentar pedir
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          deliveryAddress: 'Barrio San Vicente #123, Trinidad',
          customerPhone: '77889900',
          paymentMethod: 'CASH',
          items: [{ productId: selectedProduct.id, quantity: 1 }],
        }),
      });

      const data = await res.json();

      // 3. Volver a encender el negocio
      await fetch(`/api/businesses/${selectedBusiness.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: true }),
      });

      if (!res.ok) {
        setTestResult({
          type: 'EXPECTED_ERROR',
          title: 'Regla de Dominio Cumplida: Rechazo por Negocio Cerrado',
          message: data.error,
        });
      } else {
        setTestError('El pedido no debió procesarse cuando el negocio está cerrado');
      }
    } catch (err: any) {
      setTestError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Forzar error de stock insuficiente
  const handleTestInsufficientStock = async () => {
    if (!selectedBusiness || !selectedProduct) return;
    setLoading(true);
    setTestResult(null);
    setTestError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          deliveryAddress: 'Barrio Casco Viejo #12, Trinidad',
          customerPhone: '77889900',
          paymentMethod: 'CASH',
          items: [{ productId: selectedProduct.id, quantity: 9999 }], // Excesivo
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTestResult({
          type: 'EXPECTED_ERROR',
          title: 'Regla de Dominio Cumplida: Stock Insuficiente Detectado',
          message: data.error,
        });
      } else {
        setTestError('El pedido no debió procesarse por falta de stock');
      }
    } catch (err: any) {
      setTestError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sprint 3: Módulo de Pedidos, Carrito & Validación de Stock</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Suite de Validación Interactiva
        </h1>
        <p className="text-xs text-ink-mute mt-1">
          Ejecuta y verifica en vivo las reglas de negocio, transacciones ACID en PostgreSQL, deducción atómica de inventario y cálculo de checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Test Configuration (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rune-panel rounded-3xl p-6 border border-surface-line space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400" />
              <span>Configuración de Prueba</span>
            </h2>

            {/* Business Selector */}
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                Seleccionar Restaurante / Comercio
              </label>
              <select
                value={selectedBusiness?.id || ''}
                onChange={(e) => handleSelectBusiness(e.target.value)}
                className="w-full p-3 rounded-xl bg-void-700 border border-surface-line text-white text-xs outline-none focus:border-violet-500"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.isOpen ? '🟢 Abierto' : '🔴 Cerrado'})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Selector */}
            {selectedBusiness && (
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                  Seleccionar Plato / Producto a Probar
                </label>
                <div className="p-3 rounded-xl bg-void-700/80 border border-surface-line flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">{selectedProduct?.name}</div>
                    <div className="text-[11px] text-violet-400">
                      Precio: {selectedProduct?.price.toFixed(2)} Bs • Stock en BD:{' '}
                      <span className="font-black text-white">{selectedProduct?.stock} un.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-ink-mute">Cantidad:</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(Number(e.target.value))}
                      className="w-14 p-1.5 text-center rounded-lg bg-surface-raised border border-surface-line text-white font-bold text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                Método de Pago de Prueba
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QR_MANUAL')}
                  className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'QR_MANUAL'
                      ? 'bg-violet-950/40 border-warn text-warn-soft'
                      : 'bg-void-700 border-surface-line text-ink-mute'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Pago QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('GATEWAY_ONLINE')}
                  className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'GATEWAY_ONLINE'
                      ? 'bg-violet-950/40 border-info text-info-soft'
                      : 'bg-void-700 border-surface-line text-ink-mute'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pasarela</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-violet-950/40 border-violet-500 text-violet-300'
                      : 'bg-void-700 border-surface-line text-ink-mute'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Efectivo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={loading}
              onClick={handleTestCreateOrder}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-arc hover:from-violet-500 hover:to-arc text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>1. Ejecutar Orden Exitosa (Verificar Decremento de Stock)</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleTestClosedBusiness}
              className="w-full py-3.5 px-4 rounded-2xl bg-warn-deep hover:bg-warn text-white font-bold text-xs shadow-lg shadow-warn-deep/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>2. Probar Regla: Pedir a Local Cerrado (Debe Rechazar)</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleTestInsufficientStock}
              className="w-full py-3.5 px-4 rounded-2xl bg-ember-deep hover:bg-ember-deep text-white font-bold text-xs shadow-lg shadow-ember-deep/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>3. Probar Regla: Stock Insuficiente (9999 un. Debe Rechazar)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Execution Output (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rune-panel rounded-3xl p-6 border border-surface-line min-h-[420px] flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Resultados de Validación de Casos de Uso</span>
              </h2>

              {loading ? (
                <div className="py-20 text-center text-ink-mute">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs">Ejecutando caso de uso en servidor...</p>
                </div>
              ) : testError ? (
                <div className="p-4 rounded-2xl bg-violet-950/40 border border-ember-deep text-ember-soft text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <XCircle className="w-4 h-4" />
                    <span>Error Inesperado:</span>
                  </div>
                  <p>{testError}</p>
                </div>
              ) : testResult ? (
                <div
                  className={`p-5 rounded-2xl border text-xs animate-in fade-in space-y-3 ${
                    testResult.type === 'SUCCESS'
                      ? 'bg-violet-950/40 border-violet-500/60 text-violet-200'
                      : 'bg-violet-950/40 border-warn/60 text-warn-soft'
                  }`}
                >
                  <div className="font-black text-sm flex items-center gap-2">
                    {testResult.type === 'SUCCESS' ? (
                      <CheckCircle2 className="w-5 h-5 text-violet-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-warn" />
                    )}
                    <span>{testResult.title}</span>
                  </div>

                  {testResult.type === 'SUCCESS' ? (
                    <div className="space-y-2 pt-2 border-t border-violet-500/20 text-[11px]">
                      <div>
                        <span className="text-ink-mute">ID de Orden Generado: </span>
                        <span className="font-mono font-bold text-white">{testResult.orderId}</span>
                      </div>
                      <div>
                        <span className="text-ink-mute">Estado Inicial: </span>
                        <span className="font-bold text-violet-300">{testResult.status}</span>
                      </div>
                      <div>
                        <span className="text-ink-mute">Total Facturado: </span>
                        <span className="font-bold text-white">{testResult.total.toFixed(2)} Bs</span>
                      </div>
                      <div className="p-3 rounded-xl bg-void-700/80 border border-violet-500/30">
                        <div className="font-bold text-violet-400 mb-1">
                          ✓ Transacción Atómica de Inventario:
                        </div>
                        <div className="text-ink-soft">
                          Stock Inicial en BD: <b>{testResult.initialStock} un.</b> &rarr; Stock
                          Actual: <b>{testResult.newStock} un.</b> (Descontados: {testResult.decremented} un.)
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link
                          href={`/orders/${testResult.orderId}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs"
                        >
                          <span>Abrir Tracking en Vivo del Pedido</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-warn/20 text-[11px]">
                      <span className="text-ink-mute">Mensaje de Excepción de Dominio:</span>
                      <div className="p-3 rounded-xl bg-void-700/80 border border-warn/30 font-mono text-warn-soft mt-1">
                        &quot;{testResult.message}&quot;
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 text-ink-faint">
                  <Database className="w-12 h-12 mx-auto mb-3 text-ink-faint" />
                  <p className="text-xs">
                    Haz clic en uno de los botones de la izquierda para ejecutar una prueba en vivo.
                  </p>
                </div>
              )}
            </div>

            {/* Navigation links */}
            <div className="pt-6 border-t border-surface-line flex items-center justify-between text-xs">
              <Link href="/orders" className="text-violet-400 hover:underline flex items-center gap-1">
                <span>Ir al Historial de Pedidos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link href="/checkout" className="text-ink-mute hover:text-white flex items-center gap-1">
                <span>Ir al Checkout Manual</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
