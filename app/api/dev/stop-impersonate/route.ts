/**
 * POST /api/dev/stop-impersonate
 * Clear dev_impersonate_user_id cookie, end impersonation session, redirect to /dev/sudo.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getServerSupabase } from '@/lib/serverSupabase'
import { isSudoEnabled } from '@/lib/env'

export async function POST(request: Request) {
  if (!isSudoEnabled()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await getServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cookieStore = await cookies()
  const impersonatedId = cookieStore.get('dev_impersonate_user_id')?.value

  if (impersonatedId) {
    const admin = createSupabaseServerClientStrict()
    const { data: openSessions } = await admin
      .from('impersonation_sessions')
      .select('id')
      .eq('impersonator_user_id', user.id)
      .eq('impersonated_user_id', impersonatedId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)

    if (openSessions?.[0]) {
      await admin
        .from('impersonation_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', openSessions[0].id)
    }
  }

  const url = new URL('/dashboard/dev/sudo', request.url)
  const res = NextResponse.redirect(url, 302)
  res.cookies.set('dev_impersonate_user_id', '', { path: '/', maxAge: 0 })
  return res
}
