/**
 * POST /api/auth/leave-demo-firm
 * Unlinks the current user from the demo firm (sets profile.firm_id to null).
 * Only applies when the user's current firm is the demo firm.
 * Uses session-bound anon client + RLS (user can only update own profile).
 */

import { getServerSupabase } from '@/lib/serverSupabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const registerFirmUrl = new URL('/dashboard/register-firm', request.url)

  const supabase = await getServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url), 302)
  }

  // RLS: user can read own profile and own firm
  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id')
    .eq('id', user.id)
    .single()

  if (!profile?.firm_id) {
    return NextResponse.redirect(registerFirmUrl, 302)
  }

  const { data: currentFirm } = await supabase
    .from('firms')
    .select('is_demo_firm')
    .eq('id', profile.firm_id)
    .single()

  if (!currentFirm?.is_demo_firm) {
    return NextResponse.redirect(registerFirmUrl, 302)
  }

  // RLS: Users can update own profile only
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ firm_id: null })
    .eq('id', user.id)

  if (updateError) {
    console.error('[leave-demo-firm] Failed to unlink profile:', updateError)
    registerFirmUrl.searchParams.set('demo_error', 'Could not leave demo. Please try again.')
    return NextResponse.redirect(registerFirmUrl, 302)
  }

  return NextResponse.redirect(registerFirmUrl, 302)
}
