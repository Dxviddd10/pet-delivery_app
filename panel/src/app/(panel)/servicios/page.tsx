import { z } from 'zod';
import { SubmitButton } from '@/components/SubmitButton';
import { Card, Empty, ErrorBanner, Field, OkBanner, PageHeader, btnPrimary, btnSecondary, inputClass } from '@/components/ui';
import { requireVet } from '@/lib/auth';
import { ServiceRow } from '@/lib/schemas';
import { saveService } from './actions';

export default async function ServiciosPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const sp = await searchParams;
  const { supabase, vet } = await requireVet();
  const { data, error } = await supabase
    .from('services').select('id, name, category, duration_min, price, home_available, is_active')
    .eq('vet_id', vet.id).order('name');
  if (error) throw new Error(error.message);
  const services = z.array(ServiceRow).parse(data);

  return (
    <>
      <PageHeader title="Servicios" subtitle="Lo que tus clientes pueden agendar desde la app" />
      <ErrorBanner message={sp.error} />
      <OkBanner message={sp.ok} />

      <Card className="mb-6">
        <h2 className="mb-3 font-bold">Agregar servicio</h2>
        <form action={saveService} className="grid items-end gap-3 sm:grid-cols-6">
          <div className="sm:col-span-2"><Field label="Nombre"><input name="name" required maxLength={80} className={inputClass} /></Field></div>
          <Field label="Categoría"><input name="category" maxLength={40} placeholder="consulta" className={inputClass} /></Field>
          <Field label="Duración (min)"><input name="duration_min" type="number" min={5} max={480} defaultValue={30} required className={inputClass} /></Field>
          <Field label="Precio (COP)"><input name="price" type="number" min={0} step={1000} required className={inputClass} /></Field>
          <div className="space-y-2">
            {vet.offers_home_visits ? (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="home_available" /> A domicilio</label>
            ) : null}
            <SubmitButton className={btnPrimary}>Agregar</SubmitButton>
          </div>
        </form>
        {!vet.offers_home_visits ? (
          <p className="mt-2 text-xs text-muted">Activa “Visitas a domicilio” en Ajustes para ofrecer servicios a domicilio.</p>
        ) : null}
      </Card>

      {!services.length ? <Empty>Aún no tienes servicios publicados.</Empty> : (
        <div className="space-y-3">
          {services.map((s) => (
            <Card key={s.id} className={s.is_active ? '' : 'opacity-60'}>
              <form action={saveService} className="grid items-end gap-3 sm:grid-cols-6">
                <input type="hidden" name="id" value={s.id} />
                <div className="sm:col-span-2"><Field label="Nombre"><input name="name" required defaultValue={s.name} maxLength={80} className={inputClass} /></Field></div>
                <Field label="Categoría"><input name="category" defaultValue={s.category ?? ''} maxLength={40} className={inputClass} /></Field>
                <Field label="Duración (min)"><input name="duration_min" type="number" min={5} max={480} defaultValue={s.duration_min} required className={inputClass} /></Field>
                <Field label="Precio (COP)"><input name="price" type="number" min={0} step={1000} defaultValue={s.price} required className={inputClass} /></Field>
                <div className="space-y-2">
                  {vet.offers_home_visits ? (
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="home_available" defaultChecked={s.home_available} /> A domicilio</label>
                  ) : null}
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={s.is_active} /> Activo</label>
                  <SubmitButton className={btnSecondary}>Guardar</SubmitButton>
                </div>
              </form>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
