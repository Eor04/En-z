'use client';

import React, { useState } from 'react';
import { Store, CheckCircle2, Moon, Clock, AlertTriangle, Power } from 'lucide-react';

interface AttendanceToggleProps {
  businessId: string;
  initialIsOpen: boolean;
  businessName: string;
  onStatusChanged?: (isOpen: boolean) => void;
}

export function AttendanceToggle({
  businessId,
  initialIsOpen,
  businessName,
  onStatusChanged,
}: AttendanceToggleProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleToggle = async () => {
    const nextState = !isOpen;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/businesses/${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: nextState }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al cambiar estado');
      }

      setIsOpen(nextState);
      if (onStatusChanged) {
        onStatusChanged(nextState);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isOpen
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          <Power className={`w-6 h-6 ${isOpen ? 'animate-pulse' : ''}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-white">{businessName}</h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                isOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {isOpen ? '🟢 Abierto al Público' : '🔴 Tienda Cerrada'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isOpen
              ? 'Tu local está activo y los clientes en Trinidad pueden ordenar tu menú.'
              : 'Tu local figura como cerrado. No recibirás nuevos pedidos.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {errorMsg && (
          <span className="text-[11px] text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {errorMsg}
          </span>
        )}

        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            isOpen
              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
          } disabled:opacity-50`}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isOpen ? (
            <>
              <Moon className="w-3.5 h-3.5" />
              <span>Cerrar Tienda por Hoy</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Marcar como Abierto</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
