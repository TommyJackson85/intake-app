// app/api/auth/accept-terms/route.ts
// Accept updated terms for the currently authenticated user (Supabase Auth session).

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientWithAuth } from '@/lib/serverClientWithAuth'
import { CURRENT_TERMS_VERSION } from '@/lib/terms-config'
import { getServerSupabase } from '@/lib/serverSupabase'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabase()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { termsVersion } = body

    if (!termsVersion || termsVersion !== CURRENT_TERMS_VERSION) {
      return NextResponse.json(
        { error: 'Invalid terms version' },
        { status: 400 }
      )
    }

    const admin = await createSupabaseServerClientStrict()

    // Update profile with terms acceptance
    const { error } = await admin
      .from('profiles')
      .update({
        terms_accepted_at: new Date().toISOString(),
        terms_version: CURRENT_TERMS_VERSION,
        privacy_accepted_at: new Date().toISOString(), // Also update privacy acceptance
      })
      .eq('id', user.id)

    if (error) {
      console.error('[accept-terms] Error updating profile:', error)
      return NextResponse.json(
        { error: 'Failed to update terms acceptance' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[accept-terms] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
