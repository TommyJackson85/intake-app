// scripts/backfillPassword.ts
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict';

const supabase = await createSupabaseServerClientStrict();

async function backfillPassword(email: string, plainPassword: string) {
  const hash = await bcrypt.hash(plainPassword, 12)
  const { error } = await supabase
    .from('profiles')
    .update({ password_hash: hash })
    .eq('email', email.toLowerCase())

  console.log(email, error ?? 'OK')
}

// simple CLI usage: node scripts/backfillPassword.js email password
const [,, emailArg, passwordArg] = process.argv
if (!emailArg || !passwordArg) {
  console.error('Usage: ts-node scripts/backfillPassword.ts <email> <password>')
  process.exit(1)
}

backfillPassword(emailArg, passwordArg).then(() => process.exit(0))