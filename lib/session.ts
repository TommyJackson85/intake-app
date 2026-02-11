// lib/session.ts - Session utilities with getClientIp added
// Updated to include getClientIp function + Next.js 15+ await fixes

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

import { createSupabaseServerClientStrict } from './serverClientStrict';
const supabase = async () => await createSupabaseServerClientStrict()

// ============================================
// Get Client IP Address
// ============================================

/**
 * Extract client IP from request headers
 * Handles X-Forwarded-For, X-Real-IP, and direct connections
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback for direct connections
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) {
    return cf.trim();
  }

  return 'unknown';
}

// ============================================
// Cookie Management (Next.js 15+ async)
// ============================================

/**
 * Get user ID from session cookie
 * ✅ Next.js 15+: cookies() returns Promise, must await
 */
export async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies(); // ✅ MUST await in Next.js 15+
    return cookieStore.get('user_id')?.value || null;
  } catch (error) {
    console.error('[Session] getUserId error:', error);
    return null;
  }
}

/**
 * Get firm ID from session cookie
 * ✅ Next.js 15+: cookies() returns Promise, must await
 */
export async function getFirmId(): Promise<string | null> {
  try {
    const cookieStore = await cookies(); // ✅ MUST await in Next.js 15+
    return cookieStore.get('firm_id')?.value || null;
  } catch (error) {
    console.error('[Session] getFirmId error:', error);
    return null;
  }
}

/**
 * Get session token from cookie
 * ✅ Next.js 15+: cookies() returns Promise, must await
 */
export async function getSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies(); // ✅ MUST await in Next.js 15+
    return cookieStore.get('session_token')?.value || null;
  } catch (error) {
    console.error('[Session] getSessionToken error:', error);
    return null;
  }
}

/**
 * Get all session cookies at once
 * ✅ Next.js 15+: cookies() returns Promise, must await
 */
export async function getAllSessionCookies(): Promise<{
  sessionToken: string | null;
  userId: string | null;
  firmId: string | null;
}> {
  try {
    const cookieStore = await cookies(); // ✅ MUST await in Next.js 15+

    return {
      sessionToken: cookieStore.get('session_token')?.value || null,
      userId: cookieStore.get('user_id')?.value || null,
      firmId: cookieStore.get('firm_id')?.value || null,
    };
  } catch (error) {
    console.error('[Session] getAllSessionCookies error:', error);
    return {
      sessionToken: null,
      userId: null,
      firmId: null,
    };
  }
}

/**
 * Set session cookie
 * ✅ Next.js 15+: cookies() returns Promise, must await
 */
export async function setSessionCookie(
  name: string,
  value: string,
  options?: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
  }
): Promise<void> {
  try {
    const cookieStore = await cookies(); // ✅ MUST await in Next.js 15+

    cookieStore.set(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: options?.maxAge || 30 * 60, // 30 minutes default
      ...options,
    });
  } catch (error) {
    console.error('[Session] setSessionCookie error:', error);
  }
}

/**
 * Clear all session cookies
 * ✅ Next.js 15+: cookies() returns Promise, must await
 */
export async function clearSessionCookies(): Promise<void> {
  try {
    const cookieStore = await cookies(); // ✅ MUST await in Next.js 15+

    cookieStore.delete('session_token');
    cookieStore.delete('user_id');
    cookieStore.delete('firm_id');
    cookieStore.delete('_csrf');
  } catch (error) {
    console.error('[Session] clearSessionCookies error:', error);
  }
}

/**
 * Clear specific cookie
 * ✅ Next.js 15+: cookies() returns Promise, must await
 */
export async function clearCookie(name: string): Promise<void> {
  try {
    const cookieStore = await cookies(); // ✅ MUST await in Next.js 15+
    cookieStore.delete(name);
  } catch (error) {
    console.error(`[Session] clearCookie(${name}) error:`, error);
  }
}

// ============================================
// Session Verification
// ============================================

/**
 * Verify user is authenticated
 */
export async function verifyAuth(): Promise<{
  authenticated: boolean;
  userId?: string;
  firmId?: string;
} | null> {
  try {
    const sessionData = await getAllSessionCookies();

    if (!sessionData.sessionToken || !sessionData.userId) {
      return {
        authenticated: false,
      };
    }
    // Create client here
    const supabase = await createSupabaseServerClientStrict();
    // Optionally verify session in database
    const { data: session } = await supabase
      .from('sessions')
      .select('user_id, is_valid')
      .eq('token', sessionData.sessionToken)
      .single();

    if (!session?.is_valid) {
      return {
        authenticated: false,
      };
    }

    return {
      authenticated: true,
      userId: sessionData.userId,
      firmId: sessionData.firmId || undefined,
    };
  } catch (error) {
    console.error('[Session] verifyAuth error:', error);
    return null;
  }
}

// ============================================
// Session Cleanup
// ============================================

/**
 * Invalidate all sessions for a user
 * Call this on logout or password change
 */
export async function invalidateAllUserSessions(userId: string): Promise<boolean> {
  try {
    // Create client here
    const supabase = await createSupabaseServerClientStrict();
    const { error } = await supabase
      .from('sessions')
      .update({ is_valid: false })
      .eq('user_id', userId);

    if (error) {
      console.error('[Session] invalidateAllUserSessions error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Session] invalidateAllUserSessions error:', error);
    return false;
  }
}

/**
 * Get active sessions for a user
 */
export async function getUserActiveSessions(userId: string): Promise<any[] | null> {
  try {
    // Create client here
    const supabase = await createSupabaseServerClientStrict();
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id, ip_address, user_agent, created_at, last_activity')
      .eq('user_id', userId)
      .eq('is_valid', true)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('[Session] getUserActiveSessions error:', error);
      return null;
    }

    return sessions;
  } catch (error) {
    console.error('[Session] getUserActiveSessions error:', error);
    return null;
  }
}

/**
 * Create a new session record in database
 */
export async function createSessionRecord(
  userId: string,
  ipAddress: string,
  userAgent: string,
  tokenHash: string
): Promise<string | null> {
  try {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);
    // Create client here
    const supabase = await createSupabaseServerClientStrict();
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString(),
        last_activity: new Date().toISOString(),
        is_valid: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Session] createSessionRecord error:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('[Session] createSessionRecord error:', error);
    return null;
  }
}

/**
 * Cleanup expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    // Create client here
    const supabase = await createSupabaseServerClientStrict();
    const { data, error } = await supabase
      .from('sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      console.error('[Session] cleanupExpiredSessions error:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('[Session] cleanupExpiredSessions error:', error);
    return 0;
  }
}