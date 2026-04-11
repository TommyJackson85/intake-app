'use client'

import Link from 'next/link'
import { useDemoStore } from '@/lib/demo/store'

export default function DemoClientsPage() {
  const { clients, matters, archiveClient, archivedClients } = useDemoStore()

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '6px' }}>Clients</h1>
          <p style={{ margin: 0, color: '#627c71', fontSize: '12px' }}>
            Demo mode: archiving only affects this session and resets on refresh.
          </p>
        </div>
        <Link
          href="/demo"
          style={{
            background: '#208096',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          + Add Client
        </Link>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94, 82, 64, 0.2)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94, 82, 64, 0.2)' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Name</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Phone</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Linked matter(s)</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>KYC Status</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }} />
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const matterLabels = client.linked_matter_ids
                .map((id) => matters.find((m) => m.id === id)?.file_id ?? id)
                .join(', ')
              return (
                <tr id={`client-row-${client.id}`} key={client.id} style={{ borderBottom: '1px solid rgba(94, 82, 64, 0.2)' }}>
                  <td style={{ padding: '16px', fontWeight: 700, color: '#134252' }}>{client.full_name}</td>
                  <td style={{ padding: '16px' }}>{client.email}</td>
                  <td style={{ padding: '16px' }}>{client.phone}</td>
                  <td style={{ padding: '16px', color: '#627c71' }}>{matterLabels || '—'}</td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background:
                          client.kyc_status === 'approved'
                            ? '#e8f5f0'
                            : client.kyc_status === 'flagged'
                              ? '#fee'
                              : '#f5f5f5',
                        color:
                          client.kyc_status === 'approved'
                            ? '#208096'
                            : client.kyc_status === 'flagged'
                              ? '#c0152f'
                              : '#627c71',
                      }}
                    >
                      {client.kyc_status}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const ok = window.confirm(
                          'Archive this client? In demo mode this only hides it for this session and resets on refresh.'
                        )
                        if (ok) archiveClient(client.id)
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid rgba(94,82,64,0.3)',
                        color: '#134252',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {archivedClients.length > 0 && (
        <p style={{ marginTop: '10px', fontSize: '12px', color: '#627c71' }}>
          {archivedClients.length} client(s) archived in this demo session.{' '}
          <Link href="/demo/archive/clients" style={{ color: '#208096' }}>
            View Archive
          </Link>
        </p>
      )}
    </div>
  )
}
