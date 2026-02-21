/**
 * POST /api/auth/demo-login
 * Signs in as the demo lawyer (sandbox firm). Credentials from env; no sudo.
 * Safe for production: only allows logging into the single demo firm account.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

  const redirectUrl = new URL('/auth/post-login', request.url)
  const res = NextResponse.redirect(redirectUrl, 302)
  cookieChunks.forEach(header => {
    res.headers.append('Set-Cookie', header)
  })
  return res
}
