/**
 * GET /api/auth/me
 * Returns the current user's profile and firm.
 * Uses getCurrentUserServer() which for normal/demo users reads via session-bound anon client (RLS).
 * For dev impersonation only, service-role is used. Auth context uses this for demo banner, nav, etc.
 */

import { NextResponse } from 'next/server'
import { getCurrentUserServer } from '@/lib/server/current-user'

export async function GET() {
  try {
    const current = await getCurrentUserServer()
    if (!current) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    return NextResponse.json({
      profile: current.profile,
      firm: current.firm,
      impersonating: current.impersonating ?? false,
      show_dev_sudo: current.show_dev_sudo ?? false,
    })
  } catch (err) {
    console.error('[auth/me] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
