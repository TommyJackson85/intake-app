'use client'

import Link from 'next/link'
import { useDemoStore } from '@/lib/demo/store'

export default function DemoArchivedMattersPage() {
  const { archivedMatters, recentlyDeletedMatters, restoreMatter, permanentlyDeleteMatter } = useDemoStore()
  const rows = [
    ...archivedMatters.map((m) => ({ kind: 'archived' as const, matter: m })),
    ...recentlyDeletedMatters.map((m) => ({ kind: 'deleted' as const, matter: m })),
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
        <div>
          <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Archived Matters</h1>
          <p style={{ margin: 0, color: '#627c71' }}>
            You are viewing archived demo data. Restore brings items back to active lists. Delete permanently removes
            items from this demo session only. All demo data resets on full page refresh.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/demo/archive/clients" style={linkButton(false)}>Archived Clients</Link>
          <Link href="/demo/matters" style={linkButton(true)}>Back to matters</Link>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94,82,64,0.2)', overflowX: 'auto' }}>
        {rows.length === 0 ? (
          <div style={{ padding: '20px', color: '#627c71' }}>No archived matters in this demo session.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>File</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Status</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>State</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Archived at</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ kind, matter: m }) => (
                <tr key={`${kind}-${m.id}`} style={{ borderBottom: '1px solid rgba(94,82,64,0.12)' }}>
                  <td style={{ padding: '14px', color: '#134252', fontWeight: 800 }}>{m.file_id}</td>
                  <td style={{ padding: '14px', color: '#627c71', fontWeight: 700 }}>{m.status}</td>
                  <td style={{ padding: '14px', color: '#627c71', fontWeight: 700 }}>
                    {kind === 'archived' ? 'Archived' : 'Deleted permanently (session)'}
                  </td>
                  <td style={{ padding: '14px', color: '#627c71' }}>
                    {m.deletedAt ? new Date(m.deletedAt).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '14px', display: 'flex', gap: '8px' }}>
                    {kind === 'archived' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => restoreMatter(m.id)}
                          style={actionButton('#208096', 'white')}
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const ok = window.confirm(
                              'In demo mode, this removes the matter from this session only. All demo data returns on full page refresh.'
                            )
                            if (ok) permanentlyDeleteMatter(m.id)
                          }}
                          style={actionButton('white', '#134252')}
                        >
                          Delete permanently
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#627c71' }}>Session-only log entry</span>
                    )}
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

function actionButton(background: string, color: string) {
  return {
    background,
    color,
    border: '1px solid rgba(94,82,64,0.3)',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    cursor: 'pointer',
  } as const
}

function linkButton(primary: boolean) {
  return {
    display: 'inline-block',
    padding: '10px 14px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '13px',
    background: primary ? '#208096' : 'white',
    color: primary ? 'white' : '#134252',
    border: primary ? 'none' : '1px solid rgba(94,82,64,0.2)',
  } as const
}
