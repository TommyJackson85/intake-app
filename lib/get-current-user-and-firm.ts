// lib/get-current-user-and-firm.ts
import { createSupabaseServerClientStrict } from './serverClientWithAuth'

export async function getCurrentUserAndFirm() {
  const supabase = await createSupabaseServerClientStrict()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('UNAUTHENTICATED')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, firm_id, full_name, email')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('PROFILE_NOT_FOUND')
  }

  const { data: firm, error: firmError } = await supabase
    .from('firms')
    .select('id, name, firm_state, created_at')
    .eq('id', profile.firm_id)
    .single()

  if (firmError || !firm) {
    throw new Error('FIRM_NOT_FOUND')
  }

  return { supabase, user, profile, firm }
}
