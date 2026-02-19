import { NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getCurrentUserServer } from '@/lib/server/current-user'

export async function GET(request: Request) {
  try {
    const current = await getCurrentUserServer()
    if (!current) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const role = (current.profile.role ?? 'lawyer') as string
    if (role === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!current.profile.firm_id) {
      return NextResponse.json({ error: 'Firm required' }, { status: 400 })
    }

    const admin = createSupabaseServerClientStrict()
    const firmId = current.profile.firm_id
    const userId = current.profile.id

    const url = new URL(request.url)
    const scope = url.searchParams.get('scope') === 'firm' ? 'firm' : 'my'

    const assignedFilter = scope === 'my' ? userId : null

    const now = new Date()
    const in7 = new Date(now)
    in7.setDate(in7.getDate() + 7)

    const [newIntakesRes, waitingRes, mattersRes, closingsRes, intakesListRes, mattersListRes] =
      await Promise.all([
        admin
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('firm_id', firmId)
          .eq('status', 'submitted')
          .match(assignedFilter ? { assigned_to_user_id: assignedFilter } : {}),
        admin
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('firm_id', firmId)
          .eq('status', 'waiting_on_client')
          .match(assignedFilter ? { assigned_to_user_id: assignedFilter } : {}),
        admin
          .from('matters')
          .select('id', { count: 'exact', head: true })
          .eq('firm_id', firmId)
          .neq('status', 'closed'),
        admin
          .from('matters')
          .select('id', { count: 'exact', head: true })
          .eq('firm_id', firmId)
          .gte('expected_closing_date', now.toISOString())
          .lte('expected_closing_date', in7.toISOString())
          .neq('status', 'closed'),
        admin
          .from('leads')
          .select(
            'id, created_at, status, client_full_name, client_email, matter_type, property_address, assigned_to_user_id'
          )
          .eq('firm_id', firmId)
          .match(assignedFilter ? { assigned_to_user_id: assignedFilter } : {})
          .order('created_at', { ascending: false })
          .limit(10),
        admin
          .from('matters')
          .select(
            'id, created_at, status, matter_type, property_address, expected_closing_date, client:clients(id, full_name, email)'
          )
          .eq('firm_id', firmId)
          .neq('status', 'closed')
          .order('expected_closing_date', { ascending: true })
          .limit(10),
      ])

    const intakes = (intakesListRes.data || []) as any[]
    const matters = (mattersListRes.data || []) as any[]

    const keyDates = matters
      .filter((m) => Boolean(m.expected_closing_date))
      .slice(0, 8)
      .map((m) => ({
        kind: 'closing' as const,
        date: m.expected_closing_date as string,
        label: `${m.client?.full_name ? `${m.client.full_name} — ` : ''}${m.matter_type}`,
        href: `/dashboard/matters`,
      }))

    return NextResponse.json({
      summary: {
        newIntakes: newIntakesRes.count || 0,
        waitingOnClient: waitingRes.count || 0,
        closingsNext7Days: closingsRes.count || 0,
        mattersNeedingAttention: mattersRes.count || 0,
      },
      worklists: {
        intakes,
        matters,
      },
      keyDates,
    })
  } catch (e) {
    console.error('[dashboard/home] error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

