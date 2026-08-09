'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Crosshair,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Compass,
  Sparkles,
} from 'lucide-react';

interface ClientLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (location: {
    lat: number;
    lng: number;
    formattedAddress: string;
    googleMapsUrl: string;
  }) => void;
}

// Coordenadas por defecto de Trinidad, Beni (Plaza Principal José Ballivián)
const DEFAULT_TRINIDAD_LAT = -14.8348;
const DEFAULT_TRINIDAD_LNG = -64.9042;

export function ClientLocationPicker({
  initialLat = DEFAULT_TRINIDAD_LAT,
  initialLng = DEFAULT_TRINIDAD_LNG,
  onLocationChange,
}: ClientLocationPickerProps) {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [locating, setLocating] = useState(false);
  const [locatedSuccess, setLocatedSuccess] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Inicializar Leaflet dinámicamente en el cliente
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Fix para los iconos por defecto de Leaflet en Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current).setView([lat, lng], 15);

        // Tile layer oscuro/moderno de CartoDB o OpenStreetMap
        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19,
          }
        ).addTo(map);

        // Marcador personalizado interactivo
        const customIcon = L.divIcon({
          className: 'custom-pin',
          html: `
            <div style="
              background: #10b981;
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid #ffffff;
              box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 10px;
                height: 10px;
                background: #ffffff;
                border-radius: 50%;
                transform: rotate(45deg);
              "></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const marker = L.marker([lat, lng], {
          draggable: true,
          icon: customIcon,
        }).addTo(map);

        marker.bindPopup(
          '<b style="color:#0f172a">📍 Tu Ubicación de Entrega</b><br><span style="font-size:11px;color:#475569">Arrastra este pin a tu casa exacta</span>'
        );

        // Evento al arrastrar el marcador
        marker.on('dragend', function (event: any) {
          const position = event.target.getLatLng();
          updateCoordinates(position.lat, position.lng);
        });

        // Evento al hacer clic en cualquier parte del mapa
        map.on('click', function (e: any) {
          marker.setLatLng(e.latlng);
          updateCoordinates(e.latlng.lat, e.latlng.lng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const updateCoordinates = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);

    const formattedAddress = `📍 Ubicación GPS: ${newLat.toFixed(5)}, ${newLng.toFixed(5)} (Trinidad, Beni)`;
    const googleMapsUrl = `https://maps.google.com/?q=${newLat},${newLng}`;

    onLocationChange({
      lat: newLat,
      lng: newLng,
      formattedAddress,
      googleMapsUrl,
    });
  };

  // Función para capturar la ubicación GPS del dispositivo
  const handleGetCurrentLocation = () => {
    setLocating(true);
    setGeoError(null);
    setLocatedSuccess(false);

    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización GPS.');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        setLat(userLat);
        setLng(userLng);
        setLocating(false);
        setLocatedSuccess(true);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([userLat, userLng], 17);
          markerRef.current.setLatLng([userLat, userLng]);
          markerRef.current
            .bindPopup(
              '<b style="color:#0f172a">✓ ¡Ubicación GPS Detectada!</b><br><span style="font-size:11px;color:#475569">Tu repartidor llegará aquí</span>'
            )
            .openPopup();
        }

        updateCoordinates(userLat, userLng);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setLocating(false);
        setGeoError(
          'No pudimos acceder a tu GPS automáticamente. Puedes hacer clic o arrastrar el pin en el mapa de Trinidad.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Ubicaciones de referencia rápida en Trinidad
  const TRINIDAD_PRESETS = [
    { name: 'Centro / Casco Viejo', lat: -14.8348, lng: -64.9042 },
    { name: 'Patio El Bosque / Zona Norte', lat: -14.8315, lng: -64.9012 },
    { name: 'Plaza Pompeya / Sur', lat: -14.839, lng: -64.9065 },
    { name: 'Av. Cipriano Barace', lat: -14.837, lng: -64.8985 },
  ];

  const handleSelectPreset = (pLat: number, pLng: number) => {
    setLat(pLat);
    setLng(pLng);
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([pLat, pLng], 16);
      markerRef.current.setLatLng([pLat, pLng]);
    }
    updateCoordinates(pLat, pLng);
  };

  return (
    <div className="space-y-4">
      {/* Botón principal de GPS y Notificaciones */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={locating}
          className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all ring-2 ring-emerald-400/40 disabled:opacity-50"
        >
          <Crosshair className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
          <span>
            {locating
              ? 'Detectando tu GPS en Trinidad...'
              : '📍 Obtener Mi Ubicación Actual (GPS / Google Maps)'}
          </span>
        </button>

        <a
          href={`https://maps.google.com/?q=${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          className="py-2.5 px-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
        >
          <span>Abrir en Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
        </a>
      </div>

      {locatedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            ¡Ubicación GPS detectada con éxito! Puedes arrastrar el marcador verde en el mapa para ajustar la puerta de tu casa.
          </span>
        </div>
      )}

      {geoError && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Contenedor del Mapa Interactivo Leaflet */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-xl">
        <div
          ref={mapContainerRef}
          className="w-full h-64 sm:h-80 bg-slate-900 z-0"
        />

        {/* Overlay con instrucciones */}
        <div className="absolute top-3 right-3 z-10 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-200 flex items-center gap-1.5 shadow-lg pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>Haz clic o arrastra el pin en Trinidad</span>
        </div>

        {/* Barra inferior de coordenadas */}
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-semibold">
              Coordenadas: <strong className="text-white font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</strong>
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">
            Trinidad, Beni • Lista para el repartidor ✓
          </span>
        </div>
      </div>

      {/* Presets rápidos si el GPS está apagado */}
      <div>
        <span className="text-[11px] text-slate-400 block mb-1.5">
          Zonas de referencia rápida en Trinidad (haz clic para centrar):
        </span>
        <div className="flex flex-wrap gap-1.5">
          {TRINIDAD_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleSelectPreset(preset.lat, preset.lng)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white text-[11px] font-semibold transition-all"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
