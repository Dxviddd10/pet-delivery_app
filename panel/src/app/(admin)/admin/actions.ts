'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { MONTH_RE } from '@/lib/admin-schemas';
import { failTo, requireAdmin } from '@/lib/auth';
import { Uuid } from '@/lib/schemas';

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
  }).safeParse({
    name: formData.get('name'), phone: String(formData.get('phone') ?? ''), address: String(formData.get('address') ?? ''),
    commission: formData.get('commission'), owner_email: String(formData.get('owner_email') ?? ''),
  });
  if (!parsed.success) failTo('/admin/nueva', parsed.error.issues[0]?.message ?? 'Datos inválidos');
  const { supabase } = await requireAdmin();
  const d = parsed.data;
  const { error } = await supabase.rpc('admin_create_vet', {
    p_name: d.name, p_phone: d.phone, p_address: d.address, p_commission: d.commission, p_owner_email: d.owner_email,
  });
  if (error) failTo('/admin/nueva', error.message);
  okTo('/admin', 'Veterinaria creada y activada');
}

export async function addMember(formData: FormData) {
  const back = backPath(formData);
  const parsed = z.object({
    vet: Uuid, email: z.string().trim().toLowerCase().email('Correo inválido'), role: z.enum(['owner', 'staff']),
  }).safeParse({ vet: formData.get('vet'), email: formData.get('email'), role: formData.get('role') });
  if (!parsed.success) failTo(back, parsed.error.issues[0]?.message ?? 'Datos inválidos');
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('admin_add_vet_member', {
    p_vet: parsed.data.vet, p_email: parsed.data.email, p_role: parsed.data.role,
  });
  if (error) failTo(back, error.message);
  okTo(back, 'Persona agregada a la veterinaria');
}

export async function removeMember(formData: FormData) {
  const back = backPath(formData);
  const parsed = z.object({ vet: Uuid, user: Uuid }).safeParse({ vet: formData.get('vet'), user: formData.get('user') });
  if (!parsed.success) failTo(back, 'Acción inválida');
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc('admin_remove_vet_member', { p_vet: parsed.data.vet, p_user: parsed.data.user });
  if (error) failTo(back, error.message);
  okTo(back, 'Persona quitada de la veterinaria');
}
