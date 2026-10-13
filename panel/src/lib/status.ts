import type { Tone } from '@/components/ui';

export const apptStatus: Record<string, { label: string; tone: Tone }> = {
  requested: { label: 'Por confirmar', tone: 'amber' },
  confirmed: { label: 'Confirmada', tone: 'green' },
  rescheduled: { label: 'Reprogramada', tone: 'blue' },
  completed: { label: 'Realizada', tone: 'gray' },
  cancelled: { label: 'Cancelada', tone: 'red' },
  no_show: { label: 'No asistió', tone: 'red' },
};

export const orderStatus: Record<string, { label: string; tone: Tone }> = {
  placed: { label: 'Nuevo', tone: 'amber' },
  confirmed: { label: 'Confirmado', tone: 'blue' },
  preparing: { label: 'Preparando', tone: 'blue' },
  out_for_delivery: { label: 'En camino', tone: 'orange' },
  delivered: { label: 'Entregado', tone: 'green' },
  cancelled: { label: 'Cancelado', tone: 'red' },
};

export const requestStatus: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Nueva', tone: 'amber' },
  contacted: { label: 'Contactado', tone: 'blue' },
  approved: { label: 'Aprobada', tone: 'green' },
  rejected: { label: 'Rechazada', tone: 'red' },
  withdrawn: { label: 'Retirada', tone: 'gray' },
};

export const listingStatus: Record<string, { label: string; tone: Tone }> = {
  draft: { label: 'Borrador', tone: 'gray' },
  published: { label: 'Publicada', tone: 'green' },
  reserved: { label: 'Reservada', tone: 'amber' },
  adopted: { label: 'Adoptada 🎉', tone: 'blue' },
  archived: { label: 'Archivada', tone: 'gray' },
};

export const paymentMethodLabel = { cash_on_delivery: 'Contra entrega', transfer: 'Transferencia', online: 'En línea' } as const;
export const paymentStatusLabel = { pending: 'Pago pendiente', paid: 'Pagado', refunded: 'Reembolsado' } as const;

// Siguiente paso del pedido según el modo de entrega
export function nextOrderStep(status: string, mode: 'pickup' | 'delivery'): { to: string; label: string } | null {
  switch (status) {
    case 'placed': return { to: 'confirmed', label: 'Confirmar pedido' };
    case 'confirmed': return { to: 'preparing', label: 'Empezar a preparar' };
    case 'preparing': return mode === 'delivery' ? { to: 'out_for_delivery', label: 'Enviar a domicilio' } : { to: 'delivered', label: 'Entregado en tienda' };
    case 'out_for_delivery': return { to: 'delivered', label: 'Marcar entregado' };
    default: return null;
  }
}
