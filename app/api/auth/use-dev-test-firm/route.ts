/**
 * POST /api/auth/use-dev-test-firm
 * Links an is_dev_sudo profile to the dev test firm (is_test_firm=true, is_demo_firm=false).
 * Only for developer sudo accounts. Full dashboard, no demo banners.
 */

import { createClient } from '@supabase/supabase-js'
import { getServerSupabase } from '@/lib/serverSupabase'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'
import { isSudoEnabled } from '@/lib/env'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  const fallbackUrl = new URL('/dashboard/register-firm', request.url)
  const dashboardUrl = new URL('/dashboard', request.url)

  if (!isSudoEnabled()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!url || !serviceRoleKey) {
    fallbackUrl.searchParams.set('demo_error', 'Server misconfigured.')
    return NextResponse.redirect(fallbackUrl, 302)
  }

  const supabase = await getServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    fallbackUrl.searchParams.set('demo_error', 'Please sign in first.')
    return NextResponse.redirect(fallbackUrl, 302)
  }

  const admin = createClient<Database>(url, serviceRoleKey)
  const { data: profile } = await admin
    .from('profiles')
    .select('id, is_dev_sudo')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || (profile as { is_dev_sudo?: boolean }).is_dev_sudo !== true) {
    fallbackUrl.searchParams.set('demo_error', 'Dev sudo required.')
    return NextResponse.redirect(fallbackUrl, 302)
  }

  const { data: devTestFirm } = await admin
    .from('firms')
    .select('id')
    .eq('name', 'Dev Test Conveyancing LLP')
    .eq('is_demo_firm', false)
    .maybeSingle()

  if (!devTestFirm) {
    fallbackUrl.searchParams.set('demo_error', 'No dev test firm found. Run: npx ts-node scripts/seed-dev-test-firm.ts')
    return NextResponse.redirect(fallbackUrl, 302)
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ firm_id: devTestFirm.id })
    .eq('id', user.id)

  if (updateError) {
    console.error('[use-dev-test-firm] Failed to link profile:', updateError)
    fallbackUrl.searchParams.set('demo_error', 'Could not link to dev test firm.')
    return NextResponse.redirect(fallbackUrl, 302)
  }

  return NextResponse.redirect(dashboardUrl, 302)
}
