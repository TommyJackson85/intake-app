'use client'

import { useMemo, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import UploadDemoDocumentModal from '@/app/demo/_components/UploadDemoDocumentModal'
import RequestDemoDocumentModal from '@/app/demo/_components/RequestDemoDocumentModal'
import { getFulfilledRequestDocumentName } from '@/lib/demo/demoDocumentRequest'

export default function DemoDocumentsPage() {
  const { documents, documentRequests, matters, staff } = useDemoStore()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)

  const sorted = useMemo(
    () => [...documents].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()),
    [documents]
  )

  const sortedRequests = useMemo(
    () =>
      [...documentRequests].sort(
        (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
      ),
    [documentRequests]
  )

  return (
    <div>
      <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Documents</h1>
      <p style={{ marginTop: 0, marginBottom: '16px', color: '#627c71' }}>
        Matter documents and closing file artifacts in demo mode.
      </p>

      <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button
          type="button"
          onClick={() => setRequestOpen(true)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(94,82,64,0.35)',
            background: '#fff',
            color: '#134252',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Request document
        </button>
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

      <RequestDemoDocumentModal isOpen={requestOpen} onClose={() => setRequestOpen(false)} />
      <UploadDemoDocumentModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />

      <h2 style={{ fontSize: '18px', marginBottom: '10px', marginTop: '8px', color: '#134252', fontWeight: 800 }}>
        Requested documents
      </h2>
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid rgba(94,82,64,0.2)',
          overflowX: 'auto',
          marginBottom: '28px',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Request</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Matter</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Category</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Requested</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>By</th>
            </tr>
          </thead>
          <tbody>
            {sortedRequests.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '14px', color: '#627c71' }}>
                  No document requests yet.
                </td>
              </tr>
            ) : (
              sortedRequests.map((req) => {
                const matter = matters.find((m) => m.id === req.matter_id)
                const by = staff.find((s) => s.id === req.requested_by_staff_id)
                const fulfilledDocName = getFulfilledRequestDocumentName(req, documents)
                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid rgba(94,82,64,0.12)' }}>
                    <td style={{ padding: '14px', color: '#134252', fontWeight: 700, verticalAlign: 'top' }}>
                      <div>{req.title}</div>
                      {req.description && (
                        <div style={{ marginTop: '6px', fontWeight: 500, color: '#627c71', fontSize: '13px' }}>
                          {req.description}
                        </div>
                      )}
                      {req.status === 'fulfilled' && (
                        <div style={{ marginTop: '6px', fontWeight: 600, color: '#2f855a', fontSize: '13px' }}>
                          Fulfilled{fulfilledDocName ? " by " + fulfilledDocName : ""}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top' }}>
                      {matter?.file_id ?? req.matter_id}
                    </td>
                    <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top' }}>{req.category}</td>
                    <td
                      style={{
                        padding: '14px',
                        color: '#627c71',
                        verticalAlign: 'top',
                        textTransform: 'capitalize',
                      }}
                    >
                      {req.status}
                    </td>
                    <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top' }}>
                      {new Date(req.requested_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top' }}>
                      {by?.full_name ?? 'Staff'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#134252', fontWeight: 800 }}>Uploaded documents</h2>
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
