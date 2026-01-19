// lib/rotate-firm-api-key.ts
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { logAuditEvent } from './auditLog'

export async function rotateFirmApiKey(firmId: string) {
  const newKey = Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString(
    'hex',
  )

  const { data, error } = await createSupabaseServerClientStrict
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

  await logAuditEvent({
    firm_id: firmId,
    user_id: null, // you’re not using Supabase Auth; you can later plug in your own user ID
    event_type: 'api_key_rotated',
    entity_type: 'firm',
    entity_id: firmId,
    details: {
      firm_name: data.firm_name,
    },
    lawful_basis: 'Security - key rotation',
  })

  return data.api_key as string
}