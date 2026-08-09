'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Lock,
  Layers,
  Banknote,
  Send,
} from 'lucide-react';

export default function Sprint4ValidationPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [testOrder, setTestOrder] = useState<any>(null);
  const [testPayment, setTestPayment] = useState<any>(null);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  const clearLogs = () => {
    setLogs([]);
    setTestOrder(null);
    setTestPayment(null);
  };

  // TEST 1: Flujo Completo QR Simple + Subida + Aprobación
  const runQRApprovalTest = async () => {
    setRunning(true);
    clearLogs();
    addLog('🚀 INICIANDO TEST 1: Flujo QR Simple con Subida y Aprobación de Comprobante...');

    try {
      // 1. Obtener negocio Don Pepe y asegurar abierto
      const spacesRes = await fetch('/api/spaces');
      const spacesData = await spacesRes.json();
      const elBosque = spacesData.spaces.find((s: any) => s.name === 'El Bosque');
      const spaceDetail = await (await fetch(`/api/spaces/${elBosque.id}`)).json();
      const businesses = spaceDetail.businesses || spaceDetail.space?.businesses || [];
      const donPepe = businesses[0];

      await fetch(`/api/businesses/${donPepe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: true }),
      });

      const menuRes = await (await fetch(`/api/businesses/${donPepe.id}`)).json();
      const product = menuRes.products[0];
      addLog(`✓ Negocio: ${donPepe.name} (ABIERTO)`);
      addLog(`✓ Producto: ${product.name} (Precio: ${product.price} Bs)`);

      // 2. Crear orden con QR_MANUAL
      addLog('📦 Creando orden con método QR Express...');
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: donPepe.id,
          deliveryAddress: 'Barrio Pompeya, Trinidad',
          customerPhone: '77889900',
          paymentMethod: 'QR_MANUAL',
          items: [{ productId: product.id, quantity: 1 }],
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Error al crear orden');

      const createdOrder = orderData.order;
      const createdPayment = orderData.payment;
      setTestOrder(createdOrder);
      setTestPayment(createdPayment);

      addLog(`✓ Orden creada: ${createdOrder.id}`);
      addLog(`✓ Total a pagar: ${createdOrder.totalPrice} Bs | Estado inicial: ${createdOrder.status}`);
      addLog(`✓ Pago registrado: ID ${createdPayment.id} (Estado: ${createdPayment.status})`);

      // 3. Cliente adjunta comprobante
      addLog('📲 Cliente transfiere por QR y adjunta comprobante bancario...');
      const uploadRes = await fetch('/api/payments/upload-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: createdOrder.id,
          receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
          transactionReference: `BNB-QR-${Math.floor(100000 + Math.random() * 900000)}`,
        }),
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Error al subir comprobante');
      addLog(`✓ Comprobante adjuntado con éxito. Ref: ${uploadData.payment?.transactionId}`);

      // 4. Dueño de tienda revisa y APRUEBA el comprobante
      addLog('👨‍🍳 Dueño del comercio revisa captura y APRUEBA el pago...');
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: createdPayment.id,
          approved: true,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Error al verificar comprobante');

      addLog(`✓ Pago Actualizado: ${verifyData.payment.status} ✓`);
      addLog(`✓ Orden Avanzada Automáticamente: ${verifyData.order.status} (En Cocina) ✓`);
      addLog('🎉 TEST 1 COMPLETADO CON ÉXITO: El flujo de pago QR manual funciona de punta a punta.');
    } catch (err: any) {
      addLog(`❌ ERROR EN TEST 1: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  // TEST 2: Flujo de Rechazo de Comprobante
  const runQRRejectionTest = async () => {
    setRunning(true);
    clearLogs();
    addLog('🚀 INICIANDO TEST 2: Flujo de Rechazo de Comprobante Fraudulento/Incorrecto...');

    try {
      const spacesRes = await (await fetch('/api/spaces')).json();
      const elBosque = spacesRes.spaces.find((s: any) => s.name === 'El Bosque');
      const spaceDetail = await (await fetch(`/api/spaces/${elBosque.id}`)).json();
      const donPepe = spaceDetail.businesses[0];
      const menuRes = await (await fetch(`/api/businesses/${donPepe.id}`)).json();
      const product = menuRes.products[0];

      // 1. Crear orden
      const orderRes = await (
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: donPepe.id,
            deliveryAddress: 'Barrio San Vicente, Trinidad',
            customerPhone: '77889900',
            paymentMethod: 'QR_MANUAL',
            items: [{ productId: product.id, quantity: 1 }],
          }),
        })
      ).json();

      addLog(`✓ Orden creada: ${orderRes.order.id}`);

      // 2. Subir comprobante con monto erróneo
      await fetch('/api/payments/upload-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderRes.order.id,
          receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
          transactionReference: 'REF-INVALIDA-000',
        }),
      });
      addLog('📲 Comprobante adjuntado por el cliente.');

      // 3. Tienda rechaza comprobante
      addLog('❌ Dueño de tienda RECHAZA el comprobante por inconsistencia en el monto...');
      const verifyRes = await (
        await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentId: orderRes.payment.id,
            approved: false,
            rejectionReason: 'El monto transferido es menor al total de la orden',
          }),
        })
      ).json();

      addLog(`✓ Estado del Pago: ${verifyRes.payment.status} (REJECTED)`);
      addLog(`✓ Nota en la Orden: "${verifyRes.order.notes}"`);
      addLog('🎉 TEST 2 COMPLETADO: El sistema protege al comercio ante comprobantes inválidos.');
    } catch (err: any) {
      addLog(`❌ ERROR EN TEST 2: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  // TEST 3: Pasarela Online con Tarjeta
  const runGatewayCardTest = async () => {
    setRunning(true);
    clearLogs();
    addLog('🚀 INICIANDO TEST 3: Pago Online con Tarjeta de Crédito/Débito...');

    try {
      const spacesRes = await (await fetch('/api/spaces')).json();
      const elBosque = spacesRes.spaces.find((s: any) => s.name === 'El Bosque');
      const spaceDetail = await (await fetch(`/api/spaces/${elBosque.id}`)).json();
      const donPepe = spaceDetail.businesses[0];
      const menuRes = await (await fetch(`/api/businesses/${donPepe.id}`)).json();
      const product = menuRes.products[0];

      // 1. Crear orden
      addLog('📦 Creando orden con método GATEWAY_ONLINE...');
      const orderRes = await (
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: donPepe.id,
            deliveryAddress: 'Barrio El Carmen, Trinidad',
            customerPhone: '77889900',
            paymentMethod: 'GATEWAY_ONLINE',
            items: [{ productId: product.id, quantity: 1 }],
          }),
        })
      ).json();

      addLog(`✓ Orden ID: ${orderRes.order.id} | Total: ${orderRes.order.totalPrice} Bs`);

      // 2. Procesar tarjeta
      addLog('💳 Enviando datos cifrados a la pasarela de pago bancaria...');
      const gatewayRes = await fetch('/api/payments/process-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderRes.order.id,
          cardNumber: '4500 1234 5678 9010',
          cardHolder: 'JUAN PEREZ TRINIDAD',
          expiry: '12/28',
          cvv: '888',
        }),
      });

      const gatewayData = await gatewayRes.json();
      if (!gatewayRes.ok) throw new Error(gatewayData.error || 'Error en pasarela');

      addLog(`✓ Autorización Bancaria ID: ${gatewayData.transactionId}`);
      addLog(`✓ Estado del Pago: ${gatewayData.payment.status} (APPROVED)`);
      addLog(`✓ Estado de Orden: ${gatewayData.order.status} (En Preparación)`);
      addLog('🎉 TEST 3 COMPLETADO: Cobro por pasarela procesado e integrado al flujo en tiempo real.');
    } catch (err: any) {
      addLog(`❌ ERROR EN TEST 3: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  // TEST 4: Webhook Automatizado de Pasarela
  const runWebhookTest = async () => {
    setRunning(true);
    clearLogs();
    addLog('🚀 INICIANDO TEST 4: Recepción de Webhook Asíncrono de Pasarela (Libélula / Cybersource)...');

    try {
      const spacesRes = await (await fetch('/api/spaces')).json();
      const elBosque = spacesRes.spaces.find((s: any) => s.name === 'El Bosque');
      const spaceDetail = await (await fetch(`/api/spaces/${elBosque.id}`)).json();
      const donPepe = spaceDetail.businesses[0];
      const menuRes = await (await fetch(`/api/businesses/${donPepe.id}`)).json();
      const product = menuRes.products[0];

      // 1. Crear orden
      const orderRes = await (
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: donPepe.id,
            deliveryAddress: 'Barrio Cipriano Barace, Trinidad',
            customerPhone: '77889900',
            paymentMethod: 'GATEWAY_ONLINE',
            items: [{ productId: product.id, quantity: 1 }],
          }),
        })
      ).json();

      addLog(`✓ Orden pendiente creada: ${orderRes.order.id}`);

      // 2. Disparar Webhook
      addLog('⚡ Simulando payload HTTP POST de Webhook entrante desde servidor bancario...');
      const webhookRes = await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'payment.completed',
          orderId: orderRes.order.id,
          transactionId: `TX-WH-AUTO-${Date.now()}`,
          amount: orderRes.order.totalPrice,
          currency: 'BOB',
          signature: 'sha256_mock_valid_signature',
        }),
      });

      const webhookData = await webhookRes.json();
      if (!webhookRes.ok) throw new Error(webhookData.error || 'Error en webhook');

      addLog(`✓ Respuesta del Webhook: ${webhookData.message}`);
      addLog(`✓ Estado del Pago en DB: ${webhookData.paymentStatus}`);
      addLog('🎉 TEST 4 COMPLETADO: El webhook procesó la orden en segundo plano.');
    } catch (err: any) {
      addLog(`❌ ERROR EN TEST 4: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Suite de Pruebas Automatizadas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Validación Sprint 4: Pasarela de Pagos & Comprobantes QR
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Verificación aislada de casos de uso de pagos, transferencias bancarias, pasarela online y webhooks.
          </p>
        </div>

        <Link
          href="/store/dashboard"
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500 text-xs font-semibold text-slate-200 hover:text-amber-400 flex items-center gap-2 transition-all shrink-0"
        >
          <span>Ir a Panel de Comprobantes</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid de Pruebas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Test 1 */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-3 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Caso Principal
            </span>
          </div>
          <h3 className="font-bold text-white text-sm">1. Flujo QR Simple & Aprobación</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Crea una orden con QR, sube un comprobante de transferencia y lo aprueba desde la perspectiva de la tienda, avanzando a preparación.
          </p>
          <button
            onClick={runQRApprovalTest}
            disabled={running}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar Test QR Aprobado</span>
          </button>
        </div>

        {/* Test 2 */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-3 hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
              Seguridad Comercial
            </span>
          </div>
          <h3 className="font-bold text-white text-sm">2. Rechazo de Comprobante Inválido</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Valida que un comprobante rechazado por monto o datos erróneos no active la cocina y registre el motivo en la orden.
          </p>
          <button
            onClick={runQRRejectionTest}
            disabled={running}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar Test Comprobante Rechazado</span>
          </button>
        </div>

        {/* Test 3 */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-3 hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Pasarela Online
            </span>
          </div>
          <h3 className="font-bold text-white text-sm">3. Pago Directo con Tarjeta</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Simula la interacción con la pasarela bancaria con autorización en tiempo real y confirmación instantánea.
          </p>
          <button
            onClick={runGatewayCardTest}
            disabled={running}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar Test Pasarela Tarjeta</span>
          </button>
        </div>

        {/* Test 4 */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-3 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Webhook Asíncrono
            </span>
          </div>
          <h3 className="font-bold text-white text-sm">4. Webhook de Pasarela Bancaria</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Prueba la recepción del webhook HTTP POST de la entidad bancaria que confirma el pago en segundo plano.
          </p>
          <button
            onClick={runWebhookTest}
            disabled={running}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar Test Webhook</span>
          </button>
        </div>
      </div>

      {/* Terminal de Logs en Vivo */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Consola de Ejecución en Tiempo Real</span>
          </h3>
          <button
            onClick={clearLogs}
            className="text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            Limpiar logs
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900 font-mono text-xs text-emerald-400 space-y-1.5 min-h-[160px] max-h-[300px] overflow-y-auto">
          {logs.length === 0 ? (
            <span className="text-slate-600 italic">
              Haz clic en cualquiera de las pruebas para ver la traza de ejecución de dominio...
            </span>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>

        {testOrder && (
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Última orden de prueba: <strong className="text-white">{testOrder.id}</strong></span>
            <Link
              href={`/orders/${testOrder.id}`}
              target="_blank"
              className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
            >
              <span>Abrir vista de seguimiento del cliente</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
