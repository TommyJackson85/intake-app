'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { DemoDocument, DemoDocumentRequest } from '@/lib/demo/types'
import { useDemoStore } from '@/lib/demo/store'
import {
  getClientDocumentRequestEditContext,
  validateClientDocumentRequestEditDraft,
} from '@/lib/demo/staffEditClientDocumentRequest'

const CATEGORIES: DemoDocument['category'][] = [
  'Contract',
  'Title',
  'Closing',
  'Compliance',
  'Post-Closing',
]

type EditClientDocumentRequestModalProps = {
  isOpen: boolean
  request: DemoDocumentRequest | null
  onClose: () => void
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: '#134252',
}
const optionalLabelStyle: React.CSSProperties = {
  fontWeight: 500,
  color: '#627c71',
}
const controlStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(94,82,64,0.25)',
  fontSize: 14,
  boxSizing: 'border-box',
  background: '#fff',
}

/** Staff modal to edit client-facing ordinary document request details before upload. */
export default function EditClientDocumentRequestModal({
  isOpen,
  request,
  onClose,
}: EditClientDocumentRequestModalProps) {
  const { matters, documentRequests, editClientDocumentRequest } = useDemoStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<DemoDocument['category']>('Contract')
  const [saveError, setSaveError] = useState<string | null>(null)
  const wasOpenRef = useRef(false)

  const editContext = useMemo(
    () =>
      getClientDocumentRequestEditContext({
        request,
        matters,
      }),
    [request, matters],
  )
  const canSubmit = editContext.canEdit

  useEffect(() => {
    if (!isOpen || !request) {
      wasOpenRef.current = false
      return
    }
    if (wasOpenRef.current) return
    wasOpenRef.current = true

    setSaveError(null)
    setTitle(request.title)
    setDescription(request.description ?? '')
    setCategory(request.category)
  }, [isOpen, request])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen || !request) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    const draft = {
      requestId: request.id,
      title,
      description: description.trim() || null,
      category,
    }
    const validation = validateClientDocumentRequestEditDraft({
      draft,
      documentRequests,
      matters,
    })
    if (!validation.ok) {
      setSaveError(validation.error)
      return
    }
    const ok = editClientDocumentRequest(validation.draft)
    if (!ok) {
      setSaveError('Could not edit the client document request.')
      return
    }
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit client document request"
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
              {editContext.actionLabel}
            </div>
            <div style={{ color: '#627c71', fontSize: '13px' }}>{editContext.detailLabel}</div>
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
          {saveError ? (
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
              {saveError}
            </div>
          ) : null}

          <div style={{ ...labelStyle, marginBottom: 12 }}>
            Matter
            <div
              style={{
                ...controlStyle,
                background: '#f5f5f0',
                color: '#627c71',
                fontWeight: 600,
              }}
            >
              {editContext.matterLabel ?? '—'}
            </div>
          </div>

          <div style={{ ...labelStyle, marginBottom: 12 }}>
            Client
            <div
              style={{
                ...controlStyle,
                background: '#f5f5f0',
                color: '#627c71',
                fontWeight: 600,
              }}
            >
              {editContext.clientLabel ?? '—'}
            </div>
          </div>

          <div style={{ ...labelStyle, marginBottom: 12 }}>
            Request status
            <div
              style={{
                ...controlStyle,
                background: '#f5f5f0',
                color: '#627c71',
                fontWeight: 600,
              }}
            >
              {editContext.requestStatusLabel ?? '—'}
            </div>
          </div>

          <label style={{ ...labelStyle, marginBottom: 12 }}>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Buyer government ID"
              style={controlStyle}
            />
          </label>

          <label style={{ ...labelStyle, marginBottom: 12 }}>
            Description <span style={optionalLabelStyle}>(optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Client-facing guidance for what to upload"
              style={{ ...controlStyle, resize: 'vertical' }}
            />
          </label>

          <label style={{ ...labelStyle, marginBottom: 18 }}>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DemoDocument['category'])}
              style={controlStyle}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

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
              disabled={!canSubmit}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(19,66,82,0.35)',
                background: canSubmit ? '#134252' : '#9aa8a3',
                color: '#fff',
                fontWeight: 800,
                fontSize: 13,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              Save client document request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
