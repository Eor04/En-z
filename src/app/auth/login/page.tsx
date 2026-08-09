import { Suspense } from 'react';
import { UnifiedLoginForm } from '@/presentation/components/auth/UnifiedLoginForm';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Iniciar Sesión | PedidosTrinidad Delivery',
  description: 'Portal de acceso unificado para Clientes, Tiendas, Repartidores y Administradores de PedidosTrinidad.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la página principal</span>
        </Link>

        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">Pedidos<span className="text-emerald-400">Trinidad</span></span>
        </div>
        <p className="text-xs text-slate-400">Acceso Seguro y Modular por Roles</p>
      </div>

      <div className="relative z-10 px-4 sm:px-0">
        <Suspense fallback={<div className="text-center text-slate-400 py-12">Cargando portal...</div>}>
          <UnifiedLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
