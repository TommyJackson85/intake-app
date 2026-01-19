// app/api/external/export/matters/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getFirmFromApiKey } from '@/lib/get-firm-from-api-key'
import { logAuditEvent } from '@/lib/auditLog'

import { assertScope, REQUIRED_SCOPES } from '@/lib/api-scope'
import { getFirmFromApiKeyWithScopes } from '@/lib/get-firm-api-key'

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = request.nextUrl
    const limit = Number(searchParams.get('limit') ?? '1000')
    const offset = Number(searchParams.get('offset') ?? '0')

    const { data, error } = await createSupabaseServerClientStrict()
      .from('matters')
      .select('*')
      .eq('firm_id', firmId)
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('External matters export error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch matters' },
        { status: 500 },
      )
    }

    await logAuditEvent({
      firm_id: firmId,
      user_id: null,
      event_type: 'export',
      entity_type: 'matter',
      entity_id: null,
      details: {
        via: 'external-export',
        resource: 'matters',
        limit,
        offset,
        returned: data?.length ?? 0,
      },
      lawful_basis: 'GDPR export / BI feed',
    })

    return NextResponse.json(
      {
        firm_id: firmId,
        items: data ?? [],
      },
      { status: 200 },
    )
  } catch (err) {
    console.error('External matters export unexpected error:', err)
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 },
    )
  }
}