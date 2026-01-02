import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Apply CSRF check to all /api/* POST requests,
  // EXCEPT /api/internal/* which is protected by its own secret header.
  if (
    request.method === 'POST' &&
    request.nextUrl.pathname.startsWith('/api/')
  ) {
    const pathname = request.nextUrl.pathname

    // Skip CSRF for internal endpoints
    if (pathname.startsWith('/api/internal/')) {
      return NextResponse.next()
    }

    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')

    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    ]

    const requestOrigin = origin || (referer ? new URL(referer).origin : null)

    if (!allowedOrigins.some((allowed) => requestOrigin?.includes(allowed))) {
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}