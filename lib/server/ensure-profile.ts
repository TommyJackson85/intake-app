import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import type { User } from '@supabase/supabase-js'

/**
 * Ensure there is a row in public.profiles for the given auth user.
 * This is a defensive fallback in case the Supabase trigger that normally
 * creates profiles is missing or misconfigured in a given environment.
 */
export async function ensureProfileForUser(user: Pick<User, 'id' | 'email'>) {
  const admin = createSupabaseServerClientStrict()

  // 1) Try to read an existing profile
  const { data: existing, error: readError } = await admin
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

  // 3) Create a minimal profile row
  const { data: created, error: createError } = await admin
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
