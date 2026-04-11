'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'

function SendLinkButton({ intakeId, clientEmail, isDemoFirm }: { intakeId: string; clientEmail: string | null; isDemoFirm: boolean }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  if (!clientEmail) return null
  if (isDemoFirm) return <span style={{ fontSize: '12px', color: '#999' }}>Demo – send disabled</span>
  const handleSend = async (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/intakes/${intakeId}/send-link`, { method: 'POST' })
      const body = await res.json().catch(() => null)
      if (res.ok) setSent(true)
      else alert(body?.error || 'Failed to send')
    } catch {
      alert('Failed to send')
    } finally {
      setLoading(false)
    }
  }
  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={loading || sent}
      style={{
        background: 'none',
        border: 'none',
        color: '#208096',
        cursor: loading || sent ? 'default' : 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        padding: 0,
      }}
    >
      {sent ? 'Sent' : loading ? 'Sending…' : 'Send link'}
    </button>
  )
}

type IntakeRow = {
  id: string
  created_at: string | null
  status: string | null
  client_full_name: string | null
  client_email: string | null
  client_phone: string | null
  matter_type: string | null
  property_address: string | null
  submitted_at: string | null
  last_client_activity_at: string | null
}

export default function IntakesPage() {
  const { firm } = useAuth()
  const isDemoFirm = Boolean((firm as { is_demo_firm?: boolean } | null)?.is_demo_firm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [intakes, setIntakes] = useState<IntakeRow[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/dashboard/intakes?scope=my')
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || 'Failed to load intakes')
        setIntakes((body?.intakes || []) as IntakeRow[])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load intakes')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Intake / Leads</h1>
          <p style={{ margin: 0, color: '#627c71' }}>
            Recent intakes for your firm. Default view is “My work”.
          </p>
        </div>
        <Link
          href="/dashboard/intakes/new"
          style={{
            background: '#208096',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 800,
          }}
        >
          + New intake link
        </Link>
      </div>

      {error && (
        <div style={{ background: '#fee', color: '#c0152f', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94, 82, 64, 0.2)', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '20px', color: '#627c71' }}>Loading…</div>
        ) : intakes.length === 0 ? (
          <div style={{ padding: '24px', color: '#627c71' }}>
            No intakes yet. Create one to send a client link.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94, 82, 64, 0.2)' }}>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Client</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Matter</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Status</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Created</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}></th>
              </tr>
            </thead>
            <tbody>
              {intakes.map((i) => (
                <tr key={i.id} style={{ borderBottom: '1px solid rgba(94, 82, 64, 0.12)' }}>
                  <td style={{ padding: '14px', fontWeight: 800, color: '#134252' }}>
                    {i.client_full_name || i.client_email || '—'}
                    <div style={{ color: '#627c71', fontSize: '12px', fontWeight: 600 }}>
                      {i.client_email || ''}
                    </div>
                  </td>
                  <td style={{ padding: '14px', color: '#134252' }}>
                    <div style={{ fontWeight: 800 }}>{i.matter_type || '—'}</div>
                    <div style={{ color: '#627c71', fontSize: '12px' }}>{i.property_address || ''}</div>
                  </td>
                  <td style={{ padding: '14px', color: '#627c71', fontWeight: 800 }}>{i.status || 'new'}</td>
                  <td style={{ padding: '14px', color: '#627c71' }}>
                    {i.created_at ? new Date(i.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <SendLinkButton intakeId={i.id} clientEmail={i.client_email} isDemoFirm={isDemoFirm} />
                      <Link
                        href={`/dashboard/intakes/${i.id}/client-preview`}
                        style={{ color: '#208096', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
                      >
                        Preview
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

