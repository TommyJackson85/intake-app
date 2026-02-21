/**
 * Seed the demo law firm "Demo Conveyancing LLP" with demo data.
 * Run: npx ts-node scripts/seed-demo-firm.ts
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in env.
 */

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
const DEMO_LAWYER_EMAIL = 'demo.lawyer@demo.test'
const DEMO_LAWYER_PASSWORD = 'DemoLawyer2025!' // Change in production or use env

async function seedDemoFirm() {
  console.log('[seed-demo-firm] Starting…')

  // 1) Create or find demo firm
  let firmId: string

  const { data: existingFirm } = await admin
    .from('firms')
    .select('id')
    .eq('name', DEMO_FIRM_NAME)
    .maybeSingle()

  if (existingFirm) {
    firmId = existingFirm.id
    await admin.from('firms').update({ is_demo_firm: true, is_test_firm: true }).eq('id', firmId)
    console.log('[seed-demo-firm] Using existing demo firm:', firmId)
  } else {
    const { data: firm, error } = await admin
      .from('firms')
      .insert({
        name: DEMO_FIRM_NAME,
        state: DEMO_FIRM_STATE,
        is_test_firm: true,
        is_demo_firm: true,
      })
      .select('id')
      .single()
    if (error || !firm) {
      console.error('[seed-demo-firm] Failed to create firm:', error)
      process.exit(1)
    }
    firmId = firm.id
    console.log('[seed-demo-firm] Created demo firm:', firmId)
  }

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
      await admin.from('profiles').update({ firm_id: firmId, role: 'lawyer' }).eq('id', userId)
      console.log('[seed-demo-firm] Updated profile firm_id')
    }
  } else {
    const { error: profileError } = await admin
      .from('profiles')
      .insert({ id: userId, email: DEMO_LAWYER_EMAIL, firm_id: firmId, role: 'lawyer' })
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
  console.log('Demo lawyer credentials:')
  console.log('  Email:', DEMO_LAWYER_EMAIL)
  console.log('  Password:', DEMO_LAWYER_PASSWORD)
  console.log('')
  console.log('Set in .env for demo login API:')
  console.log('  DEMO_LAWYER_EMAIL=' + DEMO_LAWYER_EMAIL)
  console.log('  DEMO_LAWYER_PASSWORD=' + DEMO_LAWYER_PASSWORD)
}

seedDemoFirm().catch((e) => {
  console.error(e)
  process.exit(1)
})
