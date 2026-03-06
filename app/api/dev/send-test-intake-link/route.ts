/**
 * POST /api/dev/send-test-intake-link
 * Dev-only: sends a test intake link to an arbitrary email address.
 * Guards: NODE_ENV !== 'production' AND profile.is_dev_sudo === true.
 * In production this route returns 403.
 */

import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getServerSupabase } from '@/lib/serverSupabase'
import { isSudoEnabled } from '@/lib/env'
import { sendIntakeLink } from '@/lib/emailService'

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  if (!isSudoEnabled()) {
    return NextResponse.json({ error: 'Sudo not enabled' }, { status: 403 })
  }

  try {
    const supabase = await getServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const admin = createSupabaseServerClientStrict()
    const { data: profile } = await admin
      .from('profiles')
      .select('id, firm_id, is_dev_sudo')
      .eq('id', user.id)
      .single()

    if (!profile || !(profile as { is_dev_sudo?: boolean }).is_dev_sudo) {
      return NextResponse.json({ error: 'Dev sudo required' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const firmId = (profile as { firm_id?: string }).firm_id
    if (!firmId) {
      return NextResponse.json({ error: 'No firm to create test lead' }, { status: 400 })
    }

    const portalToken = crypto.randomUUID()
    const portalTokenHash = sha256Hex(portalToken)

    const { data: lead, error } = await admin
      .from('leads')
      .insert({
        firm_id: firmId,
        status: 'draft',
        assigned_to_user_id: profile.id,
        client_email: email,
        client_full_name: 'Test recipient',
        matter_type: 'real_estate_purchase',
        property_address: null,
        intake_data: {},
        portal_token_hash: portalTokenHash,
        portal_token_created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !lead) {
      console.error('[dev/send-test-intake-link] insert error', error)
      return NextResponse.json({ error: 'Failed to create test lead' }, { status: 500 })
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const intakeUrl = `${origin}/intake/${portalToken}`

    await sendIntakeLink(email, 'Test recipient', intakeUrl)

    return NextResponse.json({
      success: true,
      sentTo: email,
      intakeUrl,
      leadId: lead.id,
    })
  } catch (e) {
    console.error('[dev/send-test-intake-link] error', e)
    const status = (e as { status?: number })?.status
    let message = e instanceof Error ? e.message : 'Internal server error'
    if (status === 401) {
      const isEu = process.env.MAILGUN_HOST?.includes('eu.mailgun.net')
      message = isEu
        ? 'Mailgun 401: For EU, use a Domain Sending Key. Mailgun Dashboard → Sending → your domain → Sending API keys → Add key, then set MAILGUN_API_KEY to that key.'
        : 'Mailgun 401: If you are in EU/Ireland, set MAILGUN_HOST=api.eu.mailgun.net in .env.local and use a Domain Sending Key (Sending → domain → Sending API keys) as MAILGUN_API_KEY.'
    }
    const httpStatus = message.includes('MAILGUN_DOMAIN') ? 400 : status === 401 ? 400 : 500
    return NextResponse.json({ error: message }, { status: httpStatus })
  }
}
