// lib/session-management.ts - Secure session handling
// Copy-paste ready - session expiration, token rotation, forced logout

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ SESSION CONFIGURATION
export const SESSION_CONFIG = {
  LIFETIME: 30 * 60 * 1000,        // 30 minutes
  REFRESH_THRESHOLD: 5 * 60 * 1000, // Refresh if < 5 minutes left
  ABSOLUTE_MAX: 8 * 60 * 60 * 1000, // Absolute 8 hour max per day
};

/**
 * Secure cookie options
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,                                    // ✅ Prevents XSS access
  secure: process.env.NODE_ENV === 'production',   // ✅ HTTPS only in production
  sameSite: 'strict' as const,                      // ✅ Prevents CSRF
  path: '/',
  maxAge: SESSION_CONFIG.LIFETIME / 1000,           // Convert to seconds
};

/**
 * Create new session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create session record in database
 */
export async function createSession(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<{
  sessionId: string;
  token: string;
  expiresAt: Date;
} | null> {
  try {
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_CONFIG.LIFETIME);

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        token_hash: hashToken(token),
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString(),
        last_activity: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      return null;
    }

    return {
      sessionId: data.id,
      token,
      expiresAt,
    };
  } catch (error) {
    console.error('Session creation error:', error);
    return null;
  }
}

/**
 * Verify session token
 */
export async function verifySession(
  sessionToken: string,
  ipAddress: string
): Promise<{ userId: string; sessionId: string } | null> {
  try {
    const tokenHash = hashToken(sessionToken);

    // Get session from database
    const { data: session, error } = await supabase
      .from('sessions')
      .select('id, user_id, expires_at, ip_address, is_valid')
      .eq('token_hash', tokenHash)
      .eq('is_valid', true)
      .single();

    if (error || !session) {
      console.warn('Invalid session token');
      return null;
    }

    // ✅ Check expiration
    const expiresAt = new Date(session.expires_at);
    if (new Date() > expiresAt) {
      // Invalidate expired session
      await supabase
        .from('sessions')
        .update({ is_valid: false })
        .eq('id', session.id);
      return null;
    }

    // ✅ Verify IP address (optional: configurable)
    // if (session.ip_address !== ipAddress) {
    //   console.warn('Session IP mismatch - potential hijacking');
    //   await invalidateSession(session.id);
    //   return null;
    // }

    // ✅ Update last activity
    await supabase
      .from('sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', session.id);

    return {
      userId: session.user_id,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

/**
 * Rotate session token (generate new, invalidate old)
 */
export async function rotateSessionToken(
  oldSessionId: string,
  ipAddress: string,
  userAgent: string
): Promise<string | null> {
  try {
    // Get user from old session
    const { data: oldSession } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', oldSessionId)
      .single();

    if (!oldSession) {
      return null;
    }

    // Create new session
    const newSession = await createSession(
      oldSession.user_id,
      ipAddress,
      userAgent
    );

    if (!newSession) {
      return null;
    }

    // Invalidate old session
    await supabase
      .from('sessions')
      .update({ is_valid: false })
      .eq('id', oldSessionId);

    // Log rotation
    await logSessionEvent('SESSION_ROTATED', oldSession.user_id, {
      oldSessionId,
      newSessionId: newSession.sessionId,
    });

    return newSession.token;
  } catch (error) {
    console.error('Session rotation error:', error);
    return null;
  }
}

/**
 * Invalidate single session
 */
export async function invalidateSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ is_valid: false })
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to invalidate session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Session invalidation error:', error);
    return false;
  }
}

/**
 * ✅ CRITICAL: Invalidate ALL sessions for user
 * Call this on password change or security event
 */
export async function invalidateAllUserSessions(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sessions')
      .update({ is_valid: false })
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to invalidate all sessions:', error);
      return false;
    }

    // Log security event
    await logSessionEvent('ALL_SESSIONS_INVALIDATED', userId, {
      reason: 'password_change_or_security_event',
    });

    return true;
  } catch (error) {
    console.error('Error invalidating all sessions:', error);
    return false;
  }
}

/**
 * Check if session needs refreshing
 */
export function shouldRefreshSession(expiresAt: Date): boolean {
  const timeUntilExpiry = expiresAt.getTime() - Date.now();
  return timeUntilExpiry < SESSION_CONFIG.REFRESH_THRESHOLD;
}

/**
 * Hash session token
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Log session events for audit trail
 */
async function logSessionEvent(
  eventType: string,
  userId: string,
  metadata: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        event_type: eventType,
        user_id: userId,
        description: eventType.replace(/_/g, ' '),
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });
  } catch (error) {
    console.error('Failed to log session event:', error);
  }
}

/**
 * Get all active sessions for user
 */
export async function getUserActiveSessions(
  userId: string
): Promise<any[] | null> {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id, ip_address, user_agent, created_at, last_activity')
      .eq('user_id', userId)
      .eq('is_valid', true)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('Failed to get active sessions:', error);
      return null;
    }

    return sessions;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return null;
  }
}

/**
 * Cleanup expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      console.error('Failed to cleanup sessions:', error);
      return null;
    }

    return (data?.length || 0);
  } catch (error) {
    console.error('Cleanup error:', error);
    return null;
  }
}

// ============================================
// Database Schema
// ============================================
/*
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
  is_valid BOOLEAN NOT NULL DEFAULT true,
  
  CONSTRAINT token_hash_not_empty CHECK (token_hash != '')
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_is_valid ON sessions(is_valid);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Only service role and authenticated users can access their own
CREATE POLICY "Users can access their own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all" ON sessions
  FOR ALL USING (true) WITH CHECK (true);
*/