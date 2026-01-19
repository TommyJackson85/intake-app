// lib/get-firm-api-key.ts
import { supabaseService } from './serverClientService'

export interface FirmApiKeyRecord {
  firm_id: string
  scopes: string[]
}

export async function getFirmFromApiKeyWithScopes(
  apiKey: string | null,
): Promise<FirmApiKeyRecord & { firm_name: string }> {
  if (!apiKey) {
    throw new Error('MISSING_API_KEY')
  }

  const { data, error } = await supabaseService
    .from('firm_api_keys')
    .select('firm_id, scopes, firms!inner(firm_name)')
    .eq('api_key', apiKey)
    .is('revoked_at', null)
    .single()

  if (error || !data) {
    throw new Error('INVALID_API_KEY')
  }

  return {
    firm_id: data.firm_id,
    scopes: data.scopes,
    firm_name: (data as any).firms.firm_name,
  }
}