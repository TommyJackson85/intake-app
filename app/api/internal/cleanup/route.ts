import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { logAuditEvent } from '@/lib/auditLog'
import { limitSensitive } from '@/lib/rate-limit'
import { assertScope, REQUIRED_SCOPES } from '@/lib/api-scope'
import { getFirmFromApiKeyWithScopes } from '@/lib/get-firm-api-key'

export async function POST(request: NextRequest) {

  const suppliedKey = request.headers.get('x-cleanup-key')
  const apiKey = request.headers.get('x-firm-api-key')
  const { firm_id, scopes } = await getFirmFromApiKeyWithScopes(apiKey)

  const rate = await limitSensitive(request)
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Too many deletion requests. Please try again later.' },
      { status: 429 },
    )
  }

  // Check permission for this action
  assertScope(scopes, REQUIRED_SCOPES.createLead)

  if (!suppliedKey || suppliedKey !== process.env.INTERNAL_CLEANUP_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1) Log that cleanup was triggered (system-level, not per firm)
    await logAuditEvent({
      firm_id: process.env.SYSTEM_FIRM_ID ?? 'system', // fixed UUID or 'system'
      user_id: null,
      event_type: 'cleanup_run',
      entity_type: 'system',
      entity_id: null,
      details: {
        triggered_at: new Date().toISOString(),
        source: 'cron',
        target: 'marketing_leads',
      },
      lawful_basis: 'GDPR storage limitation – retention cleanup',
    })

    // 2) Delete expired marketing leads (> 2 years old)
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const { data: deletedLeads, error: leadError } = await createSupabaseServerClientStrict()
      .from('marketing_leads')
      .delete()
      .lt('created_at', twoYearsAgo.toISOString())
      .select('id')

    if (leadError) {
      console.error('Error deleting old marketing leads:', leadError)
    }

    // 3) Placeholder for future retention deletions (clients/matters/aml_checks, etc.)
    // When you add those, always scope by firm_id there; marketing_leads remains global.

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