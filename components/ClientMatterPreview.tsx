'use client'

/**
 * Read-only preview of the client portal matter view. Used for "Preview client portal" on matters.
 */

type MatterItem = {
  id: string
  matter_type: string
  status: string | null
  property_address: string | null
  expected_closing_date: string | null
  created_at: string | null
}

type ClientData = {
  id: string
  full_name: string
  email: string
  phone: string | null
} | null

export function ClientMatterPreview({
  firm,
  client,
  matters,
}: {
  firm: { id: string; name: string; state: string } | null
  client: ClientData
  matters: MatterItem[]
}) {
  return (
    <div>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 900, fontSize: '22px', color: '#134252' }}>{firm?.name || 'Client Portal'}</div>
        <div style={{ color: '#627c71', fontSize: '13px' }}>
          Client view · Preview (read-only)
        </div>
      </div>

      <h1 style={{ marginTop: 0, marginBottom: '10px', fontSize: '32px' }}>Your matters</h1>
      <p style={{ marginTop: 0, marginBottom: '20px', color: '#627c71', lineHeight: '1.6' }}>
        View the basic status of your matter(s). (Preview — you are still logged in as the firm.)
      </p>

      <div style={{ background: 'white', border: '1px solid rgba(94, 82, 64, 0.2)', borderRadius: '8px', overflow: 'hidden' }}>
        {matters.length === 0 ? (
          <div style={{ padding: '20px', color: '#627c71' }}>
            No matters found yet.
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
              {matters.map((m) => (
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

      {client && (
        <div style={{ marginTop: '20px', padding: '12px', background: '#f8f8f8', borderRadius: '6px', fontSize: '13px', color: '#627c71' }}>
          Client: {client.full_name} · {client.email}
        </div>
      )}
    </div>
  )
}
