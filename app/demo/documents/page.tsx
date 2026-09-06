'use client'

import { useMemo, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import UploadDemoDocumentModal from '@/app/demo/_components/UploadDemoDocumentModal'
import RequestDemoDocumentModal from '@/app/demo/_components/RequestDemoDocumentModal'
import DocumentPreviewModal from '@/app/demo/_components/DocumentPreviewModal'
import LinkClientUploadToDocumentRequestModal from '@/app/demo/_components/LinkClientUploadToDocumentRequestModal'
import MarkDocumentRequestNeedsFollowUpModal from '@/app/demo/_components/MarkDocumentRequestNeedsFollowUpModal'
import ClearDocumentRequestNeedsFollowUpModal from '@/app/demo/_components/ClearDocumentRequestNeedsFollowUpModal'
import { getFulfilledRequestDocumentName } from '@/lib/demo/demoDocumentRequest'
import { buildStaffClientUploadReceiptQueue } from '@/lib/demo/staffClientUploadReceiptQueue'
import { canStaffLinkClientUploadToDocumentRequest } from '@/lib/demo/staffClientUploadRequestLinkRepair'
import { buildStaffDocumentRequestFollowUpList } from '@/lib/demo/staffDocumentRequestFollowUpList'
import {
  getDocumentRequestFollowUpDetailPresentation,
  getDocumentRequestFollowUpPresentation,
  normalizeDocumentRequestFollowUp,
} from '@/lib/demo/staffDocumentRequestFollowUp'

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

export default function DemoDocumentsPage() {
  const {
    documents,
    documentRequests,
    matters,
    staff,
    acknowledgeClientUploadReceipt,
    markDocumentRequestNeedsFollowUp,
  } = useDemoStore()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null)
  const [linkRepairDocumentId, setLinkRepairDocumentId] = useState<string | null>(null)
  const [followUpRequestId, setFollowUpRequestId] = useState<string | null>(null)
  const [clearFollowUpRequestId, setClearFollowUpRequestId] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...documents].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()),
    [documents]
  )

  const sortedRequests = useMemo(
    () =>
      [...documentRequests].sort(
        (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
      ),
    [documentRequests]
  )

  const clientUploadReceiptQueue = useMemo(
    () =>
      buildStaffClientUploadReceiptQueue({
        documentRequests,
        documents,
        matters,
      }),
    [documentRequests, documents, matters]
  )

  const documentRequestFollowUpList = useMemo(
    () =>
      buildStaffDocumentRequestFollowUpList({
        documentRequests,
        documents,
        matters,
      }),
    [documentRequests, documents, matters]
  )

  const previewDocument = useMemo(
    () => documents.find((d) => d.id === previewDocumentId) ?? null,
    [documents, previewDocumentId]
  )

  const linkRepairDocument = useMemo(
    () => documents.find((d) => d.id === linkRepairDocumentId) ?? null,
    [documents, linkRepairDocumentId]
  )

  const previewLinkedRequest = useMemo(
    () =>
      previewDocument
        ? documentRequests.find((r) => r.fulfilled_document_id === previewDocument.id) ?? null
        : null,
    [documentRequests, previewDocument]
  )

  const followUpRequest = useMemo(
    () => documentRequests.find((r) => r.id === followUpRequestId) ?? null,
    [documentRequests, followUpRequestId],
  )

  const clearFollowUpRequest = useMemo(
    () => documentRequests.find((r) => r.id === clearFollowUpRequestId) ?? null,
    [documentRequests, clearFollowUpRequestId],
  )

  return (
    <div>
      <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Documents</h1>
      <p style={{ marginTop: 0, marginBottom: '16px', color: '#627c71' }}>
        Matter document records in demo mode (metadata only — no real files stored or downloadable).
      </p>

      <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button
          type="button"
          onClick={() => setRequestOpen(true)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(94,82,64,0.35)',
            background: '#fff',
            color: '#134252',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Create client document request
        </button>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#134252',
            color: '#fff',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Simulate upload
        </button>
      </div>

      <RequestDemoDocumentModal isOpen={requestOpen} onClose={() => setRequestOpen(false)} />
      <UploadDemoDocumentModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />
      <DocumentPreviewModal
        previewDocument={previewDocument}
        matters={matters}
        staff={staff}
        fulfilledRequest={previewLinkedRequest}
        onClose={() => setPreviewDocumentId(null)}
        canLinkToDocumentRequest={
          Boolean(previewDocument && canStaffLinkClientUploadToDocumentRequest(previewDocument, matters))
        }
        onLinkToDocumentRequest={() => {
          if (previewDocument) setLinkRepairDocumentId(previewDocument.id)
        }}
      />
      <LinkClientUploadToDocumentRequestModal
        isOpen={Boolean(linkRepairDocument)}
        document={linkRepairDocument}
        onClose={() => setLinkRepairDocumentId(null)}
      />

      <MarkDocumentRequestNeedsFollowUpModal
        isOpen={Boolean(followUpRequest)}
        request={followUpRequest}
        onClose={() => setFollowUpRequestId(null)}
      />

      <ClearDocumentRequestNeedsFollowUpModal
        isOpen={Boolean(clearFollowUpRequest)}
        request={clearFollowUpRequest}
        onClose={() => setClearFollowUpRequestId(null)}
      />

      <h2 style={{ fontSize: '18px', marginBottom: '8px', marginTop: '8px', color: '#134252', fontWeight: 800 }}>
        Client upload receipt queue
        {clientUploadReceiptQueue.pendingCount > 0 ? ` (${clientUploadReceiptQueue.pendingCount})` : ''}
      </h2>
      <p style={{ marginTop: 0, marginBottom: '10px', color: '#627c71', fontSize: 13, lineHeight: 1.45, maxWidth: '46rem' }}>
        {clientUploadReceiptQueue.disclaimer}
      </p>
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid rgba(94,82,64,0.2)',
          overflowX: 'auto',
          marginBottom: '28px',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Request</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Matter</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Uploaded file</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Uploaded</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Receipt status</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {clientUploadReceiptQueue.items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '14px', color: '#627c71' }}>
                  No client portal uploads awaiting receipt review.
                </td>
              </tr>
            ) : (
              clientUploadReceiptQueue.items.map((item) => (
                <tr key={item.requestId} style={{ borderBottom: '1px solid rgba(94,82,64,0.12)' }}>
                  <td style={{ padding: '14px', color: '#134252', fontWeight: 700, verticalAlign: 'top' }}>
                    <div>{item.requestTitle}</div>
                    <div style={{ marginTop: 4, fontWeight: 500, color: '#627c71', fontSize: 13 }}>
                      {item.requestCategory}
                    </div>
                  </td>
                  <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: '#134252' }}>{item.matterFileId}</div>
                    <div style={{ marginTop: 4, fontSize: 13 }}>{item.matterLabel}</div>
                  </td>
                  <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewDocumentId(item.documentId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        color: '#134252',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                      }}
                    >
                      {item.documentName}
                    </button>
                    <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: '#0f766e' }}>
                      Client portal upload
                    </div>
                  </td>
                  <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top' }}>
                    {formatDemoDateTime(item.uploadedAt)}
                  </td>
                  <td style={{ padding: '14px', color: '#0f766e', fontWeight: 700, verticalAlign: 'top', fontSize: 13 }}>
                    {item.receiptStatusLabel}
                  </td>
                  <td style={{ padding: '14px', verticalAlign: 'top' }}>
                    <button
                      type="button"
                      onClick={() => acknowledgeClientUploadReceipt(item.requestId)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(15,118,110,0.35)',
                        background: '#ecfdf5',
                        color: '#0f766e',
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Record receipt review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: '18px', marginBottom: '8px', marginTop: '8px', color: '#134252', fontWeight: 800 }}>
        Document requests needing follow-up
        {documentRequestFollowUpList.pendingCount > 0
          ? ` (${documentRequestFollowUpList.pendingCount})`
          : ''}
      </h2>
      <p style={{ marginTop: 0, marginBottom: '10px', color: '#627c71', fontSize: 13, lineHeight: 1.45, maxWidth: '46rem' }}>
        {documentRequestFollowUpList.disclaimer}
      </p>
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid rgba(94,82,64,0.2)',
          overflowX: 'auto',
          marginBottom: '28px',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Request</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Matter</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Follow-up</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Receipt review</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Linked upload</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Marked</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {documentRequestFollowUpList.items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '14px', color: '#627c71' }}>
                  No document requests currently marked Needs follow-up.
                </td>
              </tr>
            ) : (
              documentRequestFollowUpList.items.map((item) => (
                <tr key={item.requestId} style={{ borderBottom: '1px solid rgba(94,82,64,0.12)' }}>
                  <td style={{ padding: '14px', color: '#134252', fontWeight: 700, verticalAlign: 'top' }}>
                    <div>{item.requestTitle}</div>
                    <div style={{ marginTop: 4, fontWeight: 500, color: '#627c71', fontSize: 13 }}>
                      {item.requestCategory}
                    </div>
                    {item.internalFollowUpNote ? (
                      <div style={{ marginTop: 6, fontWeight: 500, color: '#627c71', fontSize: 12 }}>
                        {item.internalFollowUpNote}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: '#134252' }}>{item.matterFileId}</div>
                    <div style={{ marginTop: 4, fontSize: 13 }}>{item.matterLabel}</div>
                  </td>
                  <td
                    style={{
                      padding: '14px',
                      color: '#b45309',
                      fontWeight: 700,
                      verticalAlign: 'top',
                      fontSize: 13,
                    }}
                  >
                    {item.followUpStatusLabel}
                  </td>
                  <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top', fontSize: 13 }}>
                    {item.receiptReviewLabel}
                  </td>
                  <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top', fontSize: 13 }}>
                    <div>{item.linkedClientUploadLabel ?? '—'}</div>
                    {item.uploadedAt ? (
                      <div style={{ marginTop: 4, fontSize: 12 }}>{formatDemoDateTime(item.uploadedAt)}</div>
                    ) : null}
                  </td>
                  <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top', fontSize: 13 }}>
                    <div>{item.markedByName ?? 'Staff'}</div>
                    {item.markedAt ? (
                      <div style={{ marginTop: 4, fontSize: 12 }}>{formatDemoDateTime(item.markedAt)}</div>
                    ) : null}
                  </td>
                  <td style={{ padding: '14px', verticalAlign: 'top' }}>
                    {item.canClearNeedsFollowUp ? (
                      <button
                        type="button"
                        onClick={() => setClearFollowUpRequestId(item.requestId)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid rgba(94,82,64,0.3)',
                          background: '#fff',
                          color: '#134252',
                          fontWeight: 800,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Clear follow-up
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: '18px', marginBottom: '10px', marginTop: '8px', color: '#134252', fontWeight: 800 }}>
        Requested documents
      </h2>
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid rgba(94,82,64,0.2)',
          overflowX: 'auto',
          marginBottom: '28px',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Request</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Matter</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Category</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Follow-up</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Requested</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>By</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedRequests.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '14px', color: '#627c71' }}>
                  No document requests yet.
                </td>
              </tr>
            ) : (
              sortedRequests.map((req) => {
                const matter = matters.find((m) => m.id === req.matter_id)
                const by = staff.find((s) => s.id === req.requested_by_staff_id)
                const fulfilledDocName = getFulfilledRequestDocumentName(req, documents)
                const followUpDetail = getDocumentRequestFollowUpDetailPresentation({
                  request: req,
                  documents,
                  matters,
                  staffId: staff[0]?.id,
                })
                // Prefer detail path (reuses eligibility/canMark/presentation/normalize).
                // Fall back to presentation helpers when detail is denied.
                const followUp =
                  followUpDetail?.followUp ??
                  getDocumentRequestFollowUpPresentation(
                    normalizeDocumentRequestFollowUp(req.staff_follow_up),
                  )
                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid rgba(94,82,64,0.12)' }}>
                    <td style={{ padding: '14px', color: '#134252', fontWeight: 700, verticalAlign: 'top' }}>
                      <div>{req.title}</div>
                      {req.description && (
                        <div style={{ marginTop: '6px', fontWeight: 500, color: '#627c71', fontSize: '13px' }}>
                          {req.description}
                        </div>
                      )}
                      {req.status === 'fulfilled' && (
                        <div style={{ marginTop: '6px', fontWeight: 600, color: '#2f855a', fontSize: '13px' }}>
                          Fulfilled{fulfilledDocName ? " by " + fulfilledDocName : ""}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top' }}>
                      {matter?.file_id ?? req.matter_id}
                    </td>
                    <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top' }}>{req.category}</td>
                    <td
                      style={{
                        padding: '14px',
                        color: '#627c71',
                        verticalAlign: 'top',
                        textTransform: 'capitalize',
                      }}
                    >
                      {req.status}
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top' }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: followUp.status === 'needs_follow_up' ? '#b45309' : '#627c71',
                          fontSize: 13,
                        }}
                      >
                        {followUp.statusLabel}
                      </div>
                      {followUp.status === 'needs_follow_up' && followUpDetail ? (
                        <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                          <div style={{ fontSize: 12, color: '#627c71' }}>
                            <span style={{ fontWeight: 700, color: '#134252' }}>Matter</span>
                            <div>{followUpDetail.matterLabel}</div>
                          </div>
                          <div style={{ fontSize: 12, color: '#627c71' }}>
                            <span style={{ fontWeight: 700, color: '#134252' }}>Document request</span>
                            <div>{followUpDetail.requestLabel}</div>
                          </div>
                          <div style={{ fontSize: 12, color: '#627c71' }}>
                            <span style={{ fontWeight: 700, color: '#134252' }}>Receipt review</span>
                            <div>{followUpDetail.receiptReviewLabel}</div>
                          </div>
                          <div style={{ fontSize: 12, color: '#627c71' }}>
                            <span style={{ fontWeight: 700, color: '#134252' }}>Linked client upload</span>
                            <div>{followUpDetail.linkedClientUploadLabel ?? '—'}</div>
                          </div>
                          <div style={{ fontSize: 12, color: '#627c71' }}>
                            <span style={{ fontWeight: 700, color: '#134252' }}>Uploaded</span>
                            <div>
                              {followUpDetail.uploadedAt
                                ? formatDemoDateTime(followUpDetail.uploadedAt)
                                : '—'}
                            </div>
                          </div>
                          <div style={{ fontSize: 12, color: '#627c71' }}>
                            <span style={{ fontWeight: 700, color: '#134252' }}>Internal follow-up note</span>
                            <div>{followUpDetail.internalFollowUpNote || '—'}</div>
                          </div>
                        </div>
                      ) : followUp.note ? (
                        <div style={{ marginTop: 4, color: '#627c71', fontSize: 12 }}>{followUp.note}</div>
                      ) : null}
                    </td>
                    <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top' }}>
                      {formatDemoDateTime(req.requested_at)}
                    </td>
                    <td style={{ padding: '14px', color: '#627c71', verticalAlign: 'top' }}>
                      {by?.full_name ?? 'Staff'}
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top' }}>
                      {followUp.status === 'needs_follow_up' ? (
                        <button
                          type="button"
                          onClick={() => setClearFollowUpRequestId(req.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(94,82,64,0.3)',
                            background: '#fff',
                            color: '#134252',
                            fontWeight: 800,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          Clear follow-up
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setFollowUpRequestId(req.id)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(180,83,9,0.35)',
                            background: '#fffbeb',
                            color: '#b45309',
                            fontWeight: 800,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          Needs follow-up
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#134252', fontWeight: 800 }}>Uploaded documents</h2>
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94,82,64,0.2)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Document</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Matter</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Category</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Uploaded</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>By</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((doc) => {
              const matter = matters.find((m) => m.id === doc.matter_id)
              const uploadedBy = staff.find((s) => s.id === doc.uploaded_by_staff_id)
              return (
                <tr key={doc.id} style={{ borderBottom: '1px solid rgba(94,82,64,0.12)' }}>
                  <td style={{ padding: '14px' }}>
                    <button
                      type="button"
                      onClick={() => setPreviewDocumentId(doc.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        color: '#134252',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                      }}
                    >
                      {doc.name}
                    </button>
                  </td>
                  <td style={{ padding: '14px', color: '#627c71' }}>{matter?.file_id ?? doc.matter_id}</td>
                  <td style={{ padding: '14px', color: '#627c71' }}>{doc.category}</td>
                  <td style={{ padding: '14px', color: '#627c71', textTransform: 'capitalize' }}>{doc.status}</td>
                  <td style={{ padding: '14px', color: '#627c71' }}>{formatDemoDateTime(doc.uploaded_at)}</td>
                  <td style={{ padding: '14px', color: '#627c71' }}>{uploadedBy?.full_name ?? 'Staff'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
