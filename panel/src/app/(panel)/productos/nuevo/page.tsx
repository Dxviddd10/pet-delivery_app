import { ErrorBanner, PageHeader } from '@/components/ui';
import { ProductForm } from '@/components/ProductForm';
import { createProduct } from '../actions';

export default async function NuevoProductoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <PageHeader title="Nuevo producto" />
      <ErrorBanner message={error} />
      <ProductForm action={createProduct} />
    </>
  );
}
