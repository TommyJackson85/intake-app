/**
 * GET /api/auth/me
 * Returns the current user's profile and firm.
 * Uses service-role server-side, so it bypasses RLS and reliably returns is_demo_firm, is_demo_guest, etc.
 * Used by auth context to drive the demo banner when client-side Supabase RLS might block firm reads.
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
