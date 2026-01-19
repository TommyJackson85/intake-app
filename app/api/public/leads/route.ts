// app/api/public/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { logAuditEvent } from '@/lib/auditLog'

export async function POST(request: NextRequest) {
  try {
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

    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      null

    // No firm_id here: this is pure marketing lead capture
    const { data: existing, error: existingError } = await createSupabaseServerClientStrict()
      .from('marketing_leads')
      .select('id')
      .is('firm_id', null)
      .eq('email', email)
      .maybeSingle()

    if (existingError) {
      console.error('Existing public lead check failed:', existingError)
    }

    if (existing) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 200 },
      )
    }

    const { data: lead, error } = await createSupabaseServerClientStrict()
      .from('marketing_leads')
      .insert([
        {
          firm_id: null,
          email,
          firm_name: firm_name || null,
          state: state || null,
          ip_address: ip || null,
          source: 'public_site',
        },
      ])
      .select()
      .maybeSingle()

    if (error) {
      console.error('Insert public lead error:', error)
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 },
      )
    }

    // Optional: centralised audit of public leads (firm_id = 'marketing')
    await logAuditEvent({
      firm_id: 'marketing', // special/system firm
      user_id: null,
      event_type: 'create',
      entity_type: 'marketing_lead',
      entity_id: lead?.id,
      ip_address: ip || undefined,
      details: {
        source: 'public_site',
        email,
        firm_name,
        state,
      },
      lawful_basis: 'Legitimate interest (lead generation)',
    })

    return NextResponse.json(
      { message: 'Lead saved', lead_id: lead?.id },
      { status: 201 },
    )
  } catch (error) {
    console.error('Public leads API error:', error)
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 },
    )
  }
}
