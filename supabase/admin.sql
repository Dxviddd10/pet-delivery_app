-- ============================================================
-- Pet Delivery · Rol de ADMINISTRADOR de plataforma
-- Ejecutar DESPUÉS de schema.sql y panel.sql (una sola vez).
-- Todas las funciones verifican is_admin() internamente.
-- ============================================================

-- Resumen por veterinaria para un mes (hora de Colombia): pedidos entregados, ventas y comisión
create or replace function admin_vet_summary(p_month date default (now() at time zone 'America/Bogota')::date)
returns table (
  vet_id uuid, vet_name text, vet_status vet_status, commission_rate numeric,
  offers_home_visits boolean, city text, created_at timestamptz,
  delivered_orders bigint, sales bigint, commission bigint
)
language plpgsql security definer set search_path = public as $$
declare v_start timestamptz; v_end timestamptz;
begin
  if not is_admin() then raise exception 'Solo administradores'; end if;
  v_start := make_timestamptz(extract(year from p_month)::int, extract(month from p_month)::int, 1, 0, 0, 0, 'America/Bogota');
  v_end := v_start + interval '1 month';
  return query
    select v.id, v.name, v.status, v.commission_rate, v.offers_home_visits, v.city, v.created_at,
           count(o.id)::bigint,
           coalesce(sum(o.subtotal), 0)::bigint,
           coalesce(sum(o.commission_amount), 0)::bigint
    from vets v
    left join orders o on o.vet_id = v.id and o.status = 'delivered'
                      and o.created_at >= v_start and o.created_at < v_end
    group by v.id
    order by v.name;
end $$;

-- Personal de todas las veterinarias (con correo)
create or replace function admin_members()
returns table (m_vet_id uuid, m_user_id uuid, m_email text, m_full_name text, m_role text)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Solo administradores'; end if;
  return query
    select vm.vet_id, vm.user_id, u.email::text, p.full_name, vm.member_role
    from vet_members vm
    join auth.users u on u.id = vm.user_id
    join profiles p on p.id = vm.user_id
    order by vm.vet_id, vm.member_role, u.email;
end $$;

create or replace function admin_set_vet_status(p_vet uuid, p_status vet_status) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Solo administradores'; end if;
  update vets set status = p_status where id = p_vet;
  if not found then raise exception 'Veterinaria no encontrada'; end if;
end $$;

-- La nueva comisión aplica a los pedidos que se creen desde ahora (los anteriores no cambian)
create or replace function admin_set_vet_commission(p_vet uuid, p_rate numeric) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Solo administradores'; end if;
  if p_rate < 0 or p_rate > 50 then raise exception 'La comisión debe estar entre 0 y 50'; end if;
  update vets set commission_rate = p_rate where id = p_vet;
  if not found then raise exception 'Veterinaria no encontrada'; end if;
end $$;

create or replace function admin_create_vet(
  p_name text, p_phone text, p_address text, p_commission numeric, p_owner_email text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_vet uuid; v_user uuid;
begin
  if not is_admin() then raise exception 'Solo administradores'; end if;
  if p_commission < 0 or p_commission > 50 then raise exception 'La comisión debe estar entre 0 y 50'; end if;

  if coalesce(trim(p_owner_email), '') <> '' then
    select id into v_user from auth.users where lower(email) = lower(trim(p_owner_email));
    if v_user is null then
      raise exception 'No existe un usuario con el correo %. Crea su cuenta en Authentication → Users y vuelve a intentar', p_owner_email;
    end if;
  end if;

  insert into vets (name, phone, address, commission_rate, status)
  values (trim(p_name), nullif(trim(p_phone), ''), nullif(trim(p_address), ''), p_commission, 'active')
  returning id into v_vet;

  if v_user is not null then
    insert into vet_members (vet_id, user_id, member_role) values (v_vet, v_user, 'owner');
    update profiles set role = 'vet_staff' where id = v_user and role = 'adopter';
  end if;
  return v_vet;
end $$;

create or replace function admin_add_vet_member(p_vet uuid, p_email text, p_role text default 'staff') returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not is_admin() then raise exception 'Solo administradores'; end if;
  if p_role not in ('owner', 'staff') then raise exception 'Rol inválido'; end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'No existe un usuario con el correo %. Crea su cuenta en Authentication → Users', p_email;
  end if;
  insert into vet_members (vet_id, user_id, member_role) values (p_vet, v_user, p_role)
  on conflict (vet_id, user_id) do update set member_role = excluded.member_role;
  update profiles set role = 'vet_staff' where id = v_user and role = 'adopter';
end $$;

create or replace function admin_remove_vet_member(p_vet uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_role text; v_owners int;
begin
  if not is_admin() then raise exception 'Solo administradores'; end if;
  select member_role into v_role from vet_members where vet_id = p_vet and user_id = p_user;
  if v_role is null then raise exception 'Esa persona no pertenece a la veterinaria'; end if;
  if v_role = 'owner' then
    select count(*) into v_owners from vet_members where vet_id = p_vet and member_role = 'owner';
    if v_owners <= 1 then raise exception 'No puedes quitar al único dueño de la veterinaria'; end if;
  end if;
  delete from vet_members where vet_id = p_vet and user_id = p_user;
end $$;

-- Permisos de ejecución
revoke all on function admin_vet_summary(date) from public;
revoke all on function admin_members() from public;
revoke all on function admin_set_vet_status(uuid, vet_status) from public;
revoke all on function admin_set_vet_commission(uuid, numeric) from public;
revoke all on function admin_create_vet(text, text, text, numeric, text) from public;
revoke all on function admin_add_vet_member(uuid, text, text) from public;
revoke all on function admin_remove_vet_member(uuid, uuid) from public;
grant execute on function admin_vet_summary(date) to authenticated;
grant execute on function admin_members() to authenticated;
grant execute on function admin_set_vet_status(uuid, vet_status) to authenticated;
grant execute on function admin_set_vet_commission(uuid, numeric) to authenticated;
grant execute on function admin_create_vet(text, text, text, numeric, text) to authenticated;
grant execute on function admin_add_vet_member(uuid, text, text) to authenticated;
grant execute on function admin_remove_vet_member(uuid, uuid) to authenticated;

-- Hace efectiva la suspensión: catálogo, servicios y mascotas de una veterinaria que no esté
-- activa dejan de verse en la app (su personal y los administradores siguen viéndolos).
drop policy if exists products_select on products;
create policy products_select on products for select using (
  (is_active and exists (select 1 from vets v where v.id = vet_id and v.status = 'active'))
  or is_vet_member(vet_id) or is_admin()
);

drop policy if exists services_select on services;
create policy services_select on services for select using (
  (is_active and exists (select 1 from vets v where v.id = vet_id and v.status = 'active'))
  or is_vet_member(vet_id) or is_admin()
);

drop policy if exists listings_select on adoption_listings;
create policy listings_select on adoption_listings for select using (
  (status = 'published' and exists (select 1 from vets v where v.id = vet_id and v.status = 'active'))
  or is_vet_member(vet_id) or is_admin()
);

-- ------------------------------------------------------------
-- Cómo convertirte en administrador (una sola vez, desde el SQL Editor):
--   update profiles set role = 'admin' where id = '<TU-USER-ID>';
-- (Un usuario NO puede ascenderse a sí mismo desde la app: la política de profiles lo impide.)
-- ------------------------------------------------------------
