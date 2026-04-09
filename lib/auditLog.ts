// lib/auditLog.ts - FIXED to allow null firmId and userId
// Copy-paste ready - Complete audit logging system

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Generic audit event logger
 * Use this for most audit events
 * 
 * @param firmId - Firm ID (can be null for system/public events)
 * @param userId - User ID (can be null for unauthenticated events)
 * @param eventType - Type of event (e.g., 'client_created')
 * @param resourceType - Type of resource affected (e.g., 'client')
 * @param resourceId - ID of affected resource
 * @param metadata - Additional event data (optional)
 */
export async function logAuditEvent(
  firmId: string | null,
  userId: string | null,
  eventType: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from('audit_logs')
      .insert({
        firm_id: firmId,
        user_id: userId,
        event_type: eventType,
        resource_type: resourceType,
        resource_id: resourceId,
        description: `${eventType} for ${resourceType} ${resourceId}`,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Audit logging error:', error);
  }
}

/**
 * Log authentication events
 * 
 * @param email - User email attempting login
 * @param status - Login outcome
 * @param ip - Client IP address
 * @param details - Additional details (optional)
 */
export async function logLogin(
  email: string,
  status: 'success' | 'failed' | 'rate_limited' | 'validation_failed' | 'authentication_failed' | 'user_not_found' | 'session_creation_failed' | 'auth_error',
  ip: string,
  details?: string
): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from('audit_logs')
      .insert({
        firm_id: null,
        user_id: null,
        event_type: `login_${status}`,
        resource_type: 'authentication',
        resource_id: email,
        description: `Login ${status} for ${email}`,
        metadata: {
          ip,
          details,
          timestamp: new Date().toISOString(),
        },
      });

    if (error) {
      console.error('Failed to log login event:', error);
    }
  } catch (error) {
    console.error('Login logging error:', error);
  }
}

/**
 * Log GDPR data export
 * 
 * @param firmId - Firm requesting export
 * @param userId - User requesting export
 * @param format - Export format (json/csv)
 */
export async function logGDPRExport(
  firmId: string,
  userId: string,
  format: 'json' | 'csv'
): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from('audit_logs')
      .insert({
        firm_id: firmId,
        user_id: userId,
        event_type: 'gdpr_export_requested',
        resource_type: 'gdpr',
        resource_id: userId,
        description: `GDPR data export requested in ${format} format`,
        metadata: {
          format,
          timestamp: new Date().toISOString(),
        },
      });

    if (error) {
      console.error('Failed to log GDPR export:', error);
    }
  } catch (error) {
    console.error('GDPR export logging error:', error);
  }
}

/**
 * Log GDPR data deletion
 * 
 * @param firmId - Firm being deleted
 * @param userId - User requesting deletion
 * @param deletedCount - Number of records deleted
 */
export async function logGDPRDeletion(
  firmId: string,
  userId: string,
  deletedCount: number
): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from('audit_logs')
      .insert({
        firm_id: firmId,
        user_id: userId,
        event_type: 'gdpr_deletion_completed',
        resource_type: 'gdpr',
        resource_id: userId,
        description: `GDPR deletion completed: ${deletedCount} records deleted`,
        metadata: {
          deletedCount,
          timestamp: new Date().toISOString(),
        },
      });

    if (error) {
      console.error('Failed to log GDPR deletion:', error);
    }
  } catch (error) {
    console.error('GDPR deletion logging error:', error);
  }
}

/**
 * Log API key operations
 * 
 * @param firmId - Firm owning the key
 * @param userId - User performing operation
 * @param operation - Type of operation
 * @param keyPrefix - Key prefix for identification
 */
export async function logAPIKeyOperation(
  firmId: string,
  userId: string,
  operation: 'created' | 'rotated' | 'revoked' | 'used',
  keyPrefix: string
): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from('audit_logs')
      .insert({
        firm_id: firmId,
        user_id: userId,
        event_type: `api_key_${operation}`,
        resource_type: 'api_key',
        resource_id: keyPrefix,
        description: `API key ${operation}: ${keyPrefix}`,
        metadata: {
          operation,
          keyPrefix,
          timestamp: new Date().toISOString(),
        },
      });

    if (error) {
      console.error('Failed to log API key operation:', error);
    }
  } catch (error) {
    console.error('API key logging error:', error);
  }
}

/**
 * Log suspicious activity
 * 
 * @param firmId - Firm ID (if applicable)
 * @param userId - User ID (if applicable)
 * @param activityType - Type of suspicious activity
 * @param ip - Client IP address
 * @param details - Activity details
 */
export async function logSuspiciousActivity(
  firmId: string | null,
  userId: string | null,
  activityType: string,
  ip: string,
  details: string
): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from('audit_logs')
      .insert({
        firm_id: firmId,
        user_id: userId,
        event_type: 'suspicious_activity',
        resource_type: 'security',
        resource_id: ip,
        description: `Suspicious activity: ${activityType}`,
        metadata: {
          activityType,
          ip,
          details,
          timestamp: new Date().toISOString(),
        },
      });

    if (error) {
      console.error('Failed to log suspicious activity:', error);
    }
  } catch (error) {
    console.error('Suspicious activity logging error:', error);
  }
}

/**
 * Log rate limit exceeded
 * 
 * @param endpoint - Endpoint that was rate limited
 * @param ip - Client IP address
 * @param limit - Rate limit threshold
 */
export async function logRateLimitExceeded(
  endpoint: string,
  ip: string,
  limit: number
): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from('audit_logs')
      .insert({
        firm_id: null,
        user_id: null,
        event_type: 'rate_limit_exceeded',
        resource_type: 'rate_limit',
        resource_id: endpoint,
        description: `Rate limit exceeded for ${endpoint}`,
        metadata: {
          endpoint,
          ip,
          limit,
          timestamp: new Date().toISOString(),
        },
      });

    if (error) {
      console.error('Failed to log rate limit event:', error);
    }
  } catch (error) {
    console.error('Rate limit logging error:', error);
  }
}

/**
 * Log configuration changes
 * 
 * @param firmId - Firm ID
 * @param userId - User making the change
 * @param configType - Type of configuration changed
 * @param changes - Object describing what changed
 */
export async function logConfigurationChange(
  firmId: string,
  userId: string,
  configType: string,
  changes: Record<string, any>
): Promise<void> {
  try {
    const { error } = await getSupabase()
      .from('audit_logs')
      .insert({
        firm_id: firmId,
        user_id: userId,
        event_type: 'configuration_changed',
        resource_type: 'configuration',
        resource_id: configType,
        description: `Configuration changed: ${configType}`,
        metadata: {
          configType,
          changes,
          timestamp: new Date().toISOString(),
        },
      });

    if (error) {
      console.error('Failed to log configuration change:', error);
    }
  } catch (error) {
    console.error('Configuration logging error:', error);
  }
}

/**
 * Get audit logs for a firm
 * 
 * @param firmId - Firm ID to get logs for
 * @param options - Query options (limit, offset, event types)
 */
export async function getAuditLogs(
  firmId: string,
  options?: {
    limit?: number;
    offset?: number;
    eventTypes?: string[];
    startDate?: Date;
    endDate?: Date;
  }
): Promise<any[] | null> {
  try {
    let query = getSupabase()
      .from('audit_logs')
      .select('*')
      .eq('firm_id', firmId)
      .order('timestamp', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20));
    }

    if (options?.eventTypes && options.eventTypes.length > 0) {
      query = query.in('event_type', options.eventTypes);
    }

    if (options?.startDate) {
      query = query.gte('timestamp', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('timestamp', options.endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get audit logs:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get audit logs error:', error);
    return null;
  }
}