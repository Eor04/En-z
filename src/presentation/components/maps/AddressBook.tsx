'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Trash2, Star, Home, Briefcase, Heart, Check } from 'lucide-react';

export interface SavedAddress {
  id: string;
  label: string;
  icon: string;
  address: string;
  createdAt: string;
}

const STORAGE_KEY = 'pedidos_trinidad_saved_addresses';

const PRESET_ICONS = [
  { emoji: '🏠', label: 'Mi Casa' },
  { emoji: '🏢', label: 'Mi Trabajo' },
  { emoji: '👨‍👩‍👧', label: 'Casa de mis papás' },
  { emoji: '📍', label: 'Otro lugar' },
  { emoji: '🏫', label: 'Mi Colegio' },
  { emoji: '🏥', label: 'Clínica' },
];

interface AddressBookProps {
  currentAddress?: string;
  onSelectAddress: (address: string) => void;
}

export function AddressBook({ currentAddress, onSelectAddress }: AddressBookProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('🏠');
  const [customLabel, setCustomLabel] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Cargar direcciones del localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SavedAddress[] = JSON.parse(stored);
        setAddresses(parsed);
      }
    } catch {
      setAddresses([]);
    }
  }, []);

  const saveToStorage = useCallback((newList: SavedAddress[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch {}
  }, []);

  const handleSaveCurrentAddress = () => {
    if (!currentAddress || (!newLabel && !customLabel)) return;

    const finalLabel = customLabel || newLabel || `Lugar ${addresses.length + 1}`;
    const newEntry: SavedAddress = {
      id: `addr_${Date.now()}`,
      label: finalLabel,
      icon: newIcon,
      address: currentAddress,
      createdAt: new Date().toISOString(),
    };

    const updated = [newEntry, ...addresses];
    setAddresses(updated);
    saveToStorage(updated);

    // Reset form
    setNewLabel('');
    setCustomLabel('');
    setNewIcon('🏠');
    setSelectedPreset(null);
    setShowForm(false);

    // Show feedback
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleDelete = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    saveToStorage(updated);
  };

  const handleSelectPreset = (preset: { emoji: string; label: string }) => {
    setNewIcon(preset.emoji);
    setNewLabel(preset.label);
    setCustomLabel('');
    setSelectedPreset(preset.label);
  };

  const isCurrentAddressAlreadySaved = addresses.some(
    (a) => a.address === currentAddress
  );

  return (
    <div className="space-y-3">
      {/* Lista de direcciones guardadas */}
      {addresses.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-ink-mute font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3 h-3 text-warn" />
            <span>Mis Lugares Frecuentes</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {addresses.map((addr) => {
              const isActive = currentAddress === addr.address;
              return (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => onSelectAddress(addr.address)}
                  className={`group relative text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                    isActive
                      ? 'bg-violet-950/50 border-violet-500/60 ring-1 ring-violet-500/30'
                      : 'bg-void-700/70 border-surface-line hover:border-surface-line hover:bg-void-700'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{addr.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{addr.label}</span>
                      {isActive && (
                        <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[9px] font-bold">
                          <Check className="w-2.5 h-2.5" />
                          <span>Seleccionado</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-ink-mute mt-0.5 line-clamp-2 leading-snug">
                      {addr.address.replace(/📍 Ubicación GPS:\s*/i, '').substring(0, 80)}
                    </p>
                  </div>
                  {/* Botón borrar */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(addr.id);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-ember/20 text-ember hover:bg-ember/40 transition-all"
                    title="Eliminar dirección guardada"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Botón para guardar la dirección actual */}
      {currentAddress && !isCurrentAddressAlreadySaved && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 px-4 rounded-xl border border-dashed border-violet-500/40 hover:border-violet-500/70 bg-violet-500/5 hover:bg-violet-500/10 text-violet-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Guardar esta ubicación como lugar frecuente</span>
        </button>
      )}

      {savedFeedback && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold animate-in fade-in">
          <Check className="w-3.5 h-3.5" />
          <span>¡Dirección guardada en tu libreta! Aparecerá en tus próximos pedidos.</span>
        </div>
      )}

      {/* Formulario para guardar dirección */}
      {showForm && (
        <div className="p-4 rounded-2xl bg-void-700/80 border border-violet-500/30 space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-xs font-bold text-white flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-violet-400" />
            <span>¿Con qué nombre quieres guardar esta ubicación?</span>
          </p>

          {/* Opciones rápidas predefinidas */}
          <div className="grid grid-cols-3 gap-2">
            {PRESET_ICONS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                  selectedPreset === preset.label
                    ? 'bg-violet-500/20 border-violet-500/60 text-violet-300'
                    : 'bg-surface-raised/80 border-surface-line text-ink-soft hover:border-surface-line'
                }`}
              >
                <span className="text-lg">{preset.emoji}</span>
                <span className="text-[10px] text-center leading-tight">{preset.label}</span>
              </button>
            ))}
          </div>

          {/* Nombre personalizado */}
          <div>
            <label className="text-[11px] text-ink-mute font-semibold block mb-1.5">
              O escribe un nombre personalizado:
            </label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => {
                setCustomLabel(e.target.value);
                setSelectedPreset(null);
              }}
              placeholder="Ej. Casa de mi abuela, Gimnasio, etc."
              maxLength={40}
              className="w-full p-2.5 rounded-xl bg-surface-raised border border-surface-line focus:border-violet-500 text-white placeholder-ink-faint text-xs outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveCurrentAddress}
              disabled={!newLabel && !customLabel}
              className="flex-1 py-2.5 px-4 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar en mi Libreta</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setCustomLabel('');
                setNewLabel('');
                setSelectedPreset(null);
              }}
              className="py-2.5 px-3.5 rounded-xl bg-surface-raised hover:bg-surface-high text-ink-mute text-xs font-semibold transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {addresses.length === 0 && !showForm && (
        <p className="text-[10px] text-ink-faint text-center py-1">
          Aún no tienes lugares guardados. Una vez marques tu ubicación en el mapa, puedes guardarlo para usarlo rápido en futuros pedidos.
        </p>
      )}
    </div>
  );
}
