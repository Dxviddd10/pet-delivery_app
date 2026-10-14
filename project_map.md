# 🗺️ Mapa de Arquitectura y Referencia del Proyecto
**Directorio Base:** `C:\Users\maico\OneDrive - Universidad Santo Tomás\Escritorio\pet-delivery_app`

## 📊 1. Resumen General del Repositorio
- **Archivos analizados:** `89`
- **Líneas de código totales:** `9,176`
- **Rutas identificadas (Expo / Next.js):** `35`
- **Componentes React identificados:** `49`
- **Custom Hooks identificados:** `20`
- **Tablas SQL detectadas:** `15`

### Distribución por Capas
| Capa / Dominio | Archivos |
| :--- | :--- |
| Web Admin Panel (Next.js Page/Route) | 30 |
| Mobile App (Expo Router) | 15 |
| Web Admin Core/Config | 9 |
| Project Root Config/Doc | 7 |
| Web Admin Library/Service | 6 |
| Web Admin Component | 5 |
| Mobile Component | 4 |
| Database & Backend (Supabase) | 4 |
| Mobile Library/Service | 3 |
| Mobile Hook | 2 |
| Mobile Provider | 2 |
| Mobile Core | 1 |
| Developer Tools | 1 |

## 🧭 2. Mapa de Rutas y Pantallas
### 📱 Aplicación Móvil (Expo Router - `app/`)
| Ruta Móvil | Archivo de Origen |
| :--- | :--- |
| `/(auth)/_layout` | [`app/(auth)/_layout.tsx`](file:///app/(auth)/_layout.tsx) |
| `/(auth)/login` | [`app/(auth)/login.tsx`](file:///app/(auth)/login.tsx) |
| `/(auth)/register` | [`app/(auth)/register.tsx`](file:///app/(auth)/register.tsx) |
| `/(tabs)` | [`app/(tabs)/index.tsx`](file:///app/(tabs)/index.tsx) |
| `/(tabs)/_layout` | [`app/(tabs)/_layout.tsx`](file:///app/(tabs)/_layout.tsx) |
| `/(tabs)/activity` | [`app/(tabs)/activity.tsx`](file:///app/(tabs)/activity.tsx) |
| `/(tabs)/profile` | [`app/(tabs)/profile.tsx`](file:///app/(tabs)/profile.tsx) |
| `/(tabs)/shop` | [`app/(tabs)/shop.tsx`](file:///app/(tabs)/shop.tsx) |
| `/(tabs)/vets` | [`app/(tabs)/vets.tsx`](file:///app/(tabs)/vets.tsx) |
| `/_layout` | [`app/_layout.tsx`](file:///app/_layout.tsx) |
| `/adoption/[id]` | [`app/adoption/[id].tsx`](file:///app/adoption/[id].tsx) |
| `/book/[vetId]` | [`app/book/[vetId].tsx`](file:///app/book/[vetId].tsx) |
| `/cart` | [`app/cart.tsx`](file:///app/cart.tsx) |
| `/pet/new` | [`app/pet/new.tsx`](file:///app/pet/new.tsx) |
| `/vet/[id]` | [`app/vet/[id].tsx`](file:///app/vet/[id].tsx) |

### 💻 Panel Web Administrativo (Next.js App Router - `panel/src/app/`)
| Tipo y Ruta Web | Archivo de Origen |
| :--- | :--- |
| Next.js API Route: /(panel)/productos/plantilla | [`panel/src/app/(panel)/productos/plantilla/route.ts`](file:///panel/src/app/(panel)/productos/plantilla/route.ts) |
| Next.js Layout: /(admin) | [`panel/src/app/(admin)/layout.tsx`](file:///panel/src/app/(admin)/layout.tsx) |
| Next.js Layout: /(panel) | [`panel/src/app/(panel)/layout.tsx`](file:///panel/src/app/(panel)/layout.tsx) |
| Next.js Layout: /layout.tsx | [`panel/src/app/layout.tsx`](file:///panel/src/app/layout.tsx) |
| Next.js Page: /(admin)/admin | [`panel/src/app/(admin)/admin/page.tsx`](file:///panel/src/app/(admin)/admin/page.tsx) |
| Next.js Page: /(admin)/admin/nueva | [`panel/src/app/(admin)/admin/nueva/page.tsx`](file:///panel/src/app/(admin)/admin/nueva/page.tsx) |
| Next.js Page: /(panel) | [`panel/src/app/(panel)/page.tsx`](file:///panel/src/app/(panel)/page.tsx) |
| Next.js Page: /(panel)/adopciones | [`panel/src/app/(panel)/adopciones/page.tsx`](file:///panel/src/app/(panel)/adopciones/page.tsx) |
| Next.js Page: /(panel)/adopciones/[id] | [`panel/src/app/(panel)/adopciones/[id]/page.tsx`](file:///panel/src/app/(panel)/adopciones/[id]/page.tsx) |
| Next.js Page: /(panel)/adopciones/nueva | [`panel/src/app/(panel)/adopciones/nueva/page.tsx`](file:///panel/src/app/(panel)/adopciones/nueva/page.tsx) |
| Next.js Page: /(panel)/ajustes | [`panel/src/app/(panel)/ajustes/page.tsx`](file:///panel/src/app/(panel)/ajustes/page.tsx) |
| Next.js Page: /(panel)/citas | [`panel/src/app/(panel)/citas/page.tsx`](file:///panel/src/app/(panel)/citas/page.tsx) |
| Next.js Page: /(panel)/pedidos | [`panel/src/app/(panel)/pedidos/page.tsx`](file:///panel/src/app/(panel)/pedidos/page.tsx) |
| Next.js Page: /(panel)/productos | [`panel/src/app/(panel)/productos/page.tsx`](file:///panel/src/app/(panel)/productos/page.tsx) |
| Next.js Page: /(panel)/productos/[id] | [`panel/src/app/(panel)/productos/[id]/page.tsx`](file:///panel/src/app/(panel)/productos/[id]/page.tsx) |
| Next.js Page: /(panel)/productos/importar | [`panel/src/app/(panel)/productos/importar/page.tsx`](file:///panel/src/app/(panel)/productos/importar/page.tsx) |
| Next.js Page: /(panel)/productos/nuevo | [`panel/src/app/(panel)/productos/nuevo/page.tsx`](file:///panel/src/app/(panel)/productos/nuevo/page.tsx) |
| Next.js Page: /(panel)/servicios | [`panel/src/app/(panel)/servicios/page.tsx`](file:///panel/src/app/(panel)/servicios/page.tsx) |
| Next.js Page: /login | [`panel/src/app/login/page.tsx`](file:///panel/src/app/login/page.tsx) |
| Next.js Page: /sin-acceso | [`panel/src/app/sin-acceso/page.tsx`](file:///panel/src/app/sin-acceso/page.tsx) |

## 🗄️ 3. Modelo de Datos y Backend (Supabase SQL)
### Archivo: [`supabase/admin.sql`](file:///supabase/admin.sql) (160 líneas)
- **Funciones:** `admin_add_vet_member`, `admin_create_vet`, `admin_members`, `admin_remove_vet_member`, `admin_set_vet_commission`, `admin_set_vet_status`, `admin_vet_summary`
- **Políticas RLS (3):**
  - `products_select ON products`
  - `services_select ON services`
  - `listings_select ON adoption_listings`

### Archivo: [`supabase/panel.sql`](file:///supabase/panel.sql) (61 líneas)
- **Políticas RLS (6):**
  - `profiles_select_vet_customers ON profiles`
  - `pets_select_vet ON pets`
  - `pet_photos_public_read ON storage`
  - `pet_photos_vet_insert ON storage`
  - `pet_photos_vet_update ON storage`
  - `pet_photos_vet_delete ON storage`

### Archivo: [`supabase/schema.sql`](file:///supabase/schema.sql) (597 líneas)
- **Tablas:** `adoption_listings`, `adoption_requests`, `adoption_swipes`, `appointments`, `order_items`, `orders`, `payments`, `pets`, `product_categories`, `products`, `profiles`, `services`, `vet_hours`, `vet_members`, `vets`
- **Funciones:** `cancel_my_appointment`, `cancel_my_order`, `create_order`, `get_adoption_feed`, `handle_new_user`, `is_admin`, `is_vet_member`, `request_appointment`, `restore_stock_on_cancel`
- **Políticas RLS (28):**
  - `profiles_select_own ON profiles`
  - `profiles_update_own ON profiles`
  - `vets_select ON vets`
  - `vets_update_member ON vets`
  - `vets_admin_all ON vets`
  - `vet_members_select ON vet_members`
  - `vet_hours_select   ON vet_hours`
  - `vet_hours_manage   ON vet_hours`
  - *... y 20 políticas más*
- **Triggers:** `on_auth_user_created`, `orders_restore_stock`

### Archivo: [`supabase/seed.sql`](file:///supabase/seed.sql) (95 líneas)

## 🧩 4. Catálogo de Componentes y Hooks Clave
| Archivo | Componentes / Funciones | Hooks |
| :--- | :--- | :--- |
| [`app/(auth)/_layout.tsx`](file:///app/(auth)/_layout.tsx) | `AuthLayout` | - |
| [`app/(auth)/login.tsx`](file:///app/(auth)/login.tsx) | `LoginScreen` | - |
| [`app/(auth)/register.tsx`](file:///app/(auth)/register.tsx) | `RegisterScreen` | - |
| [`app/(tabs)/_layout.tsx`](file:///app/(tabs)/_layout.tsx) | `TabsLayout` | - |
| [`app/(tabs)/activity.tsx`](file:///app/(tabs)/activity.tsx) | `ActivityScreen` | - |
| [`app/(tabs)/index.tsx`](file:///app/(tabs)/index.tsx) | `AdoptFeedScreen` | - |
| [`app/(tabs)/profile.tsx`](file:///app/(tabs)/profile.tsx) | `ProfileScreen` | - |
| [`app/(tabs)/shop.tsx`](file:///app/(tabs)/shop.tsx) | `ShopScreen` | - |
| [`app/(tabs)/vets.tsx`](file:///app/(tabs)/vets.tsx) | `VetsScreen` | - |
| [`app/_layout.tsx`](file:///app/_layout.tsx) | `RootLayout` | - |
| [`app/adoption/[id].tsx`](file:///app/adoption/[id].tsx) | `AdoptionRoute` | - |
| [`app/book/[vetId].tsx`](file:///app/book/[vetId].tsx) | `BookRoute` | - |
| [`app/cart.tsx`](file:///app/cart.tsx) | `CartScreen` | - |
| [`app/pet/new.tsx`](file:///app/pet/new.tsx) | `NewPetScreen` | - |
| [`app/vet/[id].tsx`](file:///app/vet/[id].tsx) | `VetDetailRoute` | - |
| [`panel/src/app/(admin)/admin/actions.ts`](file:///panel/src/app/(admin)/admin/actions.ts) | `Optional` | - |
| [`panel/src/app/(panel)/productos/plantilla/route.ts`](file:///panel/src/app/(panel)/productos/plantilla/route.ts) | `GET` | - |
| [`panel/src/app/layout.tsx`](file:///panel/src/app/layout.tsx) | `RootLayout` | - |
| [`panel/src/components/ListingForm.tsx`](file:///panel/src/components/ListingForm.tsx) | `ListingForm` | - |
| [`panel/src/components/NavLink.tsx`](file:///panel/src/components/NavLink.tsx) | `NavLink` | - |
| [`panel/src/components/ProductForm.tsx`](file:///panel/src/components/ProductForm.tsx) | `ProductForm` | - |
| [`panel/src/components/SubmitButton.tsx`](file:///panel/src/components/SubmitButton.tsx) | `SubmitButton` | - |
| [`panel/src/components/ui.tsx`](file:///panel/src/components/ui.tsx) | `Badge`, `Card`, `Empty`, `ErrorBanner`, `Field`, `OkBanner`, `PageHeader` | - |
| [`src/components/PetCard.tsx`](file:///src/components/PetCard.tsx) | `PetCard` | - |
| [`src/components/SwipeDeck.tsx`](file:///src/components/SwipeDeck.tsx) | `SwipeDeck` | - |
| [`src/components/extras.tsx`](file:///src/components/extras.tsx) | `Footer`, `OptionTile`, `PricePill` | - |
| [`src/components/ui.tsx`](file:///src/components/ui.tsx) | `AuthShell`, `Avatar`, `Badge`, `Button`, `Card`, `Chip`, `ChipRow`, `EmptyState`, `ErrorState`, `Loading`, `Row`, `Screen`, `SectionTitle` | - |
| [`src/hooks/queries.ts`](file:///src/hooks/queries.ts) | - | `useAdoptionFeed`, `useCancelAppointment`, `useCancelOrder`, `useCreateOrder`, `useCreatePet`, `useListing`, `useMyAdoptionRequests`, `useMyAppointments`, `useMyOrders`, `useMyPets`, `useProducts`, `useRequestAdoption`, `useRequestAppointment`, `useServices`, `useSwipe`, `useVet`, `useVets` |
| [`src/hooks/useDebounced.ts`](file:///src/hooks/useDebounced.ts) | - | `useDebounced` |
| [`src/providers/AuthProvider.tsx`](file:///src/providers/AuthProvider.tsx) | `AuthProvider` | `useAuth` |
| [`src/providers/CartProvider.tsx`](file:///src/providers/CartProvider.tsx) | `CartProvider` | `useCart` |

## 📁 5. Estructura Detallada de Archivos y Símbolos

### Project Root Config/Doc
- [`.gitignore`](file:///.gitignore) — `8 líneas`
- [`README.md`](file:///README.md) — `88 líneas`
- [`app.json`](file:///app.json) — `14 líneas` *(Expo app: Pet Delivery (slug: pet-delivery, scheme: petdelivery))*

### Mobile App (Expo Router)
- [`app/(auth)/_layout.tsx`](file:///app/(auth)/_layout.tsx) — `5 líneas` *(comps: AuthLayout)*
- [`app/(auth)/login.tsx`](file:///app/(auth)/login.tsx) — `55 líneas` *(comps: LoginScreen; types: Values)*
- [`app/(auth)/register.tsx`](file:///app/(auth)/register.tsx) — `65 líneas` *(comps: RegisterScreen; types: Values)*
- [`app/(tabs)/_layout.tsx`](file:///app/(tabs)/_layout.tsx) — `40 líneas` *(comps: TabsLayout)*
- [`app/(tabs)/activity.tsx`](file:///app/(tabs)/activity.tsx) — `144 líneas` *(comps: ActivityScreen; types: Tab)*
- [`app/(tabs)/index.tsx`](file:///app/(tabs)/index.tsx) — `136 líneas` *(comps: AdoptFeedScreen)*
- [`app/(tabs)/profile.tsx`](file:///app/(tabs)/profile.tsx) — `56 líneas` *(comps: ProfileScreen)*
- [`app/(tabs)/shop.tsx`](file:///app/(tabs)/shop.tsx) — `123 líneas` *(comps: ShopScreen)*
- [`app/(tabs)/vets.tsx`](file:///app/(tabs)/vets.tsx) — `46 líneas` *(comps: VetsScreen)*
- [`app/_layout.tsx`](file:///app/_layout.tsx) — `61 líneas` *(comps: RootLayout)*
- [`app/adoption/[id].tsx`](file:///app/adoption/[id].tsx) — `84 líneas` *(comps: AdoptionRoute)*
- [`app/book/[vetId].tsx`](file:///app/book/[vetId].tsx) — `200 líneas` *(comps: BookRoute)*
- [`app/cart.tsx`](file:///app/cart.tsx) — `134 líneas` *(comps: CartScreen)*
- [`app/pet/new.tsx`](file:///app/pet/new.tsx) — `66 líneas` *(comps: NewPetScreen; types: Values)*
- [`app/vet/[id].tsx`](file:///app/vet/[id].tsx) — `91 líneas` *(comps: VetDetailRoute)*

### Project Root Config/Doc
- [`package.json`](file:///package.json) — `38 líneas` *(npm pkg: pet-delivery-app v0.1.0 (20 deps, 2 devDeps))*

### Web Admin Core/Config
- [`panel/.gitignore`](file:///panel/.gitignore) — `6 líneas`
- [`panel/.npmrc`](file:///panel/.npmrc) — `1 líneas`
- [`panel/README.md`](file:///panel/README.md) — `70 líneas`
- [`panel/next.config.ts`](file:///panel/next.config.ts) — `25 líneas`
- [`panel/package.json`](file:///panel/package.json) — `28 líneas` *(npm pkg: pet-delivery-panel v0.1.0 (6 deps, 7 devDeps))*
- [`panel/postcss.config.mjs`](file:///panel/postcss.config.mjs) — `2 líneas`

### Web Admin Panel (Next.js Page/Route)
- [`panel/src/app/(admin)/admin/actions.ts`](file:///panel/src/app/(admin)/admin/actions.ts) — `91 líneas` *(comps: Optional; fns: addMember, createVet, removeMember, setCommission, setVetStatus)*
- [`panel/src/app/(admin)/admin/nueva/page.tsx`](file:///panel/src/app/(admin)/admin/nueva/page.tsx) — `29 líneas`
- [`panel/src/app/(admin)/admin/page.tsx`](file:///panel/src/app/(admin)/admin/page.tsx) — `149 líneas`
- [`panel/src/app/(admin)/layout.tsx`](file:///panel/src/app/(admin)/layout.tsx) — `29 líneas`
- [`panel/src/app/(panel)/adopciones/[id]/page.tsx`](file:///panel/src/app/(panel)/adopciones/[id]/page.tsx) — `30 líneas`
- [`panel/src/app/(panel)/adopciones/actions.ts`](file:///panel/src/app/(panel)/adopciones/actions.ts) — `174 líneas` *(fns: createListing, setListingStatus, updateListing, updateRequest)*
- [`panel/src/app/(panel)/adopciones/nueva/page.tsx`](file:///panel/src/app/(panel)/adopciones/nueva/page.tsx) — `14 líneas`
- [`panel/src/app/(panel)/adopciones/page.tsx`](file:///panel/src/app/(panel)/adopciones/page.tsx) — `135 líneas` *(types: Sb)*
- [`panel/src/app/(panel)/ajustes/actions.ts`](file:///panel/src/app/(panel)/ajustes/actions.ts) — `36 líneas` *(fns: saveSettings)*
- [`panel/src/app/(panel)/ajustes/page.tsx`](file:///panel/src/app/(panel)/ajustes/page.tsx) — `53 líneas`
- [`panel/src/app/(panel)/citas/actions.ts`](file:///panel/src/app/(panel)/citas/actions.ts) — `57 líneas` *(fns: updateAppointment)*
- [`panel/src/app/(panel)/citas/page.tsx`](file:///panel/src/app/(panel)/citas/page.tsx) — `113 líneas`
- [`panel/src/app/(panel)/layout-actions.ts`](file:///panel/src/app/(panel)/layout-actions.ts) — `18 líneas` *(fns: switchActiveVet)*
- [`panel/src/app/(panel)/layout.tsx`](file:///panel/src/app/(panel)/layout.tsx) — `83 líneas`
- [`panel/src/app/(panel)/page.tsx`](file:///panel/src/app/(panel)/page.tsx) — `68 líneas`
- [`panel/src/app/(panel)/pedidos/actions.ts`](file:///panel/src/app/(panel)/pedidos/actions.ts) — `40 líneas` *(fns: updateOrder)*
- [`panel/src/app/(panel)/pedidos/page.tsx`](file:///panel/src/app/(panel)/pedidos/page.tsx) — `104 líneas`
- [`panel/src/app/(panel)/productos/[id]/page.tsx`](file:///panel/src/app/(panel)/productos/[id]/page.tsx) — `27 líneas`
- [`panel/src/app/(panel)/productos/actions.ts`](file:///panel/src/app/(panel)/productos/actions.ts) — `181 líneas` *(fns: createProduct, importProducts, quickUpdateProduct, toggleProduct, updateProduct)*
- [`panel/src/app/(panel)/productos/importar/page.tsx`](file:///panel/src/app/(panel)/productos/importar/page.tsx) — `30 líneas`
- [`panel/src/app/(panel)/productos/nuevo/page.tsx`](file:///panel/src/app/(panel)/productos/nuevo/page.tsx) — `14 líneas`
- [`panel/src/app/(panel)/productos/page.tsx`](file:///panel/src/app/(panel)/productos/page.tsx) — `76 líneas`
- [`panel/src/app/(panel)/productos/plantilla/route.ts`](file:///panel/src/app/(panel)/productos/plantilla/route.ts) — `13 líneas` *(comps: GET)*
- [`panel/src/app/(panel)/servicios/actions.ts`](file:///panel/src/app/(panel)/servicios/actions.ts) — `41 líneas` *(fns: saveService)*
- [`panel/src/app/(panel)/servicios/page.tsx`](file:///panel/src/app/(panel)/servicios/page.tsx) — `66 líneas`
- [`panel/src/app/globals.css`](file:///panel/src/app/globals.css) — `16 líneas`
- [`panel/src/app/layout.tsx`](file:///panel/src/app/layout.tsx) — `15 líneas` *(comps: RootLayout)*
- [`panel/src/app/login/actions.ts`](file:///panel/src/app/login/actions.ts) — `23 líneas` *(fns: signIn, signOut)*
- [`panel/src/app/login/page.tsx`](file:///panel/src/app/login/page.tsx) — `29 líneas`
- [`panel/src/app/sin-acceso/page.tsx`](file:///panel/src/app/sin-acceso/page.tsx) — `31 líneas`

### Web Admin Component
- [`panel/src/components/ListingForm.tsx`](file:///panel/src/components/ListingForm.tsx) — `83 líneas` *(comps: ListingForm; types: Props)*
- [`panel/src/components/NavLink.tsx`](file:///panel/src/components/NavLink.tsx) — `18 líneas` *(comps: NavLink)*
- [`panel/src/components/ProductForm.tsx`](file:///panel/src/components/ProductForm.tsx) — `40 líneas` *(comps: ProductForm)*
- [`panel/src/components/SubmitButton.tsx`](file:///panel/src/components/SubmitButton.tsx) — `20 líneas` *(comps: SubmitButton)*
- [`panel/src/components/ui.tsx`](file:///panel/src/components/ui.tsx) — `72 líneas` *(comps: Badge, Card, Empty, ErrorBanner, Field, OkBanner, PageHeader; types: Tone)*

### Web Admin Library/Service
- [`panel/src/lib/admin-schemas.ts`](file:///panel/src/lib/admin-schemas.ts) — `26 líneas` *(types: AdminMember, AdminVet)*
- [`panel/src/lib/auth.ts`](file:///panel/src/lib/auth.ts) — `74 líneas` *(fns: failTo, isAdminUser, requireAdmin, requireVet; types: Supabase, VetMembership)*
- [`panel/src/lib/format.ts`](file:///panel/src/lib/format.ts) — `45 líneas` *(fns: bogotaDayRange, bogotaMonthStart, errText, formatCOP, formatDate)*
- [`panel/src/lib/schemas.ts`](file:///panel/src/lib/schemas.ts) — `109 líneas` *(types: AppointmentRow, ListingRow, OrderRow, ProductRow, RequestRow)*
- [`panel/src/lib/status.ts`](file:///panel/src/lib/status.ts) — `49 líneas` *(fns: nextOrderStep)*
- [`panel/src/lib/supabase/server.ts`](file:///panel/src/lib/supabase/server.ts) — `22 líneas` *(fns: createClient)*

### Web Admin Core/Config
- [`panel/src/proxy.ts`](file:///panel/src/proxy.ts) — `43 líneas` *(fns: proxy)*
- [`panel/tsconfig.json`](file:///panel/tsconfig.json) — `41 líneas`
- [`panel/tsconfig.tsbuildinfo`](file:///panel/tsconfig.tsbuildinfo) — `1 líneas`

### Project Root Config/Doc
- [`project_map.json`](file:///project_map.json) — `2091 líneas`
- [`project_map.md`](file:///project_map.md) — `268 líneas`

### Mobile Component
- [`src/components/PetCard.tsx`](file:///src/components/PetCard.tsx) — `88 líneas` *(comps: PetCard)*
- [`src/components/SwipeDeck.tsx`](file:///src/components/SwipeDeck.tsx) — `138 líneas` *(comps: SwipeDeck; types: SwipeDirection)*
- [`src/components/extras.tsx`](file:///src/components/extras.tsx) — `82 líneas` *(comps: Footer, OptionTile, PricePill; fns: productTile; types: TileProps)*
- [`src/components/ui.tsx`](file:///src/components/ui.tsx) — `242 líneas` *(comps: AuthShell, Avatar, Badge, Button, Card, Chip, ChipRow, EmptyState, ErrorState, Loading, Row, Screen, SectionTitle; types: ButtonProps, FieldProps)*

### Mobile Hook
- [`src/hooks/queries.ts`](file:///src/hooks/queries.ts) — `328 líneas` *(hooks: useAdoptionFeed, useCancelAppointment, useCancelOrder, useCreateOrder, useCreatePet, useListing, useMyAdoptionRequests, useMyAppointments, useMyOrders, useMyPets, useProducts, useRequestAdoption, useRequestAppointment, useServices, useSwipe, useVet, useVets; fns: useAdoptionFeed, useCancelAppointment, useCancelOrder, useCreateOrder, useCreatePet; types: AdoptionRequestInput, AppointmentInput, NewPetInput, OrderInput)*
- [`src/hooks/useDebounced.ts`](file:///src/hooks/useDebounced.ts) — `10 líneas` *(hooks: useDebounced; fns: useDebounced)*

### Mobile Library/Service
- [`src/lib/format.ts`](file:///src/lib/format.ts) — `30 líneas` *(fns: errMsg, formatAge, formatCOP, formatDateTime)*
- [`src/lib/schemas.ts`](file:///src/lib/schemas.ts) — `112 líneas` *(types: AdoptionRequest, Appointment, FeedListing, ListingDetail, Order)*
- [`src/lib/supabase.ts`](file:///src/lib/supabase.ts) — `49 líneas`

### Mobile Provider
- [`src/providers/AuthProvider.tsx`](file:///src/providers/AuthProvider.tsx) — `61 líneas` *(comps: AuthProvider; hooks: useAuth; fns: useAuth; types: AuthContextValue)*
- [`src/providers/CartProvider.tsx`](file:///src/providers/CartProvider.tsx) — `75 líneas` *(comps: CartProvider; hooks: useCart; fns: useCart; types: CartContextValue, CartLine)*

### Mobile Core
- [`src/theme.ts`](file:///src/theme.ts) — `21 líneas`

### Database & Backend (Supabase)
- [`supabase/admin.sql`](file:///supabase/admin.sql) — `160 líneas` *(fns: admin_add_vet_member, admin_create_vet, admin_members, admin_remove_vet_member, admin_set_vet_commission)*
- [`supabase/panel.sql`](file:///supabase/panel.sql) — `61 líneas`
- [`supabase/schema.sql`](file:///supabase/schema.sql) — `597 líneas` *(fns: cancel_my_appointment, cancel_my_order, create_order, get_adoption_feed, handle_new_user; tables: adoption_listings, adoption_requests, adoption_swipes, appointments, order_items)*
- [`supabase/seed.sql`](file:///supabase/seed.sql) — `95 líneas`

### Developer Tools
- [`tools/code_inspector.py`](file:///tools/code_inspector.py) — `633 líneas` *(fns: load_gitignore_patterns, main)*

### Project Root Config/Doc
- [`tsconfig.json`](file:///tsconfig.json) — `21 líneas`

---
*Generado automáticamente por `tools/code_inspector.py`*