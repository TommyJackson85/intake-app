import { createClient as createSupabaseClient } from '@supabase/supabase-js'

//formally getSupabaseServerClient
export const createSupabaseServerClientStrict = () =>{
  // This is a pure server-only client, no cookies/session.
  // Safe to use with the service role key in this API route only.
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // IMPORTANT: service role key, NEVER expose this to the browser
  )
}