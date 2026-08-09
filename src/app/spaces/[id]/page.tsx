import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Store, ArrowLeft, ArrowRight, Utensils, Phone, Clock, MapPin, ExternalLink, Snowflake } from 'lucide-react';
import prisma from '@/infrastructure/db/prisma';

export const dynamic = 'force-dynamic';

async function getSpaceDetails(id: string) {
  return await (prisma.space as any).findUnique({
    where: { id },
    include: {
      businesses: {
        include: {
          products: {
            where: { isAvailable: true },
            select: { id: true, name: true, price: true },
          },
        },
      },
    },
  });
}

export default async function SpaceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const space = await getSpaceDetails(params.id);

  if (!space) {
    notFound();
  }

  const isSpaceActive = space.isActive !== false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Link */}
      <Link
        href="/spaces"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a todos los Espacios</span>
      </Link>

      {/* Warning if Space is Frozen */}
      {!isSpaceActive && (
        <div className="mb-6 p-4 rounded-3xl bg-cyan-950/60 border border-cyan-500/40 flex items-center gap-3 text-xs text-cyan-200">
          <Snowflake className="w-5 h-5 text-cyan-400 shrink-0 animate-pulse" />
          <div>
            <strong className="text-white block">Espacio Temporalmente Suspendido por Administración</strong>
            <span>{space.frozenReason || 'Este patio gastronómico se encuentra en mora de mensualidad y no recibe nuevos pedidos.'}</span>
          </div>
        </div>
      )}

      {/* Space Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel mb-10 border border-slate-800 shadow-2xl">
        <div className="relative h-64 sm:h-80 w-full bg-slate-900 overflow-hidden">
          {space.imageUrl ? (
            <img
              src={space.imageUrl}
              alt={space.name}
              className={`w-full h-full object-cover ${!isSpaceActive ? 'grayscale opacity-70' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700">
              <Store className="w-16 h-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{space.address || space.location || 'Trinidad, Beni'}</span>
                </div>

                {space.googleMapsUrl && (
                  <a
                    href={space.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 backdrop-blur-md transition-all shadow-md"
                  >
                    <span>Ver en Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {space.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
                {space.description}
              </p>
            </div>

            <div className="px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs font-bold text-white shrink-0">
              {space.businesses.length} Locales Registrados
            </div>
          </div>
        </div>
      </div>

      {/* Businesses Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Utensils className="w-5 h-5 text-emerald-400" />
          <span>Locales y Restaurantes Disponibles</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Haz clic en cualquier local para explorar su menú y armar tu pedido.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {space.businesses.map((biz: any) => (
          <div
            key={biz.id}
            className="glass-panel rounded-3xl overflow-hidden border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-xl"
          >
            <div>
              {/* Business Banner / Logo */}
              <div className="relative h-40 bg-slate-900 overflow-hidden">
                {biz.bannerUrl ? (
                  <img
                    src={biz.bannerUrl}
                    alt={biz.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center">
                    <Store className="w-10 h-10 text-slate-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md border ${
                      biz.isOpen && biz.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {biz.isOpen && biz.isActive ? '🟢 Abierto ahora' : '🔴 Cerrado'}
                  </span>
                </div>

                {/* Category Chip */}
                <div className="absolute bottom-3 left-4">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900/90 text-amber-300 border border-slate-700 backdrop-blur-md uppercase tracking-wider">
                    {biz.category.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {biz.name}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>WhatsApp: {biz.ownerPhone}</span>
                </div>

                {/* Sample items preview */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2">Platos destacados:</div>
                  <div className="space-y-1">
                    {biz.products.slice(0, 3).map((prod: any) => (
                      <div key={prod.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 truncate max-w-[180px]">{prod.name}</span>
                        <span className="font-bold text-emerald-400 font-mono">{prod.price.toFixed(2)} Bs</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="p-6 pt-0">
              <Link
                href={`/businesses/${biz.id}`}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Ver Menú Completo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
