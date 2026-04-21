'use client'

import { useMemo, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import UploadDemoDocumentModal from '@/app/demo/_components/UploadDemoDocumentModal'

export default function DemoDocumentsPage() {
  const { documents, matters, staff } = useDemoStore()
  const [uploadOpen, setUploadOpen] = useState(false)

  const sorted = useMemo(
    () => [...documents].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()),
    [documents]
  )

  return (
    <div>
      <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Documents</h1>
      <p style={{ marginTop: 0, marginBottom: '16px', color: '#627c71' }}>
        Matter documents and closing file artifacts in demo mode.
      </p>

      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#134252',
            color: '#fff',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Simulate upload
        </button>
      </div>

      <UploadDemoDocumentModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />

      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94,82,64,0.2)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Document</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Matter</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Category</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Uploaded</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>By</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((doc) => {
              const matter = matters.find((m) => m.id === doc.matter_id)
              const uploadedBy = staff.find((s) => s.id === doc.uploaded_by_staff_id)
              return (
                <tr key={doc.id} style={{ borderBottom: '1px solid rgba(94,82,64,0.12)' }}>
                  <td style={{ padding: '14px', color: '#134252', fontWeight: 700 }}>{doc.name}</td>
                  <td style={{ padding: '14px', color: '#627c71' }}>{matter?.file_id ?? doc.matter_id}</td>
                  <td style={{ padding: '14px', color: '#627c71' }}>{doc.category}</td>
                  <td style={{ padding: '14px', color: '#627c71', textTransform: 'capitalize' }}>{doc.status}</td>
                  <td style={{ padding: '14px', color: '#627c71' }}>{new Date(doc.uploaded_at).toLocaleString()}</td>
                  <td style={{ padding: '14px', color: '#627c71' }}>{uploadedBy?.full_name ?? 'Staff'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
