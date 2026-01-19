/**
 * Next.js Middleware - Route Protection
 * Copy this entire file to: middleware.ts (at project root, NOT in app/ folder)
 * 
 * Validates authentication before any request reaches your routes
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Protected routes that require authentication
 * Add more routes as needed
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/api/clients',
  '/api/clients/:id',
  '/api/matters',
  '/api/matters/:id',
  '/api/aml-checks',
  '/api/aml-checks/:id',
  '/api/gdpr/export',
  '/api/audit-logs',
]

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/api/leads', // External leads endpoint
  '/api/auth/signin', // Custom auth route
  '/_next',
  '/favicon.ico',
]

/**
 * Middleware function runs on EVERY request
 * Before the request reaches your route handler
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Read cookies set by the signin route
  const firmId = request.cookies.get('firm_id')?.value
  const userId = request.cookies.get('user_id')?.value

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    // Handle exact matches and pattern matches
    if (route.includes(':id')) {
      const pattern = route.replace(':id', '[^/]+')
      return new RegExp(`^${pattern}$`).test(pathname)
    }
    return pathname === route || pathname.startsWith(route)
  })

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => {
    if (route.includes(':id')) {
      const pattern = route.replace(':id', '[^/]+')
      return new RegExp(`^${pattern}$`).test(pathname)
    }
    return pathname.startsWith(route)
  })

  if (isProtectedRoute) {
    // If not authenticated, redirect to signin
    if (!firmId || !userId) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
  }

  return NextResponse.next()
}

/**
 * Configure which routes trigger middleware
 * Exclude static files, images, etc.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}