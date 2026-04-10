import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/serverSupabase'
import { getCurrentUserServer } from '@/lib/server/current-user'

export async function GET(request: Request) {
  try {
    const current = await getCurrentUserServer()
    if (!current) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (!current.profile.firm_id) return NextResponse.json({ error: 'Firm required' }, { status: 400 })
    if ((current.profile.role ?? 'lawyer') === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const scope = url.searchParams.get('scope') === 'firm' ? 'firm' : 'my'
    const status = url.searchParams.get('status')

    const supabase = await getServerSupabase()
    let query = supabase
      .from('leads')
      .select(
        'id, created_at, updated_at, status, client_full_name, client_email, client_phone, matter_type, property_address, assigned_to_user_id, submitted_at, last_client_activity_at'
      )
      .eq('firm_id', current.profile.firm_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (scope === 'my') {
      query = query.eq('assigned_to_user_id', current.profile.id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) {
      console.error('[dashboard/intakes] query error', error)
      return NextResponse.json({ error: 'Failed to load intakes' }, { status: 500 })
    }

    return NextResponse.json({ intakes: data || [] })
  } catch (e) {
    console.error('[dashboard/intakes] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

