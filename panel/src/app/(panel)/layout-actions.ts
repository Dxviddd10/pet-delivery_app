'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

/**
 * Permite a un usuario con múltiples veterinarias alternar entre sedes.
 * Guarda la veterinaria activa en una cookie HttpOnly.
 */
export async function switchActiveVet(formData: FormData) {
  const vetId = String(formData.get('vet_id') ?? '');
  if (!vetId) return;
  const cookieStore = await cookies();
  cookieStore.set('active_vet_id', vetId, { path: '/', httpOnly: true, sameSite: 'lax' });
  revalidatePath('/', 'layout');
  redirect('/');
}
