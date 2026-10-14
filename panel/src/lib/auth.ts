import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
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

  let rawMembers: any = null;
  const { data, error } = await supabase
    .from('vet_members')
    .select(`member_role, vets(${VET_COLUMNS})`)
    .eq('user_id', auth.user.id);

  if (!error && data && data.length > 0) {
    rawMembers = data;
  } else {
    // Si la consulta vino vacía con el cliente del usuario, consultar con Service Role si está disponible
    const adminClient = getSupabaseAdmin();
    if (adminClient) {
      const { data: adminData } = await adminClient
        .from('vet_members')
        .select(`member_role, vets(${VET_COLUMNS})`)
        .eq('user_id', auth.user.id);
      if (adminData && adminData.length > 0) {
        rawMembers = adminData;
      }
    }

    // Fallback: si en la BD la columna se llama 'role' en lugar de 'member_role'
    if (!rawMembers || rawMembers.length === 0) {
      const client = getSupabaseAdmin() ?? supabase;
      const { data: altData } = await client
        .from('vet_members')
        .select(`role, vets(${VET_COLUMNS})`)
        .eq('user_id', auth.user.id);
      if (altData && altData.length > 0) {
        rawMembers = altData.map((r: any) => ({ ...r, member_role: r.role }));
      }
    }
  }

  const validRows = (rawMembers ?? []).filter((r: any) => r && r.vets);
  const memberships = z
    .array(z.object({ member_role: z.enum(['owner', 'staff']), vets: VetRow }))
    .parse(validRows);

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

/** ¿El usuario actual es administrador de la plataforma? Valida RPC is_admin() y directamente profiles.role = 'admin' */
export async function isAdminUser(supabase: Supabase): Promise<boolean> {
  const { data: rpcData, error } = await supabase.rpc('is_admin');
  if (!error && typeof rpcData === 'boolean') {
    return rpcData;
  }
  // Validación directa en profiles.role = 'admin'
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .single();
  return profile?.role === 'admin';
}

/**
 * Guardián dedicado para /admin.
 * Exige sesión activa y valida directamente profiles.role = 'admin'.
 * Totalmente independiente de vet_members (no requiere pertenecer a una veterinaria ni elegir sede).
 * Si no es admin: redirige a '/' si tiene veterinaria asociada, o a '/sin-acceso'.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login');

  const isAdmin = await isAdminUser(supabase);
  if (!isAdmin) {
    const { count } = await supabase
      .from('vet_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.user.id);
    if (count && count > 0) {
      redirect('/');
    }
    redirect('/sin-acceso');
  }

  return { supabase, user: auth.user };
}
