// lib/serverClient.ts
/*import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'  // <- type from supabase-js
import type { Database } from '@/lib/database.types'

//formally createServerSupabaseClient
export async function createSupabaseServerClientWithAuth(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )
}*/

// lib/serverClientStrict.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types' // optional: for type safety

/**
 * Creates a Supabase client using the SERVICE ROLE KEY.
 * 
 * SECURITY NOTES:
 * - This client BYPASSES Row Level Security (RLS).
 * - Use ONLY in server-side code (app/api/**, server actions, etc.).
 * - NEVER import or use this in client components or browser code.
 * - Always scope queries by firm_id in your code to enforce tenant isolation.
 * 
 * Since we don't use Supabase Auth, tenant isolation is enforced by:
 * 1. API key header (x-firm-api-key) → resolves to firm_id
 * 2. All queries filtered by .eq('firm_id', firmId)
 * 3. Audit logging of all sensitive operations
 */
export function createSupabaseServerClientWithAuth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    )
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Convenience singleton if you prefer not to create a new client each time
let _serviceClient: ReturnType<typeof createSupabaseServerClientWithAuth> | null = null

export function getSupabaseServiceClient() {
  if (!_serviceClient) {
    _serviceClient = createSupabaseServerClientWithAuth()
  }
  return _serviceClient
}