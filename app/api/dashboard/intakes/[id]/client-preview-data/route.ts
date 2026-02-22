/**
 * GET /api/dashboard/intakes/[id]/client-preview-data
 * Returns lead data for same-firm client preview. Read-only; no token exposed.
 */

import { NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getCurrentUserServer } from '@/lib/server/current-user'
import { logAuditEvent } from '@/lib/auditLog'

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const current = await getCurrentUserServer()
    if (!current) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (!current.profile.firm_id) return NextResponse.json({ error: 'Firm required' }, { status: 400 })
    if ((current.profile.role ?? 'lawyer') === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await ctx.params
    if (!id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const admin = createSupabaseServerClientStrict()
    const firmId = current.profile.firm_id

    const { data: lead, error } = await admin
      .from('leads')
      .select('id, firm_id, status, client_full_name, client_email, client_phone, matter_type, property_address, intake_data, created_at, submitted_at')
      .eq('id', id)
      .eq('firm_id', firmId)
      .single()

    if (error || !lead) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await logAuditEvent(
      firmId,
      current.authUser.id,
      'client_preview_viewed',
      'lead',
      id,
      { resource_id: id }
    )

    const { data: firm } = await admin
      .from('firms')
      .select('id, name, state')
      .eq('id', firmId)
      .single()

    return NextResponse.json({
      firm: firm ? { id: firm.id, name: firm.name, state: firm.state } : null,
      lead: {
        id: lead.id,
        status: lead.status,
        client_full_name: lead.client_full_name,
        client_email: lead.client_email,
        client_phone: lead.client_phone,
        matter_type: lead.matter_type,
        property_address: lead.property_address,
        intake_data: lead.intake_data ?? {},
        created_at: lead.created_at,
        submitted_at: lead.submitted_at,
      },
    })
  } catch (e) {
    console.error('[intakes client-preview-data] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
