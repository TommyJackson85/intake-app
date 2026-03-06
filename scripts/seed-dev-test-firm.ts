/**
 * Seed the dev test firm "Dev Test Conveyancing LLP" with synthetic data.
 * is_test_firm=true, is_demo_firm=false. For developer sudo testing.
 *
 * Run: npx ts-node scripts/seed-dev-test-firm.ts
 *
 * Creates:
 * - Dev test firm (shared internal tenant)
 * - Synthetic clients, matters, leads
 * - Optional: dev-test-admin auth user + profile for impersonation target
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

const DEV_TEST_FIRM_NAME = 'Dev Test Conveyancing LLP'
const DEV_TEST_ADMIN_EMAIL = 'dev-test-admin@dev.test'
const DEV_TEST_ADMIN_PASSWORD = 'DevTestAdmin2025!' // Synthetic only; change if needed

async function seedDevTestFirm() {
  console.log('[seed-dev-test-firm] Starting…')

  // 1) Create or find dev test firm (is_test_firm=true, is_demo_firm=false)
  let firmId: string

  const { data: existing } = await admin
    .from('firms')
    .select('id')
    .eq('name', DEV_TEST_FIRM_NAME)
    .eq('is_demo_firm', false)
    .maybeSingle()

  if (existing) {
    firmId = existing.id
    await admin.from('firms').update({ is_test_firm: true, is_demo_firm: false }).eq('id', firmId)
    console.log('[seed-dev-test-firm] Using existing firm:', firmId)
  } else {
    const { data: firm, error } = await admin
      .from('firms')
      .insert({
        name: DEV_TEST_FIRM_NAME,
        state: 'FL',
        is_test_firm: true,
        is_demo_firm: false,
      })
      .select('id')
      .single()
    if (error || !firm) {
      console.error('[seed-dev-test-firm] Failed to create firm:', error)
      process.exit(1)
    }
    firmId = firm.id
    console.log('[seed-dev-test-firm] Created firm:', firmId)
  }

  // 2) Seed synthetic clients
  const clientsToCreate = [
    { full_name: 'Test Client Alpha', email: 'test.alpha@dev.example.com', phone: '+1 555 0101' },
    { full_name: 'Test Client Beta', email: 'test.beta@dev.example.com', phone: '+1 555 0102' },
  ]

  const clientIds: string[] = []
  for (const c of clientsToCreate) {
    const { data: ex } = await admin
      .from('clients')
      .select('id')
      .eq('firm_id', firmId)
      .eq('email', c.email)
      .maybeSingle()
    if (ex) {
      clientIds.push(ex.id)
    } else {
      const { data: client } = await admin
        .from('clients')
        .insert({ firm_id: firmId, full_name: c.full_name, email: c.email, phone: c.phone })
        .select('id')
        .single()
      if (client) clientIds.push(client.id)
    }
  }
  console.log('[seed-dev-test-firm] Clients:', clientIds.length)

  // 3) Seed synthetic matters
  if (clientIds[0]) {
    const matters = [
      { client_id: clientIds[0], property_address: '100 Dev Test St, Miami, FL', matter_type: 'real_estate_purchase', status: 'open' },
      { client_id: clientIds[1] ?? clientIds[0], property_address: '200 Dev Test Ave, Tampa, FL', matter_type: 'real_estate_sale', status: 'open' },
    ]
    for (const m of matters) {
      const { data: ex } = await admin
        .from('matters')
        .select('id')
        .eq('firm_id', firmId)
        .eq('client_id', m.client_id)
        .eq('property_address', m.property_address)
        .maybeSingle()
      if (!ex) {
        await admin.from('matters').insert({
          firm_id: firmId,
          client_id: m.client_id,
          matter_type: m.matter_type,
          property_address: m.property_address,
          status: m.status,
        })
      }
    }
    console.log('[seed-dev-test-firm] Matters seeded')
  }

  // 4) Seed synthetic lead
  try {
    const { data: exLead } = await (admin as any).from('leads')
      .select('id')
      .eq('firm_id', firmId)
      .eq('client_email', 'test.lead@dev.example.com')
      .maybeSingle()
    if (!exLead) {
      await (admin as any).from('leads').insert({
        firm_id: firmId,
        client_email: 'test.lead@dev.example.com',
        client_full_name: 'Test Lead',
        matter_type: 'real_estate_purchase',
        property_address: '300 Dev Lane, Orlando, FL',
        status: 'new',
      })
      console.log('[seed-dev-test-firm] Lead seeded')
    }
  } catch {
    // leads table may not exist
  }

  // 5) Create dev-test-admin user for impersonation target (optional)
  const { data: authUser, error: authError } = await (admin as any).auth.admin.createUser({
    email: DEV_TEST_ADMIN_EMAIL,
    password: DEV_TEST_ADMIN_PASSWORD,
    email_confirm: true,
  })

  let adminUserId: string | null = null
  if (authError?.message?.includes('already been registered')) {
    const { data: users } = await (admin as any).auth.admin.listUsers()
    const u = users?.users?.find((x: { email?: string }) => x.email === DEV_TEST_ADMIN_EMAIL)
    if (u) adminUserId = u.id
  } else if (!authError && authUser?.user) {
    adminUserId = authUser.user.id
  }

  if (adminUserId) {
    const { data: prof } = await admin.from('profiles').select('id, firm_id').eq('id', adminUserId).maybeSingle()
    if (prof) {
      if (prof.firm_id !== firmId) {
        await admin.from('profiles').update({ firm_id: firmId, role: 'lawyer' }).eq('id', adminUserId)
        console.log('[seed-dev-test-firm] Linked dev-test-admin to firm')
      }
    } else {
      await admin.from('profiles').insert({
        id: adminUserId,
        email: DEV_TEST_ADMIN_EMAIL,
        firm_id: firmId,
        role: 'lawyer',
        full_name: 'Dev Test Admin',
      })
      console.log('[seed-dev-test-firm] Created dev-test-admin profile')
    }
  }

  console.log('[seed-dev-test-firm] Done.')
  console.log('')
  console.log('Dev test firm:', firmId)
  if (adminUserId) {
    console.log('Impersonation target:')
    console.log('  Email:', DEV_TEST_ADMIN_EMAIL)
    console.log('  Password:', DEV_TEST_ADMIN_PASSWORD)
  }
}

seedDevTestFirm().catch((e) => {
  console.error(e)
  process.exit(1)
})
