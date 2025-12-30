import { NextRequest, NextResponse } from 'next/server'
//import { createClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/serverClient'
import { sendWelcomeEmail } from '@/lib/emailService'
import { logAuditEvent } from '@/lib/auditLog'

export async function POST(request: NextRequest) {
  try {
    const { email, firm_name, state } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Check if email already exists
    const { data: existing } = await supabase
      .from('marketing_leads')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 200 }
      )
    }

    // Insert new lead
    const { data: lead, error } = await supabase
      .from('marketing_leads')
      .insert([
        {
          email,
          firm_name: firm_name || null,
          state: state || null,
          ip_address: request.headers.get('x-forwarded-for') || request.ip,
        },
      ])
      .select()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      )
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(email, firm_name || 'Law Firm')
    } catch (emailError) {
      console.error('Email send failed (non-blocking):', emailError)
    }

    // Log event (no user context yet)
    await logAuditEvent({
      firm_id: 'marketing', // placeholder for public leads
      user_id: null,
      event_type: 'marketing_lead_captured',
      entity_type: 'marketing_leads',
      entity_id: lead?.id,
      details: { email, firm_name, state },
      ip_address: request.headers.get('x-forwarded-for') || request.ip,
      lawful_basis: 'legitimate_interest',
    })

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