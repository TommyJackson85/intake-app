'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { getDocumentRequestFollowUpDetailPresentation } from '@/lib/demo/staffDocumentRequestFollowUp'
import type { DemoDocumentRequest } from '@/lib/demo/types'

type MarkDocumentRequestNeedsFollowUpModalProps = {
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
  fontFamily: 'inherit',
  resize: 'vertical',
}

function formatDemoDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date(value))
}

/**
 * Staff-only modal to mark Needs follow-up with receipt context + internal note.
 */
export default function MarkDocumentRequestNeedsFollowUpModal({
  isOpen,
  request,
  onClose,
}: MarkDocumentRequestNeedsFollowUpModalProps) {
  const { documents, matters, staff, markDocumentRequestNeedsFollowUp } = useDemoStore()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const detail = useMemo(() => {
    if (!request) return null
    return getDocumentRequestFollowUpDetailPresentation({
      request,
      documents,
      matters,
      staffId: staff[0]?.id,
    })
  }, [request, documents, matters, staff])

  useEffect(() => {
    if (!isOpen) {
      setNote('')
      setError(null)
      return
    }
    setNote('')
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

  if (!isOpen || !request || !detail) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!detail.canMarkNeedsFollowUp) {
      setError('This request cannot be marked Needs follow-up.')
      return
    }
    const ok = markDocumentRequestNeedsFollowUp(request.id, note)
    if (!ok) {
      setError('Could not mark Needs follow-up for this request.')
      return
    }
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mark-needs-follow-up-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(19, 66, 82, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#fff',
          borderRadius: 12,
          border: '1px solid rgba(94,82,64,0.2)',
          boxShadow: '0 12px 40px rgba(19,66,82,0.18)',
          padding: 24,
        }}
      >
        <h2
          id="mark-needs-follow-up-title"
          style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#134252' }}
        >
          Needs follow-up
        </h2>
        <p style={{ marginTop: 8, marginBottom: 18, color: '#627c71', fontSize: 13, lineHeight: 1.45 }}>
          Internal staff signal only — not shown on the client portal.
        </p>

        <div
          style={{
            display: 'grid',
            gap: 14,
            marginBottom: 18,
            padding: 14,
            borderRadius: 8,
            background: '#fcfcf9',
            border: '1px solid rgba(94,82,64,0.12)',
          }}
        >
          <div>
            <div style={labelStyle}>Matter</div>
            <div style={valueStyle}>{detail.matterLabel}</div>
          </div>
          <div>
            <div style={labelStyle}>Document request</div>
            <div style={valueStyle}>{detail.requestLabel}</div>
          </div>
          <div>
            <div style={labelStyle}>Receipt review</div>
            <div style={valueStyle}>{detail.receiptReviewLabel}</div>
          </div>
          <div>
            <div style={labelStyle}>Linked client upload</div>
            <div style={valueStyle}>{detail.linkedClientUploadLabel ?? '—'}</div>
          </div>
          <div>
            <div style={labelStyle}>Uploaded</div>
            <div style={valueStyle}>
              {detail.uploadedAt ? formatDemoDateTime(detail.uploadedAt) : '—'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ ...labelStyle, color: '#134252', fontSize: 13 }} htmlFor="internal-follow-up-note">
            Internal follow-up note
          </label>
          <textarea
            id="internal-follow-up-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Optional internal note for staff"
            style={controlStyle}
          />

          {error ? (
            <p style={{ marginTop: 10, marginBottom: 0, color: '#b45309', fontSize: 13, fontWeight: 600 }}>
              {error}
            </p>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
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
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(180,83,9,0.35)',
                background: '#fffbeb',
                color: '#b45309',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Mark Needs follow-up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
