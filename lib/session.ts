/**
 * Session Management
 * Copy this entire file to: lib/session.ts
 * 
 * Handles reading firm_id and user_id from cookies in server components/routes
 */

import { cookies } from 'next/headers'
import { SessionContext } from '@/types/database'

/**
 * Get firm ID from session cookie (httpOnly, secure)
 * Use in API routes and server components
 * 
 * @example
 * const firmId = getFirmIdFromSession()
 * if (!firmId) return res.status(401).json({ error: 'Not authenticated' })
 */
export function getFirmIdFromSession(): string | null {
  try {
    const cookieStore = cookies()
    return cookieStore.get('firm_id')?.value || null
  } catch (err) {
    // In client components, cookies() throws; catch gracefully
    console.error('[Session] getFirmId error:', err)
    return null
  }
}

/**
 * Get user ID from session cookie
 * 
 * @example
 * const userId = getUserIdFromSession()
 */
export function getUserIdFromSession(): string | null {
  try {
    const cookieStore = cookies()
    return cookieStore.get('user_id')?.value || null
  } catch (err) {
    console.error('[Session] getUserId error:', err)
    return null
  }
}

/**
 * Verify BOTH firm_id and user_id are set
 * Use to protect routes that require authentication
 * 
 * @returns Session context or null if not authenticated
 * @example
 * const session = verifySession()
 * if (!session) return res.status(401).json({ error: 'Not authenticated' })
 * const { firmId, userId } = session
 */
export function verifySession(): SessionContext | null {
  const firmId = getFirmIdFromSession()
  const userId = getUserIdFromSession()

  if (!firmId || !userId) {
    return null
  }

  return {
    firmId,
    userId,
    userRole: 'lawyer', // Default; fetch actual role from DB if needed
  }
}

/**
 * Get IP address from request headers
 * Use for audit logging
 * 
 * @example
 * const ip = getClientIp(request)
 */
export function getClientIp(request: any): string | undefined {
  return (
    request?.headers?.get('x-forwarded-for') ||
    request?.headers?.get('x-real-ip') ||
    undefined
  )
}

/**
 * Set session cookies (used in signin route)
 * Server-side only
 * 
 * @example
 * setSessionCookies(firmId, userId)
 */
export async function setSessionCookies(
  firmId: string,
  userId: string
): Promise<void> {
  const cookieStore = cookies()

  cookieStore.set('firm_id', firmId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })

  cookieStore.set('user_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

/**
 * Clear session cookies (used in logout route)
 */
export async function clearSessionCookies(): Promise<void> {
  const cookieStore = cookies()

  cookieStore.set('firm_id', '', {
    maxAge: 0,
  })

  cookieStore.set('user_id', '', {
    maxAge: 0,
  })
}