'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { DemoDocument } from '@/lib/demo/types'
import { useDemoStore } from '@/lib/demo/store'

const CATEGORIES: DemoDocument['category'][] = [
  'Contract',
  'Title',
  'Closing',
  'Compliance',
  'Post-Closing',
]

type RequestDemoDocumentModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function RequestDemoDocumentModal({ isOpen, onClose }: RequestDemoDocumentModalProps) {
  const { matters, staff, addDemoDocumentRequest } = useDemoStore()
  const [matterId, setMatterId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<DemoDocument['category']>('Contract')
  const [staffId, setStaffId] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false
      return
    }
    if (wasOpenRef.current) return
    wasOpenRef.current = true

    setSaveError(null)
    setTitle('')
    setDescription('')
    setCategory('Contract')
    setMatterId(matters[0]?.id ?? '')
    setStaffId(staff[0]?.id ?? '')
  }, [isOpen, matters, staff])

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

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    if (!matterId.trim()) {
      setSaveError('Select a matter.')
      return
    }
    if (!title.trim()) {
      setSaveError('Enter a request title.')
      return
    }
    if (!staffId.trim()) {
      setSaveError('Select who is requesting.')
      return
    }
    addDemoDocumentRequest({
      matter_id: matterId,
      title: title.trim(),
      description: description.trim() || null,
      category,
      requested_by_staff_id: staffId,
      requested_at: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Request document (demo)"
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
              Request document
            </div>
            <div style={{ color: '#627c71', fontSize: '13px' }}>
              Demo only — records what the firm asked for; portal delivery is not implemented yet.
            </div>
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
          {saveError && (
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
          )}

          <label style={{ display: 'block', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#134252' }}>
            Matter
            <select
              value={matterId}
              onChange={(e) => setMatterId(e.target.value)}
              required
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid rgba(94,82,64,0.25)',
                fontSize: 14,
                background: '#fff',
              }}
            >
              {matters.length === 0 ? (
                <option value="">No matters</option>
              ) : (
                matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.file_id} — {m.property.address.slice(0, 48)}
                    {m.property.address.length > 48 ? '…' : ''}
                  </option>
                ))
              )}
            </select>
          </label>

          <label style={{ display: 'block', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#134252' }}>
            Request title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Final settlement statement"
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid rgba(94,82,64,0.25)',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#134252' }}>
            Description <span style={{ fontWeight: 500, color: '#627c71' }}>(optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions or context for the client or team"
              rows={3}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid rgba(94,82,64,0.25)',
                fontSize: 14,
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#134252' }}>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DemoDocument['category'])}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid rgba(94,82,64,0.25)',
                fontSize: 14,
                background: '#fff',
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'block', marginBottom: 18, fontSize: 13, fontWeight: 700, color: '#134252' }}>
            Requested by
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 6,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid rgba(94,82,64,0.25)',
                fontSize: 14,
                background: '#fff',
              }}
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.role})
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid rgba(94,82,64,0.35)',
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 700,
                color: '#134252',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#134252',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 800,
              }}
            >
              Save request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
