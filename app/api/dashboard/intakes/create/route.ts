import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getCurrentUserServer } from '@/lib/server/current-user'

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUserServer()
    if (!current) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if ((current.profile.role ?? 'lawyer') === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!current.profile.firm_id) return NextResponse.json({ error: 'Firm required' }, { status: 400 })

    const body = await request.json().catch(() => null)
    const clientEmail = typeof body?.clientEmail === 'string' ? body.clientEmail.trim() : ''
    const clientFullName = typeof body?.clientFullName === 'string' ? body.clientFullName.trim() : ''
    const clientPhone = typeof body?.clientPhone === 'string' ? body.clientPhone.trim() : ''
    const matterType = typeof body?.matterType === 'string' ? body.matterType.trim() : ''
    const propertyAddress = typeof body?.propertyAddress === 'string' ? body.propertyAddress.trim() : ''

    if (!clientEmail) return NextResponse.json({ error: 'Client email is required' }, { status: 400 })
    if (!matterType) return NextResponse.json({ error: 'Matter type is required' }, { status: 400 })

    const portalToken = crypto.randomUUID()
    const portalTokenHash = sha256Hex(portalToken)

    const admin = createSupabaseServerClientStrict()

    const { data: lead, error } = await admin
      .from('leads')
      .insert({
        firm_id: current.profile.firm_id,
        status: 'draft',
        assigned_to_user_id: current.profile.id,
        client_email: clientEmail,
        client_full_name: clientFullName || null,
        client_phone: clientPhone || null,
        matter_type: matterType,
        property_address: propertyAddress || null,
        intake_data: {},
        portal_token_hash: portalTokenHash,
        portal_token_created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !lead) {
      console.error('[dashboard/intakes/create] insert error', error)
      return NextResponse.json({ error: 'Failed to create intake' }, { status: 500 })
    }

    const origin = new URL(request.url).origin
    const intakeUrl = `${origin}/intake/${portalToken}`

    return NextResponse.json({
      success: true,
      intakeId: lead.id,
      intakeUrl,
    })
  } catch (e) {
    console.error('[dashboard/intakes/create] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

