'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { listOpenDocumentRequestsForClientUploadLinkRepair } from '@/lib/demo/staffClientUploadRequestLinkRepair'
import type { DemoDocument } from '@/lib/demo/types'

type LinkClientUploadToDocumentRequestModalProps = {
  isOpen: boolean
  document: DemoDocument | null
  onClose: () => void
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#134252',
}

const controlStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(94, 82, 64, 0.25)',
  fontSize: 14,
  boxSizing: 'border-box',
  background: '#fff',
}

/**
 * Staff-only corrective modal: manually link an eligible client-portal upload
 * to an open ordinary document request on the same matter.
 */
export default function LinkClientUploadToDocumentRequestModal({
  isOpen,
  document,
  onClose,
}: LinkClientUploadToDocumentRequestModalProps) {
  const { documentRequests, linkClientUploadToDocumentRequest } = useDemoStore()
  const [requestId, setRequestId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const openRequests = useMemo(() => {
    if (!document) return []
    return listOpenDocumentRequestsForClientUploadLinkRepair({
      document,
      documentRequests,
    })
  }, [document, documentRequests])

  useEffect(() => {
    if (!isOpen) {
      setRequestId('')
      setError(null)
      return
    }
    setRequestId(openRequests[0]?.id ?? '')
    setError(null)
  }, [isOpen, openRequests])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen || !document) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!requestId.trim()) {
      setError('Select a document request to continue.')
      return
    }
    const ok = linkClientUploadToDocumentRequest(document.id, requestId)
    if (!ok) {
      setError(
        'Could not link this upload. Choose an open request on the same matter, or cancel.',
      )
      return
    }
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-client-upload-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(19, 66, 82, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#fff',
          borderRadius: 12,
          border: '1px solid rgba(94, 82, 64, 0.2)',
          boxShadow: '0 12px 40px rgba(19, 66, 82, 0.18)',
        }}
      >
        <div style={{ padding: '18px 20px 0' }}>
          <h2
            id="link-client-upload-title"
            style={{ margin: 0, fontSize: 20, color: '#134252', fontWeight: 800 }}
          >
            Link to document request
          </h2>
          <p style={{ margin: '8px 0 0', color: '#627c71', fontSize: 13, lineHeight: 1.45 }}>
            Staff repair only. Link <strong>{document.name}</strong> to an open ordinary request on
            this matter. Does not change the file, uploader, or client portal wording.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '18px 20px' }}>
          {error ? (
            <div
              role="alert"
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 8,
                background: '#fff5f5',
                color: '#842029',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          ) : null}

          <label style={labelStyle}>
            Document request
            <select
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              style={controlStyle}
              disabled={openRequests.length === 0}
            >
              {openRequests.length === 0 ? (
                <option value="">No open requests on this matter</option>
              ) : (
                openRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.category})
                  </option>
                ))
              )}
            </select>
          </label>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 18,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(94, 82, 64, 0.3)',
                background: '#fff',
                color: '#134252',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={openRequests.length === 0}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: 'none',
                background: openRequests.length === 0 ? '#9db5ad' : '#134252',
                color: '#fff',
                fontWeight: 800,
                cursor: openRequests.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Link to document request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
