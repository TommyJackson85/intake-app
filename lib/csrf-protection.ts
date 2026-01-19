// lib/csrf-protection.ts - CSRF token generation & validation
// Copy-paste ready - prevents cross-site request forgery

import crypto from 'crypto';

/**
 * Generate CSRF token (secure random string)
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate CSRF token for user session
 * Tokens are bound to user + timestamp for extra security
 */
export function generateUserCSRFToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now().toString();
  const data = `${token}:${userId}:${timestamp}`;
  return Buffer.from(data).toString('base64');
}

/**
 * Validate CSRF token from request
 * Must match token in cookie + session
 */
export function validateCSRFToken(
  tokenFromForm: string,
  tokenFromCookie: string
): boolean {
  if (!tokenFromForm || !tokenFromCookie) {
    return false;
  }

  try {
    // ✅ Constant-time comparison prevents timing attacks
    return constantTimeCompare(tokenFromForm, tokenFromCookie);
  } catch {
    return false;
  }
}

/**
 * Validate user-bound CSRF token
 */
export function validateUserCSRFToken(
  tokenFromForm: string,
  tokenFromCookie: string,
  userId: string,
  maxAgeSeconds: number = 3600
): boolean {
  if (!tokenFromForm || !tokenFromCookie) {
    return false;
  }

  try {
    const decoded = Buffer.from(tokenFromCookie, 'base64').toString('utf-8');
    const [token, boundUserId, timestamp] = decoded.split(':');

    // Verify user binding
    if (boundUserId !== userId) {
      return false;
    }

    // Verify token age (1 hour default)
    const tokenAge = Math.floor((Date.now() - parseInt(timestamp)) / 1000);
    if (tokenAge > maxAgeSeconds) {
      return false;
    }

    // Constant-time comparison
    return constantTimeCompare(tokenFromForm, tokenFromCookie);
  } catch {
    return false;
  }
}

/**
 * Constant-time string comparison
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Even if lengths don't match, do comparison to take same time
    const minLength = Math.min(a.length, b.length);
    let result = a.length ^ b.length;

    for (let i = 0; i < minLength; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Cookie options for CSRF token
 */
export const csrfCookieOptions = {
  httpOnly: true,        // ✅ Not accessible from JavaScript
  secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only
  sameSite: 'strict' as const, // ✅ Prevent cross-site cookie sending
  path: '/',
  maxAge: 3600,          // 1 hour
};

/**
 * Response headers to prevent caching of CSRF forms
 */
export const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Vary': 'Accept-Encoding',
};

export const csrfHeaders = {
  ...noCacheHeaders,
  'X-CSRF-Token': 'required',
};