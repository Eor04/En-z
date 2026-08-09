'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Navigation,
  MapPin,
  Store,
  Bike,
  Phone,
  MessageSquare,
  ExternalLink,
  Compass,
  CheckCircle2,
  Route,
  Volume2,
} from 'lucide-react';
import {
  extractCoordinates,
  getGoogleMapsNavigationUrl,
  getGoogleMapsCompleteRouteUrl,
  getWazeNavigationUrl,
  getDriverWhatsAppMessageUrl,
  TRINIDAD_DEFAULT_COORDS,
} from '@/presentation/utils/navigationUrls';

interface DriverRouteMapModalProps {
  order: any;
  onClose: () => void;
}

export function DriverRouteMapModal({ order, onClose }: DriverRouteMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const [driverLat, setDriverLat] = useState<number>(TRINIDAD_DEFAULT_COORDS.lat);
  const [driverLng, setDriverLng] = useState<number>(TRINIDAD_DEFAULT_COORDS.lng);

  // Coordenadas del cliente
  const customerCoords = extractCoordinates(order?.deliveryAddress, -14.8348, -64.9042);
  const customerLat = customerCoords.lat;
  const customerLng = customerCoords.lng;

  // Coordenadas del comercio / cocina
  const spaceName = order?.business?.space?.name || 'El Bosque';
  const storeCoords = extractCoordinates(
    order?.business?.space?.name || order?.business?.address,
    -14.8315,
    -64.9012
  );
  const storeLat = storeCoords.lat;
  const storeLng = storeCoords.lng;

  // Intentar geolocalizar al repartidor en vivo
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDriverLat(pos.coords.latitude);
          setDriverLng(pos.coords.longitude);
        },
        (err) => console.log('Driver GPS fallback to default:', err),
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  // Inicializar Leaflet Map con múltiples marcadores y polyline
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        // Centro intermedio
        const midLat = (driverLat + storeLat + customerLat) / 3;
        const midLng = (driverLng + storeLng + customerLng) / 3;

        const map = L.map(mapContainerRef.current).setView([midLat, midLng], 14);

        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            maxZoom: 19,
          }
        ).addTo(map);

        // 1. Marcador Moto Repartidor
        const driverIcon = L.divIcon({
          className: 'driver-marker',
          html: `
            <div style="
              background: #0ea5e9;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border: 3px solid #ffffff;
              box-shadow: 0 4px 14px rgba(14, 165, 233, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 16px;
            ">
              🏍️
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        // 2. Marcador Comercio / Tienda
        const storeIcon = L.divIcon({
          className: 'store-marker',
          html: `
            <div style="
              background: #f59e0b;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border: 3px solid #ffffff;
              box-shadow: 0 4px 14px rgba(245, 158, 11, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 16px;
            ">
              🏬
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        // 3. Marcador Cliente (Destino)
        const customerIcon = L.divIcon({
          className: 'customer-marker',
          html: `
            <div style="
              background: #10b981;
              width: 36px;
              height: 36px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid #ffffff;
              box-shadow: 0 4px 14px rgba(16, 185, 129, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="transform: rotate(45deg); font-size: 14px;">🏠</span>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        // Agregar marcadores con Popups
        L.marker([driverLat, driverLng], { icon: driverIcon })
          .addTo(map)
          .bindPopup('<b>🏍️ Tu Posición Actual (Moto)</b>');

        L.marker([storeLat, storeLng], { icon: storeIcon })
          .addTo(map)
          .bindPopup(
            `<b>🏬 1. Retirar en: ${order?.business?.name || 'Local'}</b><br><span style="font-size:11px;color:#64748b">${spaceName}</span>`
          );

        L.marker([customerLat, customerLng], { icon: customerIcon })
          .addTo(map)
          .bindPopup(
            `<b>🏠 2. Entregar a: ${order?.customer?.name || 'Cliente'}</b><br><span style="font-size:11px;color:#64748b">${order?.deliveryAddress}</span>`
          );

        // Trazar línea de ruta: Moto ➔ Tienda ➔ Cliente
        const latlngs = [
          [driverLat, driverLng],
          [storeLat, storeLng],
          [customerLat, customerLng],
        ];

        L.polyline(latlngs as any, {
          color: '#10b981',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8',
        }).addTo(map);

        // Ajustar vista para incluir los 3 puntos
        const bounds = L.latLngBounds(latlngs as any);
        map.fitBounds(bounds, { padding: [50, 50] });

        mapInstanceRef.current = map;
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
  }, [driverLat, driverLng, storeLat, storeLng, customerLat, customerLng]);

  // URLs optimizadas para navegación turn-by-turn nativa
  const completeRouteGpsUrl = getGoogleMapsCompleteRouteUrl({
    originLat: driverLat,
    originLng: driverLng,
    storeLat,
    storeLng,
    storeName: order?.business?.name,
    customerLat,
    customerLng,
    customerAddress: order?.deliveryAddress,
  });

  const navigateToCustomerGpsUrl = getGoogleMapsNavigationUrl({
    lat: customerLat,
    lng: customerLng,
    address: order?.deliveryAddress,
    name: order?.customer?.name,
  });

  const navigateToStoreGpsUrl = getGoogleMapsNavigationUrl({
    lat: storeLat,
    lng: storeLng,
    name: order?.business?.name,
    address: spaceName,
  });

  const wazeCustomerUrl = getWazeNavigationUrl(customerLat, customerLng);

  const whatsAppUrl = getDriverWhatsAppMessageUrl({
    phone: order?.customerPhone || order?.customer?.phone,
    customerName: order?.customer?.name,
    orderId: order?.id,
    deliveryAddress: order?.deliveryAddress,
  });

  const cleanPhone = (order?.customerPhone || order?.customer?.phone || '').replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="glass-panel max-w-3xl w-full rounded-3xl border-2 border-emerald-500/50 shadow-2xl overflow-hidden bg-slate-950 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black shrink-0">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ruta GPS en Vivo
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  #{order?.id?.slice(0, 6)?.toUpperCase()}
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                Navegación Interactiva: Local ➔ Cliente en Trinidad
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mapa Interactivo Leaflet */}
        <div className="relative flex-1 min-h-[240px] sm:min-h-[320px] bg-slate-900">
          <div ref={mapContainerRef} className="w-full h-full min-h-[240px] sm:min-h-[320px]" />

          {/* Leyenda flotante */}
          <div className="absolute top-3 left-3 z-10 bg-slate-950/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 shadow-xl text-[11px] space-y-1.5 pointer-events-none">
            <div className="flex items-center gap-2 text-sky-300 font-bold">
              <span>🏍️</span>
              <span>Tu Moto (Inicio)</span>
            </div>
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <span>🏬</span>
              <span>{order?.business?.name} (Retiro)</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <span>🏠</span>
              <span>{order?.customer?.name} (Entrega)</span>
            </div>
          </div>
        </div>

        {/* Panel de Datos y Acciones Rápidas */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Retiro info */}
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-2">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  <span>Punto 1: Recoger en Cocina</span>
                </span>
                <strong className="text-white text-xs block">{order?.business?.name}</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {spaceName} • Trinidad, Beni
                </p>
              </div>
              <a
                href={navigateToStoreGpsUrl}
                target="_blank"
                rel="noreferrer"
                className="self-start px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
              >
                <Navigation className="w-3 h-3" />
                <span>Navegar a Cocina</span>
              </a>
            </div>

            {/* Entrega info */}
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-2">
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>Punto 2: Entregar al Cliente</span>
                </span>
                <strong className="text-white text-xs block">{order?.customer?.name}</strong>
                <p className="text-slate-300 text-[11px] mt-0.5 font-mono">
                  {order?.deliveryAddress}
                </p>
                {order?.notes && (
                  <p className="text-amber-300 text-[11px] mt-1 italic">
                    Notas: &quot;{order.notes}&quot;
                  </p>
                )}
              </div>
              <a
                href={navigateToCustomerGpsUrl}
                target="_blank"
                rel="noreferrer"
                className="self-start px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
              >
                <Navigation className="w-3 h-3" />
                <span>Navegar al Cliente</span>
              </a>
            </div>
          </div>

          {/* BOTÓN PRINCIPAL GIGANTE: INICIAR RUTA EN GOOGLE MAPS (GPS HABLADO) */}
          <a
            href={navigateToCustomerGpsUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-sm font-black shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2.5 transition-all ring-2 ring-emerald-400/50 transform active:scale-98"
          >
            <Navigation className="w-5 h-5 animate-pulse text-slate-950" />
            <span className="text-slate-950 tracking-wide uppercase font-black">
              🧭 Iniciar Ruta en Google Maps (GPS Hablado)
            </span>
          </a>

          {/* Botones secundarios: Waze, WhatsApp, Llamada, Ruta Completa */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={completeRouteGpsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-w-[140px] py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              title="Ruta con 2 paradas: Moto -> Local -> Cliente"
            >
              <Route className="w-3.5 h-3.5 text-slate-400" />
              <span>Ruta con 2 Paradas</span>
            </a>

            <a
              href={wazeCustomerUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Waze</span>
            </a>

            {cleanPhone && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            )}

            {cleanPhone && (
              <a
                href={`tel:${cleanPhone}`}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Llamar</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
