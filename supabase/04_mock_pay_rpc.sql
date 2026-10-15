-- ============================================================
-- Pet Delivery · Simulador de pago (MODO PRUEBA)
-- Fase 3b: permite "pagar" un pedido sin pasarela real.
--
-- ¿Por qué una RPC y no un botón en la app?
--   El comprador NO tiene permiso para editar sus pedidos
--   (RLS: solo miembros de la veterinaria pueden actualizarlos),
--   así que el pago debe confirmarse con una función
--   SECURITY DEFINER, igual que lo haría un webhook real.
--
-- Seguridad: la función SOLO actúa sobre pedidos del propio
--   usuario y con payment_provider = 'mock'. En producción los
--   pedidos llevan 'wompi', por lo que esta RPC no puede usarse
--   para marcar pedidos reales como pagados.
--
-- Ejecutar DESPUÉS de 02_payouts_plan_a.sql y 03_add_mock_provider.sql.
-- Es idempotente: se puede re-ejecutar sin romper la base.
-- ============================================================

create or replace function mock_pay_order(
  p_order_id uuid,
  p_approve  boolean default true
) returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_order orders;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

  select * into v_order
    from orders
   where id = p_order_id
     and user_id = auth.uid()
     and payment_provider = 'mock';

  if not found then
    raise exception 'Pedido de prueba no encontrado';
  end if;

  -- Aprobar: marca el pedido como pagado e inserta el registro de pago.
  if p_approve and v_order.payment_status <> 'paid' then
    update orders
       set payment_status = 'paid', paid_at = now()
     where id = v_order.id
     returning * into v_order;

    if not exists (
      select 1 from payments where provider_ref = 'mock_' || v_order.id::text
    ) then
      insert into payments (payable_type, payable_id, provider, provider_ref,
                            amount, status, currency, raw_payload)
      values ('order', v_order.id, 'mock', 'mock_' || v_order.id::text,
              v_order.total, 'paid', 'COP',
              jsonb_build_object('simulated', true, 'action', 'approve'));
    end if;
  end if;

  return v_order;
end $$;

revoke all on function mock_pay_order(uuid, boolean) from public;
grant execute on function mock_pay_order(uuid, boolean) to authenticated;
