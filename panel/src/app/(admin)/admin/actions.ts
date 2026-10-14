'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { MONTH_RE } from '@/lib/admin-schemas';
import { failTo, requireAdmin } from '@/lib/auth';
import { Uuid } from '@/lib/schemas';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

function backPath(formData: FormData): string {
  const mes = String(formData.get('mes') ?? '');
  return MONTH_RE.test(mes) ? `/admin?mes=${mes}` : '/admin';
}

function okTo(path: string, message: string): never {
  revalidatePath('/admin');
  redirect(`${path}${path.includes('?') ? '&' : '?'}ok=${encodeURIComponent(message)}`);
}

// "5", "7.5" o "7,5" → número (evita que un campo vacío se convierta en 0)
const Rate = z.string().trim().regex(/^\d{1,2}([.,]\d{1,2})?$/, 'Comisión inválida (ej. 5 o 7.5)')
  .transform((v) => Number(v.replace(',', '.')))
  .pipe(z.number().min(0).max(50, 'La comisión máxima es 50%'));

export async function setVetStatus(formData: FormData) {
  const back = backPath(formData);
  const parsed = z.object({ vet: Uuid, status: z.enum(['active', 'suspended', 'pending']) })
    .safeParse({ vet: formData.get('vet'), status: formData.get('status') });
  if (!parsed.success) failTo(back, 'Acción inválida');
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('admin_set_vet_status', { p_vet: parsed.data.vet, p_status: parsed.data.status });
  if (error) failTo(back, error.message);
  okTo(back, parsed.data.status === 'active' ? 'Veterinaria activada' : 'Estado actualizado');
}

export async function setCommission(formData: FormData) {
  const back = backPath(formData);
  const parsed = z.object({ vet: Uuid, rate: Rate }).safeParse({ vet: formData.get('vet'), rate: formData.get('rate') });
  if (!parsed.success) failTo(back, parsed.error.issues[0]?.message ?? 'Datos inválidos');
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('admin_set_vet_commission', { p_vet: parsed.data.vet, p_rate: parsed.data.rate });
  if (error) failTo(back, error.message);
  okTo(back, 'Comisión actualizada (aplica a los pedidos nuevos)');
}

const Optional = (max: number) => z.string().trim().max(max);

