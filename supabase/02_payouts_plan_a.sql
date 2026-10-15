-- ============================================================
-- Pet Delivery · Plan A: Liquidaciones a veterinarias (por lotes)
-- Fase 1: estructura, RLS, RPCs y habilitar pago online.
--
-- Ejecutar DESPUÉS de schema.sql.
-- Es idempotente: se puede re-ejecutar sin romper la base.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabla de lotes de liquidación (payouts)
-- ------------------------------------------------------------
create table if not exists payout_batches (
  id             uuid primary key default gen_random_uuid(),
  created_by     uuid references profiles(id),
  vet_id         uuid not null references vets(id) on delete cascade,
  amount         integer not null check (amount >= 0),   -- neto transferido a la veterinaria
  status         text not null check (status in ('pending','completed','failed')) default 'pending',
  payout_method  text,
  reference      text,                                   -- comprobante / ID de transferencia
  notes          text,
  created_at     timestamptz not null default now(),
  completed_at   timestamptz
);

create index if not exists payout_batches_vet_idx    on payout_batches(vet_id, created_at desc);
create index if not exists payout_batches_status_idx on payout_batches(status);

-- ------------------------------------------------------------
-- 2. Campos de liquidación y trazabilidad de pago online en orders
-- ------------------------------------------------------------
alter table orders
  add column if not exists settled             boolean not null default false,
  add column if not exists settled_at          timestamptz,
  add column if not exists settlement_batch_id uuid references payout_batches(id) on delete set null,
  add column if not exists checkout_session_id text,
  add column if not exists payment_provider    text check (payment_provider in ('mercadopago','wompi','stripe','mock')),
  add column if not exists paid_at             timestamptz;

create index if not exists orders_settled_idx      on orders(settled, payment_status, status);
create index if not exists orders_paid_settled_idx on orders(payment_status, settled, vet_id, status);

-- ------------------------------------------------------------
-- 3. Datos de payout en vets (a dónde transferirle a cada veterinaria)
--    Solo datos de contacto/identificación, nunca credenciales.
-- ------------------------------------------------------------
alter table vets
  add column if not exists payout_method        text check (payout_method in ('bank_transfer','nequi','daviplata','mercadopago')),
  add column if not exists bank_name            text,
  add column if not exists bank_account_type    text check (bank_account_type in ('savings','checking','other')),
  add column if not exists bank_account_holder  text,
  add column if not exists bank_account_number  text,
  add column if not exists payout_alias         text,   -- celular / alias Nequi, Daviplata o MercadoPago
  add column if not exists payout_notes         text;

-- ------------------------------------------------------------
-- 4. Trazabilidad extra en payments
-- ------------------------------------------------------------
alter table payments
  add column if not exists currency   text default 'COP',
  add column if not exists fee_amount integer default 0;   -- comisión de pasarela, si se registra

