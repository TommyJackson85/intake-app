'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type MatterRow = {
  id: string
  created_at: string | null
  status: string | null
  matter_type: string
  property_address: string | null
  expected_closing_date: string | null
  client: { id: string; full_name: string; email: string } | null
}

export default function MattersPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [matters, setMatters] = useState<MatterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !profile?.firm_id) {
      router.replace('/dashboard')
    }
  }, [authLoading, profile?.firm_id, router])

  useEffect(() => {
    if (!profile?.firm_id) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/dashboard/matters')
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || 'Failed to load matters')
        setMatters((body?.matters || []) as MatterRow[])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load matters')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [profile?.firm_id])

  if (authLoading || !profile?.firm_id) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
        <div>
          <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Matters</h1>
          <p style={{ margin: 0, color: '#627c71' }}>
            Open matters for your firm.
          </p>
        </div>
        <Link
          href="/dashboard/matters/new"
          style={{
            background: '#208096',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 800,
          }}
        >
          + 
        </Link>
      </div>

      {error && (
        <div style={{ background: '#fee', color: '#c0152f', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94, 82, 64, 0.2)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '20px', color: '#627c71' }}>Loading…</div>
        ) : matters.length === 0 ? (
          <div style={{ padding: '24px', color: '#627c71' }}>
            No open matters yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94, 82, 64, 0.2)' }}>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Client</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Matter</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Closing</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Status</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}></th>
              </tr>
            </thead>
            <tbody>
              {matters.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(94, 82, 64, 0.12)' }}>
                  <td style={{ padding: '14px', fontWeight: 800, color: '#134252' }}>
                    {m.client?.full_name || '—'}
                    <div style={{ color: '#627c71', fontSize: '12px', fontWeight: 600 }}>{m.client?.email || ''}</div>
                  </td>
                  <td style={{ padding: '14px', color: '#134252' }}>
                    <div style={{ fontWeight: 800 }}>{m.matter_type}</div>
                    <div style={{ color: '#627c71', fontSize: '12px' }}>{m.property_address || ''}</div>
                  </td>
                  <td style={{ padding: '14px', color: '#627c71' }}>
                    {m.expected_closing_date ? new Date(m.expected_closing_date).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '14px', color: '#627c71', fontWeight: 800 }}>{m.status || 'open'}</td>
                  <td style={{ padding: '14px' }}>
                    <Link
                      href={`/dashboard/matters/${m.id}/client-preview`}
                      style={{ color: '#208096', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
                    >
                      Preview client view
                    </Link>
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
