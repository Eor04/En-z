'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  Store,
  Package,
  ArrowRight,
  ExternalLink,
  QrCode,
  ChefHat,
  BarChart2,
} from 'lucide-react';
import { AttendanceToggle } from '@/presentation/components/store/AttendanceToggle';
import { ProductManager } from '@/presentation/components/store/ProductManager';
import { StoreReceiptsManager } from '@/presentation/components/payments/StoreReceiptsManager';
import { StoreLiveOrdersManager } from '@/presentation/components/store/StoreLiveOrdersManager';
import { StoreAnalyticsDashboard } from '@/presentation/components/store/StoreAnalyticsDashboard';
import { Badge, Button, Panel, Skeleton, Tabs } from '@/presentation/components/ui';
import { EASE_RUNE } from '@/presentation/lib/motion';

type Tab = 'orders' | 'receipts' | 'products' | 'analytics';

export default function StoreDashboardPage() {
  const { data: session, status } = useSession();
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  const fetchBusiness = async () => {
    try {
      const res = await fetch('/api/store/me');
      const data = await res.json();
      if (data.business) {
        const menuRes = await fetch(`/api/businesses/${data.business.id}`);
        setBusinessData(await menuRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'loading') fetchBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  if (status === 'loading' || loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-28 rounded-[28px]" />
        <Skeleton className="h-24 rounded-[28px]" />
        <Skeleton className="h-14 w-full max-w-2xl rounded-2xl" />
        <Skeleton className="h-96 rounded-[28px]" />
      </div>
    );
  }

  const userRole = (session?.user as any)?.role;
  if (!session?.user || (userRole !== 'BUSINESS_OWNER' && userRole !== 'ADMIN')) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <Panel className="p-8 text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-warn/30 bg-warn/12 text-warn">
            <Store className="h-7 w-7" />
          </span>
          <h1 className="font-display text-xl font-bold text-white">Portal de tiendas</h1>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink-mute">
            Iniciá sesión con tu cuenta de comercio para gestionar tu local.
          </p>
          <div className="mt-7 space-y-3">
            <Button
              full
              size="md"
              onClick={() =>
                signIn('credentials', {
                  email: 'tienda@pedidostrinidad.com',
                  password: 'password123',
                  callbackUrl: '/store/dashboard',
                })
              }
            >
              Acceder con cuenta demo
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/auth/login" variant="subtle" full size="md">
              Usar otra cuenta
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  const { business, products } = businessData || {};

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Encabezado */}
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_RUNE }}
        className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div className="min-w-0">
          <Badge tone="warn" icon={Store}>
            Panel comercial
          </Badge>
          <h1 className="mt-3 truncate font-display text-[28px] font-bold leading-tight tracking-tight text-white sm:text-4xl">
            {business?.name || 'Mi negocio'}
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-mute">
            Atendé comandas en vivo, verificá pagos por QR y administrá tu catálogo.
          </p>
        </div>

        {business && (
          <Link
            href={`/businesses/${business.id}`}
            target="_blank"
            className="flex shrink-0 items-center gap-2 rounded-2xl border border-surface-line bg-void-800/70 px-4 py-2.5 text-[12px] font-semibold text-ink-soft transition-colors hover:border-violet-400/50 hover:text-white"
          >
            Ver menú público
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </motion.header>

      {business && (
        <div className="mb-8">
          <AttendanceToggle
            businessId={business.id}
            initialIsOpen={business.isOpen}
            businessName={business.name}
          />
        </div>
      )}

      <div className="mb-8">
        <Tabs
          layoutKey="store-tabs"
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { value: 'orders', label: 'Comandas', icon: ChefHat },
            { value: 'receipts', label: 'Comprobantes QR', icon: QrCode },
            { value: 'products', label: 'Catálogo', icon: Package, count: products?.length ?? 0 },
            { value: 'analytics', label: 'Ganancias', icon: BarChart2 },
          ]}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: EASE_RUNE }}
        >
          {business && activeTab === 'orders' && (
            <StoreLiveOrdersManager businessId={business.id} onOrderUpdated={fetchBusiness} />
          )}
          {business && activeTab === 'receipts' && (
            <StoreReceiptsManager businessId={business.id} onReceiptVerified={fetchBusiness} />
          )}
          {business && activeTab === 'products' && (
            <ProductManager businessId={business.id} initialProducts={products || []} />
          )}
          {business && activeTab === 'analytics' && (
            <StoreAnalyticsDashboard businessId={business.id} businessName={business.name} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
