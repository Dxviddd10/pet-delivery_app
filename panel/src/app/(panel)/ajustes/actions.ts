'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { failTo, requireVet } from '@/lib/auth';

const optional = (max: number) => z.string().trim().max(max).transform((v) => (v === '' ? null : v));

const Input = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre de la veterinaria').max(80),
  description: optional(500),
  phone: z.string().trim().regex(/^(\d{7,10})?$/, 'Teléfono: solo dígitos').transform((v) => (v === '' ? null : v)),
  whatsapp: z.string().trim().regex(/^(57\d{10})?$/, 'WhatsApp con indicativo, ej. 573101234567').transform((v) => (v === '' ? null : v)),
  address: optional(160),
  home_fee: z.coerce.number().int().min(0).max(500_000),
  delivery_fee: z.coerce.number().int().min(0).max(500_000),
});

export async function saveSettings(formData: FormData) {
  const g = (k: string) => String(formData.get(k) ?? '');
  const parsed = Input.safeParse({
    name: g('name'), description: g('description'), phone: g('phone'), whatsapp: g('whatsapp'),
    address: g('address'), home_fee: g('home_fee') || '0', delivery_fee: g('delivery_fee') || '0',
  });
  if (!parsed.success) failTo('/ajustes', parsed.error.issues[0]?.message ?? 'Datos inválidos');
  const { supabase, vet, role } = await requireVet();
  if (role !== 'owner') failTo('/ajustes', 'Solo el dueño de la veterinaria puede cambiar los ajustes');

  const { error } = await supabase.from('vets')
    .update({ ...parsed.data, offers_home_visits: formData.get('offers_home_visits') === 'on' })
    .eq('id', vet.id);
  if (error) failTo('/ajustes', error.message);
  revalidatePath('/', 'layout');
  redirect('/ajustes?ok=' + encodeURIComponent('Ajustes guardados'));
}