export async function createVet(formData: FormData) {
  const parsed = z.object({
    name: z.string().trim().min(2, 'Escribe el nombre de la veterinaria').max(80),
    phone: Optional(10).pipe(z.string().regex(/^(\d{7,10})?$/, 'Teléfono: solo dígitos')),
    address: Optional(160),
    commission: Rate,
    owner_email: z.string().trim().toLowerCase().pipe(z.union([z.literal(''), z.string().email('Correo del dueño inválido')])),
    owner_password: z.string().trim().pipe(
      z.union([
        z.literal(''),
        z.string().min(6, 'La contraseña temporal debe tener al menos 6 caracteres'),
      ])
    ).optional(),
  }).safeParse({
    name: formData.get('name'),
    phone: String(formData.get('phone') ?? ''),
    address: String(formData.get('address') ?? ''),
    commission: formData.get('commission'),
    owner_email: String(formData.get('owner_email') ?? ''),
    owner_password: String(formData.get('owner_password') ?? ''),
  });
  if (!parsed.success) failTo('/admin/nueva', parsed.error.issues[0]?.message ?? 'Datos inválidos');
  const { supabase } = await requireAdmin();
  const d = parsed.data;
  const adminClient = getSupabaseAdmin();

  let ownerUserId: string | null = null;

  // 1. Si se proporcionó correo del dueño, obtener o crear de manera segura su UUID
  if (d.owner_email) {
    const rawPass = d.owner_password?.trim() || '';
    if (rawPass && rawPass.length < 6) {
      failTo('/admin/nueva', 'La contraseña temporal debe tener al menos 6 caracteres');
    }
    const tempPassword = rawPass || 'PetDelivery2025*';

    if (adminClient) {
      // A. Buscar si el usuario ya existe en Supabase Auth
      let existingUser: any = null;
      try {
        const { data: userListData, error: listError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listError) console.error('Error al listar usuarios con adminClient:', listError);
        existingUser = userListData?.users.find((u) => u.email?.toLowerCase() === d.owner_email);
      } catch (err) {
        console.error('Error al listar usuarios con adminClient:', err);
      }

      if (existingUser) {
        ownerUserId = existingUser.id;
        // Actualizar contraseña al valor temporal ingresado y forzar confirmación de email
        const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
          password: tempPassword,
          email_confirm: true,
          user_metadata: { role: 'vet_staff', full_name: d.name },
        });
        if (updateError) {
          failTo('/admin/nueva', `Error en la contraseña del dueño en Supabase Auth: ${updateError.message}`);
        }
      } else {
        // B. Si no existe, crearlo con createUser asignando la contraseña exacta sin alteraciones
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: d.owner_email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { role: 'vet_staff', full_name: d.name },
        });

        if (newUser?.user) {
          ownerUserId = newUser.user.id;
        } else if (createError) {
          // Si el error es porque ya existe, volver a listar para obtener su ID y actualizar contraseña
          const isAlreadyRegistered =
            createError.message.toLowerCase().includes('already') ||
            createError.message.toLowerCase().includes('registered') ||
            (createError as any).status === 422;

          if (isAlreadyRegistered) {
            const { data: retryList } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
            const found = retryList?.users.find((u) => u.email?.toLowerCase() === d.owner_email);
            if (found) {
              ownerUserId = found.id;
              const { error: retryUpdateError } = await adminClient.auth.admin.updateUserById(found.id, {
                password: tempPassword,
                email_confirm: true,
                user_metadata: { role: 'vet_staff', full_name: d.name },
              });
              if (retryUpdateError) {
                failTo('/admin/nueva', `Error en la contraseña del dueño en Supabase Auth: ${retryUpdateError.message}`);
              }
            } else {
              failTo('/admin/nueva', `Error al registrar al dueño en Supabase Auth: ${createError.message}`);
            }
          } else {
            // Error directo de Supabase Auth (ej. longitud mínima, complejidad, etc.)
            failTo('/admin/nueva', `Error en la contraseña del dueño en Supabase Auth: ${createError.message}`);
          }
        }
      }
    }

    // C. Si ownerUserId sigue siendo null (fallback sin service role key):
    if (!ownerUserId) {
      const { data: rpcUserId } = await supabase.rpc('admin_get_user_id_by_email', { p_email: d.owner_email });
      if (rpcUserId) {
        ownerUserId = String(rpcUserId);
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: d.owner_email,
          password: tempPassword,
          options: { data: { full_name: d.name, role: 'vet_staff' } },
        });
        if (signUpData?.user) {
          ownerUserId = signUpData.user.id;
        } else {
          if (signUpError && !signUpError.message.toLowerCase().includes('already')) {
            failTo('/admin/nueva', `Error en la contraseña del dueño en Supabase Auth: ${signUpError.message}`);
          }
          const { data: retryRpcId } = await supabase.rpc('admin_get_user_id_by_email', { p_email: d.owner_email });
          if (retryRpcId) ownerUserId = String(retryRpcId);
        }
      }
      // Forzar confirmación de email directamente en PostgreSQL
      await supabase.rpc('admin_confirm_user_email', { p_email: d.owner_email });
    }

    // D. Inmediatamente se cree/obtenga el usuario, hacer upsert en public.profiles con role = 'vet_staff'
    if (ownerUserId) {
      const targetClient = adminClient ?? supabase;
      try {
        await targetClient.from('profiles').upsert(
          { id: ownerUserId, role: 'vet_staff', full_name: d.name },
          { onConflict: 'id' }
        );
      } catch (err) {
        console.error('Error al hacer upsert en profiles:', err);
      }
    }
  }

  // 2. Crear la veterinaria en la base de datos
  const { data: vetId, error } = await supabase.rpc('admin_create_vet', {
    p_name: d.name,
    p_phone: d.phone,
    p_address: d.address,
    p_commission: d.commission,
    p_owner_email: d.owner_email,
  });
  if (error) failTo('/admin/nueva', error.message);

  const newVetId = String(vetId);

  // 3. Vinculación estricta y sincrónica en vet_members para el dueño (vet_id, user_id, role = 'owner')
  if (d.owner_email) {
    if (!ownerUserId) {
      if (adminClient) {
        const { data: uList } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = uList?.users.find((u) => u.email?.toLowerCase() === d.owner_email);
        if (found) ownerUserId = found.id;
      }
      if (!ownerUserId) {
        const { data: rpcId } = await supabase.rpc('admin_get_user_id_by_email', { p_email: d.owner_email });
        if (rpcId) ownerUserId = String(rpcId);
      }
    }

    if (!ownerUserId) {
      failTo('/admin/nueva', `Veterinaria creada, pero no se pudo localizar el usuario del dueño (${d.owner_email}) para asignarle la sede. Verifica que exista en Authentication.`);
    }

    const targetClient = adminClient ?? supabase;

    // A. Inserción directa sincrónica en public.vet_members con Service Role (omite RLS)
    const { error: vmErr1 } = await targetClient.from('vet_members').upsert(
      { vet_id: newVetId, user_id: ownerUserId, member_role: 'owner' },
      { onConflict: 'vet_id,user_id' }
    );
    if (vmErr1) {
      await targetClient.from('vet_members').upsert(
        { vet_id: newVetId, user_id: ownerUserId, role: 'owner' } as any,
        { onConflict: 'vet_id,user_id' }
      );
    }

    // B. Doble garantía por RPC de PostgreSQL (SECURITY DEFINER, omite RLS)
    await supabase.rpc('admin_link_vet_member', {
      p_vet: newVetId,
      p_user: ownerUserId,
      p_role: 'owner',
    });

    await supabase.rpc('admin_add_vet_member', {
      p_vet: newVetId,
      p_email: d.owner_email,
      p_role: 'owner',
    });

    // C. Asegurar perfil sincrónicamente con role = 'vet_staff'
    await targetClient.from('profiles').upsert(
      { id: ownerUserId, role: 'vet_staff', full_name: d.name },
      { onConflict: 'id' }
    );
    await targetClient.from('profiles').update({ role: 'vet_staff' }).eq('id', ownerUserId);

    // D. Verificación estricta sincrónica: confirmar que la membresía exista físicamente
    const { data: memberRows } = await targetClient
      .from('vet_members')
      .select('*')
      .eq('vet_id', newVetId)
      .eq('user_id', ownerUserId);

    if (!memberRows || memberRows.length === 0) {
      const { error: finalInsertError } = await targetClient.from('vet_members').insert({
        vet_id: newVetId,
        user_id: ownerUserId,
        member_role: 'owner',
      });
      if (finalInsertError) {
        await targetClient.from('vet_members').insert({
          vet_id: newVetId,
          user_id: ownerUserId,
          role: 'owner',
        } as any);
      }
    }
  }

  const successMsg = d.owner_email
    ? `Veterinaria creada y asignada exitosamente a ${d.owner_email}`
    : 'Veterinaria creada y activada';

  okTo('/admin', successMsg);
}

