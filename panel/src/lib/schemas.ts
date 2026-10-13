import { z } from 'zod';

export const VetRow = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  address: z.string().nullable(),
  offers_home_visits: z.boolean(),
  home_fee: z.number(),
  delivery_fee: z.number(),
  commission_rate: z.number(),
  status: z.enum(['pending', 'active', 'suspended']),
});
export type VetRow = z.infer<typeof VetRow>;

export const Customer = z.object({ full_name: z.string(), phone: z.string().nullable() }).nullable();

export const AppointmentRow = z.object({
  id: z.string(),
  mode: z.enum(['in_clinic', 'home']),
  scheduled_at: z.string(),
  status: z.enum(['requested', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show']),
  total: z.number(),
  address: z.string().nullable(),
  notes: z.string().nullable(),
  profiles: Customer,
  services: z.object({ name: z.string() }).nullable(),
  pets: z.object({ name: z.string(), species: z.string(), breed: z.string().nullable() }).nullable(),
});
export type AppointmentRow = z.infer<typeof AppointmentRow>;

export const OrderRow = z.object({
  id: z.string(),
  status: z.enum(['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']),
  delivery_mode: z.enum(['pickup', 'delivery']),
  delivery_address: z.string().nullable(),
  subtotal: z.number(),
  delivery_fee: z.number(),
  commission_amount: z.number(),
  total: z.number(),
  payment_method: z.enum(['cash_on_delivery', 'transfer', 'online']),
  payment_status: z.enum(['pending', 'paid', 'refunded']),
  notes: z.string().nullable(),
  created_at: z.string(),
  profiles: Customer,
  order_items: z.array(z.object({ name: z.string(), quantity: z.number(), unit_price: z.number() })),
});
export type OrderRow = z.infer<typeof OrderRow>;

export const ListingRow = z.object({
  id: z.string(),
  name: z.string(),
  species: z.enum(['dog', 'cat', 'other']),
  breed: z.string().nullable(),
  sex: z.enum(['male', 'female']).nullable(),
  age_months: z.number().nullable(),
  size: z.enum(['small', 'medium', 'large']).nullable(),
  description: z.string().nullable(),
  temperament: z.string().nullable(),
  vaccinated: z.boolean(),
  sterilized: z.boolean(),
  dewormed: z.boolean(),
  photos: z.array(z.string()),
  status: z.enum(['draft', 'published', 'reserved', 'adopted', 'archived']),
});
export type ListingRow = z.infer<typeof ListingRow>;

export const RequestRow = z.object({
  id: z.string(),
  status: z.enum(['pending', 'contacted', 'approved', 'rejected', 'withdrawn']),
  message: z.string().nullable(),
  housing_type: z.string().nullable(),
  has_other_pets: z.boolean(),
  has_children: z.boolean(),
  vet_notes: z.string().nullable(),
  created_at: z.string(),
  listing_id: z.string(),
  profiles: Customer,
  adoption_listings: z.object({ name: z.string() }).nullable(),
});
export type RequestRow = z.infer<typeof RequestRow>;

export const ProductRow = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().nullable(),
  sku: z.string().nullable(),
  description: z.string().nullable(),
  price: z.number(),
  stock: z.number(),
  kind: z.enum(['food', 'accessory', 'otc_medicine', 'rx_medicine']),
  is_active: z.boolean(),
});
export type ProductRow = z.infer<typeof ProductRow>;

export const ServiceRow = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  duration_min: z.number(),
  price: z.number(),
  home_available: z.boolean(),
  is_active: z.boolean(),
});
export type ServiceRow = z.infer<typeof ServiceRow>;

export const Uuid = z.string().uuid();
