/**
 * POST /api/auth/demo-login
 * Signs in as the demo lawyer (sandbox firm). Credentials from env; no sudo.
 * Safe for production: only allows logging into the single demo firm account.
 * Ensures the user's profile is linked to the demo firm so they reach the dashboard.
 */

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  const email = process.env.DEMO_LAWYER_EMAIL
  const password = process.env.DEMO_LAWYER_PASSWORD

  if (!url || !anonKey) {
    return NextResponse.json(
      { error: 'Server misconfigured' },
      { status: 503 }
    )
  }
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Demo login is not configured. Set DEMO_LAWYER_EMAIL and DEMO_LAWYER_PASSWORD.' },
      { status: 503 }
    )
  }

  const cookieChunks: string[] = []

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.headers.get('cookie')?.split('; ').find(row => row.startsWith(`${name}=`))?.split('=')[1]
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        const opts = options as { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: string }
        let header = `${name}=${value}; Path=${opts.path ?? '/'}; Max-Age=${opts.maxAge ?? 60 * 60 * 24 * 7}`
        if (opts.httpOnly) header += '; HttpOnly'
        if (opts.secure) header += '; Secure'
        if (opts.sameSite) header += `; SameSite=${opts.sameSite}`
        cookieChunks.push(header)
      },
      remove(name: string, options: Record<string, unknown>) {
        const opts = options as { path?: string }
        cookieChunks.push(`${name}=; Path=${opts.path ?? '/'}; Max-Age=0`)
      },
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json(
      { error: error.message || 'Demo login failed' },
      { status: 401 }
    )
  }
  if (!data.session) {
    return NextResponse.json(
      { error: 'No session returned' },
      { status: 500 }
    )
  }

  // On error, redirect back to firm-setup (where the button lives) with error message
  const fallbackUrl = new URL('/dashboard/firm-setup', request.url)

  if (!serviceRoleKey) {
    console.error('[demo-login] SUPABASE_SERVICE_ROLE_KEY missing')
    fallbackUrl.searchParams.set(
      'demo_error',
      'Demo not configured. Add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables.'
    )
    const res = NextResponse.redirect(fallbackUrl, 302)
    cookieChunks.forEach((header) => res.headers.append('Set-Cookie', header))
    return res
  }

  const admin = createClient<Database>(url!, serviceRoleKey)
  const { data: demoFirm } = await admin
    .from('firms')
    .select('id')
    .eq('is_demo_firm', true)
    .limit(1)
    .maybeSingle()

  if (!demoFirm) {
    console.error('[demo-login] No demo firm found')
    fallbackUrl.searchParams.set(
      'demo_error',
      'No demo firm found. Run the SQL in supabase/seed-demo-firm.sql in Supabase.'
    )
    const res = NextResponse.redirect(fallbackUrl, 302)
    cookieChunks.forEach((header) => res.headers.append('Set-Cookie', header))
    return res
  }

  // Use upsert so we create the profile with firm_id if it doesn't exist,
  // or update it if it does (UPDATE affects 0 rows when profile doesn't exist)
  const { error: upsertError } = await admin
    .from('profiles')
    .upsert(
      {
        id: data.session.user.id,
        email: data.session.user.email ?? null,
        firm_id: demoFirm.id,
        role: 'lawyer',
      },
      { onConflict: 'id' }
    )

  if (upsertError) {
    console.error('[demo-login] Failed to link profile:', upsertError)
    fallbackUrl.searchParams.set('demo_error', 'Demo setup failed. Check Supabase logs and SUPABASE_SERVICE_ROLE_KEY.')
    const res = NextResponse.redirect(fallbackUrl, 302)
    cookieChunks.forEach((header) => res.headers.append('Set-Cookie', header))
    return res
  }

  // Redirect directly to dashboard (profile now has firm_id)
  const redirectUrl = new URL('/dashboard', request.url)
  const res = NextResponse.redirect(redirectUrl, 302)
  cookieChunks.forEach(header => {
    res.headers.append('Set-Cookie', header)
  })
  return res
}
