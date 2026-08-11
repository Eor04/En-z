export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Store,
  ArrowLeft,
  ArrowRight,
  Utensils,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import prisma from '@/infrastructure/db/prisma';
import { EnZLogo } from '@/presentation/components/brand/EnZLogo';
import {
  Badge,
  Panel,
  Reveal,
  StaggerList,
  StaggerItem,
  EmptyState,
} from '@/presentation/components/ui';
import { bs } from '@/presentation/lib/utils';

async function getSpaceDetails(id: string) {
  return prisma.space.findUnique({
    where: { id },
    include: {
      businesses: {
        where: { isActive: true },
        orderBy: [{ isOpen: 'desc' }, { name: 'asc' }],
        include: {
          products: {
            where: { isAvailable: true },
            orderBy: { price: 'desc' },
            select: { id: true, name: true, price: true },
            take: 3,
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const space = await prisma.space.findUnique({
    where: { id: params.id },
    select: { name: true, description: true },
  });
  return {
    title: space?.name ?? 'Espacio',
    description: space?.description ?? undefined,
  };
}

export default async function SpaceDetailPage({ params }: { params: { id: string } }) {
  const space = await getSpaceDetails(params.id);
  if (!space || !space.isActive) notFound();

  const openCount = space.businesses.filter((b) => b.isOpen).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/spaces"
        className="group mb-7 inline-flex items-center gap-2 text-[12px] font-semibold text-ink-mute transition-colors hover:text-violet-300"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        Volver a los espacios
      </Link>

      {/* --- Portada --- */}
      <Reveal>
        <div className="rune-panel rune-edge relative mb-12 overflow-hidden rounded-[32px]">
          <div className="relative h-64 w-full overflow-hidden bg-void-700 sm:h-80">
            {space.imageUrl ? (
              <img
                src={space.imageUrl}
                alt={space.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center opacity-20">
                <EnZLogo size={260} glow={false} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-transparent" />

            <div className="absolute inset-x-6 bottom-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {/* En Server Components los iconos van como elemento, no como prop-función */}
                  <Badge tone="violet">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {space.address || 'Trinidad, Beni'}
                  </Badge>
                  <Badge tone={openCount > 0 ? 'ok' : 'mute'} dot>
                    {openCount > 0 ? `${openCount} locales abiertos` : 'Sin locales abiertos'}
                  </Badge>
                  {space.googleMapsUrl && (
                    <a
                      href={space.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-ember/30 bg-ember/10 px-2.5 py-1 text-[11px] font-semibold text-ember-soft transition-colors hover:bg-ember/20"
                    >
                      Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight text-white sm:text-[42px]">
                  {space.name}
                </h1>
                {space.description && (
                  <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-soft sm:text-sm">
                    {space.description}
                  </p>
                )}
              </div>

              <div className="shrink-0 rounded-2xl border border-surface-line bg-void-800/85 px-4 py-3 text-center backdrop-blur-md">
                <p className="font-display text-2xl font-bold leading-none text-white tabular">
                  {space.businesses.length}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  locales
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* --- Locales --- */}
      <Reveal className="mb-7">
        <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-300">
            <Utensils className="h-4 w-4" />
          </span>
          Locales disponibles
        </h2>
        <p className="ml-[46px] mt-1 text-[13px] text-ink-mute">
          Entrá a cualquier local para ver su menú completo y armar tu pedido.
        </p>
      </Reveal>

      {space.businesses.length === 0 ? (
        <EmptyState
          iconNode={<Store className="h-7 w-7" />}
          title="Todavía no hay locales activos"
          description="Este espacio aún no tiene comercios habilitados. Volvé a intentarlo más tarde."
        />
      ) : (
        <StaggerList className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {space.businesses.map((biz) => (
            <StaggerItem key={biz.id}>
              <Link href={`/businesses/${biz.id}`} className="block h-full">
                <Panel interactive className="flex h-full flex-col overflow-hidden">
                  <div className="relative h-40 overflow-hidden bg-void-700">
                    {biz.bannerUrl ? (
                      <img
                        src={biz.bannerUrl}
                        alt={biz.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950/60 to-void-700">
                        <Store className="h-9 w-9 text-violet-500/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />

                    <div className="absolute right-3 top-3">
                      <Badge tone={biz.isOpen ? 'ok' : 'mute'} dot>
                        {biz.isOpen ? 'Abierto' : 'Cerrado'}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-4">
                      <span className="rounded-lg border border-surface-line bg-void-800/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-warn-soft backdrop-blur-md">
                        {biz.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg font-bold text-white transition-colors group-hover:text-arc-soft">
                      {biz.name}
                    </h3>
                    <p className="mt-1.5 flex items-center gap-2 text-[12px] text-ink-mute">
                      <Phone className="h-3.5 w-3.5 text-ink-faint" />
                      {biz.ownerPhone}
                    </p>

                    {biz.products.length > 0 && (
                      <div className="mt-4 border-t border-surface-line pt-3.5">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                          Destacados
                        </p>
                        <ul className="space-y-1.5">
                          {biz.products.map((p) => (
                            <li key={p.id} className="flex items-center justify-between gap-3 text-[12px]">
                              <span className="truncate text-ink-soft">{p.name}</span>
                              <span className="shrink-0 font-display font-bold text-violet-300 tabular">
                                {bs(p.price)} Bs
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <span className="sheen mt-5 flex items-center justify-center gap-2 rounded-2xl border border-violet-300/30 bg-grad-rune px-4 py-3 font-display text-[12px] font-bold text-white shadow-glow-violet">
                      Ver menú completo
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Panel>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  );
}
