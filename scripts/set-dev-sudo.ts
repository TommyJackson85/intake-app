/**
 * Mark a profile as developer sudo (is_dev_sudo = true) by email.
 * Run: npx ts-node scripts/set-dev-sudo.ts user@example.com
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.
 * Only run in non-production; this does not check NODE_ENV.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const email = process.argv[2]
if (!email) {
  console.error('Usage: npx ts-node scripts/set-dev-sudo.ts <email>')
  process.exit(1)
}

const admin = createClient<Database>(url, key)

async function main() {
  const { data: profile, error: findError } = await admin
    .from('profiles')
    .select('id, email, is_dev_sudo')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (findError) {
    console.error('Error fetching profile:', findError)
    process.exit(1)
  }
  if (!profile) {
    console.error('No profile found for email:', email)
    process.exit(1)
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ is_dev_sudo: true })
    .eq('id', profile.id)

  if (updateError) {
    console.error('Error updating profile:', updateError)
    process.exit(1)
  }

  console.log('Set is_dev_sudo = true for:', profile.email, '(id:', profile.id, ')')
}

main()
