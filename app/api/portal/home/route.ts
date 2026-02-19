import { NextResponse } from 'next/server'
import { getCurrentUserServer } from '@/lib/server/current-user'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'

export async function GET() {
  try {
    const current = await getCurrentUserServer()
    if (!current) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const role = (current.profile.role ?? 'lawyer') as string
    if (role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const clientId = (current.profile as any).client_id as string | null | undefined
    if (!clientId) return NextResponse.json({ error: 'Client profile not linked' }, { status: 400 })

    const admin = createSupabaseServerClientStrict()

    const [{ data: client }, { data: matters }] = await Promise.all([
      admin.from('clients').select('id, full_name, email, phone, firm_id').eq('id', clientId).single(),
      admin
        .from('matters')
        .select('id, matter_type, status, property_address, expected_closing_date, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }),
    ])

    return NextResponse.json({
      client: client || null,
      matters: matters || [],
    })
  } catch (e) {
    console.error('[portal/home] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

