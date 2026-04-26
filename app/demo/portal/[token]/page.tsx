'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { demoSeedData, DEMO_MILESTONE_LOGS, MILESTONE_LABELS, MILESTONE_ORDER } from '@/lib/demo/demoData'
import type { MatterMilestoneStatus } from '@/lib/demo/types'
import { useDemoStore } from '@/lib/demo/store'

export default function ClientPortalPage() {
  const params = useParams()
  const token = typeof params.token === 'string' ? params.token : ''
  const { matters, documentRequests, fulfillDemoDocumentRequest } = useDemoStore()
  const [fulfillRequestId, setFulfillRequestId] = useState<string | null>(null)
  const [fulfillFileName, setFulfillFileName] = useState('')
  const [fulfillError, setFulfillError] = useState<string | null>(null)
  const [fulfillNotice, setFulfillNotice] = useState<string | null>(null)

  const closeFulfillModal = () => {
    setFulfillRequestId(null)
    setFulfillFileName('')
    setFulfillError(null)
  }

  useEffect(() => {
    if (!fulfillRequestId) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFulfillModal()
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [fulfillRequestId])

  useEffect(() => {
    if (!fulfillNotice) return
    const t = window.setTimeout(() => setFulfillNotice(null), 4500)
    return () => window.clearTimeout(t)
  }, [fulfillNotice])

  const matter = useMemo(
    () => matters.find((m) => m.portal_token === token) ?? null,
    [matters, token],
  )

  const openDocumentRequestsForMatter = useMemo(() => {
    if (!matter) return []
    return documentRequests
      .filter((r) => r.matter_id === matter.id && r.status === 'open')
      .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime())
  }, [documentRequests, matter])

  const logs = useMemo(
    () => (matter ? DEMO_MILESTONE_LOGS.filter((l) => l.matter_id === matter.id) : []),
    [matter],
  )

  const completedStatuses = useMemo(
    () => new Set(logs.map((l) => l.status)),
    [logs],
  )

  if (!matter) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h1 style={{ fontSize: 24, color: '#134252', marginBottom: 8 }}>Portal not found</h1>
          <p style={{ color: '#627c71', fontSize: 14 }}>This portal link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  // Find the next step (first milestone not completed)
  const nextStatus: MatterMilestoneStatus | null = MILESTONE_ORDER.find((s) => !completedStatuses.has(s)) ?? null

  // Current status = last completed milestone
  const lastCompleted = [...MILESTONE_ORDER].reverse().find((s) => completedStatuses.has(s))
  const currentLabel = lastCompleted ? MILESTONE_LABELS[lastCompleted] : 'Pending'

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ background: '#0f766e', color: 'white', padding: '28px 24px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: 6 }}>
            {matter.matter_type}
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>
            {matter.property.address}
          </h1>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
            File {matter.file_id}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
        {/* Current status card */}
        <div style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '20px 24px',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#627c71', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Current Status
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f766e' }}>
            {currentLabel}
          </div>
        </div>

        {/* Expected closing date card */}
        <div style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '20px 24px',
          marginBottom: 28,
          borderLeft: '4px solid #16a34a',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#627c71', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Expected Closing Date
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>
            {new Date(matter.key_dates.closing_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Open document requests — same `documentRequests` as /demo/documents (DemoProvider) */}
        {openDocumentRequestsForMatter.length > 0 && (
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: '20px 24px',
              marginBottom: 28,
              borderLeft: '4px solid #0f766e',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#627c71',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 14,
              }}
            >
              Requested documents
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {openDocumentRequestsForMatter.map((req, idx) => (
                <div
                  key={req.id}
                  style={{
                    paddingBottom: idx < openDocumentRequestsForMatter.length - 1 ? 16 : 0,
                    borderBottom: idx < openDocumentRequestsForMatter.length - 1 ? '1px solid #f3f4f6' : 'none',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#134252', marginBottom: 4 }}>{req.title}</div>
                  {req.description && (
                    <div style={{ fontSize: 13, color: '#627c71', marginBottom: 8, lineHeight: 1.45 }}>{req.description}</div>
                  )}
                  <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                    <span>
                      <span style={{ color: '#627c71' }}>Category:</span> {req.category}
                    </span>
                    <span style={{ textTransform: 'capitalize' }}>
                      <span style={{ color: '#627c71' }}>Status:</span> {req.status}
                    </span>
                    <span>
                      <span style={{ color: '#627c71' }}>Requested:</span>{' '}
                      {new Date(req.requested_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setFulfillRequestId(req.id)
                        setFulfillFileName('')
                        setFulfillError(null)
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#0f766e',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Upload document
                    </button>
                    <span style={{ marginLeft: 10, fontSize: 12, color: '#9ca3af' }}>
                      Demo: records metadata only; no real file is uploaded, stored, or downloaded.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {fulfillNotice && (
          <div
            role="status"
            style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 18,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {fulfillNotice}
          </div>
        )}

        {fulfillRequestId && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Simulate document upload"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeFulfillModal()
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 18,
              zIndex: 100,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 400,
                background: 'white',
                borderRadius: 12,
                boxShadow: '0 18px 40px rgba(0,0,0,0.2)',
                padding: '22px 24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#134252', marginBottom: 2 }}>Upload document</div>
                  <div style={{ fontSize: 13, color: '#627c71' }}>
                    Demo only — metadata only. No real file stored.
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeFulfillModal}
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    color: '#627c71',
                    cursor: 'pointer',
                    fontSize: 18,
                    fontWeight: 900,
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ fontSize: 13, color: '#627c71', marginBottom: 16 }}>
                Enter the file name as it will appear in your closing file.
              </div>
              {fulfillError && (
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
                  {fulfillError}
                </div>
              )}
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#134252', marginBottom: 12 }}>
                File name
                <input
                  value={fulfillFileName}
                  onChange={(e) => setFulfillFileName(e.target.value)}
                  placeholder="e.g. HUD-1 Final.pdf"
                  autoFocus
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
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
                <button
                  type="button"
                  onClick={closeFulfillModal}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    background: 'white',
                    fontWeight: 600,
                    color: '#134252',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFulfillError(null)
                    const name = fulfillFileName.trim()
                    if (!name) {
                      setFulfillError('Enter a file name.')
                      return
                    }
                    const request = documentRequests.find((r) => r.id === fulfillRequestId)
                    fulfillDemoDocumentRequest({
                      portal_token: token,
                      request_id: fulfillRequestId,
                      file_name: name,
                    })
                    setFulfillNotice(
                      request
                        ? `Submitted "${name}" for "${request.title}" (demo metadata only; no real file stored).`
                        : `Submitted "${name}" (demo metadata only; no real file stored).`
                    )
                    closeFulfillModal()
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#0f766e',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '24px',
          marginBottom: 28,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#134252', marginBottom: 20 }}>
            Transaction Progress
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {MILESTONE_ORDER.map((status, idx) => {
              const isCompleted = completedStatuses.has(status)
              const isNext = status === nextStatus
              const isPending = !isCompleted && !isNext
              const isLast = idx === MILESTONE_ORDER.length - 1
              const log = logs.find((l) => l.status === status)

              let circleStyle: React.CSSProperties
              let circleContent: string
              let labelStyle: React.CSSProperties

              if (isCompleted) {
                circleStyle = {
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#0f766e',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }
                circleContent = '\u2713'
                labelStyle = { fontSize: 14, fontWeight: 600, color: '#134252' }
              } else if (isNext) {
                circleStyle = {
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'white',
                  border: '2px solid #d97706',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }
                circleContent = '\u2192'
                labelStyle = { fontSize: 14, fontWeight: 600, color: '#d97706' }
              } else {
                circleStyle = {
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'white',
                  border: '2px solid #d1d5db',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0,
                }
                circleContent = '\u25CB'
                labelStyle = { fontSize: 14, fontWeight: 500, color: '#9ca3af' }
              }

              return (
                <div key={status}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Timeline connector + circle */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={circleStyle}>{circleContent}</div>
                      {!isLast && (
                        <div style={{
                          width: 2,
                          height: 32,
                          background: isCompleted ? '#0f766e' : '#e5e7eb',
                        }} />
                      )}
                    </div>
                    {/* Label + meta */}
                    <div style={{ paddingTop: 3, paddingBottom: isLast ? 0 : 18 }}>
                      <div style={labelStyle}>
                        {MILESTONE_LABELS[status]}
                        {isNext && (
                          <span style={{
                            marginLeft: 10,
                            fontSize: 11,
                            fontWeight: 700,
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}>
                            Next step
                          </span>
                        )}
                      </div>
                      {isCompleted && log && (
                        <div style={{ fontSize: 12, color: '#627c71', marginTop: 2 }}>
                          {new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {log.note && <span> &mdash; {log.note}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Update history */}
        {logs.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '24px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#134252', marginBottom: 16 }}>
              Update History
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[...logs].reverse().map((log) => (
                <div key={log.id} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#134252' }}>
                      {log.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                      {new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  {log.note && (
                    <div style={{ fontSize: 13, color: '#627c71', marginTop: 4 }}>
                      {log.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 40 }}>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            Powered by LawIntake &middot; {demoSeedData.demoFirm.name}
          </div>
        </div>
      </div>
    </div>
  )
}
