/**
 * Staff **document request receipt review** — final internal step after a client-portal upload.
 *
 * Records that staff reviewed receipt of an eligible client-provided upload against an ordinary
 * fulfilled document request. Staff-only; does not change client portal labels beyond existing
 * Received / Awaiting upload wording, and does not touch Condo Diligence / AML / FinCEN data.
 */
import { CLIENT_PORTAL_DOCUMENT_SOURCE } from '@/lib/demo/demoDocumentRequest'
import {
  isCondoDiligenceInternalSummaryDocument,
  isCondoDiligenceReviewMemoDocument,
} from '@/lib/demo/condoDiligence'
import type { DemoDocument, DemoDocumentRequest, DemoMatter } from '@/lib/demo/types'

export type DocumentRequestReceiptReviewStatus =
  | 'not_applicable'
  | 'pending_review'
  | 'reviewed'

export type DocumentRequestReceiptReview = {
  status: DocumentRequestReceiptReviewStatus
  reviewed_at: string | null
  reviewed_by_staff_id: string | null
  document_id: string | null
}

export type DocumentRequestReceiptReviewPresentation = {
  status: DocumentRequestReceiptReviewStatus
  statusLabel: string
  detailLabel: string
  canRecordReview: boolean
}

function isInternalGeneratedDocument(document: DemoDocument): boolean {
  if (document.generatedInternalSummary) return true
  if (isCondoDiligenceInternalSummaryDocument(document)) return true
  if (isCondoDiligenceReviewMemoDocument(document)) return true
  return false
}

function isEligibleClientProvidedUpload(document: DemoDocument): boolean {
  if (document.deletedAt) return false
  if ((document.source ?? '').trim() !== CLIENT_PORTAL_DOCUMENT_SOURCE) return false
  if (isInternalGeneratedDocument(document)) return false
  return true
}

/**
 * Normalize receipt-review state from a document request + documents.
 * Derives pending/reviewed/not_applicable from fulfillment + client-portal linkage + ack fields.
 */
export function normalizeDocumentRequestReceiptReview(
  request: DemoDocumentRequest,
  documents: DemoDocument[],
): DocumentRequestReceiptReview {
  const reviewed_at =
    typeof request.staff_receipt_acknowledged_at === 'string' &&
    request.staff_receipt_acknowledged_at.trim().length > 0
      ? request.staff_receipt_acknowledged_at
      : null
  const reviewed_by_staff_id =
    typeof request.staff_receipt_reviewed_by_staff_id === 'string' &&
    request.staff_receipt_reviewed_by_staff_id.trim().length > 0
      ? request.staff_receipt_reviewed_by_staff_id
      : null
  const linkedId =
    typeof request.fulfilled_document_id === 'string' && request.fulfilled_document_id.trim().length > 0
      ? request.fulfilled_document_id
      : null
  const explicitDocumentId =
    typeof request.staff_receipt_reviewed_document_id === 'string' &&
    request.staff_receipt_reviewed_document_id.trim().length > 0
      ? request.staff_receipt_reviewed_document_id
      : null
  const document_id = explicitDocumentId ?? linkedId

  if (request.status !== 'fulfilled' || !linkedId) {
    return {
      status: 'not_applicable',
      reviewed_at: null,
      reviewed_by_staff_id: null,
      document_id: null,
    }
  }

  const linked = documents.find((d) => d.id === linkedId)
  if (!linked || !isEligibleClientProvidedUpload(linked) || linked.matter_id !== request.matter_id) {
    return {
      status: 'not_applicable',
      reviewed_at: null,
      reviewed_by_staff_id: null,
      document_id: null,
    }
  }

  if (reviewed_at) {
    return {
      status: 'reviewed',
      reviewed_at,
      reviewed_by_staff_id,
      document_id: document_id ?? linked.id,
    }
  }

  return {
    status: 'pending_review',
    reviewed_at: null,
    reviewed_by_staff_id: null,
    document_id: linked.id,
  }
}

