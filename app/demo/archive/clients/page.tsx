'use client'

import Link from 'next/link'
import { useDemoStore } from '@/lib/demo/store'

export default function DemoArchivedClientsPage() {
  const { archivedClients, recentlyDeletedClients, restoreClient, permanentlyDeleteClient } = useDemoStore()
  const rows = [
    ...archivedClients.map((c) => ({ kind: 'archived' as const, client: c })),
    ...recentlyDeletedClients.map((c) => ({ kind: 'deleted' as const, client: c })),
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
        <div>
          <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Archived Clients</h1>
          <p style={{ margin: 0, color: '#627c71' }}>
            You are viewing archived demo data. Restore brings items back to active lists. Delete permanently removes
            items from this demo session only. All demo data resets on full page refresh.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/demo/archive/matters" style={linkButton(false)}>Archived Matters</Link>
          <Link href="/demo/clients" style={linkButton(true)}>Back to clients</Link>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94,82,64,0.2)', overflow: 'hidden' }}>
        {rows.length === 0 ? (
          <div style={{ padding: '20px', color: '#627c71' }}>No archived clients in this demo session.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Name</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Email</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>State</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Archived at</th>
                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ kind, client: c }) => (
                <tr key={`${kind}-${c.id}`} style={{ borderBottom: '1px solid rgba(94,82,64,0.12)' }}>
                  <td style={{ padding: '14px', color: '#134252', fontWeight: 800 }}>{c.full_name}</td>
                  <td style={{ padding: '14px', color: '#627c71' }}>{c.email}</td>
                  <td style={{ padding: '14px', color: '#627c71', fontWeight: 700 }}>
                    {kind === 'archived' ? 'Archived' : 'Deleted permanently (session)'}
                  </td>
                  <td style={{ padding: '14px', color: '#627c71' }}>
                    {c.deletedAt ? new Date(c.deletedAt).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '14px', display: 'flex', gap: '8px' }}>
                    {kind === 'archived' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => restoreClient(c.id)}
                          style={actionButton('#208096', 'white')}
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const ok = window.confirm(
                              'In demo mode, this removes the client from this session only. All demo data returns on full page refresh.'
                            )
                            if (ok) permanentlyDeleteClient(c.id)
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
