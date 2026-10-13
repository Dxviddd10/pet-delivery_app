'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { failTo, requireVet } from '@/lib/auth';
import { fromBogotaInput } from '@/lib/format';
import { Uuid } from '@/lib/schemas';

const Input = z.object({
  id: Uuid,
  intent: z.enum(['confirm', 'complete', 'no_show', 'cancel', 'reschedule', 'paid']),
});

const ALLOWED: Record<string, string[]> = {
  confirm: ['requested', 'rescheduled'],
  reschedule: ['requested', 'confirmed', 'rescheduled'],
  complete: ['confirmed'],
  no_show: ['confirmed'],
  cancel: ['requested', 'confirmed', 'rescheduled'],
};
const TARGET: Record<string, string> = {
  confirm: 'confirmed', reschedule: 'rescheduled', complete: 'completed', no_show: 'no_show', cancel: 'cancelled',
};

export async function updateAppointment(formData: FormData) {
  const parsed = Input.safeParse({ id: formData.get('id'), intent: formData.get('intent') });
  if (!parsed.success) failTo('/citas', 'Acción inválida');
  const { id, intent } = parsed.data;
  const { supabase, vet } = await requireVet();

  const { data: current, error } = await supabase
    .from('appointments').select('status, payment_status').eq('id', id).eq('vet_id', vet.id).single();
  if (error || !current) failTo('/citas', 'No encontramos esa cita');

  if (intent === 'paid') {
    const { error: e } = await supabase.from('appointments').update({ payment_status: 'paid' }).eq('id', id).eq('vet_id', vet.id);
    if (e) failTo('/citas', e.message);
    revalidatePath('/citas');
    return;
  }

  if (!ALLOWED[intent].includes(current.status as string)) failTo('/citas', 'Esa cita ya cambió de estado. Actualiza la página.');

  const patch: Record<string, unknown> = { status: TARGET[intent] };
  if (intent === 'reschedule') {
    const when = fromBogotaInput(String(formData.get('scheduled_at') ?? ''));
    if (!when || when.getTime() < Date.now()) failTo('/citas', 'Elige una fecha y hora futura para reprogramar');
    patch.scheduled_at = when.toISOString();
  }
  if (intent === 'cancel') patch.cancel_reason = 'Cancelada por la veterinaria';

  const { error: updErr } = await supabase
    .from('appointments').update(patch).eq('id', id).eq('vet_id', vet.id).eq('status', current.status);
  if (updErr) failTo('/citas', updErr.message);
  revalidatePath('/citas');
  revalidatePath('/');
}
