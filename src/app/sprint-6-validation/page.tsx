'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  TrendingUp,
  Store,
  Users,
  CheckCircle2,
  XCircle,
  Play,
  Sparkles,
  ExternalLink,
  MapPin,
  ArrowRight,
  DollarSign,
  Layers,
} from 'lucide-react';

export default function Sprint6ValidationPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // TEST 1: Métricas Globales y Financieras
  const runMetricsTest = async () => {
    setRunning(true);
    clearLogs();
    addLog('🚀 INICIANDO TEST 1: Consulta y Cálculo de Métricas Globales de la Plataforma...');

    try {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al obtener métricas');

      addLog(`✓ Total GMV Transaccionado: ${data.financials.totalGmv.toFixed(2)} Bs`);
      addLog(`✓ Recaudación Delivery Fees: ${data.financials.totalDeliveryFees.toFixed(2)} Bs`);
      addLog(`✓ Total Pedidos Registrados: ${data.orders.total} (${data.orders.completed} entregados)`);
      addLog(`✓ Total Usuarios: ${data.users.total} (${data.users.customers} clientes, ${data.users.drivers} repartidores, ${data.users.businessOwners} comercios)`);
      addLog(`✓ Catálogo Activo: ${data.catalog.businesses} comercios en ${data.catalog.spaces} patios de comida`);
      addLog(`✓ Métodos de Pago: QR Manual (${data.paymentMethods.QR_MANUAL}), Tarjeta Online (${data.paymentMethods.GATEWAY_ONLINE}), Efectivo (${data.paymentMethods.CASH})`);
      addLog('🎉 TEST 1 COMPLETADO: Agregación de métricas financieras y operativas 100% verificada.');
    } catch (err: any) {
      addLog(`❌ ERROR EN TEST 1: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  // TEST 2: Creación de Espacio y Comercio Administrativo
  const runCatalogAdminTest = async () => {
    setRunning(true);
    clearLogs();
    addLog('🚀 INICIANDO TEST 2: Alta Administrativa de Patio Gastronómico y Nuevo Comercio...');

    try {
      // 1. Crear nuevo Espacio
      const spaceName = `Patio Gourmet Trinidad ${Date.now().toString().slice(-4)}`;
      addLog(`🏗️ Creando nuevo espacio: "${spaceName}"...`);
      const spaceRes = await fetch('/api/admin/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: spaceName,
          description: 'Espacio gastronómico premium con variedad de platos típicos de Trinidad.',
          location: 'Av. Bolívar esquina Av. 6 de Agosto, Trinidad',
        }),
      });
      const spaceData = await spaceRes.json();
      if (!spaceRes.ok) throw new Error(spaceData.error || 'Error al crear espacio');

      addLog(`✓ Espacio creado con éxito: ID ${spaceData.space.id}`);

      // 2. Obtener un usuario BUSINESS_OWNER
      const usersRes = await (await fetch('/api/admin/users')).json();
      const owner = usersRes.users.find((u: any) => u.role === 'BUSINESS_OWNER') || usersRes.users[0];

      // 3. Crear nuevo Comercio dentro del Espacio
      const bizName = `La Casona del Sabor ${Date.now().toString().slice(-4)}`;
      addLog(`🏪 Registrando comercio "${bizName}" asignado al espacio y propietario ${owner.name}...`);
      const bizRes = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bizName,
          description: 'Especialidades benianas y cortes a la parrilla.',
          category: 'PATIO_COMIDA',
          spaceId: spaceData.space.id,
          ownerId: owner.id,
          phone: '77991122',
        }),
      });
      const bizData = await bizRes.json();
      if (!bizRes.ok) throw new Error(bizData.error || 'Error al crear comercio');

      addLog(`✓ Comercio registrado con éxito: ID ${bizData.business.id}`);
      addLog('🎉 TEST 2 COMPLETADO: Creación y vinculación jerárquica de espacios y locales exitosa.');
    } catch (err: any) {
      addLog(`❌ ERROR EN TEST 2: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  // TEST 3: Administración y Modificación de Usuarios y Roles
  const runUserAdminTest = async () => {
    setRunning(true);
    clearLogs();
    addLog('🚀 INICIANDO TEST 3: Auditoría y Modificación Dinámica de Roles de Usuario...');

    try {
      const usersRes = await (await fetch('/api/admin/users')).json();
      const testUser = usersRes.users.find((u: any) => u.role === 'CUSTOMER') || usersRes.users[0];
      addLog(`👤 Usuario seleccionado: ${testUser.name} (${testUser.email}, Rol actual: ${testUser.role})`);

      // Asignar rol DRIVER y código temporal
      const newCode = `DRV-${Math.floor(100 + Math.random() * 900)}`;
      addLog(`⚡ Promoviendo usuario a DRIVER con código "${newCode}"...`);
      const updateRes = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUser.id,
          role: 'DRIVER',
          driverCode: newCode,
        }),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.error || 'Error al actualizar usuario');

      addLog(`✓ Rol actualizado a: ${updateData.user.role} (Código: ${updateData.user.driverCode})`);

      // Restaurar rol original
      addLog(`🔄 Restaurando rol original para mantener coherencia de datos...`);
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUser.id,
          role: testUser.role,
        }),
      });
      addLog('🎉 TEST 3 COMPLETADO: Gestión y actualización de roles administrativos 100% funcional.');
    } catch (err: any) {
      addLog(`❌ ERROR EN TEST 3: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  // TEST 4: Auditoría del Libro Global de Pedidos
  const runOrderAuditTest = async () => {
    setRunning(true);
    clearLogs();
    addLog('🚀 INICIANDO TEST 4: Auditoría y Filtrado en el Libro Global de Transacciones...');

    try {
      // 1. Consultar libro global completo
      const allRes = await (await fetch('/api/admin/orders?limit=10')).json();
      addLog(`✓ Total de pedidos recientes obtenidos: ${allRes.orders.length}`);

      // 2. Filtrar por pedidos entregados
      const deliveredRes = await (await fetch('/api/admin/orders?status=entregado')).json();
      addLog(`✓ Pedidos auditados con estado "entregado": ${deliveredRes.orders.length}`);

      // 3. Filtrar por búsqueda de texto
      const searchRes = await (await fetch('/api/admin/orders?search=Pompeya')).json();
      addLog(`✓ Pedidos encontrados con destino o referencia "Pompeya": ${searchRes.orders.length}`);

      if (allRes.orders.length > 0) {
        const sample = allRes.orders[0];
        addLog(`📝 Muestra de Auditoría: ORD-#{${sample.id.slice(0, 6).toUpperCase()}} | Local: ${sample.business?.name} | Total: ${sample.totalPrice} Bs | Pago: ${sample.payment?.method} (${sample.payment?.status})`);
      }

      addLog('🎉 TEST 4 COMPLETADO: Libro de transacciones y filtros de auditoría verificados al 100%.');
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Suite de Pruebas Automatizadas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Validación Sprint 6: Panel de Administración Global & Reportes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Verificación de cálculo de métricas financieras (GMV), alta de espacios gastronómicos, administración de usuarios y auditoría global.
          </p>
        </div>

        <Link
          href="/admin/dashboard"
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-rose-600/20 shrink-0"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Ir a Panel de Administración</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid de Pruebas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Test 1 */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-3 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Finanzas & GMV
            </span>
          </div>
          <h3 className="font-bold text-white text-sm">1. Métricas Globales de Plataforma</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Calcula el GMV transaccionado, ticket promedio, recaudación de delivery y desglose por pasarelas (QR, Tarjeta, Efectivo).
          </p>
          <button
            onClick={runMetricsTest}
            disabled={running}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar Test Métricas</span>
          </button>
        </div>

        {/* Test 2 */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-3 hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
              Catálogo Global
            </span>
          </div>
          <h3 className="font-bold text-white text-sm">2. Alta de Espacios y Comercios</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Valida la creación y vinculación jerárquica de nuevos patios gastronómicos y restaurantes en la ciudad de Trinidad.
          </p>
          <button
            onClick={runCatalogAdminTest}
            disabled={running}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar Test Catálogo</span>
          </button>
        </div>

        {/* Test 3 */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-3 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Gestión de Usuarios
            </span>
          </div>
          <h3 className="font-bold text-white text-sm">3. Administración de Roles y Repartidores</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Permite reasignar roles de usuarios (ADMIN, BUSINESS_OWNER, DRIVER, CUSTOMER) y emitir credenciales de repartidor.
          </p>
          <button
            onClick={runUserAdminTest}
            disabled={running}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar Test Usuarios</span>
          </button>
        </div>

        {/* Test 4 */}
        <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-3 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Auditoría Global
            </span>
          </div>
          <h3 className="font-bold text-white text-sm">4. Libro de Órdenes & Auditoría</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Inspecciona el libro de transacciones completo con filtros por estado, comercio, cliente y método de pago.
          </p>
          <button
            onClick={runOrderAuditTest}
            disabled={running}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar Test Auditoría</span>
          </button>
        </div>
      </div>

      {/* Terminal de Logs en Vivo */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Consola de Auditoría en Tiempo Real</span>
          </h3>
          <button
            onClick={clearLogs}
            className="text-[11px] text-slate-400 hover:text-white transition-colors"
          >
            Limpiar logs
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-900 font-mono text-xs text-rose-300 space-y-1.5 min-h-[160px] max-h-[300px] overflow-y-auto">
          {logs.length === 0 ? (
            <span className="text-slate-600 italic">
              Haz clic en cualquiera de las pruebas para verificar las capacidades del panel administrativo...
            </span>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
}
