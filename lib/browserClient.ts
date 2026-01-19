import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

// formally createBrowserSupabaseClient
export const createSupabaseBrowserClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!
  )
  //anon key removed for security reasons due to supabase having issues with auth.