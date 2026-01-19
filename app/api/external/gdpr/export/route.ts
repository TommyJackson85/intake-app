// app/api/external/gdpr/export/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getFirmFromApiKey } from '@/lib/get-firm-from-api-key'
import { logAuditEvent } from '@/lib/auditLog'

import { assertScope, REQUIRED_SCOPES } from '@/lib/api-scope'
import { getFirmFromApiKeyWithScopes } from '@/lib/get-firm-api-key'

export async function GET(request: NextRequest) {
  try {
    // 1) Identify firm via API key
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

    // 2) Load firm‑scoped data
    const [clientsRes, mattersRes, amlRes, auditRes] = await Promise.all([
      createSupabaseServerClientStrict().from('clients').select('*').eq('firm_id', firmId),
      createSupabaseServerClientStrict().from('matters').select('*').eq('firm_id', firmId),
      createSupabaseServerClientStrict().from('aml_checks').select('*').eq('firm_id', firmId),
      createSupabaseServerClientStrict()
        .from('audit_events')
        .select('*')
        .eq('firm_id', firmId)
        .order('created_at', { ascending: true }),
    ])

    if (clientsRes.error || mattersRes.error || amlRes.error || auditRes.error) {
      console.error('External GDPR export query errors:', {
        clients: clientsRes.error,
        matters: mattersRes.error,
        aml: amlRes.error,
        audit: auditRes.error,
      })
      return NextResponse.json(
        { error: 'Failed to fetch data for export' },
        { status: 500 },
      )
    }

    const payload = {
      requested_at: new Date().toISOString(),
      scope: 'firm',
      user: null, // external API key, no per-user identity
      firm: {
        id: firm.id,
        firm_name: firm.name,
        firm_state: firm.firm_state,
        created_at: firm.created_at,
      },
      clients: clientsRes.data ?? [],
      matters: mattersRes.data ?? [],
      aml_checks: amlRes.data ?? [],
      audit_events: auditRes.data ?? [],
    }

    // 3) Audit log – export via API key
    await logAuditEvent({
      firm_id: firmId,
      user_id: null,
      event_type: 'export',
      entity_type: 'firm',
      entity_id: firmId,
      details: {
        scope: payload.scope,
        total_clients: payload.clients.length,
        total_matters: payload.matters.length,
        total_aml_checks: payload.aml_checks.length,
        total_audit_events: payload.audit_events.length,
        via: 'external-api-key',
      },
      lawful_basis: 'GDPR Articles 15 & 20 - data export',
    })

    // 4) Return JSON file as attachment
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="gdpr_export_${firmId}_${Date.now()}.json"`,
      },
    })
  } catch (error) {
    console.error('External GDPR export error:', error)
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 },
    )
  }
}