'use client'

import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type DashboardHomeResponse = {
  summary: {
    newIntakes: number
    waitingOnClient: number
    closingsNext7Days: number
    mattersNeedingAttention: number
  }
  worklists: {
    intakes: Array<{
      id: string
      created_at: string | null
      status: string | null
      client_full_name: string | null
      client_email: string | null
      matter_type: string | null
      property_address: string | null
      assigned_to_user_id: string | null
    }>
    matters: Array<{
      id: string
      created_at: string | null
      status: string | null
      matter_type: string
      property_address: string | null
      expected_closing_date: string | null
      client: { id: string; full_name: string; email: string } | null
    }>
  }
  keyDates: Array<{
    kind: 'closing'
    date: string
    label: string
    href: string
  }>
}

export default function Dashboard() {
  const { profile, firm } = useAuth()
  const hasFirm = Boolean(profile?.firm_id)
  const [activeTab, setActiveTab] = useState<'intakes' | 'matters'>('intakes')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardHomeResponse | null>(null)
  const [error, setError] = useState('')

  const canSeeFirmDashboard = useMemo(() => {
    if (!profile) return false
    if (profile.role === 'client') return false
    return Boolean(profile.firm_id)
  }, [profile])

  useEffect(() => {
    const load = async () => {
      if (!canSeeFirmDashboard) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/dashboard/home', { method: 'GET' })
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || 'Failed to load dashboard')
        setData(body as DashboardHomeResponse)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [canSeeFirmDashboard])

  if (!hasFirm) {
    return (
      <div>
        <h1 style={{ marginBottom: '12px', fontSize: '32px' }}>Welcome to LawIntake</h1>
        <p style={{ marginBottom: '24px', color: '#627c71' }}>
          You’re signed in. To use client intake, matters, AML checks, and other practice features,
          register your law firm. This keeps us compliant with multijurisdictional practice and
          data privacy requirements.
        </p>
        <div
          style={{
            background: 'white',
            padding: '28px',
            borderRadius: '8px',
            border: '1px solid rgba(94, 82, 64, 0.2)',
            maxWidth: '480px',
          }}
        >
          <h2 style={{ marginBottom: '12px', fontSize: '20px' }}>Register your law firm</h2>
          <p style={{ marginBottom: '20px', color: '#627c71', fontSize: '14px' }}>
            Add your firm name and state to unlock the full dashboard and API features.
          </p>
          <Link
            href="/dashboard/register-firm"
            style={{
              display: 'inline-block',
              background: '#208096',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Register firm
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
            <div>
              <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Dashboard</h1>
              <p style={{ margin: 0, color: '#627c71', fontSize: '14px' }}>
                Your worklist and key dates for the next 7 days.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                href="/dashboard/intakes/new"
                style={{
                  background: '#208096',
                  color: 'white',
                  padding: '12px 18px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                + New intake link
              </Link>
              <Link
                href="/dashboard/matters/new"
                style={{
                  background: 'rgba(94, 82, 64, 0.12)',
                  color: '#134252',
                  padding: '12px 18px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                + New matter
              </Link>
              <Link
                href="/dashboard/notes/new"
                style={{
                  background: 'white',
                  color: '#134252',
                  padding: '12px 18px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: '1px solid rgba(94, 82, 64, 0.2)',
                }}
              >
                Log note / upload
              </Link>
            </div>
          </div>

          {/* Summary cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              marginBottom: '18px',
            }}
          >
            {[
              { label: 'New intakes to review', value: loading ? '—' : (data?.summary.newIntakes ?? 0) },
              { label: 'Waiting on client info', value: loading ? '—' : (data?.summary.waitingOnClient ?? 0) },
              { label: 'Closings (next 7 days)', value: loading ? '—' : (data?.summary.closingsNext7Days ?? 0) },
              { label: 'Matters needing attention', value: loading ? '—' : (data?.summary.mattersNeedingAttention ?? 0) },
            ].map((stat, idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(94, 82, 64, 0.2)',
                }}
              >
                <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '10px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#208096' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div
              style={{
                background: '#fee',
                color: '#c0152f',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
                borderLeft: '4px solid #c0152f',
              }}
            >
              {error}
            </div>
          )}

          {/* Worklist */}
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94, 82, 64, 0.2)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: '8px', padding: '12px', borderBottom: '1px solid rgba(94, 82, 64, 0.15)', background: '#fcfcf9' }}>
              {(
                [
                  { key: 'intakes', label: 'Intakes / Leads' },
                  { key: 'matters', label: 'Open matters' },
                ] as const
              ).map((t) => {
                const selected = activeTab === t.key
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTab(t.key)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: selected ? '1px solid #208096' : '1px solid rgba(94, 82, 64, 0.2)',
                      background: selected ? '#e8f5f0' : 'white',
                      color: selected ? '#134252' : '#134252',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {t.label}
                  </button>
                )
              })}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Link href="/dashboard/intakes" style={{ color: '#208096', fontWeight: 700, textDecoration: 'none', fontSize: '13px' }}>
                  View all
                </Link>
              </div>
            </div>

            <div style={{ padding: '12px' }}>
              {loading ? (
                <div style={{ padding: '18px', color: '#627c71' }}>Loading…</div>
              ) : activeTab === 'intakes' ? (
                (data?.worklists.intakes?.length ?? 0) === 0 ? (
                  <div style={{ padding: '18px', color: '#627c71' }}>
                    No intakes yet. Create one to send a client link.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', fontSize: '12px', color: '#627c71' }}>
                        <th style={{ padding: '10px 8px' }}>Client</th>
                        <th style={{ padding: '10px 8px' }}>Matter</th>
                        <th style={{ padding: '10px 8px' }}>Status</th>
                        <th style={{ padding: '10px 8px' }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.worklists.intakes?.map((row) => (
                        <tr key={row.id} style={{ borderTop: '1px solid rgba(94, 82, 64, 0.12)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 700, color: '#134252' }}>
                            {row.client_full_name || row.client_email || '—'}{' '}
                            <Link href={`/dashboard/intakes/${row.id}/client-preview`} style={{ color: '#208096', fontSize: '12px', marginLeft: '8px' }}>Preview</Link>
                          </td>
                          <td style={{ padding: '12px 8px', color: '#134252', fontSize: '14px' }}>
                            <div style={{ fontWeight: 700 }}>{row.matter_type || '—'}</div>
                            <div style={{ color: '#627c71', fontSize: '12px' }}>{row.property_address || ''}</div>
                          </td>
                          <td style={{ padding: '12px 8px', color: '#627c71', fontWeight: 700, fontSize: '13px' }}>
                            {row.status || 'new'}
                          </td>
                          <td style={{ padding: '12px 8px', color: '#627c71', fontSize: '13px' }}>
                            {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (data?.worklists.matters?.length ?? 0) === 0 ? (
                <div style={{ padding: '18px', color: '#627c71' }}>No open matters yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', fontSize: '12px', color: '#627c71' }}>
                      <th style={{ padding: '10px 8px' }}>Client</th>
                      <th style={{ padding: '10px 8px' }}>Matter</th>
                      <th style={{ padding: '10px 8px' }}>Closing</th>
                      <th style={{ padding: '10px 8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                      {data?.worklists.matters?.map((row) => (
                        <tr key={row.id} style={{ borderTop: '1px solid rgba(94, 82, 64, 0.12)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 700, color: '#134252' }}>
                            {row.client?.full_name || '—'}{' '}
                            <Link href={`/dashboard/matters/${row.id}/client-preview`} style={{ color: '#208096', fontSize: '12px', marginLeft: '8px' }}>Preview</Link>
                          <div style={{ color: '#627c71', fontSize: '12px' }}>{row.client?.email || ''}</div>
                        </td>
                        <td style={{ padding: '12px 8px', color: '#134252' }}>
                          <div style={{ fontWeight: 800 }}>{row.matter_type}</div>
                          <div style={{ color: '#627c71', fontSize: '12px' }}>{row.property_address || ''}</div>
                        </td>
                        <td style={{ padding: '12px 8px', color: '#627c71', fontWeight: 700, fontSize: '13px' }}>
                          {row.expected_closing_date ? new Date(row.expected_closing_date).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ padding: '12px 8px', color: '#627c71', fontWeight: 700, fontSize: '13px' }}>
                          {row.status || 'open'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Key dates panel */}
        <aside style={{ width: '320px', flexShrink: 0 }}>
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94, 82, 64, 0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(94, 82, 64, 0.15)', background: '#fcfcf9' }}>
              <div style={{ fontWeight: 900, color: '#134252' }}>Key dates</div>
              <div style={{ fontSize: '12px', color: '#627c71' }}>Today → next 7 days</div>
            </div>
            <div style={{ padding: '12px 14px' }}>
              {loading ? (
                <div style={{ color: '#627c71' }}>Loading…</div>
              ) : (data?.keyDates?.length ?? 0) === 0 ? (
                <div style={{ color: '#627c71' }}>No upcoming key dates.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data?.keyDates?.map((d, idx) => (
                    <a
                      key={idx}
                      href={d.href}
                      style={{
                        display: 'block',
                        textDecoration: 'none',
                        border: '1px solid rgba(94, 82, 64, 0.15)',
                        borderRadius: '8px',
                        padding: '10px 10px',
                        color: '#134252',
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800 }}>
                        {new Date(d.date).toLocaleDateString()}
                      </div>
                      <div style={{ fontWeight: 900 }}>{d.label}</div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}