/** True when a fulfilled ordinary request has an eligible client-provided upload awaiting/eligible for staff receipt review. */
export function isEligibleDocumentRequestForReceiptReview(
  request: DemoDocumentRequest,
  documents: DemoDocument[],
  matters: DemoMatter[],
): boolean {
  const matter = matters.find((m) => m.id === request.matter_id && !m.deletedAt)
  if (!matter) return false
  const review = normalizeDocumentRequestReceiptReview(request, documents)
  return review.status === 'pending_review' || review.status === 'reviewed'
}

/** Eligible client-provided uploads that may be recorded against this request (same matter, portal source, non-internal). */
export function getEligibleClientProvidedUploadsForRequest(
  request: DemoDocumentRequest,
  documents: DemoDocument[],
): DemoDocument[] {
  const linkedId = request.fulfilled_document_id
  return documents
    .filter((d) => {
      if (d.matter_id !== request.matter_id) return false
      if (!isEligibleClientProvidedUpload(d)) return false
      // Prefer the linked fulfillment document when present; otherwise same-matter portal uploads.
      if (linkedId) return d.id === linkedId
      return true
    })
    .slice()
    .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
}

/** Whether staff may record a receipt review for this request + chosen client upload. */
export function canRecordDocumentRequestReceiptReview(input: {
  request: DemoDocumentRequest
  document: DemoDocument | null | undefined
  documents: DemoDocument[]
  matters: DemoMatter[]
  staffId: string
}): boolean {
  const staffId = input.staffId.trim()
  if (!staffId) return false
  if (!input.document) return false
  if (!isEligibleDocumentRequestForReceiptReview(input.request, input.documents, input.matters)) {
    return false
  }
  const review = normalizeDocumentRequestReceiptReview(input.request, input.documents)
  if (review.status !== 'pending_review') return false
  const eligible = getEligibleClientProvidedUploadsForRequest(input.request, input.documents)
  return eligible.some((d) => d.id === input.document!.id)
}

/** Staff-facing labels for normalized receipt-review state. */
export function getDocumentRequestReceiptReviewPresentation(
  review: DocumentRequestReceiptReview,
): DocumentRequestReceiptReviewPresentation {
  switch (review.status) {
    case 'pending_review':
      return {
        status: review.status,
        statusLabel: 'Pending receipt review',
        detailLabel: 'Client portal upload received — staff receipt review not yet recorded.',
        canRecordReview: true,
      }
    case 'reviewed':
      return {
        status: review.status,
        statusLabel: 'Receipt reviewed',
        detailLabel: review.reviewed_at
          ? `Staff recorded receipt review at ${review.reviewed_at}.`
          : 'Staff recorded receipt review.',
        canRecordReview: false,
      }
    case 'not_applicable':
    default:
      return {
        status: 'not_applicable',
        statusLabel: 'Not applicable',
        detailLabel: 'No eligible client-provided upload is linked for receipt review.',
        canRecordReview: false,
      }
  }
}

/**
 * Pure mutation: record staff receipt review on an eligible fulfilled request.
 * Returns the same array reference when the action is denied.
 */
export function recordDocumentRequestReceiptReview(
  matters: DemoMatter[],
  documents: DemoDocument[],
  documentRequests: DemoDocumentRequest[],
  input: { requestId: string; documentId: string; staffId: string },
  options?: { nowIso?: () => string },
): DemoDocumentRequest[] {
  const requestId = input.requestId.trim()
  const documentId = input.documentId.trim()
  const staffId = input.staffId.trim()
  if (!requestId || !documentId || !staffId) return documentRequests

  const request = documentRequests.find((r) => r.id === requestId)
  const document = documents.find((d) => d.id === documentId)
  if (!request || !document) return documentRequests
  if (
    !canRecordDocumentRequestReceiptReview({
      request,
      document,
      documents,
      matters,
      staffId,
    })
  ) {
    return documentRequests
  }

  const nowIso = options?.nowIso ?? (() => new Date().toISOString())
  let changed = false
  const next = documentRequests.map((r) => {
    if (r.id !== request.id) return r
    changed = true
    return {
      ...r,
      staff_receipt_acknowledged_at: nowIso(),
      staff_receipt_reviewed_by_staff_id: staffId,
      staff_receipt_reviewed_document_id: document.id,
    }
  })
  return changed ? next : documentRequests
}
