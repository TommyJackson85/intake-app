/**
 * GET /api/dashboard/matters/[id]/client-preview-data
 * Returns matter + client data for same-firm client preview. Read-only.
 */

import { NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getCurrentUserServer } from '@/lib/server/current-user'

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

    const { data: matter, error: matterError } = await admin
      .from('matters')
      .select('id, client_id, matter_type, status, property_address, expected_closing_date, created_at')
      .eq('id', id)
      .eq('firm_id', firmId)
      .single()

    if (matterError || !matter) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const clientId = (matter as { client_id: string }).client_id
    const { data: client } = await admin
      .from('clients')
      .select('id, full_name, email, phone')
      .eq('id', clientId)
      .single()

    return NextResponse.json({
      firm: current.firm ? { id: current.firm.id, name: current.firm.name, state: current.firm.state } : null,
      client: client ? { id: client.id, full_name: client.full_name, email: client.email, phone: client.phone } : null,
      matters: [{
        id: matter.id,
        matter_type: matter.matter_type,
        status: matter.status,
        property_address: matter.property_address,
        expected_closing_date: matter.expected_closing_date,
        created_at: matter.created_at,
      }],
    })
  } catch (e) {
    console.error('[matters client-preview-data] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
