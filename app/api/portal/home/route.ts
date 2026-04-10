import { NextResponse } from 'next/server'
import { getCurrentUserServer } from '@/lib/server/current-user'
import { getServerSupabase } from '@/lib/serverSupabase'

export async function GET() {
  try {
    const current = await getCurrentUserServer()
    if (!current) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const role = (current.profile.role ?? 'lawyer') as string
    if (role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const clientId = (current.profile as { client_id?: string | null }).client_id
    if (!clientId) return NextResponse.json({ error: 'Client profile not linked' }, { status: 400 })

    const supabase = await getServerSupabase()
    // RLS: client portal user sees only their client row and that firm's matters
    const [{ data: client }, { data: matters }] = await Promise.all([
      supabase.from('clients').select('id, full_name, email, phone, firm_id').eq('id', clientId).single(),
      supabase
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

