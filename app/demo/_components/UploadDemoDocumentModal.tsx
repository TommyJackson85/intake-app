'use client'

import React, { useEffect, useState } from 'react'
import type { DemoDocument } from '@/lib/demo/types'
import { useDemoStore } from '@/lib/demo/store'

const CATEGORIES: DemoDocument['category'][] = [
  'Contract',
  'Title',
  'Closing',
  'Compliance',
  'Post-Closing',
]

const STATUSES: DemoDocument['status'][] = ['draft', 'reviewed', 'final']

type UploadDemoDocumentModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function UploadDemoDocumentModal({ isOpen, onClose }: UploadDemoDocumentModalProps) {
  const { matters, staff, addDemoDocument } = useDemoStore()
  const [matterId, setMatterId] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<DemoDocument['category']>('Contract')
  const [status, setStatus] = useState<DemoDocument['status']>('draft')
  const [staffId, setStaffId] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setSaveError(null)
    setName('')
    setCategory('Contract')
    setStatus('draft')
    const firstMatter = matters[0]?.id ?? ''
    setMatterId(firstMatter)
    const firstStaff = staff[0]?.id ?? ''
    setStaffId(firstStaff)
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
    if (!name.trim()) {
      setSaveError('Enter a document name.')
      return
    }
    if (!staffId.trim()) {
      setSaveError('Select who is uploading.')
      return
    }
    addDemoDocument({
      matter_id: matterId,
      name: name.trim(),
      category,
      status,
      uploaded_by_staff_id: staffId,
      uploaded_at: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Simulate document upload (demo)"
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
              Simulate upload
            </div>
            <div style={{ color: '#627c71', fontSize: '13px' }}>
              Demo only — no file is stored; a row is added to the documents list.
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
            Document name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Signed contract.pdf"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#134252' }}>
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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#134252' }}>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DemoDocument['status'])}
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
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: 'block', marginBottom: 18, fontSize: 13, fontWeight: 700, color: '#134252' }}>
            Uploaded by
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
              Add document
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
