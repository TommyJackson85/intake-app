import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { logAuditEvent } from '@/lib/auditLog'

export async function POST(request: NextRequest) {
  const suppliedKey = request.headers.get('x-cleanup-key')

  if (!suppliedKey || suppliedKey !== process.env.INTERNAL_CLEANUP_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseServerClientStrict()

  try {
    // Log that cleanup was triggered (use real system firm UUID)
    await logAuditEvent({
      firm_id: process.env.SYSTEM_FIRM_ID!,   // ✅ change here
      user_id: null,
      event_type: 'cleanup_run',
      entity_type: 'system',
      details: {
        triggered_at: new Date().toISOString(),
        source: 'cron',
      },
    })

    // 1) Delete expired marketing leads (> 2 years old)
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const { data: deletedLeads, error: leadError } = await supabase
      .from('marketing_leads')
      .delete()
      .lt('created_at', twoYearsAgo.toISOString())
      .select('id')

    if (leadError) {
      console.error('Error deleting old marketing leads:', leadError)
    }

    // 2) Add other retention deletions later...

    return NextResponse.json({
      success: true,
      deleted: {
        marketing_leads: deletedLeads?.length || 0,
      },
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}