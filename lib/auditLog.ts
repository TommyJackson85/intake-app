/**
 * Audit Logging for GDPR Compliance
 * Copy this entire file to: lib/auditLog.ts
 * 
 * Logs all data access, modifications, and deletions to audit_events table
 * Non-blocking: if audit fails, doesn't crash your route
 */

import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { AuditLogInput, AuditEvent } from '@/types/database'

/**
 * Log an audit event (non-blocking)
 * Call this after every data operation (create, read, update, delete)
 * 
 * @example
 * await logAuditEvent({
 *   firm_id: 'uuid-123',
 *   user_id: 'uuid-456',
 *   event_type: 'create',
 *   entity_type: 'client',
 *   entity_id: 'uuid-789',
 *   ip_address: '192.168.1.1',
 *   details: { name: 'John Smith' },
 *   lawful_basis: 'Legal obligation',
 * })
 */
export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  try {
    const { error } = await createSupabaseServerClientStrict()
      .from('audit_events')
      .insert([
        {
          firm_id: input.firm_id,
          user_id: input.user_id || null,
          event_type: input.event_type,
          entity_type: input.entity_type,
          entity_id: input.entity_id || null,
          ip_address: input.ip_address || null,
          details: input.details || {},
          lawful_basis: input.lawful_basis || null,
          created_at: new Date().toISOString(),
        },
      ])

    if (error) {
      console.error('[Audit Log] Insert failed:', error.message)
      // Don't throw – audit log failures should not break business logic
    }
  } catch (err: any) {
    console.error('[Audit Log] Exception:', err.message)
    // Silent fail – auditing is not critical to app operation
  }
}

/**
 * Log data access to sensitive fields (highly confidential data)
 * 
 * @example
 * await logDataAccess(
 *   firmId,
 *   userId,
 *   'pep_flag', // field name
 *   amlCheckId, // entity id
 *   ipAddress
 * )
 */
export async function logDataAccess(
  firmId: string,
  userId: string | null,
  fieldName: string,
  entityId: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    firm_id: firmId,
    user_id: userId,
    event_type: 'read',
    entity_type: 'sensitive_field',
    entity_id: entityId,
    ip_address: ipAddress,
    details: { field: fieldName },
  })
}

/**
 * Log API key rotation
 * 
 * @example
 * await logApiKeyRotation(firmId, oldKeyPrefix)
 */
export async function logApiKeyRotation(
  firmId: string,
  oldKeyPrefix: string
): Promise<void> {
  await logAuditEvent({
    firm_id: firmId,
    event_type: 'api_key_rotated',
    entity_type: 'firm',
    entity_id: firmId,
    details: { old_key_prefix: oldKeyPrefix },
  })
}

/**
 * Log login attempt
 * 
 * @example
 * await logLogin(userId, firmId, ipAddress, success: true)
 */
export async function logLogin(
  userId: string,
  firmId: string,
  ipAddress: string,
  success: boolean
): Promise<void> {
  await logAuditEvent({
    firm_id: firmId,
    user_id: userId,
    event_type: 'login',
    entity_type: 'user',
    entity_id: userId,
    ip_address: ipAddress,
    details: { success },
  })
}

/**
 * Log data export (GDPR requests)
 * 
 * @example
 * await logGDPRExport(firmId, userId, ipAddress)
 */
export async function logGDPRExport(
  firmId: string,
  userId: string | null,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    firm_id: firmId,
    user_id: userId,
    event_type: 'export',
    entity_type: 'firm_data',
    entity_id: firmId,
    ip_address: ipAddress,
    lawful_basis: 'GDPR Article 15 (access request)',
  })
}

/**
 * Retrieve audit logs for a firm (for compliance review)
 * 
 * @example
 * const logs = await getAuditLogs(firmId, { days: 30 })
 */
export async function getAuditLogs(
  firmId: string,
  options?: {
    days?: number
    limit?: number
    offset?: number
  }
): Promise<AuditEvent[]> {
  try {
    const daysAgo = options?.days || 90
    const limit = options?.limit || 100
    const offset = options?.offset || 0

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo)

    const { data, error } = await createSupabaseServerClientStrict()
      .from('audit_events')
      .select('*')
      .eq('firm_id', firmId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Audit Log] Retrieval failed:', error.message)
      return []
    }

    return data || []
  } catch (err: any) {
    console.error('[Audit Log] Exception:', err.message)
    return []
  }
}