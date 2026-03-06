import { redirect } from 'next/navigation'
import { getCurrentUserServer } from '@/lib/server/current-user'
import { isSudoEnabled } from '@/lib/env'
import { createSupabaseServerClientStrict } from '@/lib/serverClientStrict'
import { getServerSupabase } from '@/lib/serverSupabase'
import { SudoUserList } from './SudoUserList'
import { SendTestLinkForm } from './SendTestLinkForm'

export default async function DevSudoPage() {
  if (!isSudoEnabled()) {
    redirect('/dashboard')
  }

  const supabase = await getServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/auth/signin')

  const admin = createSupabaseServerClientStrict()
  const { data: realProfile } = await admin
    .from('profiles')
    .select('is_dev_sudo')
    .eq('id', user.id)
    .maybeSingle()

  if ((realProfile as { is_dev_sudo?: boolean } | null)?.is_dev_sudo !== true) {
    redirect('/dashboard')
  }

  const current = await getCurrentUserServer()
  if (!current) redirect('/auth/signin')

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, full_name, role, firm_id')
    .order('email')

  const firmIds = [...new Set((profiles ?? []).map((p) => p.firm_id).filter(Boolean))] as string[]
  const { data: firms } = await admin
    .from('firms')
    .select('id, name, state, is_test_firm, is_demo_firm')
    .in('id', firmIds)

  const firmMap: Record<string, { id: string; name: string; state?: string | null; is_test_firm: boolean; is_demo_firm?: boolean }> = {}
  for (const f of firms ?? []) {
    firmMap[f.id] = {
      id: f.id,
      name: f.name,
      state: (f as { state?: string | null }).state,
      is_test_firm: f.is_test_firm,
      is_demo_firm: (f as { is_demo_firm?: boolean }).is_demo_firm,
    }
  }
  const byFirm = new Map<string | null, typeof profiles>()
  for (const p of profiles ?? []) {
    const key = p.firm_id ?? null
    if (!byFirm.has(key)) byFirm.set(key, [])
    byFirm.get(key)!.push(p)
  }
  type ProfileItem = { id: string; email: string | null; full_name: string | null; role: string | null; firm_id: string | null }
  const byFirmArray: [string | null, ProfileItem[]][] = Array.from(byFirm.entries()).map(([k, v]) => [k, (v ?? []) as ProfileItem[]])

  return (
    <div style={{ maxWidth: '900px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Developer Sudo</h1>
      <p style={{ color: '#627c71', marginBottom: '24px', fontSize: '14px' }}>
        Impersonate a user to see the app as they would. Test firms show full dashboard (no demo banners).
        In production, impersonation is restricted to test firms only.
      </p>
      {(current as { impersonating?: boolean }).impersonating && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#fff8e6', borderRadius: '6px', fontSize: '14px' }}>
          You are currently impersonating. Use the button below to return to your dev account.
          <form action="/api/dev/stop-impersonate" method="POST" style={{ marginTop: '8px' }}>
            <button type="submit" style={{ padding: '6px 12px', background: '#208096', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
              Stop impersonating / return to my dev account
            </button>
          </form>
        </div>
      )}
      <SendTestLinkForm />
      <SudoUserList byFirm={byFirmArray} firmMap={firmMap} currentUserId={current.authUser.id} />
    </div>
  )
}
