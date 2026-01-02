import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientWithAuth } from '@/lib/serverClientWithAuth'
import { logAuditEvent } from '@/lib/auditLog'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClientWithAuth()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile (firm_id, role, etc.)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const firmId = profile.firm_id

    // Fetch user’s own data only
    const [userProfileRes, auditRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('audit_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
    ])

    if (userProfileRes.error || auditRes.error) {
      console.error('User export query error:', {
        userProfileError: userProfileRes.error,
        auditError: auditRes.error,
      })
      return NextResponse.json(
        { error: 'Failed to export user data' },
        { status: 500 }
      )
    }

    const exportPayload = {
      metadata: {
        generated_at: new Date().toISOString(),
        requested_by_user_id: user.id,
        firm_id: firmId,
        scope: 'user_only',
        version: 1,
      },
      user_profile: userProfileRes.data,
      audit_events: auditRes.data || [],
    }

    try {
      await logAuditEvent({
        firm_id: firmId,
        user_id: user.id,
        event_type: 'export',
        entity_type: 'profile',
        entity_id: user.id,
        details: { scope: 'user_only' },
      })
    } catch (auditError2) {
      console.error('Audit log error (non-blocking):', auditError2)
    }

    const body = JSON.stringify(exportPayload, null, 2)

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="gdpr-export-user-${user.id}.json"`,
      },
    })
  } catch (err) {
    console.error('User GDPR export error:', err)
    return NextResponse.json(
      { error: 'Unexpected error during export' },
      { status: 500 }
    )
  }
}
