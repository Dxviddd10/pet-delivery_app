-- ============================================================
-- Pet Delivery · Datos de prueba (Seed Data)
-- Ejecutar después de schema.sql, panel.sql y admin.sql.
-- ============================================================

-- 1. Catálogo inicial de veterinarias aliadas
insert into vets (id, name, description, phone, whatsapp, address, status, offers_home_visits, home_fee, delivery_fee, commission_rate) values
 ('11111111-1111-1111-1111-111111111111', 'Veterinaria Patitas Tunja', 'Consulta general, vacunación y peluquería.', '3100000001', '573100000001', 'Calle 20 # 10-15, Tunja', 'active', true, 15000, 5000, 5),
 ('22222222-2222-2222-2222-222222222222', 'Clínica Boyacá Pets', 'Urgencias, cirugía y hospitalización.', '3100000002', '573100000002', 'Carrera 9 # 30-40, Tunja', 'active', true, 20000, 6000, 5),
 ('33333333-3333-3333-3333-333333333333', 'PetShop Hunza', 'Alimentos y accesorios con entrega local.', '3100000003', '573100000003', 'Av. Norte # 45-20, Tunja', 'active', false, 0, 4000, 8)
on conflict (id) do nothing;

-- 2. Servicios por veterinaria
insert into services (vet_id, name, category, duration_min, price, home_available) values
 ('11111111-1111-1111-1111-111111111111', 'Consulta general', 'consulta', 30, 45000, true),
 ('11111111-1111-1111-1111-111111111111', 'Vacunación', 'vacunación', 20, 60000, true),
 ('11111111-1111-1111-1111-111111111111', 'Baño y peluquería', 'estética', 60, 50000, false),
 ('22222222-2222-2222-2222-222222222222', 'Consulta general', 'consulta', 30, 55000, true),
 ('22222222-2222-2222-2222-222222222222', 'Ecografía', 'diagnóstico', 30, 90000, false),
 ('22222222-2222-2222-2222-222222222222', 'Desparasitación', 'prevención', 15, 25000, true);

-- 3. Categorías de productos
insert into product_categories (id, name) values
 ('aaaaaaaa-0000-0000-0000-000000000001', 'Alimento'),
 ('aaaaaaaa-0000-0000-0000-000000000002', 'Accesorios'),
 ('aaaaaaaa-0000-0000-0000-000000000003', 'Antiparasitarios')
on conflict (id) do nothing;

-- 4. Productos
insert into products (vet_id, category_id, name, brand, price, stock, kind) values
 ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000001', 'Concentrado perro adulto 8 kg', 'Genérica', 135000, 20, 'food'),
 ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000001', 'Concentrado gato adulto 3 kg', 'Genérica', 72000, 15, 'food'),
 ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000002', 'Correa y collar talla M', 'Genérica', 28000, 30, 'accessory'),
 ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000003', 'Antipulgas externo (pipeta)', 'Genérica', 38000, 25, 'otc_medicine'),
 ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'Snacks dentales x 7', 'Genérica', 22000, 40, 'food'),
 ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000003', 'Antibiótico (requiere fórmula)', 'Genérica', 48000, 10, 'rx_medicine');

-- 5. Publicaciones de adopción
insert into adoption_listings (vet_id, name, species, breed, sex, age_months, size, description, temperament, vaccinated, sterilized, dewormed, photos, status, published_at) values
 ('11111111-1111-1111-1111-111111111111', 'Max', 'dog', 'Mestizo', 'male', 8, 'medium', 'Rescatado de la calle, muy sociable y juguetón.', 'Cariñoso y energético', true, false, true, array['https://picsum.photos/seed/max-dog/700/900'], 'published', now()),
 ('11111111-1111-1111-1111-111111111111', 'Luna', 'cat', 'Criolla', 'female', 5, 'small', 'Gatita tranquila, ideal para apartamento.', 'Tranquila', true, false, true, array['https://picsum.photos/seed/luna-cat/700/900'], 'published', now()),
 ('22222222-2222-2222-2222-222222222222', 'Rocky', 'dog', 'Criollo', 'male', 24, 'large', 'Adulto joven, bien con niños, entrenado básico.', 'Protector y noble', true, true, true, array['https://picsum.photos/seed/rocky-dog/700/900'], 'published', now()),
 ('22222222-2222-2222-2222-222222222222', 'Mia', 'cat', 'Mestiza', 'female', 12, 'small', 'Curiosa y muy limpia.', 'Juguetona', true, true, true, array['https://picsum.photos/seed/mia-cat/700/900'], 'published', now());

