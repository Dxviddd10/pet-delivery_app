-- ============================================================
-- Pet Delivery · Esquema MVP (PostgreSQL / Supabase)
-- Ejecutar completo en Supabase > SQL Editor.
-- Precios en pesos colombianos (COP), enteros.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type user_role          as enum ('adopter', 'vet_staff', 'admin');
create type vet_status         as enum ('pending', 'active', 'suspended');
create type species_type       as enum ('dog', 'cat', 'other');
create type pet_sex            as enum ('male', 'female');
create type pet_size           as enum ('small', 'medium', 'large');
create type listing_status     as enum ('draft', 'published', 'reserved', 'adopted', 'archived');
create type swipe_action       as enum ('like', 'pass');
create type request_status     as enum ('pending', 'contacted', 'approved', 'rejected', 'withdrawn');
create type appointment_mode   as enum ('in_clinic', 'home');
create type appointment_status as enum ('requested', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show');
create type product_kind       as enum ('food', 'accessory', 'otc_medicine', 'rx_medicine');
create type order_status       as enum ('placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
create type delivery_mode      as enum ('pickup', 'delivery');
create type payment_method     as enum ('cash_on_delivery', 'transfer', 'online');
create type payment_status     as enum ('pending', 'paid', 'refunded');

-- ---------- Tablas ----------
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'adopter',
  full_name   text not null default '',
  phone       text,
  avatar_url  text,
  city        text not null default 'Tunja',
  push_token  text,
  created_at  timestamptz not null default now()
);

create table vets (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  legal_name         text,
  nit                text,
  description        text,
  logo_url           text,
  cover_url          text,
  phone              text,
  whatsapp           text,
  address            text,
  lat                double precision,
  lng                double precision,
  city               text not null default 'Tunja',
  status             vet_status not null default 'pending',
  plan               text not null default 'founder',
  commission_rate    numeric(5,2) not null default 0,   -- % sobre pedidos entregados
  offers_home_visits boolean not null default false,
  home_fee           integer not null default 0,        -- recargo por cita a domicilio
  delivery_fee       integer not null default 0,        -- domicilio de productos
  created_at         timestamptz not null default now()
);

create table vet_members (
  vet_id      uuid not null references vets(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  member_role text not null default 'staff' check (member_role in ('owner', 'staff')),
  primary key (vet_id, user_id)
);

create table vet_hours (
  vet_id     uuid not null references vets(id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6),
  open_time  time not null,
  close_time time not null,
  primary key (vet_id, weekday)
);

create table pets (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references profiles(id) on delete cascade,
  name       text not null,
  species    species_type not null,
  breed      text,
  sex        pet_sex,
  birth_date date,
  weight_kg  numeric(5,2),
  photo_url  text,
  notes      text,
  created_at timestamptz not null default now()
);
create index pets_owner_idx on pets(owner_id);

create table adoption_listings (
  id           uuid primary key default gen_random_uuid(),
  vet_id       uuid not null references vets(id) on delete cascade,
  name         text not null,
  species      species_type not null,
  breed        text,
  sex          pet_sex,
  age_months   integer,
  size         pet_size,
  description  text,
  temperament  text,
  vaccinated   boolean not null default false,
  sterilized   boolean not null default false,
  dewormed     boolean not null default false,
  photos       text[] not null default '{}',
  status       listing_status not null default 'draft',
  published_at timestamptz,
  created_at   timestamptz not null default now()
);
create index listings_feed_idx on adoption_listings(status, species);

create table adoption_swipes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  listing_id uuid not null references adoption_listings(id) on delete cascade,
  action     swipe_action not null,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

create table adoption_requests (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references adoption_listings(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  message         text,
  housing_type    text,
  has_other_pets  boolean not null default false,
  has_children    boolean not null default false,
  status          request_status not null default 'pending',
  vet_notes       text,
  created_at      timestamptz not null default now(),
  unique (listing_id, user_id)
);

create table services (
  id             uuid primary key default gen_random_uuid(),
  vet_id         uuid not null references vets(id) on delete cascade,
  name           text not null,
  category       text,
  duration_min   integer not null default 30,
  price          integer not null check (price >= 0),
  home_available boolean not null default false,
  is_active      boolean not null default true
);
create index services_vet_idx on services(vet_id);

create table appointments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  vet_id         uuid not null references vets(id) on delete cascade,
  pet_id         uuid not null references pets(id) on delete cascade,
  service_id     uuid not null references services(id),
  mode           appointment_mode not null,
  scheduled_at   timestamptz not null,
  duration_min   integer not null,
  address        text,                       -- solo para citas a domicilio
  status         appointment_status not null default 'requested',
  price          integer not null,
  home_fee       integer not null default 0,
  total          integer not null,
  payment_status payment_status not null default 'pending',
  notes          text,
  cancel_reason  text,
  created_at     timestamptz not null default now()
);
create index appointments_vet_idx  on appointments(vet_id, scheduled_at);
create index appointments_user_idx on appointments(user_id, scheduled_at desc);

create table product_categories (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  parent_id uuid references product_categories(id)
);

create table products (
  id                   uuid primary key default gen_random_uuid(),
  vet_id               uuid not null references vets(id) on delete cascade,
  category_id          uuid references product_categories(id),
  name                 text not null,
  description          text,
  brand                text,
  sku                  text,
  price                integer not null check (price >= 0),
  stock                integer not null default 0 check (stock >= 0),
  images               text[] not null default '{}',
  kind                 product_kind not null default 'food',
  requires_prescription boolean not null default false,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);
create index products_vet_idx on products(vet_id, is_active);

create table orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  vet_id            uuid not null references vets(id) on delete cascade,
  status            order_status not null default 'placed',
  delivery_mode     delivery_mode not null,
  delivery_address  text,
  subtotal          integer not null,
  delivery_fee      integer not null default 0,
  commission_amount integer not null default 0,
  total             integer not null,
  payment_method    payment_method not null,
  payment_status    payment_status not null default 'pending',
  prescription_url  text,
  notes             text,
  created_at        timestamptz not null default now()
);
create index orders_user_idx on orders(user_id, created_at desc);
create index orders_vet_idx  on orders(vet_id, created_at desc);

create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  name       text not null,              -- nombre congelado
  quantity   integer not null check (quantity > 0),
  unit_price integer not null            -- precio congelado
);
create index order_items_order_idx on order_items(order_id);

