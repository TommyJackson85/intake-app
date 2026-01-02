// lib/supabaseClient.ts - UPDATED (FOR PUBLIC DATA ONLY)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// ✓ Create a separate ANON key with ZERO permissions (see Supabase config below)
const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!

export const supabasePublic = createClient(supabaseUrl, supabasePublicKey)

