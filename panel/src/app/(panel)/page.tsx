import Link from 'next/link';
import { Card, PageHeader } from '@/components/ui';
import { requireVet } from '@/lib/auth';
import { bogotaDayRange, bogotaMonthStart, formatCOP } from '@/lib/format';

export default async function DashboardPage() {
  const { supabase, vet } = await requireVet();
  const day = bogotaDayRange();
  const monthStart = bogotaMonthStart();

  const [today, pendingAppts, newOrders, pendingReqs, lowStock, monthOrders] = await Promise.all([
    supabase.from('appointments').select('id', { count: 'exact', head: true })
      .eq('vet_id', vet.id).in('status', ['requested', 'confirmed', 'rescheduled'])
      .gte('scheduled_at', day.start).lt('scheduled_at', day.end),
    supabase.from('appointments').select('id', { count: 'exact', head: true })
      .eq('vet_id', vet.id).eq('status', 'requested'),
    supabase.from('orders').select('id', { count: 'exact', head: true })
      .eq('vet_id', vet.id).eq('status', 'placed'),
    supabase.from('adoption_requests').select('id, adoption_listings!inner(vet_id)', { count: 'exact', head: true })
      .eq('adoption_listings.vet_id', vet.id).eq('status', 'pending'),
    supabase.from('products').select('id', { count: 'exact', head: true })
      .eq('vet_id', vet.id).eq('is_active', true).lte('stock', 3),
    supabase.from('orders').select('subtotal, commission_amount')
      .eq('vet_id', vet.id).eq('status', 'delivered').gte('created_at', monthStart),
  ]);

  const firstError = [today, pendingAppts, newOrders, pendingReqs, lowStock, monthOrders].find((r) => r.error)?.error;
  if (firstError) throw new Error(firstError.message);

  const rows = monthOrders.data ?? [];
  const sales = rows.reduce((n, r) => n + (r.subtotal as number), 0);
  const commission = rows.reduce((n, r) => n + (r.commission_amount as number), 0);

  const tiles = [
    { label: 'Citas de hoy', value: today.count ?? 0, href: '/citas', emoji: '📅' },
    { label: 'Citas por confirmar', value: pendingAppts.count ?? 0, href: '/citas?estado=requested', emoji: '⏳' },
    { label: 'Pedidos nuevos', value: newOrders.count ?? 0, href: '/pedidos?estado=placed', emoji: '📦' },
    { label: 'Solicitudes de adopción', value: pendingReqs.count ?? 0, href: '/adopciones?vista=solicitudes', emoji: '🐶' },
    { label: 'Productos con poco stock', value: lowStock.count ?? 0, href: '/productos', emoji: '⚠️' },
  ];

  return (
    <>
      <PageHeader title="Resumen" subtitle="Lo que necesita tu atención hoy" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href}>
            <Card className="h-full transition hover:border-brand">
              <div className="text-2xl">{t.emoji}</div>
              <div className="mt-2 text-3xl font-extrabold">{t.value}</div>
              <div className="text-sm text-muted">{t.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold">Este mes (pedidos entregados)</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><div className="text-sm text-muted">Pedidos entregados</div><div className="text-2xl font-extrabold">{rows.length}</div></Card>
        <Card><div className="text-sm text-muted">Ventas de productos</div><div className="text-2xl font-extrabold">{formatCOP(sales)}</div></Card>
        <Card>
          <div className="text-sm text-muted">Comisión para Pet Delivery ({vet.commission_rate}%)</div>
          <div className="text-2xl font-extrabold">{formatCOP(commission)}</div>
        </Card>
      </div>
    </>
  );
}
