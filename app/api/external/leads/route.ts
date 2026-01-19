// app/api/external/leads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getFirmFromApiKey } from '@/lib/get-firm-from-api-key'
import { logAuditEvent } from '@/lib/auditLog'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'// service-role client

import { assertScope, REQUIRED_SCOPES } from '@/lib/api-scope'
import { getFirmFromApiKeyWithScopes } from '@/lib/get-firm-api-key'

export async function POST(request: NextRequest) {
  try {
    // 1) Validate API key & resolve firm (for accountability only)
    const apiKey = request.headers.get('x-firm-api-key')
    const { firm_id, scopes } = await getFirmFromApiKeyWithScopes(apiKey)

    // Check permission for this action
    assertScope(scopes, REQUIRED_SCOPES.createLead)

    let firm
    try {
      firm = await getFirmFromApiKey(apiKey)
    } catch (e: any) {
      if (e.message === 'MISSING_API_KEY') {
        return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
      }
      if (e.message === 'INVALID_API_KEY') {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 403 })
      }
      throw e
    }

    const firmId = firm.id as string

    // 2) Validate body
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 },
      )
    }

    const { email, full_name, state } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 },
      )
    }

    // 3) Derive IP if available
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined

    // 4) Insert global marketing lead (no firm_id on marketing_leads)
    const { data: lead, error } = await createSupabaseServerClientStrict()
      .from('marketing_leads')
      .insert([
        {
          email,
          firm_name: full_name || null,
          state: state || null,
          ip_address: ip || null,
        },
      ])
      .select()
      .maybeSingle()

    if (error) {
      console.error('External leads insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 },
      )
    }

    // 5) Audit log (tie API usage to firm for GDPR/AML accountability)
    await logAuditEvent({
      firm_id: firmId, // which firm's API key was used
      user_id: null,
      event_type: 'create',
      entity_type: 'marketing_lead',
      entity_id: lead?.id,
      ip_address: ip,
      details: {
        email,
        full_name,
        state,
        via: 'external-api',
      },
      lawful_basis: 'Legitimate interest (lead generation)',
    })

    return NextResponse.json({ success: true, id: lead?.id }, { status: 201 })
  } catch (err) {
    console.error('External leads API error:', err)
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 },
    )
  }
}