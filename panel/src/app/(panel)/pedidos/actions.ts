'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { failTo, requireVet } from '@/lib/auth';
import { Uuid } from '@/lib/schemas';
import { nextOrderStep } from '@/lib/status';

const Input = z.object({ id: Uuid, intent: z.enum(['advance', 'cancel', 'paid']) });

export async function updateOrder(formData: FormData) {
  const parsed = Input.safeParse({ id: formData.get('id'), intent: formData.get('intent') });
  if (!parsed.success) failTo('/pedidos', 'Acción inválida');
  const { id, intent } = parsed.data;
  const { supabase, vet } = await requireVet();

  const { data: order, error } = await supabase
    .from('orders').select('status, delivery_mode').eq('id', id).eq('vet_id', vet.id).single();
  if (error || !order) failTo('/pedidos', 'No encontramos ese pedido');

  let patch: Record<string, unknown>;
  if (intent === 'paid') {
    patch = { payment_status: 'paid' };
  } else if (intent === 'cancel') {
    if (!['placed', 'confirmed', 'preparing'].includes(order.status as string)) failTo('/pedidos', 'Este pedido ya no se puede cancelar');
    patch = { status: 'cancelled' }; // un trigger en la BD devuelve el stock
  } else {
    const step = nextOrderStep(order.status as string, order.delivery_mode as 'pickup' | 'delivery');
    if (!step) failTo('/pedidos', 'Este pedido ya está cerrado');
    patch = { status: step.to };
  }

  let upd = supabase.from('orders').update(patch).eq('id', id).eq('vet_id', vet.id);
  if (intent !== 'paid') upd = upd.eq('status', order.status as string); // evita pisar cambios concurrentes
  const { error: updErr } = await upd;
  if (updErr) failTo('/pedidos', updErr.message);

  revalidatePath('/pedidos');
  revalidatePath('/');
}