create table payments (
  id           uuid primary key default gen_random_uuid(),
  payable_type text not null check (payable_type in ('order', 'appointment')),
  payable_id   uuid not null,
  provider     text,
  provider_ref text,
  amount       integer not null,
  status       payment_status not null default 'pending',
  raw_payload  jsonb,
  created_at   timestamptz not null default now()
);

-- ---------- Funciones auxiliares ----------
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_vet_member(p_vet uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from vet_members where vet_id = p_vet and user_id = auth.uid());
$$;

-- Crea el perfil automáticamente al registrarse
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          new.raw_user_meta_data ->> 'phone');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- RPC: feed de adopción (excluye lo ya deslizado) ----------
create or replace function get_adoption_feed(p_species species_type default null, p_limit int default 30)
returns table (
  id uuid, vet_id uuid, vet_name text, name text, species species_type, breed text,
  sex pet_sex, age_months int, size pet_size, description text, temperament text,
  vaccinated boolean, sterilized boolean, dewormed boolean, photos text[]
)
language sql stable security invoker set search_path = public as $$
  select l.id, l.vet_id, v.name, l.name, l.species, l.breed, l.sex, l.age_months, l.size,
         l.description, l.temperament, l.vaccinated, l.sterilized, l.dewormed, l.photos
  from adoption_listings l
  join vets v on v.id = l.vet_id and v.status = 'active'
  where l.status = 'published'
    and (p_species is null or l.species = p_species)
    and not exists (
      select 1 from adoption_swipes s where s.listing_id = l.id and s.user_id = auth.uid()
    )
  order by l.published_at desc nulls last
  limit p_limit;
