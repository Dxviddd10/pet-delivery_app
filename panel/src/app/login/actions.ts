'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/auth';

const Schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(6) });

export async function signIn(formData: FormData) {
  const parsed = Schema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) redirect('/login?error=' + encodeURIComponent('Revisa tu correo y contraseña'));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    const isUnconfirmed = error.message.toLowerCase().includes('confirm') || error.message.toLowerCase().includes('verified');
    const msg = isUnconfirmed
      ? 'Tu cuenta está pendiente de confirmación de correo. Contacta al administrador.'
      : 'Correo o contraseña incorrectos';
    redirect('/login?error=' + encodeURIComponent(msg));
  }

  // Redirección inteligente:
  // 1. profiles.role = 'admin' -> /admin
  // 2. vet_members > 0 o profiles.role = 'vet_staff' -> / (Panel de Veterinaria)
  // 3. Ninguna de las anteriores -> /sin-acceso
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user) {
    if (await isAdminUser(supabase)) {
      redirect('/admin');
    }

    const { count } = await supabase
      .from('vet_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.user.id);

    const adminClient = getSupabaseAdmin();
    let hasMembership = (count ?? 0) > 0;

    if (!hasMembership && adminClient) {
      const { count: adminCount } = await adminClient
        .from('vet_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.user.id);
      if (adminCount && adminCount > 0) {
        hasMembership = true;
      }
    }

    if (hasMembership) {
      redirect('/');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle();

    let userRole = profile?.role;
    if (!userRole && adminClient) {
      const { data: adminProf } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', auth.user.id)
        .maybeSingle();
      userRole = adminProf?.role;
    }

    if (userRole === 'vet_staff') {
      redirect('/');
    }

    redirect('/sin-acceso');
  }

  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
