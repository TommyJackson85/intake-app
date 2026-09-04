'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { DemoDocument } from '@/lib/demo/types'
import {
  compareCondoDiligenceInternalSummaryPlainText,
  condoDiligenceInternalSummarySortTime,
} from '@/lib/demo/condoDiligence'

type CondoDiligenceSummaryCompareModalProps = {
  open: boolean
  snapshots: DemoDocument[]
  onClose: () => void
}

function formatSnapshotOptionLabel(doc: DemoDocument): string {
  const savedAt = doc.generatedInternalSummary?.generatedAt?.trim() || doc.uploaded_at
  const when = Number.isFinite(new Date(savedAt).getTime())
    ? new Date(savedAt).toLocaleString()
    : savedAt
  return `${doc.name} · ${when}`
}

function snapshotContent(doc: DemoDocument | undefined): string {
  return doc?.generatedInternalSummary?.content?.trim() ?? ''
}

export default function CondoDiligenceSummaryCompareModal({
  open,
  snapshots,
  onClose,
}: CondoDiligenceSummaryCompareModalProps) {
  const ordered = useMemo(
    () =>
      [...snapshots].sort(
        (a, b) => condoDiligenceInternalSummarySortTime(b) - condoDiligenceInternalSummarySortTime(a),
      ),
    [snapshots],
  )

  const [newerId, setNewerId] = useState('')
  const [earlierId, setEarlierId] = useState('')

  useEffect(() => {
    if (!open) return
    setNewerId(ordered[0]?.id ?? '')
    setEarlierId(ordered[1]?.id ?? '')
  }, [open, ordered])

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

  if (!open) return null

  const newerDoc = ordered.find((d) => d.id === newerId)
  const earlierDoc = ordered.find((d) => d.id === earlierId)
  const sameSnapshot = Boolean(newerId && earlierId && newerId === earlierId)
  const canCompare = Boolean(newerDoc && earlierDoc && !sameSnapshot)

  const comparison = canCompare
    ? compareCondoDiligenceInternalSummaryPlainText({
        earlierContent: snapshotContent(earlierDoc),
        newerContent: snapshotContent(newerDoc),
        earlierSnapshotId: earlierDoc!.id,
        newerSnapshotId: newerDoc!.id,
      })
    : null

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid rgba(94,82,64,0.25)',
    background: '#fff',
    color: '#134252',
    fontWeight: 700,
    fontSize: 12,
  }

  const metaCardStyle: React.CSSProperties = {
    border: '1px solid rgba(94,82,64,0.12)',
    borderRadius: 8,
    padding: 12,
    background: '#fff',
    minWidth: 0,
  }

  const kindStyle = (kind: 'added' | 'removed' | 'changed'): React.CSSProperties => {
    if (kind === 'added') return { color: '#166534', background: '#dcfce7', border: '1px solid #86efac' }
    if (kind === 'removed') return { color: '#991b1b', background: '#fee2e2', border: '1px solid #fca5a5' }
    return { color: '#92400e', background: '#fef3c7', border: '1px solid #fcd34d' }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Compare saved internal summaries"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 80,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: 18,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 920,
          background: '#fcfcf9',
          borderRadius: 10,
          border: '1px solid rgba(94,82,64,0.25)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(94,82,64,0.15)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#134252' }}>
              Compare saved internal summaries
            </div>
            <div style={{ fontSize: 12, color: '#627c71', marginTop: 4, lineHeight: 1.45 }}>
              Internal only — factual differences between two immutable saved snapshots. Not shared to the client
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
              whiteSpace: 'nowrap',
            }}
          >
            Close
          </button>
        </div>

        <div style={{ padding: 18, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#134252' }}>Newer snapshot</span>
              <select
                aria-label="Newer snapshot"
                value={newerId}
                onChange={(e) => setNewerId(e.target.value)}
                style={selectStyle}
              >
                {ordered.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {formatSnapshotOptionLabel(doc)}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#134252' }}>Earlier snapshot</span>
              <select
                aria-label="Earlier snapshot"
                value={earlierId}
                onChange={(e) => setEarlierId(e.target.value)}
                style={selectStyle}
              >
                {ordered.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {formatSnapshotOptionLabel(doc)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {sameSnapshot ? (
            <div
              style={{
                border: '1px solid rgba(185,28,28,0.35)',
                background: '#fef2f2',
                color: '#991b1b',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Select two different saved snapshots.
            </div>
          ) : null}

          {canCompare && newerDoc && earlierDoc ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                }}
              >
                <div style={metaCardStyle}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#134252', marginBottom: 8 }}>
                    Newer snapshot
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#134252', marginBottom: 6 }}>
                    {newerDoc.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#627c71', fontWeight: 700, lineHeight: 1.5 }}>
                    Saved:{' '}
                    {new Date(
                      newerDoc.generatedInternalSummary?.generatedAt?.trim() || newerDoc.uploaded_at,
                    ).toLocaleString()}
                    <br />
                    Status: {newerDoc.status} · Internal only
                  </div>
                </div>
                <div style={metaCardStyle}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#134252', marginBottom: 8 }}>
                    Earlier snapshot
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#134252', marginBottom: 6 }}>
                    {earlierDoc.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#627c71', fontWeight: 700, lineHeight: 1.5 }}>
                    Saved:{' '}
                    {new Date(
                      earlierDoc.generatedInternalSummary?.generatedAt?.trim() || earlierDoc.uploaded_at,
                    ).toLocaleString()}
                    <br />
                    Status: {earlierDoc.status} · Internal only
                  </div>
                </div>
              </div>

              {comparison ? (
                <>
                  <div
                    style={{
                      border: '1px solid rgba(94,82,64,0.12)',
                      borderRadius: 8,
                      padding: 12,
                      background: '#fff',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#134252', marginBottom: 6 }}>
                      Factual change summary
                    </div>
                    <div style={{ fontSize: 12, color: '#627c71', lineHeight: 1.45, marginBottom: 10 }}>
                      {comparison.disclaimer}
                    </div>
                    {comparison.compactSummary.unchanged ? (
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#134252' }}>
                        No factual differences between these snapshots.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#134252',
                        }}
                      >
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 999,
                            background: '#f5f5f5',
                            border: '1px solid rgba(94,82,64,0.15)',
                          }}
                        >
                          {comparison.compactSummary.sectionsChanged} section
                          {comparison.compactSummary.sectionsChanged === 1 ? '' : 's'} changed
                        </span>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 999,
                            ...kindStyle('changed'),
                          }}
                        >
                          {comparison.compactSummary.linesChanged} changed
                        </span>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 999,
                            ...kindStyle('added'),
                          }}
                        >
                          {comparison.compactSummary.linesAdded} added
                        </span>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 999,
                            ...kindStyle('removed'),
                          }}
                        >
                          {comparison.compactSummary.linesRemoved} removed
                        </span>
                      </div>
                    )}
                  </div>

                  {!comparison.compactSummary.unchanged ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#134252' }}>
                        Detailed changes by section
                      </div>
                      {comparison.sectionChanges.map((section) => (
                        <div
                          key={section.sectionTitle}
                          style={{
                            border: '1px solid rgba(94,82,64,0.12)',
                            borderRadius: 8,
                            padding: 12,
                            background: '#fff',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 900, color: '#134252', marginBottom: 8 }}>
                            {section.sectionTitle}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {section.changes.map((change, idx) => (
                              <div
                                key={`${section.sectionTitle}-${change.kind}-${change.label}-${idx}`}
                                style={{
                                  borderLeft: '3px solid',
                                  borderLeftColor:
                                    change.kind === 'added'
                                      ? '#16a34a'
                                      : change.kind === 'removed'
                                        ? '#dc2626'
                                        : '#d97706',
                                  paddingLeft: 10,
                                }}
                              >
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 900,
                                      textTransform: 'uppercase',
                                      padding: '2px 6px',
                                      borderRadius: 999,
                                      ...kindStyle(change.kind),
                                    }}
                                  >
                                    {change.kind}
                                  </span>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: '#134252' }}>
                                    {change.label}
                                  </span>
                                </div>
                                {change.kind === 'changed' ? (
                                  <div style={{ fontSize: 12, color: '#627c71', marginTop: 4, lineHeight: 1.45 }}>
                                    Earlier: {change.earlierValue || '—'}
                                    <br />
                                    Newer: {change.newerValue || '—'}
                                  </div>
                                ) : change.kind === 'added' ? (
                                  <div style={{ fontSize: 12, color: '#627c71', marginTop: 4 }}>
                                    {change.newerValue || change.label}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 12, color: '#627c71', marginTop: 4 }}>
                                    {change.earlierValue || change.label}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