$$;

-- ---------- RPC: solicitar cita (precios calculados en servidor) ----------
create or replace function request_appointment(
  p_vet_id uuid, p_service_id uuid, p_pet_id uuid, p_mode appointment_mode,
  p_scheduled_at timestamptz, p_address text default null, p_notes text default null
) returns appointments
language plpgsql security definer set search_path = public as $$
declare
  v_vet vets; v_service services; v_row appointments; v_fee int := 0;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

  select * into v_vet from vets where id = p_vet_id and status = 'active';
  if not found then raise exception 'Veterinaria no disponible'; end if;

  select * into v_service from services
   where id = p_service_id and vet_id = p_vet_id and is_active;
  if not found then raise exception 'Servicio no disponible'; end if;

  if not exists (select 1 from pets where id = p_pet_id and owner_id = auth.uid()) then
    raise exception 'Mascota inválida';
  end if;

  if p_scheduled_at < now() + interval '1 hour' then
    raise exception 'La cita debe ser al menos 1 hora a futuro';
  end if;

  if p_mode = 'home' then
    if not (v_vet.offers_home_visits and v_service.home_available) then
      raise exception 'Este servicio no está disponible a domicilio';
    end if;
    if coalesce(trim(p_address), '') = '' then
      raise exception 'Falta la dirección para la visita a domicilio';
    end if;
    v_fee := v_vet.home_fee;
  end if;

  insert into appointments (user_id, vet_id, pet_id, service_id, mode, scheduled_at,
                            duration_min, address, price, home_fee, total, notes)
  values (auth.uid(), p_vet_id, p_service_id, p_pet_id, p_mode, p_scheduled_at,
          v_service.duration_min,
          case when p_mode = 'home' then trim(p_address) end,
          v_service.price, v_fee, v_service.price + v_fee, p_notes)
  returning * into v_row;

  return v_row;
end $$;

-- ---------- RPC: crear pedido (valida stock y precios en servidor) ----------
-- p_items: [{"product_id": "...", "quantity": 2}, ...]  (todos de la misma veterinaria)
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
  if p_payment_method = 'online' then raise exception 'El pago en línea aún no está disponible'; end if;
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

-- Restituye stock cuando un pedido se cancela
create or replace function restore_stock_on_cancel() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update products p set stock = p.stock + oi.quantity
      from order_items oi where oi.order_id = new.id and oi.product_id = p.id;
  end if;
  return new;
end $$;

create trigger orders_restore_stock
  after update of status on orders
  for each row execute function restore_stock_on_cancel();

-- ---------- RPC: cancelaciones iniciadas por el usuario ----------
create or replace function cancel_my_order(p_order_id uuid) returns orders
language plpgsql security definer set search_path = public as $$
declare v_row orders;
begin
  update orders set status = 'cancelled'
   where id = p_order_id and user_id = auth.uid() and status in ('placed', 'confirmed')
   returning * into v_row;
  if not found then raise exception 'Este pedido ya no se puede cancelar'; end if;
  return v_row;
end $$;

create or replace function cancel_my_appointment(p_id uuid, p_reason text default null)
returns appointments
language plpgsql security definer set search_path = public as $$
declare v_row appointments;
begin
  update appointments set status = 'cancelled', cancel_reason = p_reason
   where id = p_id and user_id = auth.uid() and status in ('requested', 'confirmed', 'rescheduled')
   returning * into v_row;
  if not found then raise exception 'Esta cita ya no se puede cancelar'; end if;
  return v_row;
end $$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles           enable row level security;
alter table vets               enable row level security;
alter table vet_members        enable row level security;
alter table vet_hours          enable row level security;
alter table pets               enable row level security;
alter table adoption_listings  enable row level security;
alter table adoption_swipes    enable row level security;
alter table adoption_requests  enable row level security;
alter table services           enable row level security;
alter table appointments       enable row level security;
alter table product_categories enable row level security;
alter table products           enable row level security;
alter table orders             enable row level security;
alter table order_items        enable row level security;
alter table payments           enable row level security;

