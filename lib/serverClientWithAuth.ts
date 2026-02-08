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
//import { createClient } from '@supabase/supabase-js'

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
// lib/serverClientWithAuth.ts (example you already have)
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

export async function createSupabaseServerClientWithAuth() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

