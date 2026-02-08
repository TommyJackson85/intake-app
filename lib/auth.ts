import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict';

export async function verifyAuth(token: string) {
  try {
    const supabase = await createSupabaseServerClientStrict();

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Invalid token');
    }
    
    return { user, authenticated: true };
  } catch (error) {
    return { authenticated: false, error };
  }
}