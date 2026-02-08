// lib/get-firm-from-api-key.ts
import { createSupabaseServerClientStrict } from './serverClientStrict'
// lib/get-firm-from-api-key.ts - FIXED VERSION
// Correct Supabase client initialization

import crypto from 'crypto';

export interface FirmWithAPIKey {
  id: string;
  name: string;
  firm_state: string;
  created_at: string;
  apiKeyScopes?: string[];
}

/**
 * Get firm from API key
 * ✅ Fixed: Properly await and call Supabase client
 */
export async function getFirmFromApiKey(
  apiKey: string
): Promise<FirmWithAPIKey | null> {
  try {
    // ✅ FIX: Await the client creation first, then call methods
    const supabase = await createSupabaseServerClientStrict();

    // Hash the API key for comparison
    const hashedKey = hashAPIKey(apiKey);

    // Query the firms table
    const { data: firm, error } = await supabase
      .from('firms')
      .select('id, name, firm_state, created_at')
      .eq('api_key_hash', hashedKey)  // Use hashed key, not plaintext
      .eq('api_key_active', true)
      .single();

    if (error) {
      console.error('Error fetching firm:', error);
      return null;
    }

    if (!firm) {
      console.warn('Firm not found for API key');
      return null;
    }

    return firm as FirmWithAPIKey;
  } catch (error) {
    console.error('Failed to get firm from API key:', error);
    return null;
  }
}

/**
 * Hash API key using SHA-256
 */
function hashAPIKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify API key and get firm with proper error handling
 */
export async function verifyAPIKeyAndGetFirm(
  apiKey: string
): Promise<{
  success: boolean;
  firm?: FirmWithAPIKey;
  error?: string;
}> {
  try {
    if (!apiKey || apiKey.length < 50) {
      return {
        success: false,
        error: 'Invalid API key format',
      };
    }

    const firm = await getFirmFromApiKey(apiKey);

    if (!firm) {
      return {
        success: false,
        error: 'Firm not found or API key invalid',
      };
    }

    return {
      success: true,
      firm,
    };
  } catch (error) {
    console.error('API key verification error:', error);
    return {
      success: false,
      error: 'Failed to verify API key',
    };
  }
}