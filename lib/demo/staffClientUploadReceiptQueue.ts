/**
 * Staff **Client upload receipt queue** — internal review of portal-submitted documents.
 *
 * Surfaces fulfilled document requests that were satisfied by a client-portal upload and have
 * not yet been staff-acknowledged. Does not expose AML / Condo Diligence internals to clients,
 * and does not change client-visible receipt wording beyond the existing Received state.
 */
import {
  CLIENT_PORTAL_DOCUMENT_SOURCE,
  getFulfilledRequestDocumentName,
} from '@/lib/demo/demoDocumentRequest'
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
}

export type StaffClientUploadReceiptQueue = {
  pendingCount: number
  items: StaffClientUploadReceiptQueueItem[]
  disclaimer: string
}

/**
 * Pure staff queue of unacknowledged client-portal uploads linked to fulfilled requests.
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
    if (request.status !== 'fulfilled') continue
    if (request.staff_receipt_acknowledged_at) continue
    const documentId = request.fulfilled_document_id
    if (!documentId) continue
    const document = documentsById.get(documentId)
    if (!document || document.deletedAt) continue
    if ((document.source ?? '').trim() !== CLIENT_PORTAL_DOCUMENT_SOURCE) continue
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
    })
  }

  items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

  return {
    pendingCount: items.length,
    items,
    disclaimer:
      'Internal client-upload receipt queue. Items appear after a portal upload fulfills a client-visible document request. Acknowledging receipt is staff-only and is not shown on the client portal.',
  }
}
