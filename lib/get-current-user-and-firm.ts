// lib/get-current-user-and-firm.ts
import { createSupabaseServerClientStrict } from './serverClientStrict'
import { ensureProfileForUser } from '@/lib/server/ensure-profile'

export type FirmRow = {
  id: string
  name: string
  state: string
  created_at: string | null
  is_demo_firm?: boolean
}

/**
 * Get current user and optionally their firm.
 * Use when the route requires a firm (e.g. clients, matters, AML).
 * For dashboard/UI that supports "no firm yet", use getCurrentUser() and check profile.firm_id.
 */
export async function getCurrentUserAndFirm(): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseServerClientStrict>>
  user: { id: string; email?: string }
  profile: { id: string; firm_id: string | null; full_name: string | null; email: string | null }
  firm: FirmRow
}> {
  const supabase = await createSupabaseServerClientStrict()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('UNAUTHENTICATED')
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('id, firm_id, full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  let profile = profileRow

  if (profileError || !profile) {
    const ensured = await ensureProfileForUser({ id: user.id, email: user.email ?? undefined })
    if (!ensured) {
      throw new Error('PROFILE_NOT_FOUND')
    }
    profile = {
      id: ensured.id,
      firm_id: (ensured as { firm_id?: string | null }).firm_id ?? null,
      full_name: (ensured as { full_name?: string | null }).full_name ?? null,
      email: (ensured as { email?: string | null }).email ?? null,
    }
  }

  if (!profile.firm_id) {
    throw new Error('FIRM_REQUIRED')
  }

  const { data: firm, error: firmError } = await supabase
    .from('firms')
    .select('id, name, state, created_at, is_demo_firm')
    .eq('id', profile.firm_id)
    .single()

  if (firmError || !firm) {
    throw new Error('FIRM_NOT_FOUND')
  }

  return { supabase, user, profile, firm: firm as FirmRow }
}

/**
 * Get current user and profile only. Firm may be null (user not yet registered a law firm).
 * Use for dashboard and anywhere you need to support "no firm" state.
 */
export async function getCurrentUser(): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseServerClientStrict>>
  user: { id: string; email?: string }
  profile: { id: string; firm_id: string | null; full_name: string | null; email: string | null }
  firm: FirmRow | null
}> {
  const supabase = await createSupabaseServerClientStrict()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('UNAUTHENTICATED')
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('id, firm_id, full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  let profile = profileRow

  if (profileError || !profile) {
    const ensured = await ensureProfileForUser({ id: user.id, email: user.email ?? undefined })
    if (!ensured) {
      throw new Error('PROFILE_NOT_FOUND')
    }
    profile = {
      id: ensured.id,
      firm_id: (ensured as { firm_id?: string | null }).firm_id ?? null,
      full_name: (ensured as { full_name?: string | null }).full_name ?? null,
      email: (ensured as { email?: string | null }).email ?? null,
    }
  }

  let firm: FirmRow | null = null
  if (profile.firm_id) {
    const { data: firmData } = await supabase
      .from('firms')
      .select('id, name, state, created_at, is_demo_firm')
      .eq('id', profile.firm_id)
      .single()
    firm = firmData as FirmRow | null
  }

  return { supabase, user, profile, firm }
}
