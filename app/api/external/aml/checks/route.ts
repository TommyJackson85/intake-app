// app/api/external/aml/checks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getFirmFromApiKey } from '@/lib/get-firm-from-api-key'
import { logAuditEvent } from '@/lib/auditLog'

import { assertScope, REQUIRED_SCOPES } from '@/lib/api-scope'
import { getFirmFromApiKeyWithScopes } from '@/lib/get-firm-api-key'

export async function POST(request: NextRequest) {

  const apiKey = request.headers.get('x-firm-api-key')
  const { firm_id, scopes } = await getFirmFromApiKeyWithScopes(apiKey)

  // Check permission for this action
  assertScope(scopes, REQUIRED_SCOPES.createLead)
  try {
    // 1) Identify firm from API key
    const apiKey = request.headers.get('x-firm-api-key')

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

    // 2) Validate content type
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 },
      )
    }

    // 3) Parse and validate body (basic)
    const body = await request.json()

    const {
      client_id,
      check_type,
      check_status,
      notes,
      has_pep_flag,
      has_sanctions_flag,
      has_high_risk_jurisdiction,
    } = body || {}

    if (!client_id || typeof client_id !== 'string') {
      return NextResponse.json(
        { error: 'client_id is required (UUID string)' },
        { status: 400 },
      )
    }

    if (!check_type || typeof check_type !== 'string') {
      return NextResponse.json(
        { error: 'check_type is required' },
        { status: 400 },
      )
    }

    if (!check_status || typeof check_status !== 'string') {
      return NextResponse.json(
        { error: 'check_status is required' },
        { status: 400 },
      )
    }

    // Optional: basic enums, adjust to your schema
    const allowedTypes = ['CDD', 'KYC', 'PEP_SCREENING', 'SANCTIONS']
    const allowedStatuses = ['PENDING', 'PASSED', 'FLAGGED', 'ESCALATED']

    if (!allowedTypes.includes(check_type)) {
      return NextResponse.json(
        { error: `check_type must be one of: ${allowedTypes.join(', ')}` },
        { status: 400 },
      )
    }

    if (!allowedStatuses.includes(check_status)) {
      return NextResponse.json(
        { error: `check_status must be one of: ${allowedStatuses.join(', ')}` },
        { status: 400 },
      )
    }

    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined

    // 4) (Optional but recommended) Ensure client belongs to this firm
    const { data: client, error: clientError } = await createSupabaseServerClientStrict()
      .from('clients')
      .select('id, firm_id')
      .eq('id', client_id)
      .eq('firm_id', firmId)
      .maybeSingle()

    if (clientError) {
      console.error('Client lookup error:', clientError)
      return NextResponse.json(
        { error: 'Failed to verify client' },
        { status: 500 },
      )
    }

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found for this firm' },
        { status: 404 },
      )
    }

    // 5) Insert AML check
    const { data: amlCheck, error: amlError } = await createSupabaseServerClientStrict()
      .from('aml_checks')
      .insert([
        {
          firm_id: firmId,
          client_id,
          check_type,
          check_status,
          notes: notes || null,
          has_pep_flag: has_pep_flag ?? null,
          has_sanctions_flag: has_sanctions_flag ?? null,
          has_high_risk_jurisdiction: has_high_risk_jurisdiction ?? null,
        },
      ])
      .select()
      .maybeSingle()

    if (amlError) {
      console.error('AML check insert error:', amlError)
      return NextResponse.json(
        { error: 'Failed to save AML check' },
        { status: 500 },
      )
    }

    // 6) Audit log (highly confidential)
    await logAuditEvent({
      firm_id: firmId,
      user_id: null, // external integration, no per-user identity
      event_type: 'create',
      entity_type: 'aml_check',
      entity_id: amlCheck?.id,
      ip_address: ip,
      lawful_basis: 'Legal obligation (AML/KYC)',
      details: {
        client_id,
        check_type,
        check_status,
        via: 'external-api',
      },
    })

    return NextResponse.json(
      { success: true, id: amlCheck?.id },
      { status: 201 },
    )
  } catch (error) {
    console.error('External AML checks API error:', error)
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 },
    )
  }
}