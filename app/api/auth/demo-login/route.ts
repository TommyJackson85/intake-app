import { NextResponse } from 'next/server'

/**
 * Legacy “demo login” endpoint — quarantined.
 *
 * Historically signed the visitor into a shared `is_demo_firm` Supabase tenant.
 * Public product demo is now the unauthenticated browser sandbox at `/demo`
 * (see docs/public-demo-sandbox.md). Keep this route as a compatibility redirect only;
 * do not restore session minting without an explicit product decision.
 */
export async function POST(request: Request) {
  return NextResponse.redirect(new URL('/demo', request.url), 302)
}

export async function GET(request: Request) {
  // Redirect GET (bookmarks, direct navigation) to the sandbox instead of 405.
  return NextResponse.redirect(new URL('/demo', request.url), 302)
}
