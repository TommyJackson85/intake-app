// app/api/leads/route.ts - UPDATED
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/emailService'
import { logAuditEvent } from '@/lib/auditLog'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'

// CSRF-ish Origin/Referrer check
function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  const allowedOrigins = [
    'http://localhost:3000',
    'https://lawintake.io',
    process.env.NEXT_PUBLIC_APP_URL ?? '',
  ]

  let checkOrigin: string | undefined

  if (origin) {
    checkOrigin = origin
  } else if (referer) {
    try {
      checkOrigin = new URL(referer).origin
    } catch {
      checkOrigin = undefined
    }
  }

  // If we still don't have a valid origin, fail fast
  if (!checkOrigin) {
    return false
  }

  return allowedOrigins.some((allowed) => {
    if (!allowed) return false
    return checkOrigin!.includes(allowed)
  })
}

export async function POST(request: NextRequest) {
  // ✓ Validate origin
  if (!validateOrigin(request)) {
    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403 },
    )
  }

  // ✓ Validate Content-Type
  const contentType = request.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    return NextResponse.json(
      { error: 'Content-Type must be application/json' },
      { status: 400 },
    )
  }

  try {
    const { email, firm_name, state } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 },
      )
    }

    // ... rest of your existing code
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
