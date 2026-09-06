import { describe, expect, it } from 'vitest'
import { CLIENT_PORTAL_DOCUMENT_SOURCE } from '@/lib/demo/demoDocumentRequest'
import { demoSeedData } from '@/lib/demo/demoData'
import {
  canRecordDocumentRequestReceiptReview,
  getDocumentRequestReceiptReviewPresentation,
  getEligibleClientProvidedUploadsForRequest,
  isEligibleDocumentRequestForReceiptReview,
  normalizeDocumentRequestReceiptReview,
  recordDocumentRequestReceiptReview,
} from '@/lib/demo/staffDocumentRequestReceiptReview'
import { buildStaffClientUploadReceiptQueue } from '@/lib/demo/staffClientUploadReceiptQueue'
import type { DemoDocument, DemoDocumentRequest } from '@/lib/demo/types'

const matter = demoSeedData.matters.find((m) => m.id === 'matter-001')!

function openRequest(overrides: Partial<DemoDocumentRequest> = {}): DemoDocumentRequest {
  return {
    id: 'req-receipt-1',
    matter_id: 'matter-001',
    title: 'Buyer photo ID',
    description: null,
    category: 'Compliance',
    requested_at: '2026-03-05T14:00:00.000Z',
    requested_by_staff_id: 'staff-emma-kline',
    status: 'open',
    fulfilled_document_id: null,
    staff_receipt_acknowledged_at: null,
    staff_receipt_reviewed_by_staff_id: null,
    staff_receipt_reviewed_document_id: null,
    staff_follow_up: { status: 'none' as const, note: '', markedById: null, markedByName: null, markedAt: null },
    ...overrides,
  }
}

function clientUpload(overrides: Partial<DemoDocument> = {}): DemoDocument {
  return {
    id: 'doc-receipt-1',
    matter_id: 'matter-001',
    name: 'Buyer-ID.pdf',
    category: 'Compliance',
    source: CLIENT_PORTAL_DOCUMENT_SOURCE,
    uploaded_at: '2026-03-12T10:00:00.000Z',
    uploaded_by_staff_id: 'staff-emma-kline',
    status: 'draft',
    deletedAt: null,
    ...overrides,
  }
}

describe('staffDocumentRequestReceiptReview', () => {
  it('normalizes pending and reviewed receipt states for client-portal fulfillments', () => {
    const document = clientUpload()
    const pending = openRequest({
      status: 'fulfilled',
      fulfilled_document_id: document.id,
    })
    expect(normalizeDocumentRequestReceiptReview(pending, [document])).toMatchObject({
      status: 'pending_review',
      document_id: document.id,
      reviewed_at: null,
    })

    const reviewed = openRequest({
      status: 'fulfilled',
      fulfilled_document_id: document.id,
      staff_receipt_acknowledged_at: '2026-03-12T12:00:00.000Z',
      staff_receipt_reviewed_by_staff_id: 'staff-emma-kline',
      staff_receipt_reviewed_document_id: document.id,
    staff_follow_up: { status: 'none' as const, note: '', markedById: null, markedByName: null, markedAt: null }
    })
    expect(normalizeDocumentRequestReceiptReview(reviewed, [document])).toMatchObject({
      status: 'reviewed',
      reviewed_at: '2026-03-12T12:00:00.000Z',
      reviewed_by_staff_id: 'staff-emma-kline',
      document_id: document.id,
    })

    expect(
      normalizeDocumentRequestReceiptReview(openRequest(), [document]).status,
    ).toBe('not_applicable')
  })

  it('lists eligible client-provided uploads and gates recording', () => {
    const document = clientUpload()
    const otherPortal = clientUpload({ id: 'doc-other', name: 'Other.pdf' })
    const staffDoc = clientUpload({
      id: 'doc-staff',
      source: 'Matter setup (demo)',
      name: 'Staff.pdf',
    })
    const request = openRequest({
      status: 'fulfilled',
      fulfilled_document_id: document.id,
    })

    expect(
      getEligibleClientProvidedUploadsForRequest(request, [document, otherPortal, staffDoc]).map(
        (d) => d.id,
      ),
    ).toEqual(['doc-receipt-1'])

    expect(isEligibleDocumentRequestForReceiptReview(request, [document], [matter])).toBe(true)
    expect(
      canRecordDocumentRequestReceiptReview({
        request,
        document,
        documents: [document],
        matters: [matter],
        staffId: 'staff-emma-kline',
      }),
    ).toBe(true)
    expect(
      canRecordDocumentRequestReceiptReview({
        request,
        document: otherPortal,
        documents: [document, otherPortal],
        matters: [matter],
        staffId: 'staff-emma-kline',
      }),
    ).toBe(false)
  })

  it('records receipt review and removes the item from the receipt queue', () => {
    const document = clientUpload()
    const request = openRequest({
      status: 'fulfilled',
      fulfilled_document_id: document.id,
    })
    const before = buildStaffClientUploadReceiptQueue({
      documentRequests: [request],
      documents: [document],
      matters: [matter],
    })
    expect(before.pendingCount).toBe(1)
    expect(before.items[0].receiptStatusLabel).toBe('Pending receipt review')

    const next = recordDocumentRequestReceiptReview(
      [matter],
      [document],
      [request],
      {
        requestId: request.id,
        documentId: document.id,
        staffId: 'staff-emma-kline',
      },
      { nowIso: () => '2026-03-12T12:00:00.000Z' },
    )
    expect(next[0]).toMatchObject({
      staff_receipt_acknowledged_at: '2026-03-12T12:00:00.000Z',
      staff_receipt_reviewed_by_staff_id: 'staff-emma-kline',
      staff_receipt_reviewed_document_id: document.id,
    staff_follow_up: { status: 'none' as const, note: '', markedById: null, markedByName: null, markedAt: null }
    })
    expect(getDocumentRequestReceiptReviewPresentation(
      normalizeDocumentRequestReceiptReview(next[0], [document]),
    )).toMatchObject({
      status: 'reviewed',
      statusLabel: 'Receipt reviewed',
      canRecordReview: false,
    })

    const after = buildStaffClientUploadReceiptQueue({
      documentRequests: next,
      documents: [document],
      matters: [matter],
    })
    expect(after.pendingCount).toBe(0)
  })

  it('treats the seeded proof-of-funds portal upload as pending receipt review', () => {
    const request = demoSeedData.documentRequests.find((r) => r.id === 'docreq-003')!
    const docs = demoSeedData.documents
    expect(isEligibleDocumentRequestForReceiptReview(request, docs, demoSeedData.matters)).toBe(true)
    expect(normalizeDocumentRequestReceiptReview(request, docs).status).toBe('pending_review')
    expect(getEligibleClientProvidedUploadsForRequest(request, docs).some((d) => d.id === 'doc-005')).toBe(
      true,
    )
  })

  it('excludes cancelled requests from receipt-review eligibility and queue', () => {
    const document = clientUpload()
    const cancelledFulfilled = openRequest({
      status: 'fulfilled',
      fulfilled_document_id: document.id,
      lifecycle: {
        status: 'cancelled',
        cancelledAt: '2026-03-01T00:00:00.000Z',
        cancelledById: 'staff-emma-kline',
        cancelledByName: 'Emma Kline',
      },
    })
    expect(
      isEligibleDocumentRequestForReceiptReview(cancelledFulfilled, [document], [matter]),
    ).toBe(false)
    const queue = buildStaffClientUploadReceiptQueue({
      documentRequests: [cancelledFulfilled],
      documents: [document],
      matters: [matter],
    })
    expect(queue.pendingCount).toBe(0)
    expect(queue.items).toEqual([])
  })
})
