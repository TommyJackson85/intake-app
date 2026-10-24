import { NextResponse } from 'next/server'

/**
 * Legacy “use demo firm” endpoint — quarantined.
 *
 * Historically linked a logged-in profile to the shared `is_demo_firm` tenant.
 * Public product demo is now `/demo` (docs/public-demo-sandbox.md). Compatibility
 * redirect only — do not restore firm-linking without an explicit product decision.
 */
export async function POST(request: Request) {
  return NextResponse.redirect(new URL('/demo', request.url), 302)
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/demo', request.url), 302)
}
