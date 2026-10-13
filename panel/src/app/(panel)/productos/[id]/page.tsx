import { notFound } from 'next/navigation';
import { ErrorBanner, PageHeader } from '@/components/ui';
import { ProductForm } from '@/components/ProductForm';
import { requireVet } from '@/lib/auth';
import { ProductRow, Uuid } from '@/lib/schemas';
import { updateProduct } from '../actions';

export default async function EditarProductoPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  if (!Uuid.safeParse(id).success) notFound();
  const { supabase, vet } = await requireVet();
  const { data } = await supabase
    .from('products').select('id, name, brand, sku, description, price, stock, kind, is_active')
    .eq('id', id).eq('vet_id', vet.id).maybeSingle();
  if (!data) notFound();
  const product = ProductRow.parse(data);
  return (
    <>
      <PageHeader title={`Editar: ${product.name}`} />
      <ErrorBanner message={error} />
      <ProductForm action={updateProduct} product={product} />
    </>
  );
}
