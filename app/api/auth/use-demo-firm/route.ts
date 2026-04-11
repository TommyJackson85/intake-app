import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Legacy endpoint kept for backward compatibility.
  // Public demo is now fully client-side and in-memory at /demo.
  return NextResponse.redirect(new URL('/demo', request.url), 302)
}

export async function GET(request: Request) {
  // Redirect GET requests (e.g. bookmarks, direct navigation) to the demo page
  // instead of returning a 405 which browsers download as a file.
  return NextResponse.redirect(new URL('/demo', request.url), 302)
}
