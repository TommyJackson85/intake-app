// app/api/gdpr/delete-my-data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientWithAuth } from '@/lib/serverClientWithAuth'
import { logAuditEvent } from '@/lib/auditLog'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClientWithAuth()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's firm
    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const firm_id = profile.firm_id

    // Log the deletion request
    await logAuditEvent({
      firm_id,
      user_id: user.id,
      event_type: 'gdpr_deletion_requested',
      details: { deletion_timestamp: new Date().toISOString() },
    })

    // Soft-delete user (don't cascade delete immediately)
    const { error: deleteError } = await supabase
      .from('profiles')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', user.id)

    if (deleteError) throw deleteError

    // Delete auth user
    await supabase.auth.admin.deleteUser(user.id)

    return NextResponse.json({
      message: 'Data deletion requested. Will be permanently deleted within 90 days.',
      deletion_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Deletion error:', error)
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }
}
