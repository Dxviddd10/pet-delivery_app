'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { failTo, requireVet } from '@/lib/auth';
import { Uuid } from '@/lib/schemas';

const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((v) => (v === '' ? null : v));

const ListingInput = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre').max(40),
  species: z.enum(['dog', 'cat', 'other']),
  breed: optionalText(60),
  sex: z.enum(['male', 'female', '']).transform((v) => (v === '' ? null : v)),
  age_months: z.string().trim().transform((v) => (v === '' ? null : Number(v))).pipe(z.number().int().min(0).max(300).nullable()),
  size: z.enum(['small', 'medium', 'large', '']).transform((v) => (v === '' ? null : v)),
  description: optionalText(600),
  temperament: optionalText(120),
  status: z.enum(['draft', 'published', 'reserved', 'adopted', 'archived']),
});

function readFields(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? '');
  return ListingInput.safeParse({
    name: get('name'), species: get('species'), breed: get('breed'), sex: get('sex'),
    age_months: get('age_months'), size: get('size'), description: get('description'),
    temperament: get('temperament'), status: get('status'),
  });
}

async function uploadPhotos(
  supabase: Awaited<ReturnType<typeof requireVet>>['supabase'],
  vetId: string,
  files: File[],
  room: number,
): Promise<string[]> {
  const real = files.filter((f) => f.size > 0);
  if (real.length > room) throw new Error(`Máximo ${MAX_PHOTOS} fotos por mascota`);
  const urls: string[] = [];
  for (const file of real) {
    const ext = EXT[file.type];
    if (!ext) throw new Error('Solo se aceptan imágenes JPG, PNG o WebP');
    if (file.size > MAX_BYTES) throw new Error('Cada foto debe pesar máximo 5 MB');
    const path = `${vetId}/${randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('pet-photos').upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
    urls.push(supabase.storage.from('pet-photos').getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

export async function createListing(formData: FormData) {
  const parsed = readFields(formData);
  if (!parsed.success) failTo('/adopciones/nueva', parsed.error.issues[0]?.message ?? 'Datos inválidos');
  const { supabase, vet } = await requireVet();

  let photos: string[] = [];
  try {
    photos = await uploadPhotos(supabase, vet.id, formData.getAll('photos').filter((f): f is File => f instanceof File), MAX_PHOTOS);
  } catch (e) {
    failTo('/adopciones/nueva', e instanceof Error ? e.message : 'Error subiendo fotos');
  }

  const d = parsed.data;
  const { error } = await supabase.from('adoption_listings').insert({
    vet_id: vet.id,
    ...d,
    vaccinated: formData.get('vaccinated') === 'on',
    sterilized: formData.get('sterilized') === 'on',
    dewormed: formData.get('dewormed') === 'on',
    photos,
    published_at: d.status === 'published' ? new Date().toISOString() : null,
  });
  if (error) failTo('/adopciones/nueva', error.message);
  revalidatePath('/adopciones');
  redirect('/adopciones');
}

export async function updateListing(formData: FormData) {
  const id = Uuid.safeParse(formData.get('id'));
  if (!id.success) failTo('/adopciones', 'Mascota inválida');
  const back = `/adopciones/${id.data}`;
  const parsed = readFields(formData);
  if (!parsed.success) failTo(back, parsed.error.issues[0]?.message ?? 'Datos inválidos');
  const { supabase, vet } = await requireVet();

  const { data: current, error: curErr } = await supabase
    .from('adoption_listings').select('photos, status, published_at').eq('id', id.data).eq('vet_id', vet.id).single();
  if (curErr || !current) failTo('/adopciones', 'No encontramos esa mascota');

  const remove = new Set(formData.getAll('remove_photo').map(String));
  const kept = (current.photos as string[]).filter((u) => !remove.has(u));

  let added: string[] = [];
  try {
    added = await uploadPhotos(supabase, vet.id, formData.getAll('photos').filter((f): f is File => f instanceof File), MAX_PHOTOS - kept.length);
  } catch (e) {
    failTo(back, e instanceof Error ? e.message : 'Error subiendo fotos');
  }

  const d = parsed.data;
  const becamePublished = d.status === 'published' && !current.published_at;
  const { error } = await supabase.from('adoption_listings').update({
    ...d,
    vaccinated: formData.get('vaccinated') === 'on',
    sterilized: formData.get('sterilized') === 'on',
    dewormed: formData.get('dewormed') === 'on',
    photos: [...kept, ...added],
    ...(becamePublished ? { published_at: new Date().toISOString() } : {}),
  }).eq('id', id.data).eq('vet_id', vet.id);
  if (error) failTo(back, error.message);

  // Borra del almacenamiento las fotos quitadas (solo las de nuestro bucket y nuestra carpeta)
  const prefix = `/storage/v1/object/public/pet-photos/${vet.id}/`;
  const paths = [...remove].filter((u) => u.includes(prefix)).map((u) => u.split('/pet-photos/')[1]);
  if (paths.length) await supabase.storage.from('pet-photos').remove(paths);

  revalidatePath('/adopciones');
  redirect('/adopciones');
}

const RequestInput = z.object({
  id: Uuid,
  intent: z.enum(['contacted', 'approved', 'rejected']),
  vet_notes: z.string().trim().max(500).optional(),
});

export async function updateRequest(formData: FormData) {
  const back = '/adopciones?vista=solicitudes';
  const parsed = RequestInput.safeParse({
    id: formData.get('id'), intent: formData.get('intent'), vet_notes: String(formData.get('vet_notes') ?? ''),
  });
  if (!parsed.success) failTo(back, 'Acción inválida');
  const { id, intent, vet_notes } = parsed.data;
  const { supabase, vet } = await requireVet();

  const { data: req, error: reqErr } = await supabase
    .from('adoption_requests').select('listing_id, status, adoption_listings!inner(vet_id)')
    .eq('id', id).eq('adoption_listings.vet_id', vet.id).single();
  if (reqErr || !req) failTo(back, 'No encontramos esa solicitud');
  if (['approved', 'rejected', 'withdrawn'].includes(req.status as string)) failTo(back, 'Esta solicitud ya está cerrada');

  const { error } = await supabase.from('adoption_requests')
    .update({ status: intent, ...(vet_notes ? { vet_notes } : {}) }).eq('id', id);
  if (error) failTo(back, error.message);

  if (intent === 'approved') {
    // Reserva la mascota para que deje de aparecer en el feed
    const { error: lErr } = await supabase.from('adoption_listings')
      .update({ status: 'reserved' }).eq('id', req.listing_id as string).eq('vet_id', vet.id);
    if (lErr) failTo(back, lErr.message);
  }
  revalidatePath('/adopciones');
  revalidatePath('/');
}

export async function setListingStatus(formData: FormData) {
  const id = Uuid.safeParse(formData.get('id'));
  const status = z.enum(['published', 'adopted', 'archived']).safeParse(formData.get('status'));
  if (!id.success || !status.success) failTo('/adopciones', 'Acción inválida');
  const { supabase, vet } = await requireVet();
  const { error } = await supabase.from('adoption_listings')
    .update({ status: status.data, ...(status.data === 'published' ? { published_at: new Date().toISOString() } : {}) })
    .eq('id', id.data).eq('vet_id', vet.id);
  if (error) failTo('/adopciones', error.message);
  revalidatePath('/adopciones');
}