-- profiles
create policy profiles_select_own on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_update_own on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

-- vets (catálogo público de aliados activos)
create policy vets_select on vets for select
  using (status = 'active' or is_vet_member(id) or is_admin());
create policy vets_update_member on vets for update using (is_vet_member(id)) with check (is_vet_member(id));
create policy vets_admin_all on vets for all using (is_admin()) with check (is_admin());

create policy vet_members_select on vet_members for select using (user_id = auth.uid() or is_admin());
create policy vet_hours_select   on vet_hours for select using (true);
create policy vet_hours_manage   on vet_hours for all using (is_vet_member(vet_id)) with check (is_vet_member(vet_id));

-- pets
create policy pets_own on pets for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- adopción
create policy listings_select on adoption_listings for select
  using (status = 'published' or is_vet_member(vet_id) or is_admin());
create policy listings_manage on adoption_listings for all
  using (is_vet_member(vet_id) or is_admin()) with check (is_vet_member(vet_id) or is_admin());

create policy swipes_own on adoption_swipes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy requests_insert_own on adoption_requests for insert with check (user_id = auth.uid());
create policy requests_select on adoption_requests for select using (
  user_id = auth.uid() or is_admin()
  or exists (select 1 from adoption_listings l where l.id = listing_id and is_vet_member(l.vet_id)));
create policy requests_update_vet on adoption_requests for update using (
  exists (select 1 from adoption_listings l where l.id = listing_id and is_vet_member(l.vet_id)));
create policy requests_withdraw_own on adoption_requests for update
  using (user_id = auth.uid()) with check (user_id = auth.uid() and status = 'withdrawn');

-- servicios y productos
create policy services_select on services for select using (is_active or is_vet_member(vet_id) or is_admin());
create policy services_manage on services for all using (is_vet_member(vet_id)) with check (is_vet_member(vet_id));

create policy categories_select on product_categories for select using (true);
create policy categories_admin  on product_categories for all using (is_admin()) with check (is_admin());

create policy products_select on products for select using (is_active or is_vet_member(vet_id) or is_admin());
create policy products_manage on products for all using (is_vet_member(vet_id)) with check (is_vet_member(vet_id));

-- citas: el usuario crea vía RPC y solo lee las suyas; la veterinaria gestiona las suyas
create policy appointments_select on appointments for select
  using (user_id = auth.uid() or is_vet_member(vet_id) or is_admin());
create policy appointments_update_vet on appointments for update
  using (is_vet_member(vet_id)) with check (is_vet_member(vet_id));

-- pedidos
create policy orders_select on orders for select
  using (user_id = auth.uid() or is_vet_member(vet_id) or is_admin());
create policy orders_update_vet on orders for update
  using (is_vet_member(vet_id)) with check (is_vet_member(vet_id));

create policy order_items_select on order_items for select using (
  exists (select 1 from orders o where o.id = order_id
          and (o.user_id = auth.uid() or is_vet_member(o.vet_id) or is_admin())));

create policy payments_admin on payments for select using (is_admin());

-- Permisos de ejecución de las RPC
revoke all on function request_appointment(uuid, uuid, uuid, appointment_mode, timestamptz, text, text) from public;
revoke all on function create_order(uuid, jsonb, delivery_mode, text, payment_method, text) from public;
revoke all on function cancel_my_order(uuid) from public;
revoke all on function cancel_my_appointment(uuid, text) from public;
grant execute on function request_appointment(uuid, uuid, uuid, appointment_mode, timestamptz, text, text) to authenticated;
grant execute on function create_order(uuid, jsonb, delivery_mode, text, payment_method, text) to authenticated;
grant execute on function cancel_my_order(uuid) to authenticated;
grant execute on function cancel_my_appointment(uuid, text) to authenticated;
grant execute on function get_adoption_feed(species_type, int) to authenticated;
