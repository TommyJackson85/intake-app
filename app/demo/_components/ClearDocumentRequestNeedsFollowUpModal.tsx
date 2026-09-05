'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import {
  getDocumentRequestClearFollowUpPresentation,
  getDocumentRequestFollowUpDetailPresentation,
} from '@/lib/demo/staffDocumentRequestFollowUp'
import type { DemoDocumentRequest } from '@/lib/demo/types'

type ClearDocumentRequestNeedsFollowUpModalProps = {
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
 * Staff-only confirmation modal for Clear follow-up — reverse of Needs follow-up.
 * Neutral: removes the internal signal only.
 */
export default function ClearDocumentRequestNeedsFollowUpModal({
  isOpen,
  request,
  onClose,
}: ClearDocumentRequestNeedsFollowUpModalProps) {
  const { documents, matters, clearDocumentRequestNeedsFollowUp } = useDemoStore()
  const [error, setError] = useState<string | null>(null)

  const detail = useMemo(() => {
    if (!request) return null
    return getDocumentRequestFollowUpDetailPresentation({
      request,
      documents,
      matters,
    })
  }, [request, documents, matters])

  const clearPresentation = useMemo(() => {
    if (!request) return null
    return getDocumentRequestClearFollowUpPresentation({
      request,
      matters,
    })
  }, [request, matters])

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

  if (!isOpen || !request || !detail || !clearPresentation) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!clearPresentation.canClearNeedsFollowUp) {
      setError('This request cannot clear Needs follow-up.')
      return
    }
    const ok = clearDocumentRequestNeedsFollowUp(request.id)
    if (!ok) {
      setError('Could not clear Needs follow-up for this request.')
      return
    }
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-needs-follow-up-title"
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
          id="clear-needs-follow-up-title"
          style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#134252' }}
        >
          {clearPresentation.actionLabel}
        </h2>
        <p style={{ marginTop: 8, marginBottom: 18, color: '#627c71', fontSize: 13, lineHeight: 1.45 }}>
          {clearPresentation.detailLabel}
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
          <div>
            <div style={labelStyle}>Internal follow-up note</div>
            <div style={valueStyle}>{detail.internalFollowUpNote || '—'}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error ? (
            <p style={{ marginTop: 0, marginBottom: 12, color: '#b45309', fontSize: 13, fontWeight: 600 }}>
              {error}
            </p>
          ) : null}

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
              Cancel
            </button>
            <button
              type="submit"
              disabled={!clearPresentation.canClearNeedsFollowUp}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(94,82,64,0.3)',
                background: '#fff',
                color: '#134252',
                fontWeight: 800,
                fontSize: 13,
                cursor: clearPresentation.canClearNeedsFollowUp ? 'pointer' : 'not-allowed',
                opacity: clearPresentation.canClearNeedsFollowUp ? 1 : 0.55,
              }}
            >
              Clear follow-up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
