import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Ensure there is a row in public.profiles for the given auth user.
 * This is a defensive fallback in case the Supabase trigger that normally
 * creates profiles is missing or misconfigured in a given environment.
 *
 * When client is provided (session-bound anon client), uses RLS: only the
 * authenticated user can insert their own profile (id = auth.uid()).
 * When client is omitted, uses service-role (admin) for admin/script contexts.
 */
export async function ensureProfileForUser(
  user: Pick<User, 'id' | 'email'>,
  client?: SupabaseClient<Database>
) {
  const supabase = client ?? createSupabaseServerClientStrict()

  // 1) Try to read an existing profile
  const { data: existing, error: readError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) {
    return existing
  }

  // 2) If the table/query itself is broken, surface that clearly
  if (readError && readError.code && readError.code !== 'PGRST116') {
    console.error('[ensureProfileForUser] profile read error', { userId: user.id, readError })
  }

  // 3) Create a minimal profile row (RLS allows INSERT where id = auth.uid() when using anon client)
  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email ?? null,
    })
    .select('*')
    .single()

  if (createError || !created) {
    console.error('[ensureProfileForUser] failed to create profile', {
      userId: user.id,
      createError,
    })
    return null
  }

  return created
}
