import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

async function getLeadByToken(token: string) {
  const admin = createSupabaseServerClientStrict()
  const tokenHash = sha256Hex(token)

  // Use maybeSingle to avoid 406 when no matching lead (token invalid/expired)
  const { data: lead, error } = await admin
    .from('leads')
    .select(
      'id, firm_id, status, client_full_name, client_email, client_phone, matter_type, property_address, intake_data, created_at, submitted_at'
    )
    .eq('portal_token_hash', tokenHash)
    .maybeSingle()

  if (error) {
    console.error('[intake] lead fetch error', { message: error.message, details: error.details, hint: error.hint, code: error.code })
    return { lead: null as any, admin }
  }
  if (!lead) return { lead: null as any, admin }
  return { lead, admin }
}

export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params
    if (!token) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { lead, admin } = await getLeadByToken(token)
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Use maybeSingle to avoid 406 when firm was deleted (orphaned lead)
    const { data: firm, error: firmError } = await admin
      .from('firms')
      .select('id, name, state')
      .eq('id', lead.firm_id)
      .maybeSingle()

    if (firmError) {
      console.error('[intake] firm fetch error', { message: firmError.message, details: firmError.details, hint: firmError.hint, code: firmError.code })
      return NextResponse.json({ error: 'Unable to load intake form' }, { status: 500 })
    }
    if (!firm) {
      return NextResponse.json({ error: 'Intake form not found' }, { status: 404 })
    }

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
    console.error('[intake GET] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params
    const body = await request.json().catch(() => null)
    if (!token || !body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    const { lead, admin } = await getLeadByToken(token)
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const intakeDataPatch = typeof body.intakeDataPatch === 'object' && body.intakeDataPatch ? body.intakeDataPatch : {}
    const existing = (lead.intake_data ?? {}) as Record<string, unknown>
    const merged = { ...existing, ...intakeDataPatch }

    const client_full_name = typeof body.clientFullName === 'string' ? body.clientFullName.trim() : undefined
    const client_email = typeof body.clientEmail === 'string' ? body.clientEmail.trim() : undefined
    const client_phone = typeof body.clientPhone === 'string' ? body.clientPhone.trim() : undefined
    const property_address = typeof body.propertyAddress === 'string' ? body.propertyAddress.trim() : undefined

    const update: Record<string, unknown> = {
      intake_data: merged,
      last_client_activity_at: new Date().toISOString(),
    }
    if (client_full_name !== undefined) update.client_full_name = client_full_name || null
    if (client_email !== undefined) update.client_email = client_email
    if (client_phone !== undefined) update.client_phone = client_phone || null
    if (property_address !== undefined) update.property_address = property_address || null

    const { error } = await admin.from('leads').update(update).eq('id', lead.id)
    if (error) {
      console.error('[intake PATCH] update error', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[intake PATCH] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params
    const body = await request.json().catch(() => null)
    if (!token || !body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    const { lead, admin } = await getLeadByToken(token)
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (lead.status === 'submitted') {
      return NextResponse.json({ success: true, alreadySubmitted: true })
    }

    const intakeDataPatch = typeof body.intakeDataPatch === 'object' && body.intakeDataPatch ? body.intakeDataPatch : {}
    const existing = (lead.intake_data ?? {}) as Record<string, unknown>
    const merged = { ...existing, ...intakeDataPatch }

    const now = new Date().toISOString()
    const { error } = await admin
      .from('leads')
      .update({
        intake_data: merged,
        status: 'submitted',
        submitted_at: now,
        last_client_activity_at: now,
      })
      .eq('id', lead.id)

    if (error) {
      console.error('[intake POST] submit error', error)
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[intake POST] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

