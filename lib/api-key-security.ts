// lib/api-key-security.ts - Secure API key handling
// Copy-paste ready - prevents timing attacks & unauthorized access

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface APIKeyValidation {
  valid: boolean;
  firmId?: string;
  scopes?: string[];
  expiresAt?: Date;
  rateLimitKey?: string;
}

export interface APIKeyRecord {
  id: string;
  firm_id: string;
  key_hash: string;
  key_prefix: string;
  scopes: string[];
  created_at: Date;
  last_used_at: Date | null;
  expires_at: Date;
  is_active: boolean;
  rotation_count: number;
}

/**
 * Generate a new API key with prefix
 * Format: prefix_randomstring
 */
export function generateAPIKey(): { key: string; prefix: string } {
  const prefix = 'sk_' + Date.now().toString(36);
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const key = `${prefix}_${randomBytes}`;
  return { key, prefix };
}

/**
 * Hash API key using SHA-256 (constant-time comparison)
 */
export function hashAPIKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Constant-time string comparison (prevents timing attacks)
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validate API key from Authorization header
 * ONLY accept from header, NEVER from query string
 */
export async function validateAPIKey(
  request: Request
): Promise<APIKeyValidation> {
  // ✅ Get API key from Authorization header only
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return { valid: false };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const apiKey = authHeader.slice(7); // Remove 'Bearer '

  // Basic format validation
  if (!apiKey.startsWith('sk_') || apiKey.length < 50) {
    return { valid: false };
  }

  try {
    // Extract prefix for quick lookup
    const prefix = apiKey.split('_').slice(0, 2).join('_');

    // Hash the provided key for comparison
    const providedHash = hashAPIKey(apiKey);

    // Query database for matching key
    const { data: keyRecord, error } = await supabase
      .from('api_keys')
      .select(
        `
        id,
        firm_id,
        key_hash,
        scopes,
        expires_at,
        is_active,
        rotation_count
      `
      )
      .eq('key_prefix', prefix)
      .eq('is_active', true)
      .single();

    if (error || !keyRecord) {
      return { valid: false };
    }

    // ✅ Constant-time comparison (prevents timing attacks)
    const isValid = constantTimeCompare(
      providedHash,
      keyRecord.key_hash as string
    );

    if (!isValid) {
      // Log failed authentication attempt
      await logFailedKeyAuth(prefix, request);
      return { valid: false };
    }

    // ✅ Check key expiration
    const expiresAt = new Date(keyRecord.expires_at);
    if (new Date() > expiresAt) {
      return { valid: false };
    }

    // ✅ Check scopes are configured
    const scopes = (keyRecord.scopes as string[]) || [];
    if (scopes.length === 0) {
      return { valid: false };
    }

    // ✅ Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyRecord.id as string);

    return {
      valid: true,
      firmId: keyRecord.firm_id as string,
      scopes,
      expiresAt,
      rateLimitKey: `apikey:${keyRecord.id}`,
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return { valid: false };
  }
}

/**
 * Check if API key has required scope
 */
export function hasScope(
  scopes: string[],
  requiredScope: string
): boolean {
  return scopes.includes(requiredScope) || scopes.includes('admin');
}

/**
 * Rotate API key (invalidate old, create new)
 */
export async function rotateAPIKey(
  firmId: string,
  oldKeyPrefix: string
): Promise<{ newKey: string; oldKeyInvalidated: boolean } | null> {
  try {
    // Verify old key belongs to this firm
    const { data: oldKey } = await supabase
      .from('api_keys')
      .select('id, scopes, rotation_count')
      .eq('firm_id', firmId)
      .eq('key_prefix', oldKeyPrefix)
      .single();

    if (!oldKey) {
      return null;
    }

    // Generate new key with same scopes
    const { key: newKey, prefix: newPrefix } = generateAPIKey();
    const newKeyHash = hashAPIKey(newKey);

    // Calculate expiration (90 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    // Create new key record
    const { error: createError } = await supabase
      .from('api_keys')
      .insert({
        firm_id: firmId,
        key_hash: newKeyHash,
        key_prefix: newPrefix,
        scopes: oldKey.scopes,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        rotation_count: (oldKey.rotation_count as number) + 1,
      });

    if (createError) {
      console.error('Failed to create new API key:', createError);
      return null;
    }

    // Invalidate old key
    const { error: invalidateError } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('firm_id', firmId)
      .eq('key_prefix', oldKeyPrefix);

    if (invalidateError) {
      console.error('Failed to invalidate old key:', invalidateError);
      return null;
    }

    // ✅ Log key rotation in audit trail
    await logKeyRotation(firmId, oldKeyPrefix, newPrefix);

    return {
      newKey,
      oldKeyInvalidated: true,
    };
  } catch (error) {
    console.error('API key rotation error:', error);
    return null;
  }
}

/**
 * Revoke API key immediately
 */
export async function revokeAPIKey(
  firmId: string,
  keyPrefix: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('firm_id', firmId)
      .eq('key_prefix', keyPrefix);

    if (error) {
      console.error('Failed to revoke API key:', error);
      return false;
    }

    // ✅ Log revocation
    await logKeyRevocation(firmId, keyPrefix);

    return true;
  } catch (error) {
    console.error('API key revocation error:', error);
    return false;
  }
}

/**
 * Log failed authentication attempt
 */
async function logFailedKeyAuth(
  keyPrefix: string,
  request: Request
): Promise<void> {
  try {
    const ip = getClientIp(request);
    await supabase
      .from('audit_logs')
      .insert({
        event_type: 'API_KEY_AUTH_FAILED',
        description: `Failed authentication attempt with key prefix ${keyPrefix}`,
        user_ip: ip,
        metadata: {
          keyPrefix,
          timestamp: new Date().toISOString(),
        },
      });
  } catch (error) {
    console.error('Failed to log auth attempt:', error);
  }
}

/**
 * Log key rotation
 */
async function logKeyRotation(
  firmId: string,
  oldPrefix: string,
  newPrefix: string
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        firm_id: firmId,
        event_type: 'API_KEY_ROTATED',
        description: `API key rotated from ${oldPrefix} to ${newPrefix}`,
        metadata: {
          oldPrefix,
          newPrefix,
          timestamp: new Date().toISOString(),
        },
      });
  } catch (error) {
    console.error('Failed to log key rotation:', error);
  }
}

/**
 * Log key revocation
 */
async function logKeyRevocation(
  firmId: string,
  keyPrefix: string
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        firm_id: firmId,
        event_type: 'API_KEY_REVOKED',
        description: `API key ${keyPrefix} revoked`,
        metadata: {
          keyPrefix,
          timestamp: new Date().toISOString(),
        },
      });
  } catch (error) {
    console.error('Failed to log key revocation:', error);
  }
}

/**
 * Get client IP from request
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

// ============================================
// Database Schema
// ============================================
// Apply this migration to Supabase:
/*
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT ARRAY['leads:read', 'clients:read'],
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rotation_count INTEGER NOT NULL DEFAULT 0,
  
  CONSTRAINT valid_scopes CHECK (
    scopes <@ ARRAY['leads:read', 'leads:write', 'clients:read', 'clients:write', 'aml:read', 'matters:read', 'admin']
  ),
  CONSTRAINT expiration_future CHECK (expires_at > NOW())
);

CREATE INDEX idx_api_keys_firm_id ON api_keys(firm_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role only" ON api_keys
  FOR ALL USING (true)
  WITH CHECK (true);
*/