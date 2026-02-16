// app/api/auth/accept-terms/route.ts
// API route to accept updated terms

import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/session'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { CURRENT_TERMS_VERSION } from '@/lib/terms-config'

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
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

    const supabase = await createSupabaseServerClientStrict()

    // Update profile with terms acceptance
    const { error } = await supabase
      .from('profiles')
      .update({
        terms_accepted_at: new Date().toISOString(),
        terms_version: CURRENT_TERMS_VERSION,
        privacy_accepted_at: new Date().toISOString(), // Also update privacy acceptance
      })
      .eq('id', userId)

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
