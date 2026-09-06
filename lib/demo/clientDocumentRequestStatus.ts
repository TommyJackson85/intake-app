/**
 * Client portal **Document Request Status** — read-only status projection for clients.
 *
 * Surfaces open + fulfilled lawyer document requests on the client portal so clients can see
 * what is still needed vs what has already been received. Does not change request lifecycle,
 * lawyer tools, or AML / Condo Diligence workspaces.
 */
import { isClientDocumentRequestLifecycleActive } from '@/lib/demo/staffCancelClientDocumentRequest'
import type { DemoDocument, DemoDocumentRequest, DemoDocumentRequestStatus } from '@/lib/demo/types'
import { getFulfilledRequestDocumentName } from '@/lib/demo/demoDocumentRequest'

export type ClientDocumentRequestStatusLabel = 'Awaiting upload' | 'Received'

export type ClientDocumentRequestStatusRow = {
  id: string
  title: string
  description: string | null
  category: DemoDocumentRequest['category']
  status: DemoDocumentRequestStatus
  statusLabel: ClientDocumentRequestStatusLabel
  requestedAt: string
  fulfilledDocumentName: string | null
  /** True only while status is open — client may simulate upload. */
  canUpload: boolean
}

export type ClientDocumentRequestStatusView = {
  openCount: number
  fulfilledCount: number
  totalCount: number
  summaryLabel: string
  rows: ClientDocumentRequestStatusRow[]
  disclaimer: string
}

/** Existing safe client-facing status display for an ordinary document request. */
export function getClientDocumentRequestStatusLabel(
  status: DemoDocumentRequestStatus,
): ClientDocumentRequestStatusLabel {
  return status === 'fulfilled' ? 'Received' : 'Awaiting upload'
}

function statusLabelFor(status: DemoDocumentRequestStatus): ClientDocumentRequestStatusLabel {
  return getClientDocumentRequestStatusLabel(status)
}

function summaryLabel(openCount: number, fulfilledCount: number, totalCount: number): string {
  if (totalCount === 0) return 'No document requests on this matter yet.'
  if (openCount === 0) {
    return fulfilledCount === 1
      ? '1 document request received.'
      : `${fulfilledCount} document requests received.`
  }
  if (fulfilledCount === 0) {
    return openCount === 1
      ? '1 document request awaiting your upload.'
      : `${openCount} document requests awaiting your upload.`
  }
  return `${openCount} awaiting upload · ${fulfilledCount} received`
}

/**
 * Pure client-facing status view for a matter’s document requests.
 * Includes open and fulfilled rows; upload remains available only for open requests.
 */
export function buildClientDocumentRequestStatusView(input: {
  matterId: string
  documentRequests: DemoDocumentRequest[]
  documents: DemoDocument[]
}): ClientDocumentRequestStatusView {
  const matterId = input.matterId.trim()
  const rows = input.documentRequests
    .filter((r) => r.matter_id === matterId && isClientDocumentRequestLifecycleActive(r))
    .slice()
    .sort((a, b) => {
      // Open first, then newest requested_at
      if (a.status !== b.status) return a.status === 'open' ? -1 : 1
      return new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
    })
    .map((r): ClientDocumentRequestStatusRow => {
      const status = r.status === 'fulfilled' ? 'fulfilled' : 'open'
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        status,
        statusLabel: statusLabelFor(status),
        requestedAt: r.requested_at,
        fulfilledDocumentName: getFulfilledRequestDocumentName(r, input.documents),
        canUpload: status === 'open',
      }
    })

  const openCount = rows.filter((r) => r.status === 'open').length
  const fulfilledCount = rows.filter((r) => r.status === 'fulfilled').length

  return {
    openCount,
    fulfilledCount,
    totalCount: rows.length,
    summaryLabel: summaryLabel(openCount, fulfilledCount, rows.length),
    rows,
    disclaimer:
      'Document request status for your closing file. Uploads in this demo record file names only — no real files are stored or transmitted.',
  }
}
