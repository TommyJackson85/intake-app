import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/emailService'
import { logAuditEvent } from '@/lib/auditLog'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'

export async function POST(request: NextRequest) {
  try {
    const { email, firm_name, state } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServerClientStrict()

    // 1) Check if email already exists
    const { data: existing, error: existingError } = await supabase
      .from('marketing_leads')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingError) {
      console.error('Existing lead check failed:', existingError)
      // You can decide to treat this as non-fatal or return 500
    }

    if (existing) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 200 }
      )
    }

    // 2) Insert new lead
    const { data: lead, error } = await supabase
      .from('marketing_leads')
      .insert([
        {
          email,
          firm_name: firm_name || null,
          state: state || null,
          ip_address: request.headers.get('x-forwarded-for') || null,
        },
      ])
      .select()
      .maybeSingle()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      )
    }

    // 3) Send welcome email (non-blocking if it fails)
    try {
      await sendWelcomeEmail(email, firm_name || 'Law Firm')
    } catch (emailError) {
      console.error('Email send failed (non-blocking):', emailError)
    }

    // 4) Log audit event (optionally, if your logAuditEvent uses a different client)
    try {
      await logAuditEvent({
        firm_id: 'marketing', // or some fixed "system" firm_id
        user_id: null,
        event_type: 'marketing_lead_captured',
        entity_type: 'marketing_leads',
        entity_id: lead?.id,
        details: { email, firm_name, state },
        ip_address: request.headers.get('x-forwarded-for') || undefined,
        lawful_basis: 'legitimate_interest',
      })
    } catch (logError) {
      console.error('Audit logging failed (non-blocking):', logError)
    }

    return NextResponse.json(
      { message: 'Lead captured successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Lead capture error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}