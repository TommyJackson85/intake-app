// app/auth/logout/route.ts
// Logout via Supabase Auth session (SSR cookies) and clear legacy cookies.

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSupabase } from '@/lib/serverSupabase'

/**
 * POST /auth/logout
 * Handles logout by:
 * 1. Invalidating the session in the database
 * 2. Clearing all session cookies
 * 3. Signing out from Supabase auth
 * 4. Redirecting to login page
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabase()
    await supabase.auth.signOut()

    // Clear any legacy cookies from older session experiments.
    const cookieStore = await cookies()
    cookieStore.delete('session_token')
    cookieStore.delete('user_id')
    cookieStore.delete('firm_id')
    cookieStore.delete('_csrf')

    return NextResponse.redirect(new URL('/auth/signin', request.url), { status: 302 })
  } catch (error) {
    console.error('[Logout] Error during logout:', error)

    // Best-effort redirect.
    return NextResponse.redirect(new URL('/auth/signin', request.url), {
      status: 302,
    })
  }
}

/**
 * GET /auth/logout
 * Redirects to POST handler for compatibility
 */
export async function GET(request: NextRequest) {
  return POST(request)
}
