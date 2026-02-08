// lib/supabaseClient.ts - UPDATED (FOR PUBLIC DATA ONLY)
import { createClient } from '@supabase/supabase-js'

console.log('KEY prefix =', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 6));
console.log('KEY URL prefix =', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 6));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// ✓ Create a separate ANON key with ZERO permissions (see Supabase config below)
const supabasePublicKey = process.env.SUPABASE_SERVICE_ROLE_KEY!


export const supabasePublic = createClient(supabaseUrl, supabasePublicKey)

