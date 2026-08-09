export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Store, ArrowRight, Sparkles, MapPin, ExternalLink, Snowflake } from 'lucide-react';
import prisma from '@/infrastructure/db/prisma';

export const metadata = {
  title: 'Espacios Gastronómicos & Patios de Comida | PedidosTrinidad',
  description: 'Descubre los patios de comida, galerías y centros gastronómicos de Trinidad.',
};

async function getSpaces() {
  return await (prisma.space as any).findMany({
    include: {
      businesses: {
        select: {
          id: true,
          name: true,
          category: true,
          isOpen: true,
          isActive: true,
          logoUrl: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export default async function SpacesPage() {
  const spaces = await getSpaces();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 mb-10 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Puntos Gastronómicos en Trinidad</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Espacios Físicos & Patios de Comida
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Navega por los patios de comida, food parks y galerías comerciales de Trinidad. Elige un espacio para explorar sus locales gastronómicos y menús.
          </p>
        </div>
      </div>

      {/* Grid of Spaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {spaces.map((space: any) => {
          const isSpaceActive = space.isActive !== false;
          const activeBusinesses = space.businesses.filter((b: any) => b.isActive !== false);
          const openCount = activeBusinesses.filter((b: any) => b.isOpen).length;

          return (
            <div
              key={space.id}
              className={`glass-panel rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between group shadow-xl hover:shadow-2xl ${
                isSpaceActive
                  ? 'border-slate-800 hover:border-emerald-500/40 hover:shadow-emerald-950/20'
                  : 'border-cyan-500/40 bg-cyan-950/20'
              }`}
            >
              <div>
                {/* Image */}
                <div className="relative w-full h-52 bg-slate-900 overflow-hidden">
                  {space.imageUrl ? (
                    <img
                      src={space.imageUrl}
                      alt={space.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                        !isSpaceActive ? 'grayscale opacity-60' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <Store className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    {isSpaceActive ? (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${
                          openCount > 0
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {openCount > 0 ? `🟢 ${openCount} locales abiertos` : '🔴 Locales cerrados'}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-black backdrop-blur-md border bg-cyan-500/30 text-cyan-200 border-cyan-400 animate-pulse flex items-center gap-1">
                        <Snowflake className="w-3 h-3" />
                        <span>CONGELADO</span>
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {space.name}
                    </h2>
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                      <span className="truncate">{space.address || space.location || 'Trinidad, Beni'}</span>
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {space.description && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {space.description}
                    </p>
                  )}

                  {!isSpaceActive && (
                    <div className="p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-[11px] text-cyan-200 flex items-center gap-2">
                      <Snowflake className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{space.frozenReason || 'Espacio suspendido por administración.'}</span>
                    </div>
                  )}

                  {/* Businesses Pills */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Locales en este espacio ({space.businesses.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {space.businesses.map((biz: any) => {
                        const isBizActive = biz.isActive !== false;
                        return (
                          <span
                            key={biz.id}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                              isBizActive
                                ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                                : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                !isBizActive ? 'bg-cyan-400' : biz.isOpen ? 'bg-emerald-400' : 'bg-rose-500'
                              }`}
                            />
                            <span>{biz.name}</span>
                            {!isBizActive && <span className="text-[9px] text-cyan-400">❄️</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0 flex gap-2">
                <Link
                  href={`/spaces/${space.id}`}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 group-hover:bg-emerald-600"
                >
                  <span>Explorar Locales</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                {space.googleMapsUrl && (
                  <a
                    href={space.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-rose-300 hover:text-white transition-all flex items-center justify-center"
                    title="Ver en Google Maps"
                  >
                    <MapPin className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
