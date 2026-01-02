// lib/supabaseAuth.ts (new file)
import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use anon, but only for auth-required queries
  )
}
