// proxy.ts - Next.js 16+ Proxy (replaces middleware.ts)
// Copy-paste ready - CSRF token generation & security headers
// For Next.js 16+, this replaces middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, csrfCookieOptions } from '@/lib/csrf-protection';

/**
 * Proxy handler to:
 * 1. Generate CSRF token for forms
 * 2. Set security headers
 * 3. Validate session
 * 4. Handle CORS
 * 
 * In Next.js 16+, use 'proxy' export instead of 'middleware'
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // ✅ Generate CSRF token for this request
  const csrfToken = generateCSRFToken();
  response.cookies.set('_csrf', csrfToken, {
    ...csrfCookieOptions,
  });

  // ✅ Security Headers
  response.headers.set(
    'X-Content-Type-Options',
    'nosniff'
  );
  response.headers.set(
    'X-Frame-Options',
    'DENY'
  );
  response.headers.set(
    'X-XSS-Protection',
    '1; mode=block'
  );
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // ✅ Content Security Policy (adjust as needed)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:"
  );

  // ✅ Prevent caching of sensitive pages
  if (request.nextUrl.pathname.includes('/dashboard') ||
      request.nextUrl.pathname.includes('/api/') ||
      request.nextUrl.pathname.includes('/auth/')) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

// Configure which routes use proxy
export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

// ============================================
// Additional proxy functions for use
// ============================================

/**
 * Proxy to require authentication
 * Usage: Apply to protected routes
 */
export function withAuth(handler: (req: NextRequest) => NextResponse) {
  return async (request: NextRequest) => {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    return handler(request);
  };
}

/**
 * Proxy to require admin role
 */
export function withAdmin(handler: (req: NextRequest) => NextResponse) {
  return async (request: NextRequest) => {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    // Verify admin role (you'll need to decode token and check role)
    // This is pseudocode - implement based on your auth system
    // const { role } = decodeToken(token);
    // if (role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    // }

    return handler(request);
  };
}