import { createSupabaseServerClientWithAuth } from './serverClient'

interface AuditEvent {
  firm_id: string
  user_id: string | null
  event_type: string
  entity_type?: string
  entity_id?: string
  details?: any
  ip_address?: string
  lawful_basis?: string
}

export async function logAuditEvent(event: AuditEvent) {
  const supabase = await createSupabaseServerClientWithAuth() // IMPORTANT: await here

  try {
    const { error } = await supabase
      .from('audit_events')
      .insert([
        {
          ...event,
          created_at: new Date().toISOString(),
        },
      ])

    if (error) {
      console.error('Failed to log audit event:', error)
    }
  } catch (error) {
    console.error('Audit logging error:', error)
  }
}