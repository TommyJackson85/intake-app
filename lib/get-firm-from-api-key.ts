// lib/get-firm-from-api-key.ts
import { createSupabaseServerClientStrict } from './serverClientStrict'

export async function getFirmFromApiKey(apiKey: string | null) {
  if (!apiKey) {
    throw new Error('MISSING_API_KEY')
  }

  const { data: firm, error } = await createSupabaseServerClientStrict
    .from('firms')
    .select('id, name, firm_state, created_at')
    .eq('api_key', apiKey)
    .single()

  if (error || !firm) {
    throw new Error('INVALID_API_KEY')
  }

  return firm
}