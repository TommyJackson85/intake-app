'use client'

import React, { useEffect, useState } from 'react'
import type { DemoDocument, DemoStaffProfile } from '@/lib/demo/types'
import { defaultCondoDiligenceSummaryReviewTaskTitle } from '@/lib/demo/demoMatterReviewTask'

type CreateCondoDiligenceSummaryReviewTaskModalProps = {
  open: boolean
  document: DemoDocument | null
  staff: DemoStaffProfile[]
  /** Optional prefill when creating a follow-up from a Condo Diligence finding. */
  initialTitle?: string | null
  /** Optional prefill when creating a follow-up from a Condo Diligence finding. */
  initialInternalNote?: string | null
  onClose: () => void
  onCreate: (input: {
    title: string
    assignee_id: string | null
    due_date: string | null
    internal_note: string | null
  }) => void
}

export default function CreateCondoDiligenceSummaryReviewTaskModal({
  open,
  document,
  staff,
  initialTitle = null,
  initialInternalNote = null,
  onClose,
  onCreate,
}: CreateCondoDiligenceSummaryReviewTaskModalProps) {
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [internalNote, setInternalNote] = useState('')

  useEffect(() => {
    if (!open || !document) return
    const prefillTitle = initialTitle?.trim()
    setTitle(prefillTitle || defaultCondoDiligenceSummaryReviewTaskTitle(document.name))
    setAssigneeId('')
    setDueDate('')
    setInternalNote(initialInternalNote?.trim() || '')
  }, [open, document, initialTitle, initialInternalNote])

  useEffect(() => {
    if (!open) return
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
  }, [open, onClose])

  if (!open || !document) return null

  const fieldLabel: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    color: '#134252',
    marginBottom: 4,
  }
  const fieldInput: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid rgba(94,82,64,0.25)',
    background: '#fff',
    color: '#134252',
    fontSize: 13,
    fontWeight: 600,
  }

  const canSubmit = title.trim().length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create review task"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 85,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 18,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#fcfcf9',
          borderRadius: 10,
          border: '1px solid rgba(94,82,64,0.25)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(94,82,64,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#134252' }}>Create review task</div>
            <div style={{ fontSize: 12, color: '#627c71', marginTop: 4, lineHeight: 1.45 }}>
              Internal only — assigns review of a saved Condo Diligence summary snapshot. Not shared to the client
              portal.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid rgba(94,82,64,0.25)',
              background: '#fff',
              borderRadius: 6,
              padding: '6px 10px',
              fontWeight: 800,
              fontSize: 12,
              color: '#134252',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              border: '1px solid rgba(94,82,64,0.12)',
              borderRadius: 8,
              padding: 10,
              background: '#fff',
              fontSize: 12,
              color: '#627c71',
              fontWeight: 700,
            }}
          >
            Linked snapshot: <span style={{ color: '#134252' }}>{document.name}</span>
          </div>

          <label>
            <div style={fieldLabel}>Task title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={fieldInput}
              aria-label="Task title"
            />
          </label>

          <label>
            <div style={fieldLabel}>Assignee (optional)</div>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              style={fieldInput}
              aria-label="Assignee"
            >
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.role})
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={fieldLabel}>Due date (optional)</div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={fieldInput}
              aria-label="Due date"
            />
          </label>

          <label>
            <div style={fieldLabel}>Internal note (optional)</div>
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={3}
              style={{ ...fieldInput, resize: 'vertical' }}
              aria-label="Internal note"
              placeholder="Lawyer-only note for this review task"
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(94,82,64,0.25)',
                background: '#fff',
                fontWeight: 800,
                fontSize: 12,
                color: '#134252',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) return
                onCreate({
                  title: title.trim(),
                  assignee_id: assigneeId.trim() || null,
                  due_date: dueDate.trim() || null,
                  internal_note: internalNote.trim() || null,
                })
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: canSubmit ? '#134252' : '#9aa8a1',
                fontWeight: 800,
                fontSize: 12,
                color: '#fff',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              Create task
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
