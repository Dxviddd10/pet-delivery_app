import Link from 'next/link';
import { z } from 'zod';
import { SubmitButton } from '@/components/SubmitButton';
import { Badge, Card, Empty, ErrorBanner, PageHeader, btnDanger, btnPrimary, btnSecondary, inputClass } from '@/components/ui';
import { requireVet } from '@/lib/auth';
import { formatCOP, formatDateTime, speciesLabel, toBogotaInput } from '@/lib/format';
import { AppointmentRow } from '@/lib/schemas';
import { apptStatus } from '@/lib/status';
import { updateAppointment } from './actions';

const FILTERS = [
  { key: 'activas', label: 'Activas' },
  { key: 'requested', label: 'Por confirmar' },
  { key: 'historial', label: 'Historial' },
] as const;

export default async function CitasPage({ searchParams }: { searchParams: Promise<{ estado?: string; error?: string }> }) {
  const sp = await searchParams;
  const filter = FILTERS.find((f) => f.key === sp.estado)?.key ?? 'activas';
  const { supabase, vet } = await requireVet();

  let q = supabase
    .from('appointments')
    .select('id, mode, scheduled_at, status, total, address, notes, profiles(full_name, phone), services(name), pets(name, species, breed)')
    .eq('vet_id', vet.id)
    .limit(100);
  if (filter === 'activas') q = q.in('status', ['requested', 'confirmed', 'rescheduled']).order('scheduled_at', { ascending: true });
  else if (filter === 'requested') q = q.eq('status', 'requested').order('scheduled_at', { ascending: true });
  else q = q.in('status', ['completed', 'cancelled', 'no_show']).order('scheduled_at', { ascending: false });

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const appts = z.array(AppointmentRow).parse(data);

  return (
    <>
      <PageHeader title="Citas" subtitle="Confirma, reprograma o cierra las citas de tus clientes" />
      <ErrorBanner message={sp.error} />
      <div className="mb-5 flex gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={`/citas?estado=${f.key}`} className={f.key === filter ? btnPrimary : btnSecondary}>{f.label}</Link>
        ))}
      </div>

      {!appts.length ? <Empty>No hay citas en esta vista.</Empty> : (
        <div className="space-y-4">
          {appts.map((a) => {
            const st = apptStatus[a.status];
            const open = ['requested', 'confirmed', 'rescheduled'].includes(a.status);
            return (
              <Card key={a.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-lg font-bold">{a.services?.name} · {a.pets?.name}</div>
                    <div className="text-sm text-muted">
                      {a.pets ? `${speciesLabel[a.pets.species as keyof typeof speciesLabel] ?? 'Mascota'}${a.pets.breed ? ' · ' + a.pets.breed : ''}` : ''}
                    </div>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>
                <div className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                  <div>🗓 <strong>{formatDateTime(a.scheduled_at)}</strong></div>
                  <div>{a.mode === 'home' ? '🏠 A domicilio' : '🏥 En la veterinaria'} · {formatCOP(a.total)}</div>
                  <div>👤 {a.profiles?.full_name || 'Cliente'}{a.profiles?.phone ? ` · ${a.profiles.phone}` : ''}</div>
                  {a.address ? <div>📍 {a.address}</div> : null}
                  {a.notes ? <div className="sm:col-span-2">📝 {a.notes}</div> : null}
                </div>
                {a.profiles?.phone ? (
                  <a className="mt-2 inline-block text-sm font-semibold text-brand-dark underline" target="_blank" rel="noreferrer"
                     href={`https://wa.me/57${a.profiles.phone.replace(/\D/g, '').replace(/^57/, '')}`}>Escribir por WhatsApp</a>
                ) : null}

                {open ? (
                  <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
                    {(a.status === 'requested' || a.status === 'rescheduled') ? (
                      <ActionForm id={a.id} intent="confirm" label="Confirmar" className={btnPrimary} />
                    ) : null}
                    {a.status === 'confirmed' ? (
                      <>
                        <ActionForm id={a.id} intent="complete" label="Marcar realizada" className={btnPrimary} />
                        <ActionForm id={a.id} intent="no_show" label="No asistió" className={btnSecondary} confirm="¿Marcar que el cliente no asistió?" />
                      </>
                    ) : null}
                    <form action={updateAppointment} className="flex items-end gap-2">
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="intent" value="reschedule" />
                      <input type="datetime-local" name="scheduled_at" required defaultValue={toBogotaInput(a.scheduled_at)} className={`${inputClass} w-auto`} />
                      <SubmitButton className={btnSecondary}>Reprogramar</SubmitButton>
                    </form>
                    <ActionForm id={a.id} intent="cancel" label="Cancelar" className={btnDanger} confirm="¿Cancelar esta cita?" />
                  </div>
                ) : null}
                {a.status === 'completed' || a.status === 'confirmed' ? (
                  <div className="mt-3"><ActionForm id={a.id} intent="paid" label="Marcar pago recibido" className={btnSecondary} /></div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function ActionForm({ id, intent, label, className, confirm }: { id: string; intent: string; label: string; className: string; confirm?: string }) {
  return (
    <form action={updateAppointment}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="intent" value={intent} />
      <SubmitButton className={className} confirm={confirm}>{label}</SubmitButton>
    </form>
  );
}
