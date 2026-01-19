// app/auth/signin/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs' // or whatever you used for hashing

import { getUserIdFromSession, requireSessionFirm } from '@/lib/session'

const firmId = await requireSessionFirm()
const userId = await getUserIdFromSession()

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // 1) Look up user in your own table (profiles or users)
    const { data: profile, error } = await createSupabaseServerClientStrict
      .from('profiles')
      .select('id, email, password_hash, firm_id')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !profile || !profile.password_hash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 2) Verify password
    const valid = await bcrypt.compare(password, profile.password_hash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 3) Create response and set cookies (firm_id, user_id)
    const res = NextResponse.json({ success: true })

    const cookieStore = await cookies()
    cookieStore.set('firm_id', String(profile.firm_id), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    })
    cookieStore.set('user_id', String(profile.id), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    })

    return res
  } catch (err) {
    console.error('Signin error:', err)
    return NextResponse.json(
      { error: 'Could not sign in' },
      { status: 500 }
    )
  }
}
