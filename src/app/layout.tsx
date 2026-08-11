import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Chakra_Petch, Manrope, JetBrains_Mono } from 'next/font/google';
import { SessionProvider } from '@/presentation/components/providers/SessionProvider';
import { CartProvider } from '@/presentation/context/CartContext';
import { CartDrawer } from '@/presentation/components/cart/CartDrawer';
import { Navbar } from '@/presentation/components/layout/Navbar';
import { Footer } from '@/presentation/components/layout/Footer';
import { PwaInstallBanner } from '@/presentation/components/common/PwaInstallBanner';
import { EnZSplash } from '@/presentation/components/brand/EnZSplash';
import { AuroraBackground } from '@/presentation/components/ui';
import type { Metadata, Viewport } from 'next';

/* --- Tipografía ---------------------------------------------------------
 * Display: Chakra Petch — angular, técnica; hereda la geometría del nudo.
 * Cuerpo:  Manrope — geométrica humanista, altísima legibilidad.
 * Datos:   JetBrains Mono — cifras tabulares para precios y códigos.
 * (Evitamos Inter/Roboto a propósito, como pide la guía.)
 * --------------------------------------------------------------------- */
const display = Chakra_Petch({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const sans = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'En Z — Delivery de comida y comercios en Trinidad',
    template: '%s · En Z',
  },
  description:
    'En Z conecta patios de comida, licorerías y farmacias de Trinidad con tu puerta. Pide por QR, tarjeta o efectivo y sigue tu pedido en vivo.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'En Z',
  },
  icons: {
    icon: '/icons/icon-192x192.svg',
    apple: '/icons/icon-192x192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#06040D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`dark ${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="flex min-h-dvh flex-col bg-void text-ink antialiased">
        <SessionProvider>
          <CartProvider>
            <AuroraBackground />
            <EnZSplash />

            {/* a11y: salto directo al contenido (regla skip-links) */}
            <a
              href="#contenido"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[130] focus:rounded-xl focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
            >
              Saltar al contenido
            </a>

            <Navbar />
            <main id="contenido" className="relative flex-1">
              {children}
            </main>
            <CartDrawer />
            <PwaInstallBanner />
            <Footer />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
