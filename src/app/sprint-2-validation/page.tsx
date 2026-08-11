'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Store,
  Utensils,
  CheckCircle2,
  RefreshCw,
  Power,
  Search,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Package,
} from 'lucide-react';

export default function Sprint2ValidationPage() {
  const [spacesData, setSpacesData] = useState<any[]>([]);
  const [businessesData, setBusinessesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sprint-1/status');
      const data = await res.json();
      setSpacesData(data.spaces || []);
      setBusinessesData(data.businesses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleAttendance = async (business: any) => {
    setTogglingId(business.id);
    const nextState = !business.isOpen;
    try {
      // Usamos el endpoint PATCH
      const res = await fetch(`/api/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: nextState }),
      });

      if (res.ok) {
        setBusinessesData((prev) =>
          prev.map((b) => (b.id === business.id ? { ...b, isOpen: nextState } : b))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Banner */}
      <div className="relative rounded-3xl overflow-hidden rune-panel p-8 mb-8 border border-violet-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Sprint 2: Validación en Vivo</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Módulo de Espacios, Comercios y Menú
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft max-w-2xl mt-2 leading-relaxed">
              Validación modular de la agrupación por Patios de Comida físicos, control de asistencia (Abierto/Cerrado), catálogo estructurado y gestión de productos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-void-700 border border-surface-line hover:border-surface-line text-xs font-semibold text-ink flex items-center gap-2 transition-all hover:bg-surface-raised"
            >
              <RefreshCw className={`w-4 h-4 text-violet-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar Datos</span>
            </button>

            <Link
              href="/spaces"
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow-lg shadow-violet-600/20 flex items-center gap-2 transition-all"
            >
              <MapPin className="w-4 h-4" />
              <span>Ver Espacios Públicos</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Criterios de Aceptación Sprint 2 */}
      <div className="rune-panel rounded-2xl p-6 border border-surface-line mb-8">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-violet-400" />
          <span>Criterios de Aceptación del Sprint 2</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-void-700/60 border border-surface-line flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <div className="font-semibold text-white">Modelo Espacio Físico (Patios de Comida)</div>
              <p className="text-ink-mute mt-0.5">
                Los comercios están vinculados a patios gastronómicos (El Bosque, Plaza Verde, Aloha) o galerías comerciales de Trinidad.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-void-700/60 border border-surface-line flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <div className="font-semibold text-white">Control de Asistencia en Tiempo Real</div>
              <p className="text-ink-mute mt-0.5">
                Toggle de apertura (`isOpen`) con actualización instantánea que impide órdenes cuando el local está cerrado.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-void-700/60 border border-surface-line flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <div className="font-semibold text-white">Catálogo de Productos y Filtros de Menú</div>
              <p className="text-ink-mute mt-0.5">
                Productos con categorías, precios en Bolivianos (Bs), stock individual, buscador en vivo y modal interactivo.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-void-700/60 border border-surface-line flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
              ✓
            </div>
            <div>
              <div className="font-semibold text-white">Panel de Administración Comercial (CRUD)</div>
              <p className="text-ink-mute mt-0.5">
                Portal para propietarios ([/store/dashboard](file:///d:/DATOS/Documents/En-Z/src/app/store/dashboard/page.tsx)) con creación, edición de precios y stock.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Control de Asistencia Interactivo */}
      <div className="rune-panel rounded-2xl p-6 border border-surface-line mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Power className="w-5 h-5 text-warn" />
            <span>Prueba de Control de Asistencia (Toggle Abierto / Cerrado)</span>
          </h2>
          <span className="text-xs text-ink-mute">Prueba en vivo</span>
        </div>

        <p className="text-xs text-ink-mute mb-4">
          Prueba a cambiar el estado de apertura de cualquier local. El cambio se persiste inmediatamente en PostgreSQL y se refleja en el catálogo público:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {businessesData.map((biz) => (
            <div
              key={biz.id}
              className="p-4 rounded-2xl bg-void-700/90 border border-surface-line flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      biz.isOpen
                        ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                        : 'bg-ember/20 text-ember-soft border-ember/30'
                    }`}
                  >
                    {biz.isOpen ? '🟢 ABIERTO' : '🔴 CERRADO'}
                  </span>
                  <span className="text-[10px] text-ink-faint">{biz.space?.name}</span>
                </div>
                <div className="font-bold text-white text-xs">{biz.name}</div>
                <div className="text-[11px] text-ink-mute mt-1">
                  {biz._count?.products || 0} platos en menú
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-line/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAttendance(biz)}
                  disabled={togglingId === biz.id}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                    biz.isOpen
                      ? 'bg-violet-950/40 text-ember-soft border-ember-deep/40 hover:bg-violet-900/60'
                      : 'bg-violet-950/40 text-violet-300 border-violet-800/40 hover:bg-violet-900/60'
                  }`}
                >
                  {togglingId === biz.id ? 'Cambiando...' : biz.isOpen ? 'Cerrar Local' : 'Abrir Local'}
                </button>

                <Link
                  href={`/businesses/${biz.id}`}
                  className="p-1.5 rounded-lg bg-surface-raised text-ink-soft hover:text-white"
                  title="Ver menú público"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Espacios Físicos Registrados */}
      <div className="rune-panel rounded-2xl p-6 border border-surface-line">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-violet-400" />
          <span>Espacios Gastronómicos y Comercios Registrados</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {spacesData.map((space) => (
            <div
              key={space.id}
              className="p-4 rounded-2xl bg-void-700/80 border border-surface-line flex flex-col justify-between"
            >
              <div>
                <h3 className="font-bold text-white text-sm">{space.name}</h3>
                <p className="text-xs text-ink-mute mt-1 line-clamp-2">{space.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-line flex items-center justify-between">
                <span className="text-[11px] text-violet-400 font-semibold">
                  {space._count?.businesses || 0} Locales
                </span>
                <Link
                  href={`/spaces/${space.id}`}
                  className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-violet-400 font-medium"
                >
                  <span>Explorar</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
