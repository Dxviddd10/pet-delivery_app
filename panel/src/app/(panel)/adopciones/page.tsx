import Link from 'next/link';
import { z } from 'zod';
import { SubmitButton } from '@/components/SubmitButton';
import { Badge, Card, Empty, ErrorBanner, PageHeader, btnPrimary, btnSecondary, inputClass } from '@/components/ui';
import { requireVet } from '@/lib/auth';
import { formatDate, speciesLabel } from '@/lib/format';
import { ListingRow, RequestRow } from '@/lib/schemas';
import { listingStatus, requestStatus } from '@/lib/status';
import { setListingStatus, updateRequest } from './actions';

export default async function AdopcionesPage({ searchParams }: { searchParams: Promise<{ vista?: string; error?: string }> }) {
  const sp = await searchParams;
  const view = sp.vista === 'solicitudes' ? 'solicitudes' : 'mascotas';
  const { supabase, vet } = await requireVet();

  return (
    <>
      <PageHeader
        title="Adopciones"
        subtitle="Publica mascotas y gestiona a quienes quieren adoptarlas"
        action={<Link href="/adopciones/nueva" className={btnPrimary}>➕ Nueva mascota</Link>}
      />
      <ErrorBanner message={sp.error} />
      <div className="mb-5 flex gap-2">
        <Link href="/adopciones" className={view === 'mascotas' ? btnPrimary : btnSecondary}>Mis mascotas</Link>
        <Link href="/adopciones?vista=solicitudes" className={view === 'solicitudes' ? btnPrimary : btnSecondary}>Solicitudes</Link>
      </div>
      {view === 'mascotas' ? <Listings supabase={supabase} vetId={vet.id} /> : <Requests supabase={supabase} vetId={vet.id} />}
    </>
  );
}

type Sb = Awaited<ReturnType<typeof requireVet>>['supabase'];

async function Listings({ supabase, vetId }: { supabase: Sb; vetId: string }) {
  const { data, error } = await supabase
    .from('adoption_listings')
    .select('id, name, species, breed, sex, age_months, size, description, temperament, vaccinated, sterilized, dewormed, photos, status')
    .eq('vet_id', vetId).neq('status', 'archived').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  const listings = z.array(ListingRow).parse(data);
  if (!listings.length) return <Empty>Aún no has publicado mascotas. ¡Crea la primera!</Empty>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {listings.map((l) => {
        const st = listingStatus[l.status];
        return (
          <Card key={l.id} className="overflow-hidden !p-0">
            {l.photos[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.photos[0]} alt={`Foto de ${l.name}`} className="h-48 w-full object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center bg-orange-50 text-6xl">{l.species === 'cat' ? '🐱' : '🐶'}</div>
            )}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold">{l.name}</div>
                <Badge tone={st.tone}>{st.label}</Badge>
              </div>
              <div className="text-sm text-muted">{speciesLabel[l.species]}{l.breed ? ` · ${l.breed}` : ''}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/adopciones/${l.id}`} className={btnSecondary}>Editar</Link>
                {l.status === 'draft' ? <StatusBtn id={l.id} status="published" label="Publicar" primary /> : null}
                {l.status === 'reserved' ? <StatusBtn id={l.id} status="adopted" label="Marcar adoptada" primary /> : null}
                {l.status !== 'adopted' ? <StatusBtn id={l.id} status="archived" label="Archivar" confirm="¿Archivar esta mascota?" /> : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function StatusBtn({ id, status, label, primary, confirm }: { id: string; status: string; label: string; primary?: boolean; confirm?: string }) {
  return (
    <form action={setListingStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={primary ? btnPrimary : btnSecondary} confirm={confirm}>{label}</SubmitButton>
    </form>
  );
}

async function Requests({ supabase, vetId }: { supabase: Sb; vetId: string }) {
  const { data, error } = await supabase
    .from('adoption_requests')
    .select('id, status, message, housing_type, has_other_pets, has_children, vet_notes, created_at, listing_id, profiles(full_name, phone), adoption_listings!inner(name, vet_id)')
    .eq('adoption_listings.vet_id', vetId)
    .order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  const requests = z.array(RequestRow).parse(data);
  if (!requests.length) return <Empty>Todavía no tienes solicitudes de adopción.</Empty>;

  return (
    <div className="space-y-4">
      {requests.map((r) => {
        const st = requestStatus[r.status];
        const open = r.status === 'pending' || r.status === 'contacted';
        return (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-lg font-bold">{r.profiles?.full_name || 'Interesado'} quiere adoptar a {r.adoption_listings?.name}</div>
                <div className="text-sm text-muted">{formatDate(r.created_at)}{r.profiles?.phone ? ` · ${r.profiles.phone}` : ''}</div>
              </div>
              <Badge tone={st.tone}>{st.label}</Badge>
            </div>
            <div className="mt-3 text-sm">
              <div>🏠 {r.housing_type ?? 'Sin dato'} · {r.has_other_pets ? 'Tiene otras mascotas' : 'Sin otras mascotas'} · {r.has_children ? 'Hay niños' : 'Sin niños'}</div>
              {r.message ? <p className="mt-2 rounded-xl bg-orange-50 p-3">“{r.message}”</p> : null}
              {r.vet_notes ? <p className="mt-2 text-muted">Nota interna: {r.vet_notes}</p> : null}
            </div>
            {r.profiles?.phone ? (
              <a className="mt-2 inline-block text-sm font-semibold text-brand-dark underline" target="_blank" rel="noreferrer"
                 href={`https://wa.me/57${r.profiles.phone.replace(/\D/g, '').replace(/^57/, '')}`}>Escribir por WhatsApp</a>
            ) : null}
            {open ? (
              <form action={updateRequest} className="mt-4 space-y-3 border-t border-line pt-4">
                <input type="hidden" name="id" value={r.id} />
                <input name="vet_notes" maxLength={500} placeholder="Nota interna (opcional)" className={inputClass} />
                <div className="flex flex-wrap gap-2">
                  {r.status === 'pending' ? <button name="intent" value="contacted" className={btnSecondary}>Marcar contactado</button> : null}
                  <button name="intent" value="approved" className={btnPrimary}>Aprobar y reservar</button>
                  <button name="intent" value="rejected" className={btnSecondary}>Rechazar</button>
                </div>
              </form>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
