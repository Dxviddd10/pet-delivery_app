# Pet Delivery · Panel web para veterinarias

Next.js 16 (App Router, Server Actions) + Supabase (Auth, RLS, Storage) + Tailwind 4.
Comparte la misma base de datos que la app móvil.

## Módulos

| Ruta | Qué hace |
|---|---|
| `/` | Resumen: citas de hoy, por confirmar, pedidos nuevos, solicitudes, poco stock; ventas y comisión del mes |
| `/citas` | Confirmar, reprogramar (hora Colombia), marcar realizada / no asistió / cancelar, registrar pago |
| `/pedidos` | Flujo nuevo → confirmado → preparando → en camino/entregado; cancelar (devuelve stock); registrar pago |
| `/adopciones` | Crear/editar mascotas con **fotos (Supabase Storage)**, publicar/archivar; gestionar solicitudes (contactar, aprobar → reserva, rechazar) |
| `/productos` | Inventario con edición rápida de precio/stock, ocultar, **importación masiva por CSV** (plantilla incluida) |
| `/servicios` | Servicios y precios que se agendan desde la app |
| `/ajustes` | Datos públicos de la veterinaria, recargo de domicilio (solo el rol `owner`) |
| `/admin` | **Solo administradores:** aprobar/suspender veterinarias, definir comisión, reporte mensual de ventas y comisión, gestionar personal por correo |
| `/admin/nueva` | **Solo administradores:** crear una veterinaria y asignarle dueño |

## Puesta en marcha

1. En Supabase ejecuta, en orden: `schema.sql`, `seed.sql` (opcional), `panel.sql` y `admin.sql`.
   `panel.sql`: Crea el bucket `pet-photos`, las políticas
   para ver datos de clientes con los que se interactuó y **restringe qué columnas puede editar una veterinaria**
   (no puede cambiar su comisión, su estado de aprobación ni los totales de un pedido).
2. Crea el usuario de la veterinaria en *Authentication → Users* (con *Auto Confirm User*) y dale acceso:

```sql
insert into vet_members (vet_id, user_id, member_role)
values ('11111111-1111-1111-1111-111111111111', '<ID-DEL-USUARIO>', 'owner');
-- Veterinarias nuevas nacen 'pending'; para que salgan en la app:
-- update vets set status = 'active' where id = '<ID>';
```

3. Variables y ejecución:

```bash
cd panel
cp .env.example .env.local     # misma URL y anon key que la app móvil
npm install
npm run dev                    # http://localhost:3000
```

`npm run build` y `npm run typecheck` pasan sin errores.

## Notas técnicas

- Toda mutación es una **Server Action** que valida con Zod, exige sesión y pertenencia a la veterinaria
  (`requireVet()`), filtra por `vet_id` y verifica el estado actual antes de cambiarlo (evita pisar cambios concurrentes).
  RLS y los permisos por columna de la base de datos son la segunda barrera.
- Las fechas se muestran y se capturan en **hora de Colombia (UTC-5)**.
- Si un usuario pertenece a varias veterinarias se usa la primera (selector de sede: mejora futura).
- Next.js 16 usa `src/proxy.ts` (antes `middleware.ts`) para refrescar la sesión y proteger rutas.
- Despliegue sugerido: Vercel, con las dos variables `NEXT_PUBLIC_SUPABASE_*`.

## Administrador de plataforma

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'tu-correo@ejemplo.com');
```

Un admin sin veterinaria entra directo a `/admin`. Todas las acciones de admin son funciones SQL (`admin_*`)
que verifican `is_admin()`; un usuario normal no puede ejecutarlas ni ascenderse a sí mismo.

## Pendiente / siguientes pasos

- Notificaciones push/WhatsApp al cambiar el estado de citas y pedidos.
- Validar horario de atención y choques de agenda.
- Fotos de productos.
