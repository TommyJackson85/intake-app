/**
 * Staff **Link to document request** — manual repair for client-portal uploads.
 *
 * Corrective staff-only action: link an eligible client-provided upload to an eligible
 * ordinary open document request on the same matter. Never auto-selects a request.
 * Does not create uploads/requests, rewrite file metadata, or expose repair state to the portal.
 */
import { CLIENT_PORTAL_DOCUMENT_SOURCE } from '@/lib/demo/demoDocumentRequest'
import {
  isCondoDiligenceInternalSummaryDocument,
  isCondoDiligenceReviewMemoDocument,
} from '@/lib/demo/condoDiligence'
import type { DemoDocument, DemoDocumentRequest, DemoMatter } from '@/lib/demo/types'

export type StaffClientUploadRequestLinkRepairError =
  | 'document_not_found'
  | 'document_deleted'
  | 'document_not_client_portal'
  | 'document_internal_only'
  | 'matter_not_found'
  | 'request_not_found'
  | 'request_matter_mismatch'
  | 'request_not_open'
  | 'request_already_fulfilled_elsewhere'

export type StaffClientUploadRequestLinkRepairResult =
  | { ok: true; documentRequests: DemoDocumentRequest[] }
  | { ok: false; error: StaffClientUploadRequestLinkRepairError }

function isInternalGeneratedDocument(document: DemoDocument): boolean {
  if (document.generatedInternalSummary) return true
  if (isCondoDiligenceInternalSummaryDocument(document)) return true
  if (isCondoDiligenceReviewMemoDocument(document)) return true
  return false
}

/** Whether a document may be offered the staff link-repair action. */
export function canStaffLinkClientUploadToDocumentRequest(
  document: DemoDocument | null | undefined,
  matters: DemoMatter[],
): boolean {
  if (!document || document.deletedAt) return false
  if ((document.source ?? '').trim() !== CLIENT_PORTAL_DOCUMENT_SOURCE) return false
  if (isInternalGeneratedDocument(document)) return false
  const matter = matters.find((m) => m.id === document.matter_id && !m.deletedAt)
  return Boolean(matter)
}

/** Open ordinary document requests on the same matter as the upload (manual picker options). */
export function listOpenDocumentRequestsForClientUploadLinkRepair(input: {
  document: DemoDocument
  documentRequests: DemoDocumentRequest[]
}): DemoDocumentRequest[] {
  return input.documentRequests
    .filter(
      (r) =>
        r.matter_id === input.document.matter_id &&
        r.status === 'open' &&
        !r.fulfilled_document_id,
    )
    .slice()
    .sort(
      (a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime(),
    )
}

/**
 * Pure staff repair: link an eligible client-portal upload to a staff-selected open request
 * on the same matter. Clears any prior request that incorrectly pointed at the upload.
 * Leaves the document row unchanged (source, uploader, timestamps, storage metadata).
 */
export function tryLinkClientUploadToDocumentRequest(
  matters: DemoMatter[],
  documents: DemoDocument[],
  documentRequests: DemoDocumentRequest[],
  input: { documentId: string; requestId: string },
): StaffClientUploadRequestLinkRepairResult {
  const documentId = input.documentId.trim()
  const requestId = input.requestId.trim()
  if (!documentId || !requestId) {
    return { ok: false, error: 'document_not_found' }
  }

  const document = documents.find((d) => d.id === documentId)
  if (!document) return { ok: false, error: 'document_not_found' }
  if (document.deletedAt) return { ok: false, error: 'document_deleted' }
  if ((document.source ?? '').trim() !== CLIENT_PORTAL_DOCUMENT_SOURCE) {
    return { ok: false, error: 'document_not_client_portal' }
  }
  if (isInternalGeneratedDocument(document)) {
    return { ok: false, error: 'document_internal_only' }
  }

  const matter = matters.find((m) => m.id === document.matter_id && !m.deletedAt)
  if (!matter) return { ok: false, error: 'matter_not_found' }

  const request = documentRequests.find((r) => r.id === requestId)
  if (!request) return { ok: false, error: 'request_not_found' }
  if (request.matter_id !== document.matter_id) {
    return { ok: false, error: 'request_matter_mismatch' }
  }
  if (request.status === 'fulfilled' && request.fulfilled_document_id === documentId) {
    return { ok: true, documentRequests }
  }
  if (request.status !== 'open' || request.fulfilled_document_id) {
    if (request.status !== 'open') {
      return { ok: false, error: 'request_not_open' }
    }
    return { ok: false, error: 'request_already_fulfilled_elsewhere' }
  }

  let changed = false
  const next = documentRequests.map((r) => {
    if (r.id === request.id) {
      changed = true
      return {
        ...r,
        status: 'fulfilled' as const,
        fulfilled_document_id: document.id,
        staff_receipt_acknowledged_at: null,
        staff_receipt_reviewed_by_staff_id: null,
        staff_receipt_reviewed_document_id: null,
      }
    }
    if (r.fulfilled_document_id === document.id) {
      changed = true
      return {
        ...r,
        status: 'open' as const,
        fulfilled_document_id: null,
        staff_receipt_acknowledged_at: null,
        staff_receipt_reviewed_by_staff_id: null,
        staff_receipt_reviewed_document_id: null,
      }
    }
    return r
  })

  if (!changed) return { ok: false, error: 'request_not_found' }
  return { ok: true, documentRequests: next }
}
