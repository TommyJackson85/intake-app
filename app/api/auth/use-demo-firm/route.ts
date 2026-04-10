import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Legacy endpoint kept for backward compatibility.
  // Public demo is now fully client-side and in-memory at /demo.
  return NextResponse.redirect(new URL('/demo', request.url), 302)
}
