'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Search, MapPin, Store, ArrowRight, Snowflake, X } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Panel, Tabs } from '@/presentation/components/ui';
import { EnZLogo } from '@/presentation/components/brand/EnZLogo';
import { cn } from '@/presentation/lib/utils';
import { EASE_RUNE } from '@/presentation/lib/motion';

export interface ExplorerBusiness {
  id: string;
  name: string;
  category: string;
  isOpen: boolean;
  isActive: boolean;
  logoUrl: string | null;
}

export interface ExplorerSpace {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  isActive: boolean;
  frozenReason: string | null;
  businesses: ExplorerBusiness[];
}

type Filter = 'all' | 'open' | 'food' | 'shops';

const FOOD = new Set(['PATIO_COMIDA', 'RESTAURANTE']);

export function SpaceExplorer({ spaces }: { spaces: ExplorerSpace[] }) {
  const params = useSearchParams();
  const initialQ = params.get('q') ?? '';
  const [q, setQ] = React.useState(initialQ);
  const [filter, setFilter] = React.useState<Filter>('all');

  const matches = React.useCallback(
    (space: ExplorerSpace) => {
      const term = q.trim().toLowerCase();
      if (term) {
        const hay = [space.name, space.description ?? '', space.address ?? '', ...space.businesses.map((b) => b.name)]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (filter === 'open') return space.businesses.some((b) => b.isOpen);
      if (filter === 'food') return space.businesses.some((b) => FOOD.has(b.category));
      if (filter === 'shops') return space.businesses.some((b) => !FOOD.has(b.category));
      return true;
    },
    [q, filter]
  );

  const visible = React.useMemo(() => spaces.filter(matches), [spaces, matches]);

  const counts = React.useMemo(
    () => ({
      all: spaces.length,
      open: spaces.filter((s) => s.businesses.some((b) => b.isOpen)).length,
      food: spaces.filter((s) => s.businesses.some((b) => FOOD.has(b.category))).length,
      shops: spaces.filter((s) => s.businesses.some((b) => !FOOD.has(b.category))).length,
    }),
    [spaces]
  );

  return (
    <>
      {/* Controles */}
      <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300" />
          <label htmlFor="space-search" className="sr-only">
            Buscar espacios o comercios
          </label>
          <Input
            id="space-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar un espacio, local o plato…"
            className="pl-11 pr-10"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-ink-faint transition-colors hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Tabs
          layoutKey="space-filter"
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: 'all', label: 'Todos', count: counts.all },
            { value: 'open', label: 'Abiertos', count: counts.open },
            { value: 'food', label: 'Comida', count: counts.food },
            { value: 'shops', label: 'Comercios', count: counts.shops },
          ]}
        />
      </div>

      {/* Resultados */}
      {visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description={`No encontramos espacios para “${q}”. Probá con otro término o quitá los filtros.`}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQ('');
                setFilter('all');
              }}
            >
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((space, i) => (
              <SpaceCard key={space.id} space={space} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}

/* `AnimatePresence mode="popLayout"` mide el hijo saliente: necesita reenviar la ref. */
const SpaceCard = React.forwardRef<
  HTMLElement,
  { space: ExplorerSpace; index: number }
>(function SpaceCard({ space, index }, ref) {
  const openCount = space.businesses.filter((b) => b.isOpen).length;
  const frozen = !space.isActive;

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, ease: EASE_RUNE, delay: Math.min(index * 0.05, 0.3) }}
    >
      <Panel interactive className="flex h-full flex-col overflow-hidden">
        {/* Portada */}
        <div className="relative h-48 overflow-hidden bg-void-700">
          {space.imageUrl ? (
            <img
              src={space.imageUrl}
              alt={space.name}
              loading="lazy"
              className={cn(
                'h-full w-full object-cover transition-transform duration-700 group-hover:scale-105',
                frozen && 'opacity-50 grayscale'
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center opacity-25">
              <EnZLogo size={120} glow={false} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/45 to-transparent" />

          <div className="absolute right-3 top-3">
            {frozen ? (
              <Badge tone="info" icon={Snowflake}>
                Suspendido
              </Badge>
            ) : (
              <Badge tone={openCount > 0 ? 'ok' : 'mute'} dot>
                {openCount > 0 ? `${openCount} abiertos` : 'cerrado ahora'}
              </Badge>
            )}
          </div>

          <div className="absolute inset-x-4 bottom-4">
            <h2 className="font-display text-xl font-bold leading-tight text-white transition-colors group-hover:text-arc-soft">
              {space.name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-soft">
              <MapPin className="h-3 w-3 shrink-0 text-violet-400" />
              <span className="truncate">{space.address || 'Trinidad, Beni'}</span>
            </p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="flex flex-1 flex-col gap-4 p-5">
          {space.description && (
            <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-mute">
              {space.description}
            </p>
          )}

          {frozen && (
            <p className="flex items-start gap-2 rounded-xl border border-info/30 bg-info/10 px-3 py-2.5 text-[11px] leading-relaxed text-info-soft">
              <Snowflake className="mt-px h-3.5 w-3.5 shrink-0" />
              {space.frozenReason || 'Espacio suspendido por administración.'}
            </p>
          )}

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              {space.businesses.length} locales
            </p>
            <div className="flex flex-wrap gap-1.5">
              {space.businesses.slice(0, 6).map((b) => (
                <span
                  key={b.id}
                  className="flex items-center gap-1.5 rounded-lg border border-surface-line bg-surface/70 px-2 py-1 text-[10px] text-ink-soft"
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      !b.isActive ? 'bg-info' : b.isOpen ? 'bg-ok' : 'bg-ink-faint'
                    )}
                  />
                  {b.name}
                </span>
              ))}
              {space.businesses.length > 6 && (
                <span className="rounded-lg border border-violet-400/25 bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-300">
                  +{space.businesses.length - 6}
                </span>
              )}
            </div>
          </div>

          <div className="mt-auto flex gap-2 pt-2">
            <Link
              href={`/spaces/${space.id}`}
              className="sheen flex flex-1 items-center justify-center gap-2 rounded-2xl border border-violet-300/30 bg-grad-rune px-4 py-3 font-display text-[12px] font-bold text-white shadow-glow-violet transition-transform duration-200 active:scale-[0.98]"
            >
              Explorar locales
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            {space.googleMapsUrl && (
              <a
                href={space.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Ver ${space.name} en Google Maps`}
                className="flex items-center justify-center rounded-2xl border border-surface-line px-3.5 text-ink-mute transition-colors hover:border-ember/40 hover:text-ember"
              >
                <MapPin className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </Panel>
    </motion.article>
  );
});
