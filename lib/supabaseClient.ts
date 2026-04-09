// lib/supabaseClient.ts - UPDATED (FOR PUBLIC DATA ONLY)
import { createClient } from '@supabase/supabase-js'

export const getSupabasePublic = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

