'use client'

import React, { useEffect } from 'react'
import type { DemoDocument, DemoDocumentRequest, DemoStaffProfile, DemoMatter } from '@/lib/demo/types'
import {
  isEngagementLetterDocument,
  parseEngagementLetterDescription,
  resolveEngagementLetterPreview,
} from '@/lib/demo/engagementLetterPreview'
import { buildPreviewSourceLabel, buildPreviewTitle } from '@/lib/demo/documentPreviewPresentation'

type DocumentPreviewModalProps = {
  previewDocument: DemoDocument | null
  matters: DemoMatter[]
  staff: DemoStaffProfile[]
  fulfilledRequest: DemoDocumentRequest | null
  onClose: () => void
}

export default function DocumentPreviewModal({
  previewDocument,
  matters,
  staff,
  fulfilledRequest,
  onClose,
}: DocumentPreviewModalProps) {
  const formatDemoDateTime = (value: string) =>
    new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(new Date(value))

  useEffect(() => {
    if (!previewDocument) return

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
  }, [previewDocument, onClose])

  if (!previewDocument) return null

  const matter = matters.find((m) => m.id === previewDocument.matter_id)
  const uploadedBy = staff.find((s) => s.id === previewDocument.uploaded_by_staff_id)
  const matterLabel = matter?.file_id ?? previewDocument.matter_id
  const matterAddress = matter?.property.address ?? 'Address not available'
  const uploadedByLabel = uploadedBy?.full_name ?? previewDocument.uploaded_by_staff_id
  const subtypeLabel = previewDocument.document_subtype ?? 'General filing'
  const sourceLabel = buildPreviewSourceLabel({
    source: previewDocument.source,
    status: previewDocument.status,
    hasMatterLink: Boolean(matter),
    fulfilledRequestTitle: fulfilledRequest?.title ?? null,
  })
  const documentDateLabel = previewDocument.document_date ?? 'Not specified'
  const shortDescription = previewDocument.description?.trim() ?? ''

  const categoryPreviewConfig: Record<
    string,
    { title: string; subtitle: string; sectionLabel: string; lineTwo: string }
  > = {
    Contract: {
      title: 'Purchase Contract Addendum',
      subtitle: 'Execution Summary',
      sectionLabel: 'Agreement Snapshot',
      lineTwo: 'Parties, terms, and signatures captured for demo review.',
    },
    Title: {
      title: 'Title Commitment Overview',
      subtitle: 'Preliminary Review',
      sectionLabel: 'Coverage Snapshot',
      lineTwo: 'Exceptions and policy details represented from metadata.',
    },
    Closing: {
      title: 'Closing Package Summary',
      subtitle: 'Settlement Snapshot',
      sectionLabel: 'Finalization Notes',
      lineTwo: 'Funds and closing milestones represented in demo form.',
    },
    Compliance: {
      title: 'Compliance Checklist',
      subtitle: 'Verification Summary',
      sectionLabel: 'Control Notes',
      lineTwo: 'Regulatory checks represented as metadata-only entries.',
    },
    'Post-Closing': {
      title: 'Post-Closing Follow-Up',
      subtitle: 'Completion Snapshot',
      sectionLabel: 'Recorded Actions',
      lineTwo: 'Post-close tasks and recordings shown for demonstration.',
    },
  }

  const previewConfig = categoryPreviewConfig[previewDocument.category] ?? {
    title: 'Document Summary',
    subtitle: 'Simulated First Page',
    sectionLabel: 'Document Notes',
    lineTwo: 'This preview is generated from demo metadata.',
  }
  const previewHeading = buildPreviewTitle({
    name: previewDocument.name,
    subtype: previewDocument.document_subtype,
    categoryTitle: previewConfig.title,
  })
  const isEngagementLetter = isEngagementLetterDocument(previewDocument)
  const engagementPreview = resolveEngagementLetterPreview({
    dateLabel: previewDocument.document_date ?? 'Not specified',
    matterType: matter?.matter_type ?? 'Real estate matter',
    defaults: {
      clientName: 'Client Name',
      attorneyName: uploadedByLabel,
      fileReference: matterLabel,
      propertyAddress: matterAddress,
    },
    fields: parseEngagementLetterDescription(previewDocument.description),
  })
  const statusTone: Record<DemoDocument['status'], { bg: string; color: string; label: string }> = {
    draft: { bg: '#fef3c7', color: '#92400e', label: 'Draft' },
    reviewed: { bg: '#dbeafe', color: '#1e40af', label: 'Reviewed' },
    final: { bg: '#dcfce7', color: '#166534', label: 'Final' },
  }

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: '#627c71',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 4,
  }

  const fieldValueStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: '#134252',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Document details (demo)"
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
        zIndex: 55,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          background: '#fcfcf9',
          borderRadius: '10px',
          border: '1px solid rgba(94,82,64,0.25)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
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
              Document details
            </div>
            <div style={{ color: '#627c71', fontSize: '13px' }}>
              Demo metadata preview only — no real file content is stored.
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
              x
            </button>
          </div>
        </div>

        <div
          style={{
            padding: '18px 20px',
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.1fr)',
            gap: 16,
            alignItems: 'start',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <div
            style={{
              border: '1px solid rgba(94,82,64,0.2)',
              borderRadius: 8,
              background: 'white',
              padding: '14px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
            }}
          >
            <div style={{ gridColumn: '1 / -1', fontSize: 13, fontWeight: 800, color: '#134252' }}>
              Metadata details
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={fieldLabelStyle}>Name</div>
              <div style={fieldValueStyle}>{previewDocument.name}</div>
            </div>
            <div>
              <div style={fieldLabelStyle}>Matter</div>
              <div style={fieldValueStyle}>{matterLabel}</div>
            </div>
            <div>
              <div style={fieldLabelStyle}>Category</div>
              <div style={fieldValueStyle}>{previewDocument.category}</div>
            </div>
            <div>
              <div style={fieldLabelStyle}>Subtype</div>
              <div style={fieldValueStyle}>{previewDocument.document_subtype ?? 'Not specified'}</div>
            </div>
            <div>
              <div style={fieldLabelStyle}>Status</div>
              <div style={{ ...fieldValueStyle, textTransform: 'capitalize' }}>{previewDocument.status}</div>
            </div>
            <div>
              <div style={fieldLabelStyle}>Uploaded</div>
              <div style={fieldValueStyle}>{formatDemoDateTime(previewDocument.uploaded_at)}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={fieldLabelStyle}>Uploaded by</div>
              <div style={fieldValueStyle}>{uploadedByLabel}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={fieldLabelStyle}>Document date</div>
              <div style={fieldValueStyle}>{previewDocument.document_date ?? 'Not specified'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={fieldLabelStyle}>Received from / source</div>
              <div style={fieldValueStyle}>{previewDocument.source ?? 'Not specified'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={fieldLabelStyle}>Description / notes</div>
              <div style={fieldValueStyle}>{previewDocument.description ?? 'No notes'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={fieldLabelStyle}>Request linkage</div>
              <div style={fieldValueStyle}>
                {fulfilledRequest
                  ? `Fulfilled request: ${fulfilledRequest.title}`
                  : 'No linked fulfilled request.'}
              </div>
            </div>
          </div>

          <div
            style={{
              border: '1px solid rgba(94,82,64,0.2)',
              borderRadius: 8,
              background: '#f8f9f7',
              padding: 12,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#134252', marginBottom: 8 }}>
              Demo preview
            </div>
            <div style={{ fontSize: 12, color: '#627c71', marginBottom: 12 }}>
              Simulated first-page preview. No real file stored.
            </div>
            <div
              style={{
                background: 'white',
                border: '1px solid rgba(17,24,39,0.18)',
                boxShadow: '0 8px 18px rgba(0,0,0,0.08)',
                borderRadius: 4,
                padding: '18px 16px',
                maxHeight: 460,
                overflowY: 'auto',
              }}
            >
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, letterSpacing: '0.04em' }}>
                {previewDocument.category.toUpperCase()} DOCUMENT - DEMO
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{previewHeading.title}</div>
              {previewHeading.secondaryLine ? (
                <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 4 }}>{previewHeading.secondaryLine}</div>
              ) : null}
              <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 14 }}>{previewConfig.subtitle}</div>
              <div style={{ marginBottom: 12 }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: statusTone[previewDocument.status].bg,
                    color: statusTone[previewDocument.status].color,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                  }}
                >
                  Status: {statusTone[previewDocument.status].label}
                </span>
              </div>
              <div style={{ height: 1, background: '#e5e7eb', marginBottom: 14 }} />
              <div style={{ fontSize: 12, color: '#111827', fontWeight: 700, marginBottom: 5 }}>
                File: {previewDocument.name}
              </div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>Matter: {matterLabel}</div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>Property: {matterAddress}</div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>
                Subtype: {subtypeLabel}
              </div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>Prepared by: {uploadedByLabel}</div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>
                Source: {sourceLabel}
              </div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 10 }}>
                Recorded: {formatDemoDateTime(previewDocument.uploaded_at)}
              </div>
              <div style={{ fontSize: 12, color: '#374151', marginBottom: 10 }}>
                Document Date: {documentDateLabel}
              </div>
              {isEngagementLetter ? (
                <>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#4b5563' }}>
                    Dear {engagementPreview.clientName},
                  </p>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#4b5563' }}>
                    Thank you for selecting legal counsel in connection with the above-referenced Florida real estate
                    transaction. This draft engagement letter outlines our representation for review before any final
                    execution.
                  </p>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#4b5563' }}>
                    <strong>Scope of representation.</strong> {engagementPreview.scopeSummary}
                  </p>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#4b5563' }}>
                    <strong>Exclusions.</strong> {engagementPreview.exclusionsSummary}
                  </p>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#4b5563' }}>
                    <strong>Fee arrangement.</strong> {engagementPreview.feeSummary}
                  </p>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#4b5563' }}>
                    <strong>Costs and third-party charges.</strong> {engagementPreview.costsSummary}
                  </p>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: '#4b5563' }}>
                    If these terms are acceptable, please sign below to acknowledge this draft engagement structure.
                  </p>
                  <div style={{ marginTop: 10, marginBottom: 10, fontSize: 12, color: '#4b5563' }}>
                    Acknowledged and agreed:
                    <div style={{ marginTop: 12 }}>______________________________</div>
                    <div style={{ color: '#6b7280' }}>Client signature (demo placeholder)</div>
                  </div>
                  <div style={{ marginTop: 8, marginBottom: 10, fontSize: 12, color: '#4b5563' }}>
                    Sincerely,
                    <div style={{ marginTop: 8 }}>{engagementPreview.attorneyName}</div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: '#111827', fontWeight: 700, marginBottom: 5 }}>
                    {previewConfig.sectionLabel}
                  </div>
                  <div style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.5, marginBottom: 10 }}>
                    {previewConfig.lineTwo}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#4b5563',
                      lineHeight: 1.5,
                      marginBottom: 10,
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: 4,
                      padding: '8px 10px',
                    }}
                  >
                    {previewHeading.title} is logged for {matterLabel} regarding {matterAddress}. Received from {sourceLabel}
                    {documentDateLabel !== 'Not specified' ? ` on ${documentDateLabel}` : ''}.
                  </div>
                  {shortDescription ? (
                    <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, marginBottom: 10 }}>
                      Notes: {shortDescription}
                    </div>
                  ) : null}
                </>
              )}
              <div style={{ height: 1, background: '#e5e7eb', marginBottom: 10 }} />
              <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                This is a visual mock preview generated from metadata for demo purposes only.
              </div>
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => window.alert('PDF downloads are disabled in demo mode.')}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(94,82,64,0.35)',
                background: '#fff',
                color: '#134252',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Download PDF (disabled in demo mode)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
