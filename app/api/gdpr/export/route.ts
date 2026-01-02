import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientWithAuth } from '@/lib/serverClientWithAuth'
import { logAuditEvent } from '@/lib/auditLog'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClientWithAuth()

    // 1) Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2) Get user profile to find firm_id and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, firm_id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const firmId = profile.firm_id

    if (!firmId) {
      return NextResponse.json(
        { error: 'No firm associated with this user' },
        { status: 400 }
      )
    }

    // Optional: only allow firm_owner / firm_admin to export full firm data
    const allowedRoles = ['firm_owner', 'firm_admin']
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: insufficient permissions' },
        { status: 403 }
      )
    }

    // 3) Fetch firm, users, clients, matters, AML checks, audit events

    const [firmRes, usersRes, clientsRes, mattersRes, amlRes, auditRes] =
      await Promise.all([
        supabase.from('firms').select('*').eq('id', firmId).maybeSingle(),
        supabase.from('profiles').select('*').eq('firm_id', firmId),
        supabase.from('clients').select('*').eq('firm_id', firmId),
        supabase.from('matters').select('*').eq('firm_id', firmId),
        supabase.from('aml_checks').select('*').eq('firm_id', firmId),
        supabase
          .from('audit_events')
          .select('*')
          .eq('firm_id', firmId)
          .order('created_at', { ascending: true }),
      ])

    const firmError = firmRes.error
    const usersError = usersRes.error
    const clientsError = clientsRes.error
    const mattersError = mattersRes.error
    const amlError = amlRes.error
    const auditError = auditRes.error

    if (firmError || usersError || clientsError || mattersError || amlError || auditError) {
      console.error('Export query error:', {
        firmError,
        usersError,
        clientsError,
        mattersError,
        amlError,
        auditError,
      })
      return NextResponse.json(
        { error: 'Failed to export data' },
        { status: 500 }
      )
    }

    const exportPayload = {
      metadata: {
        generated_at: new Date().toISOString(),
        requested_by_user_id: user.id,
        firm_id: firmId,
        version: 1,
      },
      firm: firmRes.data || null,
      users: usersRes.data || [],
      clients: clientsRes.data || [],
      matters: mattersRes.data || [],
      aml_checks: amlRes.data || [],
      audit_events: auditRes.data || [],
    }

    // 4) Log audit event
    try {
      await logAuditEvent({
        firm_id: firmId,
        user_id: user.id,
        event_type: 'export',
        entity_type: 'firm',
        entity_id: firmId,
        details: {
          scope: 'full_firm_export',
          counts: {
            users: exportPayload.users.length,
            clients: exportPayload.clients.length,
            matters: exportPayload.matters.length,
            aml_checks: exportPayload.aml_checks.length,
            audit_events: exportPayload.audit_events.length,
          },
        },
      })
    } catch (auditError2) {
      console.error('Audit log error (non-blocking):', auditError2)
    }

    // 5) Return JSON as attachment
    const body = JSON.stringify(exportPayload, null, 2)

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="gdpr-export-${firmId}-${Date.now()}.json"`,
      },
    })
  } catch (err) {
    console.error('GDPR export error:', err)
    return NextResponse.json(
      { error: 'Unexpected error during export' },
      { status: 500 }
    )
  }
}
