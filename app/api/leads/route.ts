// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/serverClientService'
import { logAuditEvent } from '@/lib/auditLog'
import { sendWelcomeEmail } from '@/lib/emailService'
import { limitLeads } from '@/lib/rate-limit'
import { assertScope, REQUIRED_SCOPES } from '@/lib/api-scope'
import { getFirmFromApiKeyWithScopes } from '@/lib/get-firm-api-key'

export async function POST(request: NextRequest) {
  try {
    // 1) Rate limit per firm or IP
    const rate = await limitLeads(request)
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many lead submissions. Please try again later.' },
        { status: 429 },
      )
    }

    // 2) Resolve firm + scopes from API key
    const apiKey = request.headers.get('x-firm-api-key')
    const apiKeyResult = await getFirmFromApiKeyWithScopes(apiKey)
    const firmId = apiKeyResult.firm_id as string
    const scopes = apiKeyResult.scopes

    // 3) Check permission for this action
    assertScope(scopes, REQUIRED_SCOPES.createLead)

    // 4) Basic content-type and body validation
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 },
      )
    }

    const { email, firm_name, state } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 },
      )
    }

    // 5) Derive IP address (best-effort)
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined

    // 6) Check if this email already exists for this firm
    const { data: existing, error: existingError } = await supabaseService
      .from('marketing_leads')
      .select('id')
      .eq('firm_id', firmId)
      .eq('email', email)
      .maybeSingle()

    if (existingError) {
      console.error('Existing lead check failed:', existingError)
      // treat as non-fatal; continue
    }

    if (existing) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 200 },
      )
    }

    // 7) Insert new lead (firm-scoped)
    const { data: lead, error } = await supabaseService
      .from('marketing_leads')
      .insert([
        {
          firm_id: firmId,
          email,
          firm_name: firm_name || null,
          state: state || null,
          ip_address: ip || null,
          source: 'firm_integration',
        },
      ])
      .select()
      .maybeSingle()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 },
      )
    }

    // 8) Send welcome email (non-blocking)
    try {
      await sendWelcomeEmail(email, firm_name || 'Law Firm')
    } catch (emailError) {
      console.error('Email send failed (non-blocking):', emailError)
    }

    // 9) Log audit event (firm-scoped lead)
    await logAuditEvent({
      firm_id: firmId,
      user_id: null, // no per-user identity here
      event_type: 'create',
      entity_type: 'marketing_lead',
      entity_id: lead?.id,
      ip_address: ip,
      lawful_basis: 'Legitimate interest (lead generation)',
      details: {
        email,
        firm_name,
        state,
        via: 'api-key',
        rate_limit_remaining: rate.remaining,
      },
    })

    return NextResponse.json(
      { message: 'Lead saved', lead_id: lead?.id },
      { status: 201 },
    )
  } catch (error: any) {
    if (error.message === 'MISSING_API_KEY') {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
    }
    if (error.message === 'INVALID_API_KEY') {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 403 })
    }
    if (error.message === 'INSUFFICIENT_SCOPE') {
      return NextResponse.json({ error: 'Insufficient scope' }, { status: 403 })
    }

    console.error('Leads API error:', error)
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 },
    )
  }
}

