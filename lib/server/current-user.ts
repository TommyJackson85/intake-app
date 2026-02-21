import { cookies } from 'next/headers'
import { getServerSupabase } from '@/lib/serverSupabase'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { ensureProfileForUser } from '@/lib/server/ensure-profile'
import { isSudoEnabled } from '@/lib/env'

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  firm_id: string | null
  role: string | null
  terms_accepted_at?: string | null
  terms_version?: string | null
  privacy_accepted_at?: string | null
  is_dev_sudo?: boolean
  [key: string]: unknown
}

type FirmRow = {
  id: string
  name: string
  state: string
  email_contact: string | null
  is_test_firm: boolean
  is_demo_firm?: boolean
  created_at: string | null
  [key: string]: unknown
}

export type CurrentUserServer = {
  authUser: { id: string; email?: string }
  profile: ProfileRow
  firm: FirmRow | null
  /** True when a dev sudo user is impersonating another user; app should act as impersonated user. */
  impersonating?: boolean
}

export async function getCurrentUserServer(): Promise<CurrentUserServer | null> {
  const supabase = await getServerSupabase()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) return null

  const admin = createSupabaseServerClientStrict()
  const realUserId = data.user.id

  // Developer impersonation: if cookie set and current user is dev sudo in non-production, return impersonated user context
  const cookieStore = await cookies()
  const impersonateId = cookieStore.get('dev_impersonate_user_id')?.value
  if (impersonateId && impersonateId !== realUserId && isSudoEnabled()) {
    const { data: devProfile } = await admin
      .from('profiles')
      .select('id, is_dev_sudo')
      .eq('id', realUserId)
      .maybeSingle()
    const isDevSudo = (devProfile as { is_dev_sudo?: boolean } | null)?.is_dev_sudo === true
    if (isDevSudo) {
      const { data: targetProfile, error: targetProfileError } = await admin
        .from('profiles')
        .select('*')
        .eq('id', impersonateId)
        .maybeSingle()
      if (!targetProfileError && targetProfile) {
        let firm: FirmRow | null = null
        if (targetProfile.firm_id) {
          const { data: firmRow } = await admin
            .from('firms')
            .select('*')
            .eq('id', targetProfile.firm_id)
            .single()
          firm = firmRow as unknown as FirmRow | null
        }
        if (process.env.NODE_ENV !== 'production') {
          console.info('[dev-impersonation]', { realUserId, impersonateId, email: targetProfile.email })
        }
        return {
          authUser: { id: realUserId, email: data.user.email ?? undefined },
          profile: targetProfile as unknown as ProfileRow,
          firm,
          impersonating: true,
        }
      }
    }
  }

  const { data: profileRow, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', realUserId)
    .maybeSingle()

  let profile = profileRow

  if (profileError || !profile) {
    console.warn('[getCurrentUserServer] PROFILE_NOT_FOUND, attempting to create profile', {
      userId: realUserId,
      profileError,
    })
    profile = await ensureProfileForUser({
      id: realUserId,
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
    authUser: { id: realUserId, email: data.user.email ?? undefined },
    profile: profile as unknown as ProfileRow,
    firm,
  }
}

