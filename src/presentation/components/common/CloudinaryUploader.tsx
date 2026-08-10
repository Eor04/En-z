'use client';

import React, { useRef, useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X, Loader2, Link } from 'lucide-react';

interface CloudinaryUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  /** altura de preview en px */
  previewHeight?: number;
  /** aspect ratio para el preview: 'square' | 'wide' | 'logo' */
  aspect?: 'square' | 'wide' | 'logo';
}

export function CloudinaryUploader({
  value,
  onChange,
  folder = 'pedidos_trinidad',
  label = 'Fotografía',
  previewHeight = 128,
  aspect = 'wide',
}: CloudinaryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const uploadFile = useCallback(async (file: File) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setErrorMsg('Cloudinary no está configurado. Usa URL manual.');
      setTab('url');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Solo se permiten imágenes (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('La imagen no puede superar 5MB.');
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      onChange(data.secure_url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  }, [CLOUD_NAME, UPLOAD_PRESET, folder, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const previewClass =
    aspect === 'logo'
      ? 'w-24 h-24 rounded-xl object-contain bg-slate-800'
      : aspect === 'square'
      ? 'w-full rounded-xl object-cover'
      : 'w-full rounded-xl object-cover';

  return (
    <div>
      {/* Label + Tab toggle */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-300">{label}</label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              tab === 'upload'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Upload className="w-3 h-3 inline mr-1" />
            Subir
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              tab === 'url'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Link className="w-3 h-3 inline mr-1" />
            URL
          </button>
        </div>
      </div>

      {errorMsg && (
        <p className="text-[11px] text-rose-400 mb-1.5">{errorMsg}</p>
      )}

      {tab === 'upload' ? (
        <div className="space-y-2">
          {/* Preview */}
          {value && (
            <div
              className="relative group"
              style={{ height: aspect === 'logo' ? undefined : previewHeight }}
            >
              <img
                src={value}
                alt="Preview"
                className={previewClass}
                style={aspect !== 'logo' ? { height: previewHeight } : undefined}
              />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-2 py-5 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-700 hover:border-indigo-600/50 hover:bg-slate-800/30'
            } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                <span className="text-xs text-slate-400">Subiendo imagen...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-6 h-6 text-slate-500" />
                <span className="text-xs text-slate-400 text-center">
                  {value ? 'Cambiar imagen' : 'Arrastra una foto aquí'}<br />
                  <span className="text-slate-600">o haz clic · JPG, PNG, WEBP · máx 5MB</span>
                </span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
              }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-white placeholder-slate-500 outline-none"
          />
          {value && (
            <img
              src={value}
              alt="Preview"
              className={previewClass}
              style={aspect !== 'logo' ? { height: previewHeight } : undefined}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>
      )}
    </div>
  );
}
