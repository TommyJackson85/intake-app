/**
 * POST /api/dev/stop-impersonate
 * Clear dev_impersonate_user_id cookie and redirect to /dev/sudo.
 */

import { NextResponse } from 'next/server'
import { isSudoEnabled } from '@/lib/env'

export async function POST(request: Request) {
  if (!isSudoEnabled()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL('/dashboard/dev/sudo', request.url)
  const res = NextResponse.redirect(url, 302)
  res.cookies.set('dev_impersonate_user_id', '', { path: '/', maxAge: 0 })
  return res
}
