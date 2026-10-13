import Link from 'next/link';
import { z } from 'zod';
import { SubmitButton } from '@/components/SubmitButton';
import { Badge, Card, Empty, ErrorBanner, PageHeader, btnDanger, btnPrimary, btnSecondary } from '@/components/ui';
import { requireVet } from '@/lib/auth';
import { formatCOP, formatDateTime } from '@/lib/format';
import { OrderRow } from '@/lib/schemas';
import { nextOrderStep, orderStatus, paymentMethodLabel, paymentStatusLabel } from '@/lib/status';
import { updateOrder } from './actions';

const FILTERS = [
  { key: 'activos', label: 'Activos' },
  { key: 'placed', label: 'Nuevos' },
  { key: 'historial', label: 'Historial' },
] as const;

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ estado?: string; error?: string }> }) {
  const sp = await searchParams;
  const filter = FILTERS.find((f) => f.key === sp.estado)?.key ?? 'activos';
  const { supabase, vet } = await requireVet();

  let q = supabase
    .from('orders')
    .select('id, status, delivery_mode, delivery_address, subtotal, delivery_fee, commission_amount, total, payment_method, payment_status, notes, created_at, profiles(full_name, phone), order_items(name, quantity, unit_price)')
    .eq('vet_id', vet.id)
    .order('created_at', { ascending: filter === 'activos' })
    .limit(100);
  if (filter === 'activos') q = q.in('status', ['placed', 'confirmed', 'preparing', 'out_for_delivery']);
  else if (filter === 'placed') q = q.eq('status', 'placed');
  else q = q.in('status', ['delivered', 'cancelled']);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const orders = z.array(OrderRow).parse(data);

  return (
    <>
      <PageHeader title="Pedidos" subtitle="Prepara y entrega los pedidos de tu tienda" />
      <ErrorBanner message={sp.error} />
      <div className="mb-5 flex gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={`/pedidos?estado=${f.key}`} className={f.key === filter ? btnPrimary : btnSecondary}>{f.label}</Link>
        ))}
      </div>

      {!orders.length ? <Empty>No hay pedidos en esta vista.</Empty> : (
        <div className="space-y-4">
          {orders.map((o) => {
            const st = orderStatus[o.status];
            const step = nextOrderStep(o.status, o.delivery_mode);
            const cancellable = ['placed', 'confirmed', 'preparing'].includes(o.status);
            return (
              <Card key={o.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-lg font-bold">Pedido #{o.id.slice(0, 8)}</div>
                    <div className="text-sm text-muted">{formatDateTime(o.created_at)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge tone={o.payment_status === 'paid' ? 'green' : 'amber'}>{paymentStatusLabel[o.payment_status]}</Badge>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                </div>

                <ul className="mt-3 text-sm">
                  {o.order_items.map((i, idx) => (
                    <li key={idx} className="flex justify-between border-b border-line/60 py-1">
                      <span>{i.quantity}× {i.name}</span><span>{formatCOP(i.unit_price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between text-sm"><span>Domicilio</span><span>{formatCOP(o.delivery_fee)}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span>{formatCOP(o.total)}</span></div>
                <div className="text-xs text-muted">Comisión Pet Delivery: {formatCOP(o.commission_amount)}</div>

                <div className="mt-3 grid gap-1 text-sm">
                  <div>👤 {o.profiles?.full_name || 'Cliente'}{o.profiles?.phone ? ` · ${o.profiles.phone}` : ''}</div>
                  <div>{o.delivery_mode === 'delivery' ? `🛵 Domicilio: ${o.delivery_address ?? ''}` : '🏪 Recoge en tienda'} · 💳 {paymentMethodLabel[o.payment_method]}</div>
                  {o.notes ? <div>📝 {o.notes}</div> : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  {step ? <Act id={o.id} intent="advance" label={step.label} className={btnPrimary} /> : null}
                  {o.payment_status === 'pending' && o.status !== 'cancelled' ? <Act id={o.id} intent="paid" label="Marcar pago recibido" className={btnSecondary} /> : null}
                  {cancellable ? <Act id={o.id} intent="cancel" label="Cancelar" className={btnDanger} confirm="¿Cancelar el pedido? Se devolverá el stock." /> : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function Act({ id, intent, label, className, confirm }: { id: string; intent: string; label: string; className: string; confirm?: string }) {
  return (
    <form action={updateOrder}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="intent" value={intent} />
      <SubmitButton className={className} confirm={confirm}>{label}</SubmitButton>
    </form>
  );
}
