-- ============================================================
-- Pet Delivery · Migración para el PANEL WEB de veterinarias
-- Ejecutar DESPUÉS de schema.sql (una sola vez).
-- ============================================================

-- 1) El personal de una veterinaria puede ver el nombre/celular de los clientes
--    que han interactuado con ella (citas, pedidos o solicitudes de adopción). Nadie más.
create policy profiles_select_vet_customers on profiles for select using (
  exists (select 1 from appointments a where a.user_id = profiles.id and is_vet_member(a.vet_id))
  or exists (select 1 from orders o where o.user_id = profiles.id and is_vet_member(o.vet_id))
  or exists (
    select 1 from adoption_requests r
    join adoption_listings l on l.id = r.listing_id
    where r.user_id = profiles.id and is_vet_member(l.vet_id)
  )
);

-- 2) La veterinaria puede ver las mascotas de las citas que tiene agendadas.
create policy pets_select_vet on pets for select using (
  exists (select 1 from appointments a where a.pet_id = pets.id and is_vet_member(a.vet_id))
);

-- 3) Fotos de mascotas en adopción (Supabase Storage). Lectura pública; escritura solo
--    para personal de la veterinaria dentro de su carpeta: <vet_id>/<archivo>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pet-photos', 'pet-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "pet_photos_public_read" on storage.objects for select
  using (bucket_id = 'pet-photos');

create policy "pet_photos_vet_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'pet-photos' and is_vet_member(((storage.foldername(name))[1])::uuid));

create policy "pet_photos_vet_update" on storage.objects for update to authenticated
  using (bucket_id = 'pet-photos' and is_vet_member(((storage.foldername(name))[1])::uuid));

create policy "pet_photos_vet_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'pet-photos' and is_vet_member(((storage.foldername(name))[1])::uuid));

-- 4) Cómo dar acceso al panel a un usuario (reemplaza los UUID):
--    insert into vet_members (vet_id, user_id, member_role)
--    values ('<ID-VETERINARIA>', '<ID-USUARIO>', 'owner');
--    Y para activar una veterinaria nueva:  update vets set status = 'active' where id = '<ID>';

-- 5) SEGURIDAD: el personal de una veterinaria solo puede modificar columnas operativas.
--    Sin esto, las políticas RLS de UPDATE permitirían cambiar comisión, estado de
--    aprobación, totales o el cliente de un pedido. (El admin edita estos campos
--    desde el SQL Editor / service role, que no pasa por estos permisos.)
revoke update on vets from authenticated;
grant update (name, description, logo_url, cover_url, phone, whatsapp, address, lat, lng,
              offers_home_visits, home_fee, delivery_fee) on vets to authenticated;

revoke update on orders from authenticated;
grant update (status, payment_status, notes) on orders to authenticated;

revoke update on appointments from authenticated;
grant update (status, payment_status, scheduled_at, cancel_reason) on appointments to authenticated;

revoke update on adoption_requests from authenticated;
grant update (status, vet_notes) on adoption_requests to authenticated;
