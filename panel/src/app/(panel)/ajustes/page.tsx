import { SubmitButton } from '@/components/SubmitButton';
import { Card, ErrorBanner, Field, OkBanner, PageHeader, btnPrimary, inputClass } from '@/components/ui';
import { requireVet } from '@/lib/auth';
import { saveSettings } from './actions';

export default async function AjustesPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const sp = await searchParams;
  const { vet, role } = await requireVet();
  const readOnly = role !== 'owner';

  return (
    <>
      <PageHeader title="Ajustes de la veterinaria" subtitle="Esta información la ven tus clientes en la app" />
      <ErrorBanner message={sp.error} />
      <OkBanner message={sp.ok} />
      {readOnly ? <p className="mb-4 text-sm text-muted">Solo el dueño puede editar estos datos.</p> : null}

      <Card className="max-w-3xl">
        <form action={saveSettings} className="space-y-4">
          <fieldset disabled={readOnly} className="space-y-4">
            <Field label="Nombre"><input name="name" required defaultValue={vet.name} maxLength={80} className={inputClass} /></Field>
            <Field label="Descripción"><textarea name="description" rows={3} defaultValue={vet.description ?? ''} maxLength={500} className={inputClass} /></Field>
            <Field label="Dirección"><input name="address" defaultValue={vet.address ?? ''} maxLength={160} className={inputClass} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono"><input name="phone" defaultValue={vet.phone ?? ''} className={inputClass} /></Field>
              <Field label="WhatsApp" hint="Con indicativo de país, ej. 573101234567">
                <input name="whatsapp" defaultValue={vet.whatsapp ?? ''} className={inputClass} />
              </Field>
              <Field label="Recargo por visita a domicilio (COP)">
                <input name="home_fee" type="number" min={0} step={1000} defaultValue={vet.home_fee} className={inputClass} />
              </Field>
              <Field label="Costo de domicilio de productos (COP)">
                <input name="delivery_fee" type="number" min={0} step={1000} defaultValue={vet.delivery_fee} className={inputClass} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="offers_home_visits" defaultChecked={vet.offers_home_visits} /> Ofrezco visitas veterinarias a domicilio
            </label>
          </fieldset>
          {!readOnly ? <SubmitButton className={btnPrimary}>Guardar ajustes</SubmitButton> : null}
        </form>
      </Card>

      <Card className="mt-6 max-w-3xl">
        <h2 className="font-bold">Condiciones comerciales</h2>
        <p className="mt-1 text-sm text-muted">
          Comisión sobre pedidos entregados: <strong>{vet.commission_rate}%</strong>. Estado de la cuenta: <strong>{vet.status === 'active' ? 'Activa' : vet.status === 'pending' ? 'Pendiente de aprobación' : 'Suspendida'}</strong>.
          Para modificarlas, contacta a Pet Delivery.
        </p>
      </Card>
    </>
  );
}
