import { Field, btnPrimary, inputClass } from '@/components/ui';
import { SubmitButton } from '@/components/SubmitButton';
import type { ProductRow } from '@/lib/schemas';

export const kindOptions = [
  { value: 'food', label: 'Alimento' },
  { value: 'accessory', label: 'Accesorio' },
  { value: 'otc_medicine', label: 'Medicamento de venta libre' },
  { value: 'rx_medicine', label: 'Medicamento con fórmula (no se vende en la app aún)' },
] as const;

export function ProductForm({ action, product }: { action: (f: FormData) => Promise<void>; product?: ProductRow }) {
  const p = product;
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-white p-6">
      {p ? <input type="hidden" name="id" value={p.id} /> : null}
      <Field label="Nombre">
        <input name="name" required maxLength={120} defaultValue={p?.name} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Marca (opcional)"><input name="brand" maxLength={60} defaultValue={p?.brand ?? ''} className={inputClass} /></Field>
        <Field label="SKU / código (opcional)"><input name="sku" maxLength={40} defaultValue={p?.sku ?? ''} className={inputClass} /></Field>
        <Field label="Precio (COP)"><input name="price" type="number" min={0} step={100} required defaultValue={p?.price} className={inputClass} /></Field>
        <Field label="Stock (unidades)"><input name="stock" type="number" min={0} required defaultValue={p?.stock ?? 0} className={inputClass} /></Field>
      </div>
      <Field label="Tipo">
        <select name="kind" defaultValue={p?.kind ?? 'food'} className={inputClass}>
          {kindOptions.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
      </Field>
      <Field label="Descripción (opcional)">
        <textarea name="description" rows={3} maxLength={500} defaultValue={p?.description ?? ''} className={inputClass} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={p?.is_active ?? true} /> Visible en la tienda
      </label>
      <SubmitButton className={btnPrimary}>{p ? 'Guardar cambios' : 'Crear producto'}</SubmitButton>
    </form>
  );
}
