'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { failTo, requireVet } from '@/lib/auth';
import { Uuid } from '@/lib/schemas';

const ServiceInput = z.object({
  id: Uuid.optional(),
  name: z.string().trim().min(1, 'Escribe el nombre del servicio').max(80),
  category: z.string().trim().max(40).transform((v) => (v === '' ? null : v)),
  duration_min: z.coerce.number().int().min(5, 'Mínimo 5 minutos').max(480),
  price: z.coerce.number().int('El precio debe ser entero').min(0).max(50_000_000),
});

export async function saveService(formData: FormData) {
  const rawId = String(formData.get('id') ?? '');
  const parsed = ServiceInput.safeParse({
    id: rawId === '' ? undefined : rawId,
    name: formData.get('name'), category: String(formData.get('category') ?? ''),
    duration_min: formData.get('duration_min'), price: formData.get('price'),
  });
  if (!parsed.success) failTo('/servicios', parsed.error.issues[0]?.message ?? 'Datos inválidos');
  const { supabase, vet } = await requireVet();
  const { id, ...fields } = parsed.data;

  const row = {
    ...fields,
    // No ofrecer domicilio si la veterinaria no lo tiene activado en Ajustes
    home_available: vet.offers_home_visits && formData.get('home_available') === 'on',
    is_active: id ? formData.get('is_active') === 'on' : true,
  };

  const { error } = id
    ? await supabase.from('services').update(row).eq('id', id).eq('vet_id', vet.id)
    : await supabase.from('services').insert({ ...row, vet_id: vet.id });
  if (error) failTo('/servicios', error.message);
  revalidatePath('/servicios');
  redirect('/servicios?ok=' + encodeURIComponent('Servicio guardado'));
}
