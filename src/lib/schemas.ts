import { z } from 'zod';

export const Species = z.enum(['dog', 'cat', 'other']);
export type Species = z.infer<typeof Species>;

export const FeedListing = z.object({
  id: z.string(),
  vet_id: z.string(),
  vet_name: z.string(),
  name: z.string(),
  species: Species,
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
});
export type FeedListing = z.infer<typeof FeedListing>;

export const Vet = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  address: z.string().nullable(),
  offers_home_visits: z.boolean(),
  home_fee: z.number(),
  delivery_fee: z.number(),
});
export type Vet = z.infer<typeof Vet>;

export const Service = z.object({
  id: z.string(),
  vet_id: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  duration_min: z.number(),
  price: z.number(),
  home_available: z.boolean(),
});
export type Service = z.infer<typeof Service>;

export const Product = z.object({
  id: z.string(),
  vet_id: z.string(),
  name: z.string(),
  brand: z.string().nullable(),
  price: z.number(),
  stock: z.number(),
  kind: z.enum(['food', 'accessory', 'otc_medicine', 'rx_medicine']),
  images: z.array(z.string()),
  vets: z.object({ name: z.string() }).nullable(),
});
export type Product = z.infer<typeof Product>;

export const Pet = z.object({
  id: z.string(),
  name: z.string(),
  species: Species,
  breed: z.string().nullable(),
  sex: z.enum(['male', 'female']).nullable(),
  weight_kg: z.number().nullable(),
});
export type Pet = z.infer<typeof Pet>;

export const Appointment = z.object({
  id: z.string(),
  mode: z.enum(['in_clinic', 'home']),
  scheduled_at: z.string(),
  status: z.enum(['requested', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show']),
  total: z.number(),
  vets: z.object({ name: z.string() }).nullable(),
  services: z.object({ name: z.string() }).nullable(),
  pets: z.object({ name: z.string() }).nullable(),
});
export type Appointment = z.infer<typeof Appointment>;

export const Order = z.object({
  id: z.string(),
  status: z.enum(['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']),
  delivery_mode: z.enum(['pickup', 'delivery']),
  total: z.number(),
  created_at: z.string(),
  vets: z.object({ name: z.string() }).nullable(),
  order_items: z.array(z.object({ name: z.string(), quantity: z.number() })),
});
export type Order = z.infer<typeof Order>;

export const AdoptionRequest = z.object({
  id: z.string(),
  status: z.enum(['pending', 'contacted', 'approved', 'rejected', 'withdrawn']),
  created_at: z.string(),
  adoption_listings: z.object({ name: z.string(), vets: z.object({ name: z.string() }).nullable() }).nullable(),
});
export type AdoptionRequest = z.infer<typeof AdoptionRequest>;

export const ListingDetail = z.object({
  id: z.string(),
  name: z.string(),
  species: Species,
  description: z.string().nullable(),
  vets: z.object({ name: z.string(), whatsapp: z.string().nullable() }).nullable(),
});
export type ListingDetail = z.infer<typeof ListingDetail>;

export const UuidParam = z.string().uuid();
