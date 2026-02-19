import { getServerSupabase } from '@/lib/serverSupabase'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { ensureProfileForUser } from '@/lib/server/ensure-profile'

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  firm_id: string | null
  role: string | null
  terms_accepted_at?: string | null
  terms_version?: string | null
  privacy_accepted_at?: string | null
  // Future/dev fields may exist; keep this permissive.
  [key: string]: unknown
}

type FirmRow = {
  id: string
  name: string
  state: string
  email_contact: string | null
  is_test_firm: boolean
  created_at: string | null
  [key: string]: unknown
}

export type CurrentUserServer = {
  authUser: { id: string; email?: string }
  profile: ProfileRow
  firm: FirmRow | null
}

export async function getCurrentUserServer(): Promise<CurrentUserServer | null> {
  const supabase = await getServerSupabase()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) return null

  const admin = createSupabaseServerClientStrict()

  const { data: profileRow, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  let profile = profileRow

  if (profileError || !profile) {
    console.warn('[getCurrentUserServer] PROFILE_NOT_FOUND, attempting to create profile', {
      userId: data.user.id,
      profileError,
    })
    profile = await ensureProfileForUser({
      id: data.user.id,
      email: data.user.email ?? undefined,
    })
  }

  if (!profile) {
    throw new Error('PROFILE_NOT_FOUND')
  }

  let firm: FirmRow | null = null
  if (profile.firm_id) {
    const { data: firmRow, error: firmError } = await admin
      .from('firms')
      .select('*')
      .eq('id', profile.firm_id)
      .single()
    if (!firmError && firmRow) firm = firmRow as unknown as FirmRow
  }

  return {
    authUser: { id: data.user.id, email: data.user.email ?? undefined },
    profile: profile as unknown as ProfileRow,
    firm,
  }
}

