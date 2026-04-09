/**
 * GET /api/auth/post-login-redirect
 * Determines where to send the user after login and returns a 302 redirect.
 * Used instead of the post-login page to ensure reliable cookie/session handling.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserServer } from '@/lib/server/current-user'
import { needsTermsAcceptance } from '@/lib/terms-config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    let current = null
    try {
      current = await getCurrentUserServer()
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'PROFILE_NOT_FOUND') {
        return NextResponse.redirect(new URL('/auth/signin', request.url), 302)
      }
      throw e
    }

    if (!current) {
      return NextResponse.redirect(new URL('/auth/signin', request.url), 302)
    }

    const profile = current.profile as { firm_id?: string | null; role?: string | null; terms_version?: string | null; terms_accepted_at?: string | null }

    if (needsTermsAcceptance(profile.terms_version, profile.terms_accepted_at)) {
      return NextResponse.redirect(new URL('/auth/accept-terms', request.url), 302)
    }

    const role = (profile.role ?? 'lawyer') as string
    if (role === 'client') {
      return NextResponse.redirect(new URL('/portal', request.url), 302)
    }

    if (!profile.firm_id) {
      return NextResponse.redirect(new URL('/dashboard/register-firm', request.url), 302)
    }

    return NextResponse.redirect(new URL('/dashboard', request.url), 302)
  } catch (err) {
    console.error('[post-login-redirect] error:', err)
    return NextResponse.redirect(new URL('/auth/signin', request.url), 302)
  }
}
