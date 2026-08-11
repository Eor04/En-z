import {
  Clock,
  ChefHat,
  Search,
  Bike,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { Tone } from '@/presentation/components/ui';

export interface StatusMeta {
  label: string;
  short: string;
  tone: Tone;
  icon: LucideIcon;
  /** Posición en la línea de tiempo (los estados finales quedan fuera). */
  step: number | null;
  hint: string;
}

export const ORDER_STATUS: Record<string, StatusMeta> = {
  esperando_pago: {
    label: 'Esperando pago',
    short: 'Pago',
    tone: 'warn',
    icon: Clock,
    step: 0,
    hint: 'Estamos esperando la confirmación de tu pago.',
  },
  en_preparacion: {
    label: 'En preparación',
    short: 'Cocina',
    tone: 'info',
    icon: ChefHat,
    step: 1,
    hint: 'El local ya está preparando tu pedido.',
  },
  buscando_driver: {
    label: 'Buscando repartidor',
    short: 'Repartidor',
    tone: 'violet',
    icon: Search,
    step: 2,
    hint: 'Asignando un repartidor disponible cerca del local.',
  },
  en_camino: {
    label: 'En camino',
    short: 'En camino',
    tone: 'arc',
    icon: Bike,
    step: 3,
    hint: 'Tu pedido va en camino a la dirección indicada.',
  },
  entregado: {
    label: 'Entregado',
    short: 'Entregado',
    tone: 'ok',
    icon: CheckCircle2,
    step: 4,
    hint: '¡Pedido entregado! Gracias por usar En Z.',
  },
  cancelado: {
    label: 'Cancelado',
    short: 'Cancelado',
    tone: 'danger',
    icon: XCircle,
    step: null,
    hint: 'Este pedido fue cancelado.',
  },
};

export const TIMELINE = [
  'esperando_pago',
  'en_preparacion',
  'buscando_driver',
  'en_camino',
  'entregado',
] as const;

export function statusMeta(status?: string): StatusMeta {
  return (
    ORDER_STATUS[status ?? ''] ?? {
      label: status ?? 'Desconocido',
      short: status ?? '—',
      tone: 'mute',
      icon: Clock,
      step: null,
      hint: '',
    }
  );
}

/** Fecha larga localizada para Bolivia. */
export function orderDate(value: string | Date) {
  return new Date(value).toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
