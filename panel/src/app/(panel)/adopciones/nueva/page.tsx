import { ErrorBanner, PageHeader } from '@/components/ui';
import { ListingForm } from '@/components/ListingForm';
import { createListing } from '../actions';

export default async function NuevaMascotaPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <PageHeader title="Nueva mascota en adopción" subtitle="Guárdala como borrador o publícala para que aparezca en la app" />
      <ErrorBanner message={error} />
      <ListingForm action={createListing} />
    </>
  );
}
