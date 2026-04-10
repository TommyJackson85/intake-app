'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'

export type Profile = { id: string; email: string | null; full_name: string | null; role: string | null; firm_id: string | null }
type Firm = { id: string; name: string; state?: string | null; is_test_firm: boolean; is_demo_firm?: boolean }

type Props = {
  byFirm: [string | null, Profile[]][]
  firmMap: Record<string, Firm>
  currentUserId: string
}

type FirmFilter = 'all' | 'test' | 'demo'

export function SudoUserList({ byFirm, firmMap, currentUserId }: Props) {
  const [filter, setFilter] = useState<FirmFilter>('test')

  const filteredByFirm = useMemo(() => {
    if (filter === 'all') return byFirm
    return byFirm.filter(([firmId]) => {
      if (!firmId) return false
      const firm = firmMap[firmId]
      if (!firm) return false
      if (filter === 'test') return firm.is_test_firm && !firm.is_demo_firm
      if (filter === 'demo') return firm.is_demo_firm
      return true
    })
  }, [byFirm, firmMap, filter])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', color: '#627c71' }}>Firms:</span>
        {(['test', 'demo', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              background: filter === f ? '#208096' : 'white',
              color: filter === f ? 'white' : '#134252',
              border: '1px solid #208096',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: filter === f ? 600 : 400,
            }}
          >
            {f === 'test' ? 'Test firms only' : f === 'demo' ? 'Demo only' : 'All'}
          </button>
        ))}
      </div>
      {filteredByFirm.map(([firmId, profiles]) => {
        const firm = firmId ? firmMap[firmId] : null
        const label = firmId
          ? `${firm?.name ?? firmId}${firm?.state ? ` · ${firm.state}` : ''}${firm?.is_demo_firm ? ' (Demo firm)' : ''}${firm?.is_test_firm && !firm?.is_demo_firm ? ' (Test)' : ''}`
          : 'No firm'
        return (
          <div key={firmId ?? 'none'} style={{ border: '1px solid rgba(94,82,64,0.2)', borderRadius: '8px', padding: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#134252' }}>{label}</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {profiles.map((p) => (
                <li
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(94,82,64,0.1)',
                    gap: '16px',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>
                    {p.full_name || p.email || p.id}
                    {p.email && p.email !== (p.full_name || '') && (
                      <span style={{ color: '#627c71', marginLeft: '8px' }}>{p.email}</span>
                    )}
                    {p.role && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#627c71' }}>({p.role})</span>}
                  </span>
                  {p.id === currentUserId ? (
                    <span style={{ fontSize: '12px', color: '#627c71' }}>You</span>
                  ) : (
                    <form action="/api/dev/impersonate" method="POST" style={{ display: 'inline' }}>
                      <input type="hidden" name="userId" value={p.id} />
                      <button
                        type="submit"
                        style={{
                          padding: '4px 12px',
                          fontSize: '13px',
                          background: '#208096',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Impersonate
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      <p style={{ fontSize: '13px', color: '#627c71' }}>
        <Link href="/dashboard" style={{ color: '#208096' }}>Back to dashboard</Link>
      </p>
    </div>
  )
}