-- ============================================================
-- 6. GUÍA DE USUARIOS Y VINCULACIÓN AL PANEL (Prevención de correos duplicados)
-- ============================================================
-- Para que cada veterinaria tenga su propio acceso independiente, crea un usuario
-- por clínica en Supabase > Authentication > Users (con Auto Confirm activado):
--   1. patitas@petdelivery.co   -> Dueño de Patitas Tunja
--   2. boyaca@petdelivery.co    -> Dueño de Boyacá Pets
--   3. hunza@petdelivery.co     -> Dueño de PetShop Hunza
--   4. admin@petdelivery.co     -> Administrador de la plataforma
--
-- Luego ejecuta este bloque para vincularlos automáticamente por correo:
do $$
declare
  v_patitas_user uuid;
  v_boyaca_user  uuid;
  v_hunza_user   uuid;
  v_admin_user   uuid;
begin
  -- 1) Patitas Tunja -> patitas@petdelivery.co
  select id into v_patitas_user from auth.users where lower(email) = 'patitas@petdelivery.co';
  if v_patitas_user is not null then
    insert into vet_members (vet_id, user_id, member_role)
    values ('11111111-1111-1111-1111-111111111111', v_patitas_user, 'owner')
    on conflict (vet_id, user_id) do update set member_role = 'owner';
    update profiles set role = 'vet_staff', full_name = coalesce(nullif(full_name, ''), 'Dr. Patitas') where id = v_patitas_user;
  end if;

  -- 2) Boyacá Pets -> boyaca@petdelivery.co
  select id into v_boyaca_user from auth.users where lower(email) = 'boyaca@petdelivery.co';
  if v_boyaca_user is not null then
    insert into vet_members (vet_id, user_id, member_role)
    values ('22222222-2222-2222-2222-222222222222', v_boyaca_user, 'owner')
    on conflict (vet_id, user_id) do update set member_role = 'owner';
    update profiles set role = 'vet_staff', full_name = coalesce(nullif(full_name, ''), 'Dra. Boyacá Pets') where id = v_boyaca_user;
  end if;

  -- 3) PetShop Hunza -> hunza@petdelivery.co
  select id into v_hunza_user from auth.users where lower(email) = 'hunza@petdelivery.co';
  if v_hunza_user is not null then
    insert into vet_members (vet_id, user_id, member_role)
    values ('33333333-3333-3333-3333-333333333333', v_hunza_user, 'owner')
    on conflict (vet_id, user_id) do update set member_role = 'owner';
    update profiles set role = 'vet_staff', full_name = coalesce(nullif(full_name, ''), 'Gerente Hunza') where id = v_hunza_user;
  end if;

  -- 4) Administrador de plataforma (Super Admin global)
  -- El Super Admin solo administra la plataforma desde /admin y NO debe pertenecer a ninguna veterinaria.
  select id into v_admin_user from auth.users where lower(email) = 'admin@petdelivery.co';
  if v_admin_user is not null then
    update profiles set role = 'admin', full_name = coalesce(nullif(full_name, ''), 'Super Administrador') where id = v_admin_user;
    -- Desvincular de vet_members en caso de haber quedado asignado previamente
    delete from vet_members where user_id = v_admin_user;
  end if;

  -- Limpieza de seguridad: ningún usuario con rol 'admin' debe estar en vet_members
  delete from vet_members where user_id in (select id from profiles where role = 'admin');
end $$;