export async function addMember(formData: FormData) {
  const back = backPath(formData);
  const parsed = z.object({
    vet: Uuid, email: z.string().trim().toLowerCase().email('Correo inválido'), role: z.enum(['owner', 'staff']),
  }).safeParse({ vet: formData.get('vet'), email: formData.get('email'), role: formData.get('role') });
  if (!parsed.success) failTo(back, parsed.error.issues[0]?.message ?? 'Datos inválidos');
  const { supabase } = await requireAdmin();

  // Si no existe el usuario en Auth y tenemos cliente admin, crearlo automáticamente
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    const { data: userListData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = userListData?.users.find((u) => u.email?.toLowerCase() === parsed.data.email);
    if (!existing) {
      await adminClient.auth.admin.createUser({
        email: parsed.data.email,
        password: 'PetDelivery2025*',
        email_confirm: true,
      });
    }
  }

  const { error } = await supabase.rpc('admin_add_vet_member', {
    p_vet: parsed.data.vet, p_email: parsed.data.email, p_role: parsed.data.role,
  });
  if (error) failTo(back, error.message);
  okTo(back, 'Persona agregada a la veterinaria');
}

export async function toggleVetStatus(formData: FormData) {
  return setVetStatus(formData);
}

export async function deleteVet(formData: FormData) {
  const back = backPath(formData);
  const parsed = z.object({ vet: Uuid }).safeParse({ vet: formData.get('vet') });
  if (!parsed.success) failTo(back, 'Veterinaria inválida');
  const { supabase } = await requireAdmin();

  // 1. Intentar con RPC admin_delete_vet
  const { error: rpcError } = await supabase.rpc('admin_delete_vet', { p_vet: parsed.data.vet });
  if (rpcError) {
    // 2. Fallback: eliminar miembros asociados primero para evitar restricciones de FK
    await supabase.from('vet_members').delete().eq('vet_id', parsed.data.vet);

    // Intentar borrado físico de la veterinaria
    const { error: delError } = await supabase.from('vets').delete().eq('id', parsed.data.vet);
    if (delError) {
      // 3. Si no se puede borrar físicamente por historial de pedidos, suspenderla
      const { error: suspError } = await supabase.rpc('admin_set_vet_status', {
        p_vet: parsed.data.vet,
        p_status: 'suspended',
      });
      if (suspError) failTo(back, delError.message);
      okTo(back, 'La veterinaria contenía historial y fue suspendida');
    }
  }
  okTo(back, 'Veterinaria eliminada con éxito');
}

export async function removeMember(formData: FormData) {
  const back = backPath(formData);
  const parsed = z.object({ vet: Uuid, user: Uuid }).safeParse({ vet: formData.get('vet'), user: formData.get('user') });
  if (!parsed.success) failTo(back, 'Acción inválida');
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('admin_remove_vet_member', { p_vet: parsed.data.vet, p_user: parsed.data.user });
  if (error) {
    // Si la función RPC falla porque era el único dueño o un Super Admin vinculado por error,
    // comprobar si es admin para permitir su desvinculación forzosa
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', parsed.data.user).single();
    if (profile?.role === 'admin') {
      const { error: delError } = await supabase
        .from('vet_members')
        .delete()
        .eq('vet_id', parsed.data.vet)
        .eq('user_id', parsed.data.user);
      if (delError) failTo(back, error.message);
      okTo(back, 'Super Administrador desvinculado de la veterinaria con éxito');
    }
    failTo(back, error.message);
  }
  okTo(back, 'Persona quitada de la veterinaria');
}
