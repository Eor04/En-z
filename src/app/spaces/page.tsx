export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { MapPin } from 'lucide-react';
import prisma from '@/infrastructure/db/prisma';
import {
  SpaceExplorer,
  type ExplorerSpace,
} from '@/presentation/components/spaces/SpaceExplorer';
import { Skeleton } from '@/presentation/components/ui';

export const metadata = {
  title: 'Espacios y patios de comida',
  description:
    'Descubrí los patios de comida, galerías y comercios de Trinidad disponibles en En Z.',
};

async function getSpaces(): Promise<ExplorerSpace[]> {
  try {
    return (await prisma.space.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        address: true,
        googleMapsUrl: true,
        isActive: true,
        frozenReason: true,
        businesses: {
          where: { isActive: true },
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
    })) as ExplorerSpace[];
  } catch {
    return [];
  }
}

export default async function SpacesPage() {
  const spaces = await getSpaces();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <header className="halo relative mb-10 overflow-hidden">
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3.5 py-1.5">
            <MapPin className="h-3.5 w-3.5 text-violet-300" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">
              Trinidad · Beni
            </span>
          </span>
          <h1 className="mt-5 font-display text-[34px] font-bold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Espacios y <span className="text-rune">patios de comida</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-mute sm:text-base">
            Cada espacio reúne varios locales. Entrá a uno, mirá los menús en vivo y armá un pedido
            combinando platos de distintos comercios del mismo patio.
          </p>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[420px] rounded-3xl" />
            ))}
          </div>
        }
      >
        <SpaceExplorer spaces={spaces} />
      </Suspense>
    </div>
  );
}
