/**
 * POST /api/dev/impersonate
 * Set dev_impersonate_user_id cookie and redirect to appropriate home for that user.
 * Only when isSudoEnabled() and current user has is_dev_sudo.
 * Logs to impersonation_sessions for audit.
 */

import { NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getServerSupabase } from '@/lib/serverSupabase'
import { isSudoEnabled } from '@/lib/env'

function getEnvLabel(): 'development' | 'staging' | 'production' {
  if (process.env.NODE_ENV === 'production') return 'production'
  if (process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'staging') return 'staging'
  return 'development'
}

export async function POST(request: Request) {
  if (!isSudoEnabled()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await getServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createSupabaseServerClientStrict()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_dev_sudo')
    .eq('id', user.id)
    .maybeSingle()

  if ((profile as { is_dev_sudo?: boolean } | null)?.is_dev_sudo !== true) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const userId = formData.get('userId')?.toString()
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const { data: targetProfile } = await admin
    .from('profiles')
    .select('role, firm_id, email')
    .eq('id', userId)
    .maybeSingle()

  if (!targetProfile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const targetFirmId = (targetProfile as { firm_id?: string | null }).firm_id
  if (process.env.NODE_ENV === 'production' && targetFirmId) {
    const { data: targetFirm } = await admin
      .from('firms')
      .select('is_test_firm')
      .eq('id', targetFirmId)
      .maybeSingle()
    if (!(targetFirm as { is_test_firm?: boolean })?.is_test_firm) {
      return NextResponse.json(
        { error: 'In production, impersonation is restricted to test firms only' },
        { status: 403 }
      )
    }
  }

  const env = getEnvLabel()
  const reason = formData.get('reason')?.toString() || null
  const { error: insertError } = await admin.from('impersonation_sessions').insert({
    impersonator_user_id: user.id,
    impersonated_user_id: userId,
    reason,
    env,
    metadata: { target_email: (targetProfile as { email?: string }).email ?? null },
  })

  if (insertError) {
    console.error('[dev-impersonate] Failed to log session:', insertError)
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[dev-impersonation]', { realUserId: user.id, impersonateId: userId, email: (targetProfile as { email?: string }).email })
  }

  const role = (targetProfile as { role?: string }).role ?? 'lawyer'
  const hasFirm = Boolean((targetProfile as { firm_id?: string | null }).firm_id)

  const redirectPath = role === 'client' ? '/portal' : hasFirm ? '/dashboard' : '/dashboard/register-firm'
  const url = new URL(redirectPath, request.url)

  const res = NextResponse.redirect(url, 302)
  res.cookies.set('dev_impersonate_user_id', userId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 4,
  })
  return res
}
