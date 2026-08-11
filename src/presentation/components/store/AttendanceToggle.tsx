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
    <div className="rune-panel rounded-2xl p-5 border border-surface-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isOpen
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40 shadow-lg shadow-violet-500/10'
              : 'bg-surface-raised text-ink-mute border border-surface-line'
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
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                  : 'bg-ember/20 text-ember-soft border border-ember/40'
              }`}
            >
              {isOpen ? '🟢 Abierto al Público' : '🔴 Tienda Cerrada'}
            </span>
          </div>
          <p className="text-xs text-ink-mute mt-0.5">
            {isOpen
              ? 'Tu local está activo y los clientes en Trinidad pueden ordenar tu menú.'
              : 'Tu local figura como cerrado. No recibirás nuevos pedidos.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {errorMsg && (
          <span className="text-[11px] text-ember flex items-center gap-1">
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
              ? 'bg-ember/10 hover:bg-ember/20 text-ember border border-ember/30'
              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20'
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
