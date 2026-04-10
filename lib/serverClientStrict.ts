import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client using the SERVICE ROLE key.
 * BYPASSES Row Level Security (RLS). Use ONLY for:
 * - Dev sudo / impersonation flows (guarded by isSudoEnabled())
 * - Administrative tasks (seeding demo data, migrations, maintenance)
 * - Public/unauthenticated lookups that cannot use session (e.g. intake form by token)
 *
 * For normal or demo user dashboard/data: use getServerSupabase() (anon key + session)
 * so RLS enforces firm-scoped access. NEVER use this in user-facing read/write paths
 * for profiles, firms, leads, matters, clients.
 */
export const createSupabaseServerClientStrict = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
