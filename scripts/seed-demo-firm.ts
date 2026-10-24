/**
 * Seed the **legacy** Supabase demo law firm "Demo Conveyancing LLP" (is_demo_firm).
 *
 * Quarantined / internal QA only. Public product demo is the browser sandbox at `/demo`
 * (see docs/public-demo-sandbox.md). Do not use this script to power marketing CTAs.
 *
 * Run: DEMO_LAWYER_PASSWORD='…' npx ts-node scripts/seed-demo-firm.ts
 *
 * Loads .env.local or .env from project root automatically.
 */

import { config } from 'dotenv'
import path from 'path'

config({ path: path.join(process.cwd(), '.env') })
config({ path: path.join(process.cwd(), '.env.local'), override: true })

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient<Database>(url, key)

const DEMO_FIRM_NAME = 'Demo Conveyancing LLP'
const DEMO_FIRM_STATE = 'FL'
/** Non-secret default email for the legacy demo lawyer Auth user. */
const DEMO_LAWYER_EMAIL = (process.env.DEMO_LAWYER_EMAIL || 'demo.lawyer@demo.test').trim()
/**
 * Required from env — never hardcode. Used only for this legacy seed / internal tenant.
 * Public `/demo` does not need this variable.
 */
const DEMO_LAWYER_PASSWORD = (process.env.DEMO_LAWYER_PASSWORD || '').trim()

async function seedDemoFirm() {
  if (!DEMO_LAWYER_PASSWORD) {
    console.error('[seed-demo-firm] DEMO_LAWYER_PASSWORD is required (set in .env.local).')
    console.error('  There is no hardcoded default. Public prospect demo is /demo and does not use this script.')
    process.exit(1)
  }

  console.log('[seed-demo-firm] Starting (legacy is_demo_firm tenant)…')

  // 1) Create or find demo firm via RPC (bypasses RLS)
  let firmId: string

  const { data: rpcFirmId, error: rpcError } = await admin.rpc('create_or_get_demo_firm')
  if (rpcError) {
    console.error('[seed-demo-firm] RPC failed:', rpcError)
    console.error('')
    console.error('Run the SQL in supabase/seed-demo-firm.sql in Supabase Dashboard → SQL Editor first.')
    console.error('That creates the create_or_get_demo_firm() function.')
    process.exit(1)
  }
  firmId = rpcFirmId as string
  console.log('[seed-demo-firm] Demo firm:', firmId)

  // 2) Create demo auth user (Supabase Auth) + profile
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: DEMO_LAWYER_EMAIL,
    password: DEMO_LAWYER_PASSWORD,
    email_confirm: true,
  })

  let userId: string
  if (authError) {
    if (authError.message?.includes('already been registered')) {
      const { data: users } = await admin.auth.admin.listUsers()
      const u = users?.users?.find((x) => x.email === DEMO_LAWYER_EMAIL)
      if (!u) {
        console.error('[seed-demo-firm] Auth user exists but could not find:', authError)
        process.exit(1)
      }
      userId = u.id
      console.log('[seed-demo-firm] Using existing auth user:', userId)
    } else {
      console.error('[seed-demo-firm] Failed to create auth user:', authError)
      process.exit(1)
    }
  } else {
    userId = authUser.user!.id
    console.log('[seed-demo-firm] Created auth user:', userId)
  }

  // 3) Ensure profile exists and is linked to demo firm
  const { data: profile } = await admin.from('profiles').select('id, firm_id').eq('id', userId).maybeSingle()

  if (profile) {
    if (profile.firm_id !== firmId) {
      await admin.from('profiles').update({ firm_id: firmId, role: 'lawyer', is_demo_guest: true }).eq('id', userId)
      console.log('[seed-demo-firm] Updated profile firm_id')
    } else {
      await admin.from('profiles').update({ is_demo_guest: true }).eq('id', userId)
      console.log('[seed-demo-firm] Set is_demo_guest on profile')
    }
  } else {
    const { error: profileError } = await admin
      .from('profiles')
      .insert({ id: userId, email: DEMO_LAWYER_EMAIL, firm_id: firmId, role: 'lawyer', is_demo_guest: true })
    if (profileError) {
      console.error('[seed-demo-firm] Failed to create profile:', profileError)
      process.exit(1)
    }
    console.log('[seed-demo-firm] Created profile')
  }

  // 4) Seed demo clients
  const clientsToCreate = [
    { full_name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+1 305 555 0101' },
    { full_name: 'Bob Jones', email: 'bob.jones@example.com', phone: '+1 305 555 0102' },
  ]

  const clientIds: string[] = []
  for (const c of clientsToCreate) {
    const { data: existing } = await admin
      .from('clients')
      .select('id')
      .eq('firm_id', firmId)
      .eq('email', c.email)
      .maybeSingle()
    if (existing) {
      clientIds.push(existing.id)
    } else {
      const { data: client, error } = await admin
        .from('clients')
        .insert({
          firm_id: firmId,
          full_name: c.full_name,
          email: c.email,
          phone: c.phone,
        })
        .select('id')
        .single()
      if (!error && client) clientIds.push(client.id)
    }
  }
  console.log('[seed-demo-firm] Clients:', clientIds.length)

  // 5) Seed demo matters (if we have clients)
  if (clientIds.length > 0) {
    const matters = [
      { client_id: clientIds[0], matter_type: 'real_estate_purchase', property_address: '123 Demo St, Miami, FL', status: 'open', expected_closing_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
      { client_id: clientIds[0], matter_type: 'conveyancing', property_address: '456 Sandbox Ave, Tampa, FL', status: 'open', expected_closing_date: null },
      { client_id: clientIds[1] ?? clientIds[0], matter_type: 'real_estate_sale', property_address: '789 Sample Dr, Orlando, FL', status: 'open', expected_closing_date: null },
    ]
    for (const m of matters) {
      const { data: existing } = await admin
        .from('matters')
        .select('id')
        .eq('firm_id', firmId)
        .eq('client_id', m.client_id)
        .eq('property_address', m.property_address)
        .maybeSingle()
      if (!existing) {
        await admin.from('matters').insert({
          firm_id: firmId,
          client_id: m.client_id,
          matter_type: m.matter_type,
          property_address: m.property_address,
          status: m.status,
          expected_closing_date: m.expected_closing_date,
        })
      }
    }
    console.log('[seed-demo-firm] Matters seeded')
  }

  // 6) Seed demo leads (intakes) – table may not be in generated types yet
  try {
    const leadsTable = (admin as any).from('leads')
    const { data: existingLead } = await leadsTable
      .select('id')
      .eq('firm_id', firmId)
      .eq('client_email', 'demo.client@example.com')
      .maybeSingle()
    if (!existingLead) {
      const { error } = await leadsTable.insert({
        firm_id: firmId,
        assigned_to_user_id: userId,
        client_email: 'demo.client@example.com',
        client_full_name: 'Demo Client',
        matter_type: 'real_estate_purchase',
        property_address: '100 Demo Lane, Miami, FL',
        status: 'new',
      })
      if (!error) console.log('[seed-demo-firm] Demo lead seeded')
    }
  } catch {
    // leads table may not exist yet
  }

  console.log('[seed-demo-firm] Done.')
  console.log('')
  console.log('Legacy demo lawyer Auth user:')
  console.log('  Email:', DEMO_LAWYER_EMAIL)
  console.log('  Password: (from DEMO_LAWYER_PASSWORD — not printed)')
  console.log('')
  console.log('Note: Public CTAs should use /demo. demo-login / use-demo-firm only redirect there.')
}

seedDemoFirm().catch((e) => {
  console.error(e)
  process.exit(1)
})
