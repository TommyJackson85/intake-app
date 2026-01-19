/**
 * POST /auth/signin
 * Custom email/password authentication (not Supabase Auth)
 * 
 * Sets firm_id and user_id cookies on success
 * Copy this entire file to: app/auth/signin/route.ts
 */

import { NextRequest } from 'next/server'
import bcryptjs from 'bcryptjs'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { setSessionCookies, getClientIp } from '@/lib/session'
import { logLogin } from '@/lib/auditLog'
import {
  unauthorizedResponse,
  badRequestResponse,
  serverErrorResponse,
  jsonResponse,
} from '@/lib/apiResponse'
import { SignInRequest, SignInResponse } from '@/types/database'

/**
 * POST /auth/signin
 * Authenticate user with email/password
 * Sets session cookies on success
 */
export async function POST(request: NextRequest) {
  try {
    const body: SignInRequest = await request.json()
    const ip = getClientIp(request)

    // Validate input
    if (!body.email || !body.password) {
      return badRequestResponse('Email and password are required')
    }

    // Normalize email
    const email = body.email.toLowerCase()

    // Look up user in profiles table
    const { data: profile, error: queryError } = await createSupabaseServerClientStrict()
      .from('profiles')
      .select('id, email, password_hash, firm_id, role')
      .eq('email', email)
      .single()

    if (queryError) {
      console.error('[SignIn] Query error:', queryError)
      // Don't reveal whether email exists (security)
      return unauthorizedResponse('Invalid email or password')
    }

    if (!profile) {
      // Log failed attempt
      await logLogin('unknown', 'unknown', ip, false)
      return unauthorizedResponse('Invalid email or password')
    }

    // Verify password hash
    const isValidPassword = await bcryptjs.compare(
      body.password,
      profile.password_hash || ''
    )

    if (!isValidPassword) {
      // Log failed attempt
      await logLogin(profile.id, profile.firm_id, ip, false)
      return unauthorizedResponse('Invalid email or password')
    }

    // Create response and set cookies
    const response = jsonResponse({ success: true }, 200)

    // Set firm_id cookie
    response.cookies.set('firm_id', profile.firm_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    // Set user_id cookie
    response.cookies.set('user_id', profile.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    // Log successful login
    await logLogin(profile.id, profile.firm_id, ip, true)

    return response
  } catch (err: any) {
    console.error('[SignIn] Exception:', err)
    return serverErrorResponse(err)
  }
}