'use client'

import { useEffect, useState } from 'react'

type PortalHome = {
  client: { id: string; full_name: string; email: string; phone: string | null } | null
  matters: Array<{
    id: string
    matter_type: string
    status: string | null
    property_address: string | null
    expected_closing_date: string | null
    created_at: string | null
  }>
}

export default function PortalHomePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<PortalHome | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/portal/home')
        const body = await res.json().catch(() => null)
        if (!res.ok) throw new Error(body?.error || 'Failed to load portal')
        setData(body as PortalHome)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load portal')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: '10px', fontSize: '32px' }}>Your matters</h1>
      <p style={{ marginTop: 0, color: '#627c71', lineHeight: '1.6' }}>
        View the basic status of your matter(s). If the firm needs documents or additional information, they will contact you.
      </p>

      {error && (
        <div style={{ background: '#fee', color: '#c0152f', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid rgba(94, 82, 64, 0.2)', borderRadius: '8px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '20px', color: '#627c71' }}>Loading…</div>
        ) : (data?.matters?.length ?? 0) === 0 ? (
          <div style={{ padding: '20px', color: '#627c71' }}>
            No matters found yet. If you recently submitted an intake, the firm may still be reviewing it.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94, 82, 64, 0.2)' }}>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 900 }}>Matter</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 900 }}>Property</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 900 }}>Closing</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 900 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.matters?.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(94, 82, 64, 0.12)' }}>
                  <td style={{ padding: '14px', fontWeight: 900, color: '#134252' }}>{m.matter_type}</td>
                  <td style={{ padding: '14px', color: '#627c71' }}>{m.property_address || '—'}</td>
                  <td style={{ padding: '14px', color: '#627c71' }}>
                    {m.expected_closing_date ? new Date(m.expected_closing_date).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '14px', color: '#627c71', fontWeight: 900 }}>{m.status || 'open'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

