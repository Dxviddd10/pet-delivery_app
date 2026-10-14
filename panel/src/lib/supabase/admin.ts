import { createClient } from '@supabase/supabase-js';

/**
 * Cliente con privilegios de servicio (Service Role) para operaciones administrativas
 * como creación y gestión de usuarios en auth.users sin confirmación manual de email.
 * Solo disponible en el servidor si SUPABASE_SERVICE_ROLE_KEY está configurada.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
