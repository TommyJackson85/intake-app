import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict';

const supabase = await createSupabaseServerClientStrict()

async function testConnection() {
  const { data, error } = await supabase.from('firms').select('count')
  if (error) console.error('Error:', error)
  else console.log('✓ Connected to Supabase')
}

testConnection()
