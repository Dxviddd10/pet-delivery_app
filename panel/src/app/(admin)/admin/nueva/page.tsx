import { SubmitButton } from '@/components/SubmitButton';
import { Card, ErrorBanner, Field, PageHeader, btnPrimary, inputClass } from '@/components/ui';
import { createVet } from '../actions';

export default async function NuevaVetPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <PageHeader title="Nueva veterinaria" subtitle="Se crea activa y visible en la app desde ese momento" />
      <ErrorBanner message={error} />
      <Card className="max-w-2xl">
        <form action={createVet} className="space-y-4">
          <Field label="Nombre"><input name="name" required maxLength={80} className={inputClass} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Teléfono"><input name="phone" maxLength={10} className={inputClass} /></Field>
            <Field label="Comisión (%)" hint="Sobre pedidos entregados. Puedes cambiarla después.">
              <input name="commission" defaultValue="5" required inputMode="decimal" className={inputClass} />
            </Field>
          </div>
          <Field label="Dirección"><input name="address" maxLength={160} className={inputClass} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Correo del dueño (opcional)" hint="Si no tiene cuenta creada, se registrará automáticamente.">
              <input name="owner_email" type="email" className={inputClass} placeholder="dueno@veterinaria.co" />
            </Field>
            <Field label="Contraseña temporal" hint="Mínimo 6 caracteres (ej: Pet123456*)">
              <input name="owner_password" type="password" minLength={6} className={inputClass} placeholder="Mínimo 6 caracteres (ej: Pet123456*)" />
            </Field>
          </div>
          <SubmitButton className={btnPrimary}>Crear veterinaria</SubmitButton>
        </form>
      </Card>
    </>
  );
}
