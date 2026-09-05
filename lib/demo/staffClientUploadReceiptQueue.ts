/**
 * Staff **Client upload receipt queue** — internal review of portal-submitted documents.
 *
 * Surfaces fulfilled document requests that were satisfied by a client-portal upload and still
 * need staff receipt review. Does not expose AML / Condo Diligence internals to clients, and
 * does not change client-visible receipt wording beyond the existing Received state.
 */
import { getFulfilledRequestDocumentName } from '@/lib/demo/demoDocumentRequest'
import {
  getDocumentRequestReceiptReviewPresentation,
  isEligibleDocumentRequestForReceiptReview,
  normalizeDocumentRequestReceiptReview,
} from '@/lib/demo/staffDocumentRequestReceiptReview'
import type { DemoDocument, DemoDocumentRequest, DemoMatter } from '@/lib/demo/types'

export type StaffClientUploadReceiptQueueItem = {
  requestId: string
  requestTitle: string
  requestCategory: DemoDocumentRequest['category']
  matterId: string
  matterFileId: string
  matterLabel: string
  documentId: string
  documentName: string
  uploadedAt: string
  requestedAt: string
  receiptStatusLabel: string
}

export type StaffClientUploadReceiptQueue = {
  pendingCount: number
  items: StaffClientUploadReceiptQueueItem[]
  disclaimer: string
}

/**
 * Pure staff queue of client-portal uploads pending receipt review.
 */
export function buildStaffClientUploadReceiptQueue(input: {
  documentRequests: DemoDocumentRequest[]
  documents: DemoDocument[]
  matters: DemoMatter[]
}): StaffClientUploadReceiptQueue {
  const documentsById = new Map(input.documents.map((d) => [d.id, d]))
  const mattersById = new Map(input.matters.filter((m) => !m.deletedAt).map((m) => [m.id, m]))

  const items: StaffClientUploadReceiptQueueItem[] = []
  for (const request of input.documentRequests) {
    if (!isEligibleDocumentRequestForReceiptReview(request, input.documents, input.matters)) {
      continue
    }
    const review = normalizeDocumentRequestReceiptReview(request, input.documents)
    if (review.status !== 'pending_review' || !review.document_id) continue
    const presentation = getDocumentRequestReceiptReviewPresentation(review)
    const document = documentsById.get(review.document_id)
    if (!document || document.deletedAt) continue
    const matter = mattersById.get(request.matter_id)
    if (!matter) continue

    items.push({
      requestId: request.id,
      requestTitle: request.title,
      requestCategory: request.category,
      matterId: matter.id,
      matterFileId: matter.file_id,
      matterLabel: matter.property?.address?.trim() || matter.file_id,
      documentId: document.id,
      documentName: getFulfilledRequestDocumentName(request, input.documents) ?? document.name,
      uploadedAt: document.uploaded_at,
      requestedAt: request.requested_at,
      receiptStatusLabel: presentation.statusLabel,
    })
  }

  items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  return {
    pendingCount: items.length,
    items,
    disclaimer:
      'Internal client-upload receipt queue. Items appear after a portal upload fulfills a client-visible document request. Recording receipt review is staff-only and is not shown on the client portal.',
  }
}
