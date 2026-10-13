# Pet Delivery · App móvil (MVP Fase 1)

App para **adoptar mascotas con swipe**, **agendar citas** (en la veterinaria o a domicilio) y **comprar productos**
de veterinarias aliadas de Tunja. React Native (Expo SDK 57 + Expo Router) + Supabase (PostgreSQL, Auth, RLS).

## Qué incluye

| Área | Estado |
|---|---|
| Registro / login (correo + contraseña) | ✅ |
| Swipe de adopción + "match" + solicitud de adopción | ✅ |
| Directorio de veterinarias, servicios, WhatsApp/llamada | ✅ |
| Agendar cita (presencial / domicilio con recargo) | ✅ precios calculados en el servidor |
| Tienda, carrito, pedido (recoger o domicilio; contra entrega o transferencia) | ✅ stock y precios validados en el servidor |
| Mi actividad: citas, pedidos y solicitudes de adopción (con cancelación) | ✅ |
| Mascotas del usuario | ✅ |
| Esquema SQL completo + RLS multi-tenant + datos de prueba | ✅ |

**Panel web para veterinarias:** carpeta [`panel/`](panel/README.md) (Next.js). Requiere ejecutar también `supabase/panel.sql` y `supabase/admin.sql`.

**No incluye todavía:** pagos en línea (Wompi / Mercado Pago), notificaciones push/WhatsApp, medicamentos con fórmula, 

## Puesta en marcha

1. **Supabase**: crea un proyecto en https://supabase.com.
2. En *SQL Editor* ejecuta, en este orden: `supabase/schema.sql` y luego `supabase/seed.sql`.
3. En *Authentication → Providers → Email* puedes desactivar "Confirm email" mientras pruebas.
4. Copia `.env.example` a `.env` y completa la URL y la `anon key` (Project Settings → API).
5. Instala y ejecuta:

```bash
npm install --legacy-peer-deps
npx expo start
```

Escanea el QR con **Expo Go** o abre un emulador (`a` para Android, `i` para iOS).

> `npm run typecheck` verifica TypeScript. El bundle de Android compila (`npx expo export --platform android`).

## Estructura

```
app/                    Rutas (Expo Router)
  (auth)/               login, register
  (tabs)/               index (swipe), vets, shop, activity, profile
  vet/[id].tsx          detalle de veterinaria y servicios
  book/[vetId].tsx      agendar cita
  adoption/[id].tsx     formulario de solicitud de adopción
  cart.tsx, pet/new.tsx
src/
  components/           ui.tsx, SwipeDeck.tsx, PetCard.tsx
  hooks/queries.ts      TanStack Query + validación Zod de cada respuesta
  providers/            AuthProvider, CartProvider
  lib/                  supabase.ts, schemas.ts (Zod), format.ts
panel/                  Panel web (Next.js) para veterinarias
supabase/
  schema.sql            tablas, enums, RPC, triggers, RLS
  panel.sql             políticas y permisos del panel + bucket de fotos
  admin.sql             rol de administrador (aprobar veterinarias, comisiones, personal)
  seed.sql              3 veterinarias, servicios, productos y 4 mascotas de ejemplo
```

## Decisiones de seguridad y diseño

- **El cliente nunca fija precios, comisión ni totales**: `create_order` y `request_appointment` (RPC `security definer`)
  los calculan en la base de datos, validan stock/disponibilidad y propiedad de la mascota.
- **RLS en todas las tablas**: cada usuario solo ve lo suyo; el personal de una veterinaria (`vet_members`) solo ve sus datos.
- Los medicamentos `rx_medicine` **no se muestran ni se pueden comprar** (validar con el ICA antes de habilitarlos).
- Sesión persistida con AsyncStorage (patrón recomendado por Supabase; la sesión supera el límite de SecureStore).
- Los parámetros de ruta se validan con Zod (UUID) antes de usarse.
- Cada pedido pertenece a **una sola veterinaria**; el carrito pide confirmación si mezclas.
- Las veterinarias solo pueden editar columnas operativas (ver `panel.sql`): no pueden tocar su comisión ni los totales.
- Se simplificó respecto al diseño: direcciones como texto libre en la cita/pedido (sin tabla `addresses` aún).
- Las citas son **solicitudes** que la veterinaria confirma; no se valida aún el horario de atención ni choques de agenda.

## Dar acceso a una veterinaria (panel y datos)

```sql
insert into vet_members (vet_id, user_id, member_role)
values ('11111111-1111-1111-1111-111111111111', '<TU-USER-ID>', 'owner');
-- Luego, desde Table Editor, cambia el estado de citas, pedidos y solicitudes.
```

## Siguientes pasos sugeridos

1. Notificaciones (Expo Push + WhatsApp Business).
2. Pasarela (Wompi o Mercado Pago) y facturación de comisión.
3. Horarios de atención y control de choques de agenda.
