// app/auth/logout/route.ts
// Robust logout handler that clears all auth state

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { clearSessionCookies, invalidateAllUserSessions } from '@/lib/session'
import { getUserId } from '@/lib/session'

/**
 * POST /auth/logout
 * Handles logout by:
 * 1. Invalidating the session in the database
 * 2. Clearing all session cookies
 * 3. Signing out from Supabase auth
 * 4. Redirecting to login page
 */
export async function POST(request: NextRequest) {
  console.log('[Logout] Logout handler called')

  try {
    // Get user ID before clearing cookies
    const userId = await getUserId()

    // 1. Invalidate session in database if we have a user ID
    if (userId) {
      console.log('[Logout] Invalidating sessions for user:', userId)
      await invalidateAllUserSessions(userId)
    }

    // 2. Clear all session cookies
    console.log('[Logout] Clearing session cookies')
    await clearSessionCookies()

    // 3. Sign out from Supabase auth (clears Supabase session)
    try {
      const supabase = await createSupabaseServerClientStrict()
      await supabase.auth.signOut()
      console.log('[Logout] Supabase auth signout completed')
    } catch (supabaseError) {
      console.error('[Logout] Supabase signout error (non-critical):', supabaseError)
      // Continue even if Supabase signout fails
    }

    // 4. Clear any additional cookies that might exist
    const cookieStore = await cookies()
    cookieStore.delete('session_token')
    cookieStore.delete('user_id')
    cookieStore.delete('firm_id')
    cookieStore.delete('_csrf')

    console.log('[Logout] Logout completed successfully, redirecting to login')

    // 5. Redirect to login page
    return NextResponse.redirect(new URL('/auth/signin', request.url), {
      status: 302,
      headers: {
        // Ensure cookies are cleared by setting them to expire
        'Set-Cookie': [
          'session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict',
          'user_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict',
          'firm_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict',
        ].join(', '),
      },
    })
  } catch (error) {
    console.error('[Logout] Error during logout:', error)
    
    // Best-effort logout: clear cookies and redirect even on error
    try {
      await clearSessionCookies()
    } catch (clearError) {
      console.error('[Logout] Error clearing cookies:', clearError)
    }

    // Still redirect to login
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
