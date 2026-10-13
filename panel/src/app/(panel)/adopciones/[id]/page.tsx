import { notFound } from 'next/navigation';
import { ErrorBanner, PageHeader } from '@/components/ui';
import { ListingForm } from '@/components/ListingForm';
import { requireVet } from '@/lib/auth';
import { ListingRow, Uuid } from '@/lib/schemas';
import { updateListing } from '../actions';

export default async function EditarMascotaPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  if (!Uuid.safeParse(id).success) notFound();

  const { supabase, vet } = await requireVet();
  const { data } = await supabase
    .from('adoption_listings')
    .select('id, name, species, breed, sex, age_months, size, description, temperament, vaccinated, sterilized, dewormed, photos, status')
    .eq('id', id).eq('vet_id', vet.id).maybeSingle();
  if (!data) notFound();
  const listing = ListingRow.parse(data);

  return (
    <>
      <PageHeader title={`Editar a ${listing.name}`} />
      <ErrorBanner message={error} />
      <ListingForm action={updateListing} listing={listing} />
    </>
  );
}
