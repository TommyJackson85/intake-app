// lib/rotate-firm-api-key.ts
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { logAuditEvent } from './auditLog'

export async function rotateFirmApiKey(firmId: string) {
  // Generate a new random key
  const newKey = Buffer.from(
    crypto.getRandomValues(new Uint8Array(24))
  ).toString('hex')

  const { data, error } = await createSupabaseServerClientStrict()
    .from('firms')
    .update({
      api_key: newKey,
      api_key_rotated_at: new Date().toISOString(),
    })
    .eq('id', firmId)
    .select('id, firm_name, api_key')
    .single()

  if (error || !data) {
    throw new Error('API_KEY_ROTATION_FAILED')
  }

  // ✅ Audit log using firmId and the new key (or a safe truncated version)
  const safeKeyId = newKey.slice(0, 8) // avoid logging full secret

  await logAuditEvent(
    firmId,                 // firmId: string | null
    null,                   // userId: string | null (no auth user yet)
    'api_key_rotated',      // eventType
    'api_key',              // resourceType
    safeKeyId,              // resourceId (non‑sensitive identifier)
    {
      firmName: data.firm_name,
      rotatedAt: new Date().toISOString(),
    }
  )

  return data.api_key as string
}