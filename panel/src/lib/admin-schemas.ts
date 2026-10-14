import { z } from 'zod';

export const AdminVet = z.object({
  vet_id: z.string(),
  vet_name: z.string(),
  vet_status: z.enum(['pending', 'active', 'suspended']),
  commission_rate: z.coerce.number(),
  offers_home_visits: z.boolean(),
  city: z.string(),
  created_at: z.string(),
  delivered_orders: z.coerce.number(),
  sales: z.coerce.number(),
  commission: z.coerce.number(),
});
export type AdminVet = z.infer<typeof AdminVet>;

export const AdminMember = z.object({
  m_vet_id: z.string(),
  m_user_id: z.string(),
  m_email: z.string(),
  m_full_name: z.string(),
  m_role: z.enum(['owner', 'staff']),
});
export type AdminMember = z.infer<typeof AdminMember>;

export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
