/**
 * POST /api/auth/use-demo-firm
 * Links the CURRENT logged-in user to the demo firm. No sign-in as a different account.
 * User stays on their own account and sees the demo dashboard with demo data.
 */

import { createClient } from '@supabase/supabase-js'
import { getServerSupabase } from '@/lib/serverSupabase'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  const fallbackUrl = new URL('/dashboard/firm-setup', request.url)
  const dashboardUrl = new URL('/dashboard', request.url)

  if (!url) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const supabase = await getServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    fallbackUrl.searchParams.set('demo_error', 'Please sign in first.')
    return NextResponse.redirect(fallbackUrl, 302)
  }

  if (!serviceRoleKey) {
    fallbackUrl.searchParams.set('demo_error', 'Demo not configured. Add SUPABASE_SERVICE_ROLE_KEY.')
    return NextResponse.redirect(fallbackUrl, 302)
  }

  const admin = createClient<Database>(url!, serviceRoleKey)
  const { data: demoFirm } = await admin
    .from('firms')
    .select('id')
    .eq('is_demo_firm', true)
    .limit(1)
    .maybeSingle()

  if (!demoFirm) {
    fallbackUrl.searchParams.set('demo_error', 'No demo firm found. Run supabase/seed-demo-firm.sql in Supabase.')
    return NextResponse.redirect(fallbackUrl, 302)
  }

  const { error: upsertError } = await admin
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        firm_id: demoFirm.id,
        role: 'lawyer',
      },
      { onConflict: 'id' }
    )

  if (upsertError) {
    console.error('[use-demo-firm] Failed to link profile:', upsertError)
    fallbackUrl.searchParams.set('demo_error', 'Could not link to demo firm. Check Supabase.')
    return NextResponse.redirect(fallbackUrl, 302)
  }

  return NextResponse.redirect(dashboardUrl, 302)
}
