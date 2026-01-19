/*import { createClient as createSupabaseClient } from '@supabase/supabase-js'

//formally getSupabaseServerClient
export const createSupabaseServerClientStrict = () =>{
  // This is a pure server-only client, no cookies/session.
  // Safe to use with the service role key in this API route only.
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANT: service role key, NEVER expose this to the browser
  )
}*/

// lib/serverClientService.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Pure server-only client using the service-role key.
// NEVER import this into client components or expose these env vars to the browser.
export const createSupabaseServerClientStrict = () => {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}