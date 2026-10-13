-- Datos de prueba (ejecutar después de schema.sql). Reemplaza fotos y datos por reales.
insert into vets (id, name, description, phone, whatsapp, address, status, offers_home_visits, home_fee, delivery_fee, commission_rate) values
 ('11111111-1111-1111-1111-111111111111', 'Veterinaria Patitas Tunja', 'Consulta general, vacunación y peluquería.', '3100000001', '573100000001', 'Calle 20 # 10-15, Tunja', 'active', true, 15000, 5000, 5),
 ('22222222-2222-2222-2222-222222222222', 'Clínica Boyacá Pets', 'Urgencias, cirugía y hospitalización.', '3100000002', '573100000002', 'Carrera 9 # 30-40, Tunja', 'active', true, 20000, 6000, 5),
 ('33333333-3333-3333-3333-333333333333', 'PetShop Hunza', 'Alimentos y accesorios con entrega local.', '3100000003', '573100000003', 'Av. Norte # 45-20, Tunja', 'active', false, 0, 4000, 8);

insert into services (vet_id, name, category, duration_min, price, home_available) values
 ('11111111-1111-1111-1111-111111111111', 'Consulta general', 'consulta', 30, 45000, true),
 ('11111111-1111-1111-1111-111111111111', 'Vacunación', 'vacunación', 20, 60000, true),
 ('11111111-1111-1111-1111-111111111111', 'Baño y peluquería', 'estética', 60, 50000, false),
 ('22222222-2222-2222-2222-222222222222', 'Consulta general', 'consulta', 30, 55000, true),
 ('22222222-2222-2222-2222-222222222222', 'Ecografía', 'diagnóstico', 30, 90000, false),
 ('22222222-2222-2222-2222-222222222222', 'Desparasitación', 'prevención', 15, 25000, true);

insert into product_categories (id, name) values
 ('aaaaaaaa-0000-0000-0000-000000000001', 'Alimento'),
 ('aaaaaaaa-0000-0000-0000-000000000002', 'Accesorios'),
 ('aaaaaaaa-0000-0000-0000-000000000003', 'Antiparasitarios');

insert into products (vet_id, category_id, name, brand, price, stock, kind) values
 ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000001', 'Concentrado perro adulto 8 kg', 'Genérica', 135000, 20, 'food'),
 ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000001', 'Concentrado gato adulto 3 kg', 'Genérica', 72000, 15, 'food'),
 ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000002', 'Correa y collar talla M', 'Genérica', 28000, 30, 'accessory'),
 ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000003', 'Antipulgas externo (pipeta)', 'Genérica', 38000, 25, 'otc_medicine'),
 ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'Snacks dentales x 7', 'Genérica', 22000, 40, 'food'),
 ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000003', 'Antibiótico (requiere fórmula)', 'Genérica', 48000, 10, 'rx_medicine');

insert into adoption_listings (vet_id, name, species, breed, sex, age_months, size, description, temperament, vaccinated, sterilized, dewormed, photos, status, published_at) values
 ('11111111-1111-1111-1111-111111111111', 'Max', 'dog', 'Mestizo', 'male', 8, 'medium', 'Rescatado de la calle, muy sociable y juguetón.', 'Cariñoso y energético', true, false, true, array['https://picsum.photos/seed/max-dog/700/900'], 'published', now()),
 ('11111111-1111-1111-1111-111111111111', 'Luna', 'cat', 'Criolla', 'female', 5, 'small', 'Gatita tranquila, ideal para apartamento.', 'Tranquila', true, false, true, array['https://picsum.photos/seed/luna-cat/700/900'], 'published', now()),
 ('22222222-2222-2222-2222-222222222222', 'Rocky', 'dog', 'Criollo', 'male', 24, 'large', 'Adulto joven, bien con niños, entrenado básico.', 'Protector y noble', true, true, true, array['https://picsum.photos/seed/rocky-dog/700/900'], 'published', now()),
 ('22222222-2222-2222-2222-222222222222', 'Mia', 'cat', 'Mestiza', 'female', 12, 'small', 'Curiosa y muy limpia.', 'Juguetona', true, true, true, array['https://picsum.photos/seed/mia-cat/700/900'], 'published', now());