-- ------------------------------------------------------------
-- 5. RLS de payout_batches
-- ------------------------------------------------------------
alter table payout_batches enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payout_batches' and policyname = 'payout_batches_admin_all') then
    create policy payout_batches_admin_all on payout_batches
      for all using (is_admin()) with check (is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payout_batches' and policyname = 'payout_batches_vet_select') then
    create policy payout_batches_vet_select on payout_batches
      for select using (is_vet_member(vet_id));
  end if;
end $$;

-- ------------------------------------------------------------
-- 6. Habilitar pago online en create_order
--    (idéntica a schema.sql pero SIN el bloqueo de 'online')
-- ------------------------------------------------------------
create or replace function create_order(
  p_vet_id uuid, p_items jsonb, p_delivery_mode delivery_mode,
  p_address text default null, p_payment_method payment_method default 'cash_on_delivery',
  p_notes text default null
) returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_vet vets; v_item jsonb; v_prod products; v_qty int;
  v_subtotal int := 0; v_fee int := 0; v_commission int; v_order orders;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  select * into v_vet from vets where id = p_vet_id and status = 'active';
  if not found then raise exception 'Veterinaria no disponible'; end if;

  if p_delivery_mode = 'delivery' then
    if coalesce(trim(p_address), '') = '' then raise exception 'Falta la dirección de entrega'; end if;
    v_fee := v_vet.delivery_fee;
  end if;

  insert into orders (user_id, vet_id, delivery_mode, delivery_address, subtotal, delivery_fee,
                      commission_amount, total, payment_method, notes)
  values (auth.uid(), p_vet_id, p_delivery_mode,
          case when p_delivery_mode = 'delivery' then trim(p_address) end,
          0, v_fee, 0, 0, p_payment_method, p_notes)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 then raise exception 'Cantidad inválida'; end if;

    select * into v_prod from products
     where id = (v_item ->> 'product_id')::uuid and vet_id = p_vet_id and is_active
     for update;
    if not found then raise exception 'Producto no disponible'; end if;
    if v_prod.kind = 'rx_medicine' or v_prod.requires_prescription then
      raise exception '% requiere fórmula médica; contacta a la veterinaria', v_prod.name;
    end if;
    if v_prod.stock < v_qty then raise exception 'Stock insuficiente de %', v_prod.name; end if;

    update products set stock = stock - v_qty where id = v_prod.id;
    insert into order_items (order_id, product_id, name, quantity, unit_price)
    values (v_order.id, v_prod.id, v_prod.name, v_qty, v_prod.price);
    v_subtotal := v_subtotal + v_prod.price * v_qty;
  end loop;

  v_commission := round(v_subtotal * v_vet.commission_rate / 100.0);

  update orders
     set subtotal = v_subtotal, commission_amount = v_commission, total = v_subtotal + v_fee
   where id = v_order.id
   returning * into v_order;

  return v_order;
end $$;

-- ------------------------------------------------------------
-- 7. RPC: crear lote de liquidación (solo admin)
--    Neto a transferir = (subtotal - commission_amount) + delivery_fee
--    Solo toma pedidos pagados, entregados y no liquidados.
-- ------------------------------------------------------------
create or replace function create_payout_batch(
  p_vet_id uuid,
  p_payout_method text default null,
  p_reference text default null,
  p_notes text default null
) returns payout_batches
language plpgsql security definer set search_path = public as $$
declare
  v_vet vets; v_batch payout_batches; v_total int := 0; v_cnt int := 0; v_method text;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if not is_admin() then raise exception 'Solo administradores pueden liquidar saldos'; end if;

  select * into v_vet from vets where id = p_vet_id and status = 'active';
  if not found then raise exception 'Veterinaria no disponible'; end if;

  v_method := coalesce(p_payout_method, v_vet.payout_method);

  select coalesce(sum((subtotal - commission_amount) + delivery_fee), 0), count(*)
    into v_total, v_cnt
    from orders
   where vet_id = p_vet_id
     and payment_status = 'paid'
     and settled = false
     and status in ('delivered');

  if v_cnt = 0 then
    raise exception 'No hay pedidos pendientes por liquidar para esta veterinaria';
  end if;

  insert into payout_batches (created_by, vet_id, amount, status, payout_method, reference, notes)
  values (auth.uid(), p_vet_id, v_total, 'completed', v_method, p_reference, p_notes)
  returning * into v_batch;

  update orders
     set settled = true, settled_at = now(), settlement_batch_id = v_batch.id
   where vet_id = p_vet_id
     and payment_status = 'paid'
     and settled = false
     and status in ('delivered');

  update payout_batches set completed_at = now() where id = v_batch.id returning * into v_batch;

  return v_batch;
end $$;

-- ------------------------------------------------------------
-- 8. RPC: saldo pendiente de UNA veterinaria (admin o miembro)
-- ------------------------------------------------------------
create or replace function get_vet_unsettled_balance(p_vet_id uuid)
returns table (
  total_orders int, subtotal_sum int, commission_sum int, delivery_fee_sum int, net_to_pay int
)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if not (is_admin() or is_vet_member(p_vet_id)) then raise exception 'No autorizado'; end if;

  return query
    select count(*)::int,
           coalesce(sum(subtotal), 0)::int,
           coalesce(sum(commission_amount), 0)::int,
           coalesce(sum(delivery_fee), 0)::int,
           coalesce(sum((subtotal - commission_amount) + delivery_fee), 0)::int
      from orders
     where vet_id = p_vet_id
       and payment_status = 'paid'
       and settled = false
       and status in ('delivered');
end $$;

-- ------------------------------------------------------------
-- 9. RPC: saldos pendientes de TODAS las veterinarias (solo admin)
-- ------------------------------------------------------------
create or replace function get_all_unsettled_balances()
returns table (
  vet_id uuid, vet_name text, payout_method text, total_orders int, net_to_pay int
)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if not is_admin() then raise exception 'No autorizado'; end if;

  return query
    select o.vet_id, v.name, v.payout_method, count(*)::int,
           coalesce(sum((o.subtotal - o.commission_amount) + o.delivery_fee), 0)::int
      from orders o
      join vets v on v.id = o.vet_id
     where o.payment_status = 'paid'
       and o.settled = false
       and o.status in ('delivered')
     group by o.vet_id, v.name, v.payout_method
    having coalesce(sum((o.subtotal - o.commission_amount) + o.delivery_fee), 0) > 0
     order by net_to_pay desc;
end $$;

-- ------------------------------------------------------------
-- 10. Permisos
-- ------------------------------------------------------------
revoke all on function create_order(uuid, jsonb, delivery_mode, text, payment_method, text) from public;
grant execute on function create_order(uuid, jsonb, delivery_mode, text, payment_method, text) to authenticated;

revoke all on function create_payout_batch(uuid, text, text, text) from public;
grant execute on function create_payout_batch(uuid, text, text, text) to authenticated;

revoke all on function get_vet_unsettled_balance(uuid) from public;
grant execute on function get_vet_unsettled_balance(uuid) to authenticated;

revoke all on function get_all_unsettled_balances() from public;
grant execute on function get_all_unsettled_balances() to authenticated;

grant select, insert, update, delete on payout_batches to authenticated;

-- El rol anónimo no debe tocar ninguna de estas estructuras
revoke insert, update, delete on payout_batches from anon;
