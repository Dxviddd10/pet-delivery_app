import Link from 'next/link';
import { z } from 'zod';
import { SubmitButton } from '@/components/SubmitButton';
import { kindOptions } from '@/components/ProductForm';
import { Badge, Card, Empty, ErrorBanner, OkBanner, PageHeader, btnPrimary, btnSecondary, inputClass } from '@/components/ui';
import { requireVet } from '@/lib/auth';
import { ProductRow } from '@/lib/schemas';
import { quickUpdateProduct, toggleProduct } from './actions';

export default async function ProductosPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const sp = await searchParams;
  const { supabase, vet } = await requireVet();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, sku, description, price, stock, kind, is_active')
    .eq('vet_id', vet.id).order('name').limit(500);
  if (error) throw new Error(error.message);
  const products = z.array(ProductRow).parse(data);
  const kindLabel = Object.fromEntries(kindOptions.map((k) => [k.value, k.label.split(' (')[0]]));

  return (
    <>
      <PageHeader
        title="Productos"
        subtitle="Inventario de tu tienda. Los cambios se reflejan en la app al instante."
        action={
          <div className="flex gap-2">
            <Link href="/productos/importar" className={btnSecondary}>⬆️ Importar CSV</Link>
            <Link href="/productos/nuevo" className={btnPrimary}>➕ Nuevo producto</Link>
          </div>
        }
      />
      <ErrorBanner message={sp.error} />
      <OkBanner message={sp.ok} />

      {!products.length ? <Empty>Aún no tienes productos. Crea uno o importa tu inventario desde un CSV.</Empty> : (
        <div className="space-y-3">
          {products.map((p) => (
            <Card key={p.id} className={p.is_active ? '' : 'opacity-60'}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{p.name}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <Badge tone="blue">{kindLabel[p.kind]}</Badge>
                    {p.sku ? <Badge>{p.sku}</Badge> : null}
                    {p.stock <= 3 && p.is_active ? <Badge tone="amber">Poco stock</Badge> : null}
                    {!p.is_active ? <Badge tone="red">Oculto</Badge> : null}
                    {p.kind === 'rx_medicine' ? <Badge tone="amber">No visible en la app</Badge> : null}
                  </div>
                </div>
                <form action={quickUpdateProduct} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <label className="text-xs text-muted">Precio
                    <input name="price" type="number" min={0} step={100} defaultValue={p.price} className={`${inputClass} w-28`} />
                  </label>
                  <label className="text-xs text-muted">Stock
                    <input name="stock" type="number" min={0} defaultValue={p.stock} className={`${inputClass} w-20`} />
                  </label>
                  <SubmitButton className={btnSecondary}>Guardar</SubmitButton>
                </form>
                <div className="flex gap-2">
                  <Link href={`/productos/${p.id}`} className={btnSecondary}>Editar</Link>
                  <form action={toggleProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={String(!p.is_active)} />
                    <SubmitButton className={btnSecondary}>{p.is_active ? 'Ocultar' : 'Mostrar'}</SubmitButton>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
