'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { getClientDocumentRequestReactivationPreview } from '@/lib/demo/staffReactivateClientDocumentRequest'
import type { DemoDocumentRequest } from '@/lib/demo/types'

type ReactivateClientDocumentRequestModalProps = {
  isOpen: boolean
  request: DemoDocumentRequest | null
  onClose: () => void
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#627c71',
  marginBottom: 4,
}

const valueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#134252',
}

/** Staff confirmation modal to reactivate a cancelled client document request. */
export default function ReactivateClientDocumentRequestModal({
  isOpen,
  request,
  onClose,
}: ReactivateClientDocumentRequestModalProps) {
  const { matters, staff, reactivateClientDocumentRequest } = useDemoStore()
  const [error, setError] = useState<string | null>(null)

  const reactivatePreview = useMemo(
    () =>
      getClientDocumentRequestReactivationPreview({
        request,
        matters,
      }),
    [request, matters],
  )

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      return
    }
    setError(null)
  }, [isOpen, request?.id])

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

  if (!isOpen || !request) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!reactivatePreview.canReactivate) {
      setError('This request cannot be reactivated.')
      return
    }
    const staffId = staff[0]?.id ?? ''
    if (!staffId.trim()) {
      setError('Select who is reactivating.')
      return
    }
    const ok = reactivateClientDocumentRequest({
      requestId: request.id,
      staffId,
    })
    if (!ok) {
      setError('Could not reactivate the client document request.')
      return
    }
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reactivate client document request"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px',
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#fcfcf9',
          borderRadius: '10px',
          border: '1px solid rgba(94,82,64,0.25)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid rgba(94,82,64,0.15)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#134252', marginBottom: '2px' }}>
              {reactivatePreview.actionLabel}
            </div>
            <div style={{ color: '#627c71', fontSize: '13px' }}>{reactivatePreview.detailLabel}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#627c71',
                fontSize: '18px',
                fontWeight: 900,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '18px 20px' }}>
          {error ? (
            <div
              role="alert"
              style={{
                marginBottom: 14,
                padding: '10px 12px',
                borderRadius: 8,
                background: '#fee',
                border: '1px solid #f5c2c7',
                color: '#842029',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}

          <div
            style={{
              display: 'grid',
              gap: 14,
              marginBottom: 18,
              padding: 14,
              borderRadius: 8,
              background: '#fff',
              border: '1px solid rgba(94,82,64,0.12)',
            }}
          >
            <div>
              <div style={labelStyle}>Matter</div>
              <div style={valueStyle}>{reactivatePreview.matterLabel ?? '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Client</div>
              <div style={valueStyle}>{reactivatePreview.clientLabel ?? '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Document request</div>
              <div style={valueStyle}>{reactivatePreview.requestTitle ?? '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Current state</div>
              <div style={valueStyle}>{reactivatePreview.currentStateLabel ?? '—'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(94,82,64,0.25)',
                background: '#fff',
                color: '#134252',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Keep cancelled
            </button>
            <button
              type="submit"
              disabled={!reactivatePreview.canReactivate}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(19,66,82,0.35)',
                background: reactivatePreview.canReactivate ? '#134252' : '#9aa8a3',
                color: '#fff',
                fontWeight: 800,
                fontSize: 13,
                cursor: reactivatePreview.canReactivate ? 'pointer' : 'not-allowed',
              }}
            >
              Reactivate request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
