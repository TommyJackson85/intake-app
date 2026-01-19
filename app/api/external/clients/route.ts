// app/api/external/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getFirmFromApiKey } from '@/lib/get-firm-from-api-key'
import { logAuditEvent } from '@/lib/auditLog'

import { assertScope, REQUIRED_SCOPES } from '@/lib/api-scope'
import { getFirmFromApiKeyWithScopes } from '@/lib/get-firm-api-key'

type ExternalClientPayload = {
  external_id?: string | null
  full_name: string
  email?: string | null
  phone?: string | null
  address_line_1?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
}

function validatePayload(body: any): { ok: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid JSON body' }
  }

  if (!body.full_name || typeof body.full_name !== 'string') {
    return { ok: false, error: 'full_name is required and must be a string' }
  }

  if (body.email && typeof body.email !== 'string') {
    return { ok: false, error: 'email must be a string if provided' }
  }

  if (!body.external_id && !body.email) {
    return {
      ok: false,
      error: 'Either external_id or email must be provided for upsert',
    }
  }

  return { ok: true }
}

export async function POST(request: NextRequest) {

  const apiKey = request.headers.get('x-firm-api-key')
  const { firm_id, scopes } = await getFirmFromApiKeyWithScopes(apiKey)

  // Check permission for this action
  assertScope(scopes, REQUIRED_SCOPES.createLead)

  try {
    // 1) Identify firm by API key
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

    // 2) Validate JSON body
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 },
      )
    }

    const body = (await request.json()) as ExternalClientPayload
    const validation = validatePayload(body)

    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      )
    }

    const {
      external_id = null,
      full_name,
      email = null,
      phone = null,
      address_line_1 = null,
      city = null,
      state = null,
      zip = null,
    } = body

    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined

    // 3) Decide upsert key: external_id preferred, fallback to email
    let matchFilter
    if (external_id) {
      matchFilter = { external_id }
    } else {
      matchFilter = { email }
    }

    // 4) Try to find existing client for this firm
    const { data: existing, error: existingError } = await createSupabaseServerClientStrict()
      .from('clients')
      .select('id, external_id')
      .eq('firm_id', firmId)
      .match(matchFilter)
      .maybeSingle()

    if (existingError) {
      console.error('External clients existing check error:', existingError)
      return NextResponse.json(
        { error: 'Failed to check existing client' },
        { status: 500 },
      )
    }

    let created = false

    // 5) Upsert (insert or update)
    let upsertPayload: any = {
      firm_id: firmId,
      external_id,
      full_name,
      email,
      phone,
      address_line_1,
      city,
      state,
      zip,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      // Preserve id for update
      upsertPayload.id = existing.id
    } else {
      created = true
      upsertPayload.created_at = new Date().toISOString()
    }

    const { data: clientRows, error: upsertError } = await createSupabaseServerClientStrict()
      .from('clients')
      .upsert(upsertPayload, {
        onConflict: external_id ? 'firm_id,external_id' : 'firm_id,email',
      })
      .select()
      .limit(1)

    if (upsertError || !clientRows || clientRows.length === 0) {
      console.error('External clients upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save client' },
        { status: 500 },
      )
    }

    const client = clientRows[0]

    // 6) Audit log
    await logAuditEvent({
      firm_id: firmId,
      user_id: null,
      event_type: created ? 'create' : 'update',
      entity_type: 'client',
      entity_id: client.id,
      ip_address: ip,
      details: {
        via: 'external-api',
        created,
        match_key: external_id ? 'external_id' : 'email',
        external_id,
        email,
      },
      lawful_basis: 'Legal obligation / contract (client intake)',
    })

    return NextResponse.json(
      {
        success: true,
        created,
        client,
      },
      { status: created ? 201 : 200 },
    )
  } catch (error) {
    console.error('External clients API error:', error)
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 },
    )
  }
}