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

const STATUSES: DemoDocument['status'][] = ['draft', 'reviewed', 'final']
const SUBTYPES_BY_CATEGORY: Record<DemoDocument['category'], string[]> = {
  Contract: ['Purchase contract', 'Addendum', 'Proof of funds', 'Entity docs'],
  Title: ['Title commitment', 'Survey', 'HOA/Condo docs', 'Estoppel'],
  Closing: ['Closing disclosure', 'Settlement statement', 'Wire confirmation', 'Signed closing package'],
  Compliance: ['FIRPTA affidavit', 'OFAC/AML check', 'Identity verification', 'Tax form'],
  'Post-Closing': ['Recorded deed', 'Final title policy', 'Lender package', 'Post-closing checklist'],
}

type UploadDemoDocumentModalProps = {
  isOpen: boolean
  onClose: () => void
  preferredMatterId?: string | null
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

export default function UploadDemoDocumentModal({ isOpen, onClose, preferredMatterId = null }: UploadDemoDocumentModalProps) {
  const { matters, staff, addDemoDocument } = useDemoStore()
  const [matterId, setMatterId] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<DemoDocument['category']>('Contract')
  const [documentSubtype, setDocumentSubtype] = useState(SUBTYPES_BY_CATEGORY.Contract[0])
  const [status, setStatus] = useState<DemoDocument['status']>('draft')
  const [description, setDescription] = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [source, setSource] = useState('')
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
    setName('')
    setCategory('Contract')
    setDocumentSubtype(SUBTYPES_BY_CATEGORY.Contract[0])
    setStatus('draft')
    setDescription('')
    setDocumentDate('')
    setSource('')
    const preferredMatter =
      preferredMatterId && matters.some((m) => m.id === preferredMatterId)
        ? preferredMatterId
        : matters[0]?.id ?? ''
    setMatterId(preferredMatter)
    setStaffId(staff[0]?.id ?? '')
  }, [isOpen, matters, preferredMatterId, staff])

  useEffect(() => {
    const options = SUBTYPES_BY_CATEGORY[category]
    if (!options.includes(documentSubtype)) {
      setDocumentSubtype(options[0] ?? '')
    }
  }, [category, documentSubtype])

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
      document_subtype: documentSubtype.trim(),
      description: description.trim(),
      document_date: documentDate.trim(),
      source: source.trim(),
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

          <label style={{ ...labelStyle, marginBottom: 12 }}>
            Matter
            <select
              value={matterId}
              onChange={(e) => setMatterId(e.target.value)}
              required
              style={controlStyle}
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

          <label style={{ ...labelStyle, marginBottom: 12 }}>
            Document name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Signed contract.pdf"
              style={controlStyle}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label style={labelStyle}>
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
            <label style={labelStyle}>
              Document subtype <span style={optionalLabelStyle}>(optional)</span>
              <select
                value={documentSubtype}
                onChange={(e) => setDocumentSubtype(e.target.value)}
                style={controlStyle}
              >
                {SUBTYPES_BY_CATEGORY[category].map((subtype) => (
                  <option key={subtype} value={subtype}>
                    {subtype}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <details style={{ marginBottom: 14 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#134252' }}>
              More details (optional)
            </summary>
            <div style={{ marginTop: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>
                Description / notes <span style={optionalLabelStyle}>(optional)</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="e.g. Buyer-signed version received for review."
                  style={{ ...controlStyle, resize: 'vertical' }}
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={labelStyle}>
                  Document date <span style={optionalLabelStyle}>(optional)</span>
                  <input
                    type="date"
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    style={controlStyle}
                  />
                </label>
                <label style={labelStyle}>
                  Received from / source <span style={optionalLabelStyle}>(optional)</span>
                  <input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Buyer agent, title company"
                    style={controlStyle}
                  />
                </label>
              </div>
            </div>
          </details>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <label style={labelStyle}>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DemoDocument['status'])}
                style={controlStyle}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ ...labelStyle, marginBottom: 18 }}>
            Uploaded by
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              style={controlStyle}
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
