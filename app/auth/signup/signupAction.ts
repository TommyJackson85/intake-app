'use server'
import { createBrowserSupabaseClient } from '@/lib/browserClient'

const supabase = createBrowserSupabaseClient()

export async function signUpAction(
  email: string,
  password: string,
  firmName: string,
  state: string
) {
  // 1️⃣ Create auth user
  const { data: user, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

  if (authError) throw authError

  // 2️⃣ Insert firm
  const { data: firm, error: firmError } = await supabase
    .from('firms')
    .insert({ name: firmName, state, email_contact: email })
    .select()
    .single()

  if (firmError) throw firmError

  // 3️⃣ Insert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.user.id,
      firm_id: firm.id,
      full_name: firmName,
      role: 'firm_owner',
    })

  if (profileError) throw profileError

  return { success: true }
}
