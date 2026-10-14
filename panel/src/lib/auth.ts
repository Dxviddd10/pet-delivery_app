import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { VetRow } from '@/lib/schemas';
import { z } from 'zod';

const VET_COLUMNS =
  'id, name, description, phone, whatsapp, address, offers_home_visits, home_fee, delivery_fee, commission_rate, status';

export type VetMembership = {
  role: 'owner' | 'staff';
  vet: VetRow;
};

/**
 * Exige sesión y pertenencia a una veterinaria. Devuelve el cliente de Supabase (con la sesión
 * del usuario, así que RLS sigue aplicando) y la veterinaria activa.
 * Soporta multi-sede: respeta la sede seleccionada en la cookie 'active_vet_id' o toma la primera.
 */
export async function requireVet() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');

  const { data, error } = await supabase
    .from('vet_members')
    .select(`member_role, vets(${VET_COLUMNS})`)
    .eq('user_id', auth.user.id);
  if (error) throw new Error(error.message);

  const memberships = z
    .array(z.object({ member_role: z.enum(['owner', 'staff']), vets: VetRow }))
    .parse(data);

  if (!memberships.length) {
    redirect((await isAdminUser(supabase)) ? '/admin' : '/sin-acceso');
  }

  // Leer la sede activa de la cookie si el usuario pertenece a más de una clínica
  const cookieStore = await cookies();
  const activeVetId = cookieStore.get('active_vet_id')?.value;
  const current = memberships.find((m) => m.vets.id === activeVetId) ?? memberships[0];

  return {
    supabase,
    user: auth.user,
    vet: current.vets,
    role: current.member_role,
    memberships: memberships.map((m) => ({ role: m.member_role, vet: m.vets })),
  };
}

/** Redirige a `path` con un mensaje de error en la URL (patrón para Server Actions sin JS de cliente). */
export function failTo(path: string, message: string): never {
  const sep = path.includes('?') ? '&' : '?';
  redirect(`${path}${sep}error=${encodeURIComponent(message)}`);
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** ¿El usuario actual es administrador de la plataforma? (la función is_admin() vive en la BD) */
export async function isAdminUser(supabase: Supabase): Promise<boolean> {
  const { data } = await supabase.rpc('is_admin');
  return data === true;
}

/** Exige sesión y rol de administrador; si no, vuelve al inicio. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');
  if (!(await isAdminUser(supabase))) redirect('/');
  return { supabase, user: auth.user };
}
