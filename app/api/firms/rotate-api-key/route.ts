import { NextRequest, NextResponse } from 'next/server'
import { rotateFirmApiKey } from '@/lib/rotate-firm-api-key'

import { assertScope, REQUIRED_SCOPES } from '@/lib/api-scope'
import { getFirmFromApiKeyWithScopes } from '@/lib/get-firm-api-key'

// You need *your* own app-level admin/system auth here, NOT Supabase Auth.
// For now, assume you have some simple check, e.g. an internal admin key.
// Replace this with your own admin/session logic.
function assertInternalAdmin(request: NextRequest) {
  const adminKey = request.headers.get('x-internal-admin-key')
  if (adminKey !== process.env.INTERNAL_ADMIN_KEY) {
    throw new Error('UNAUTHORIZED')
  }
}

export async function POST(request: NextRequest) {

  const apiKey = request.headers.get('x-firm-api-key')
  const { firm_id, scopes } = await getFirmFromApiKeyWithScopes(apiKey)

  // Check permission for this action
  assertScope(scopes, REQUIRED_SCOPES.createLead)
  try {
    assertInternalAdmin(request)

    const { firm_id } = await request.json()
    if (!firm_id) {
      return NextResponse.json({ error: 'firm_id is required' }, { status: 400 })
    }

    const newKey = await rotateFirmApiKey(firm_id)

    return NextResponse.json(
      {
        api_key: newKey,
      },
      { status: 200 },
    )
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('API key rotation error:', error)
    return NextResponse.json(
      { error: 'Failed to rotate API key' },
      { status: 500 },
    )
  }
}