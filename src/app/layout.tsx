import './globals.css';
import 'leaflet/dist/leaflet.css';
import { SessionProvider } from '@/presentation/components/providers/SessionProvider';
import { CartProvider } from '@/presentation/context/CartContext';
import { CartDrawer } from '@/presentation/components/cart/CartDrawer';
import { Navbar } from '@/presentation/components/layout/Navbar';
import { PwaInstallBanner } from '@/presentation/components/common/PwaInstallBanner';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'PedidosTrinidad - Delivery Modular Gastronómico & Comercial',
  description:
    'Plataforma de delivery modular para patios de comida, licorerías y farmacias en Trinidad. Pide por QR, tarjeta o efectivo.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PedidosTrinidad',
  },
  icons: {
    icon: '/icons/icon-192x192.svg',
    apple: '/icons/icon-192x192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#090d16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
        <SessionProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <CartDrawer />
            <PwaInstallBanner />
            <footer className="border-t border-slate-900 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">
                    Pedidos<span className="text-emerald-400">Trinidad</span>
                  </span>
                  <span>• Delivery Express de Comida & Comercios en Trinidad, Beni</span>
                </div>
                <div className="text-slate-400">
                  © 2026 PedidosTrinidad. Todos los derechos reservados.
                </div>
              </div>
            </footer>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
