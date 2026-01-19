// app/api/external/matters/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getFirmFromApiKey } from '@/lib/get-firm-from-api-key'
import { logAuditEvent } from '@/lib/auditLog'

import { assertScope, REQUIRED_SCOPES } from '@/lib/api-scope'
import { getFirmFromApiKeyWithScopes } from '@/lib/get-firm-api-key'

type MatterStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'CLOSED'
  | 'ON_HOLD'
  | 'CANCELLED'

interface MatterUpdatePayload {
  matter_id?: string           // internal UUID
  matter_external_ref?: string // optional, if you support external refs
  status?: MatterStatus
  expected_closing_date?: string | null
  deletion_due_date?: string | null
}

export async function POST(request: NextRequest) {
  try {
    // 1) Authenticate firm by API key
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

    const body = (await request.json()) as MatterUpdatePayload

    if (!body.matter_id && !body.matter_external_ref) {
      return NextResponse.json(
        { error: 'matter_id or matter_external_ref is required' },
        { status: 400 },
      )
    }

    // Optional: validate status if provided
    const allowedStatuses: MatterStatus[] = [
      'OPEN',
      'IN_PROGRESS',
      'PENDING',
      'CLOSED',
      'ON_HOLD',
      'CANCELLED',
    ]

    if (body.status && !allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 },
      )
    }

    // 3) Load existing matter (scoped to this firm)
    let matterQuery = createSupabaseServerClientStrict()
      .from('matters')
      .select('*')
      .eq('firm_id', firmId)

    if (body.matter_id) {
      matterQuery = matterQuery.eq('id', body.matter_id)
    } else if (body.matter_external_ref) {
      // adjust column name if yours is different
      matterQuery = matterQuery.eq('external_ref', body.matter_external_ref)
    }

    const { data: existingMatter, error: fetchError } = await matterQuery.maybeSingle()

    if (fetchError) {
      console.error('Error fetching matter:', fetchError)
      return NextResponse.json(
        { error: 'Error fetching matter' },
        { status: 500 },
      )
    }

    if (!existingMatter) {
      return NextResponse.json(
        { error: 'Matter not found for this firm' },
        { status: 404 },
      )
    }

    // 4) Build update object
    const update: Record<string, any> = {}

    if (body.status) {
      update.status = body.status
    }

    if (body.expected_closing_date !== undefined) {
      update.expected_closing_date = body.expected_closing_date
    }

    if (body.deletion_due_date !== undefined) {
      update.deletion_due_date = body.deletion_due_date
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: 'No updatable fields provided' },
        { status: 400 },
      )
    }

    // 5) Apply update
    const { data: updated, error: updateError } = await createSupabaseServerClientStrict()
      .from('matters')
      .update(update)
      .eq('id', existingMatter.id)
      .eq('firm_id', firmId)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('Error updating matter:', updateError)
      return NextResponse.json(
        { error: 'Failed to update matter' },
        { status: 500 },
      )
    }

    // 6) Audit log
    try {
      await logAuditEvent({
        firm_id: firmId,
        user_id: null, // external system, not an app user
        event_type: 'update',
        entity_type: 'matter',
        entity_id: existingMatter.id,
        details: {
          via: 'external-api',
          previous: {
            status: existingMatter.status,
            expected_closing_date: existingMatter.expected_closing_date,
            deletion_due_date: existingMatter.deletion_due_date,
          },
          update,
        },
        lawful_basis: 'Legal obligation (matter management)',
      })
    } catch (e) {
      console.error('Audit log failed for external matter update:', e)
    }

    return NextResponse.json(
      { success: true, matter: updated },
      { status: 200 },
    )
  } catch (error) {
    console.error('External matters API error:', error)
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 },
    )
  }
}
