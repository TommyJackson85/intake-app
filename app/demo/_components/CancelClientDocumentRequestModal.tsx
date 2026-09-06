'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { getClientDocumentRequestCancelContext } from '@/lib/demo/staffCancelClientDocumentRequest'
import type { DemoDocumentRequest } from '@/lib/demo/types'

type CancelClientDocumentRequestModalProps = {
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

/** Staff confirmation modal to cancel a client document request before upload. */
export default function CancelClientDocumentRequestModal({
  isOpen,
  request,
  onClose,
}: CancelClientDocumentRequestModalProps) {
  const { matters, staff, cancelClientDocumentRequest } = useDemoStore()
  const [error, setError] = useState<string | null>(null)

  const cancelContext = useMemo(
    () =>
      getClientDocumentRequestCancelContext({
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
    if (!cancelContext.canCancel) {
      setError('This request cannot be cancelled.')
      return
    }
    const staffId = staff[0]?.id ?? ''
    if (!staffId.trim()) {
      setError('Select who is cancelling.')
      return
    }
    const ok = cancelClientDocumentRequest({
      requestId: request.id,
      staffId,
    })
    if (!ok) {
      setError('Could not cancel the client document request.')
      return
    }
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cancel client document request"
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
              {cancelContext.actionLabel}
            </div>
            <div style={{ color: '#627c71', fontSize: '13px' }}>{cancelContext.detailLabel}</div>
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
              <div style={valueStyle}>{cancelContext.matterLabel ?? '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Client</div>
              <div style={valueStyle}>{cancelContext.clientLabel ?? '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Document request</div>
              <div style={valueStyle}>{cancelContext.requestTitle ?? request.title}</div>
            </div>
            <div>
              <div style={labelStyle}>Request status</div>
              <div style={valueStyle}>{cancelContext.requestStatusLabel ?? '—'}</div>
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
              Keep request
            </button>
            <button
              type="submit"
              disabled={!cancelContext.canCancel}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(180,83,9,0.35)',
                background: cancelContext.canCancel ? '#b45309' : '#9aa8a3',
                color: '#fff',
                fontWeight: 800,
                fontSize: 13,
                cursor: cancelContext.canCancel ? 'pointer' : 'not-allowed',
              }}
            >
              Cancel client document request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
