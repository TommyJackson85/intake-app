import { NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getCurrentUserServer } from '@/lib/server/current-user'

export async function GET() {
  try {
    const current = await getCurrentUserServer()
    if (!current) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (!current.profile.firm_id) return NextResponse.json({ error: 'Firm required' }, { status: 400 })
    if ((current.profile.role ?? 'lawyer') === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createSupabaseServerClientStrict()
    const { data, error } = await admin
      .from('matters')
      .select(
        'id, created_at, status, matter_type, property_address, expected_closing_date, client:clients(id, full_name, email)'
      )
      .eq('firm_id', current.profile.firm_id)
      .neq('status', 'closed')
      .order('expected_closing_date', { ascending: true })
      .limit(50)

    if (error) {
      console.error('[dashboard/matters] query error', error)
      return NextResponse.json({ error: 'Failed to load matters' }, { status: 500 })
    }

    return NextResponse.json({ matters: data || [] })
  } catch (e) {
    console.error('[dashboard/matters] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
