import { z } from 'zod';
import { SubmitButton } from '@/components/SubmitButton';
import { Badge, Card, Empty, ErrorBanner, OkBanner, PageHeader, btnDanger, btnPrimary, btnSecondary, inputClass } from '@/components/ui';
import { AdminMember, AdminVet, MONTH_RE } from '@/lib/admin-schemas';
import { requireAdmin } from '@/lib/auth';
import { formatCOP } from '@/lib/format';
import { addMember, removeMember, setCommission, setVetStatus } from './actions';

const statusInfo = {
  pending: { label: 'Pendiente de aprobación', tone: 'amber' },
  active: { label: 'Activa', tone: 'green' },
  suspended: { label: 'Suspendida', tone: 'red' },
} as const;

const currentMonth = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 7); // hora Colombia

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ mes?: string; error?: string; ok?: string }> }) {
  const sp = await searchParams;
  const mes = sp.mes && MONTH_RE.test(sp.mes) ? sp.mes : currentMonth();
  const { supabase } = await requireAdmin();

  const [vetsRes, membersRes] = await Promise.all([
    supabase.rpc('admin_vet_summary', { p_month: `${mes}-01` }),
    supabase.rpc('admin_members'),
  ]);
  if (vetsRes.error) throw new Error(vetsRes.error.message);
  if (membersRes.error) throw new Error(membersRes.error.message);

  const order = { pending: 0, active: 1, suspended: 2 } as const;
  const vets = z.array(AdminVet).parse(vetsRes.data)
    .sort((a, b) => order[a.vet_status] - order[b.vet_status] || a.vet_name.localeCompare(b.vet_name));
  const members = z.array(AdminMember).parse(membersRes.data);

  const totals = vets.reduce(
    (t, v) => ({ orders: t.orders + v.delivered_orders, sales: t.sales + v.sales, commission: t.commission + v.commission }),
    { orders: 0, sales: 0, commission: 0 },
  );
  const pendingCount = vets.filter((v) => v.vet_status === 'pending').length;

  return (
    <>
      <PageHeader
        title="Veterinarias"
        subtitle="Aprueba aliados, define comisiones y gestiona su personal"
        action={
          <form method="get" className="flex items-end gap-2">
            <label className="text-xs text-muted">Mes del reporte
              <input type="month" name="mes" defaultValue={mes} className={`${inputClass} w-auto`} />
            </label>
            <button className={btnSecondary}>Ver</button>
          </form>
        }
      />
      <ErrorBanner message={sp.error} />
      <OkBanner message={sp.ok} />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card><div className="text-sm text-muted">Por aprobar</div><div className="text-2xl font-extrabold">{pendingCount}</div></Card>
        <Card><div className="text-sm text-muted">Pedidos entregados ({mes})</div><div className="text-2xl font-extrabold">{totals.orders}</div></Card>
        <Card><div className="text-sm text-muted">Ventas de aliados</div><div className="text-2xl font-extrabold">{formatCOP(totals.sales)}</div></Card>
        <Card><div className="text-sm text-muted">Comisión a cobrar</div><div className="text-2xl font-extrabold">{formatCOP(totals.commission)}</div></Card>
      </div>

      {!vets.length ? <Empty>Aún no hay veterinarias. Crea la primera desde “Nueva veterinaria”.</Empty> : (
        <div className="space-y-4">
          {vets.map((v) => {
            const st = statusInfo[v.vet_status];
            const vetMembers = members.filter((m) => m.m_vet_id === v.vet_id);
            return (
              <Card key={v.vet_id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-lg font-bold">{v.vet_name}</div>
                    <div className="text-sm text-muted">{v.city}{v.offers_home_visits ? ' · Visitas a domicilio' : ''}</div>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>

                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                  <div><div className="text-muted">Pedidos entregados</div><strong>{v.delivered_orders}</strong></div>
                  <div><div className="text-muted">Ventas</div><strong>{formatCOP(v.sales)}</strong></div>
                  <div><div className="text-muted">Comisión generada</div><strong>{formatCOP(v.commission)}</strong></div>
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
                  <form action={setCommission} className="flex items-end gap-2">
                    <input type="hidden" name="vet" value={v.vet_id} />
                    <input type="hidden" name="mes" value={mes} />
                    <label className="text-xs text-muted">Comisión (%)
                      <input name="rate" defaultValue={String(v.commission_rate)} inputMode="decimal" className={`${inputClass} w-24`} />
                    </label>
                    <SubmitButton className={btnSecondary}>Guardar</SubmitButton>
                  </form>
                  <form action={setVetStatus}>
                    <input type="hidden" name="vet" value={v.vet_id} />
                    <input type="hidden" name="mes" value={mes} />
                    {v.vet_status === 'active' ? (
                      <>
                        <input type="hidden" name="status" value="suspended" />
                        <SubmitButton className={btnDanger} confirm="¿Suspender esta veterinaria? Dejará de verse en la app.">Suspender</SubmitButton>
                      </>
                    ) : (
                      <>
                        <input type="hidden" name="status" value="active" />
                        <SubmitButton className={btnPrimary}>{v.vet_status === 'pending' ? 'Aprobar' : 'Reactivar'}</SubmitButton>
                      </>
                    )}
                  </form>
                </div>

                <div className="mt-4 border-t border-line pt-4">
                  <div className="mb-2 text-sm font-semibold">Personal con acceso al panel</div>
                  {!vetMembers.length ? <p className="text-sm text-muted">Nadie todavía.</p> : (
                    <ul className="space-y-1 text-sm">
                      {vetMembers.map((m) => (
                        <li key={m.m_user_id} className="flex items-center justify-between gap-2">
                          <span>{m.m_full_name || 'Sin nombre'} · {m.m_email} <Badge tone={m.m_role === 'owner' ? 'blue' : 'gray'}>{m.m_role === 'owner' ? 'Dueño' : 'Personal'}</Badge></span>
                          <form action={removeMember}>
                            <input type="hidden" name="vet" value={v.vet_id} />
                            <input type="hidden" name="user" value={m.m_user_id} />
                            <input type="hidden" name="mes" value={mes} />
                            <SubmitButton className="text-xs font-semibold text-red-600 underline" confirm={`¿Quitar a ${m.m_email}?`}>Quitar</SubmitButton>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form action={addMember} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="vet" value={v.vet_id} />
                    <input type="hidden" name="mes" value={mes} />
                    <label className="text-xs text-muted">Correo (con cuenta creada)
                      <input name="email" type="email" required className={`${inputClass} w-64`} />
                    </label>
                    <label className="text-xs text-muted">Rol
                      <select name="role" defaultValue="staff" className={`${inputClass} w-auto`}>
                        <option value="staff">Personal</option><option value="owner">Dueño</option>
                      </select>
                    </label>
                    <SubmitButton className={btnSecondary}>Agregar</SubmitButton>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
