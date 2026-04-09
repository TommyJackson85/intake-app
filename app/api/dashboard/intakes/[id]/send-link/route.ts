/**
 * POST /api/dashboard/intakes/[id]/send-link
 * Sends the intake link to the lead's client_email. Same-firm only.
 * Production-safe: only sends to the lead's own client_email (no arbitrary emails).
 */

import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/serverSupabase'
import { getCurrentUserServer } from '@/lib/server/current-user'
import { sendIntakeLink } from '@/lib/emailService'

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const current = await getCurrentUserServer()
    if (!current) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (!current.profile.firm_id) return NextResponse.json({ error: 'Firm required' }, { status: 400 })
    if ((current.profile.role ?? 'lawyer') === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    // Demo firm: block real outbound emails to external recipients
    if (current.firm?.is_demo_firm) {
      return NextResponse.json(
        { error: 'Sending intake links is disabled in demo mode. Register your own firm to send real emails.' },
        { status: 403 }
      )
    }

    const { id } = await ctx.params
    if (!id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const supabase = await getServerSupabase()
    const firmId = current.profile.firm_id

    const { data: lead, error } = await supabase
      .from('leads')
      .select('id, firm_id, client_email, client_full_name, portal_token_hash')
      .eq('id', id)
      .eq('firm_id', firmId)
      .single()

    if (error || !lead) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const clientEmail = lead.client_email
    if (!clientEmail) {
      return NextResponse.json({ error: 'Lead has no client email' }, { status: 400 })
    }

    // We don't have the raw token; we only have the hash. We need a way to send the link.
    // The intake URL requires the raw token. We cannot reconstruct it from the hash.
    // So "send link" must be called at creation time when we have the token, or we need to
    // store the token temporarily. For security, we typically don't store raw tokens.
    // Alternative: add a "resend" flow that generates a NEW token and sends it.
    const newToken = crypto.randomUUID()
    const tokenHash = sha256Hex(newToken)
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        portal_token_hash: tokenHash,
        portal_token_created_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('firm_id', firmId)

    if (updateError) {
      console.error('[send-link] update token error', updateError)
      return NextResponse.json({ error: 'Failed to generate link' }, { status: 500 })
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const intakeUrl = `${origin}/intake/${newToken}`

    await sendIntakeLink(clientEmail, lead.client_full_name || 'Client', intakeUrl)

    return NextResponse.json({ success: true, sentTo: clientEmail })
  } catch (e) {
    console.error('[send-link] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
