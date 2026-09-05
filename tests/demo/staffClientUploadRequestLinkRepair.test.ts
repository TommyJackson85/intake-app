import { describe, expect, it } from 'vitest'
import { CLIENT_PORTAL_DOCUMENT_SOURCE } from '@/lib/demo/demoDocumentRequest'
import { demoSeedData } from '@/lib/demo/demoData'
import {
  canStaffLinkClientUploadToDocumentRequest,
  listOpenDocumentRequestsForClientUploadLinkRepair,
  tryLinkClientUploadToDocumentRequest,
} from '@/lib/demo/staffClientUploadRequestLinkRepair'
import type { DemoDocument, DemoDocumentRequest } from '@/lib/demo/types'

const matter = demoSeedData.matters.find((m) => m.id === 'matter-001')!

function clientUpload(overrides: Partial<DemoDocument> = {}): DemoDocument {
  return {
    id: 'doc-link-1',
    matter_id: 'matter-001',
    name: 'Unlinked Client ID.pdf',
    category: 'Compliance',
    source: CLIENT_PORTAL_DOCUMENT_SOURCE,
    uploaded_at: '2026-03-12T10:00:00.000Z',
    uploaded_by_staff_id: 'staff-emma-kline',
    status: 'draft',
    deletedAt: null,
    ...overrides,
  }
}

function openRequest(overrides: Partial<DemoDocumentRequest> = {}): DemoDocumentRequest {
  return {
    id: 'req-link-1',
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
    ...overrides,
  }
}

describe('staffClientUploadRequestLinkRepair', () => {
  it('links an unlinked client-portal upload to an open same-matter request', () => {
    const document = clientUpload()
    const request = openRequest()
    const result = tryLinkClientUploadToDocumentRequest(
      [matter],
      [document],
      [request],
      { documentId: document.id, requestId: request.id },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.documentRequests[0]).toMatchObject({
      id: request.id,
      status: 'fulfilled',
      fulfilled_document_id: document.id,
      staff_receipt_acknowledged_at: null,
      staff_receipt_reviewed_by_staff_id: null,
      staff_receipt_reviewed_document_id: null,
    })
    expect(document.source).toBe(CLIENT_PORTAL_DOCUMENT_SOURCE)
    expect(document.uploaded_by_staff_id).toBe('staff-emma-kline')
  })

  it('clears a prior incorrect request link when repairing', () => {
    const document = clientUpload()
    const wrong: DemoDocumentRequest = {
      ...openRequest({ id: 'req-wrong', title: 'Wrong request' }),
      status: 'fulfilled',
      fulfilled_document_id: document.id,
      staff_receipt_acknowledged_at: '2026-03-12T11:00:00.000Z',
    staff_receipt_reviewed_by_staff_id: null,
    staff_receipt_reviewed_document_id: null,
    }
    const target = openRequest({ id: 'req-correct', title: 'Correct request' })
    const result = tryLinkClientUploadToDocumentRequest(
      [matter],
      [document],
      [wrong, target],
      { documentId: document.id, requestId: target.id },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const byId = Object.fromEntries(result.documentRequests.map((r) => [r.id, r]))
    expect(byId['req-wrong']).toMatchObject({
      status: 'open',
      fulfilled_document_id: null,
      staff_receipt_acknowledged_at: null,
    staff_receipt_reviewed_by_staff_id: null,
    staff_receipt_reviewed_document_id: null,
    })
    expect(byId['req-correct']).toMatchObject({
      status: 'fulfilled',
      fulfilled_document_id: document.id,
      staff_receipt_acknowledged_at: null,
    staff_receipt_reviewed_by_staff_id: null,
    staff_receipt_reviewed_document_id: null,
    })
  })

  it('denies cross-matter, non-portal, internal, and already-fulfilled targets', () => {
    const document = clientUpload()
    const otherMatterRequest = openRequest({ id: 'req-other', matter_id: 'matter-999' })
    expect(
      tryLinkClientUploadToDocumentRequest(
        [matter],
        [document],
        [otherMatterRequest],
        { documentId: document.id, requestId: otherMatterRequest.id },
      ).ok,
    ).toBe(false)

    expect(
      tryLinkClientUploadToDocumentRequest(
        [matter],
        [clientUpload({ source: 'Matter setup (demo)' })],
        [openRequest()],
        { documentId: 'doc-link-1', requestId: 'req-link-1' },
      ).ok,
    ).toBe(false)

    expect(
      tryLinkClientUploadToDocumentRequest(
        [matter],
        [
          clientUpload({
            generatedInternalSummary: {
              generatedType: 'condo_diligence_internal_summary',
              generatedAt: '2026-03-12T10:00:00.000Z',
              sourceMatterId: 'matter-001',
              content: 'internal',
              visibility: 'internal',
            },
          }),
        ],
        [openRequest()],
        { documentId: 'doc-link-1', requestId: 'req-link-1' },
      ).ok,
    ).toBe(false)

    const fulfilledElsewhere: DemoDocumentRequest = {
      ...openRequest(),
      status: 'fulfilled',
      fulfilled_document_id: 'doc-other',
    }
    expect(
      tryLinkClientUploadToDocumentRequest(
        [matter],
        [document],
        [fulfilledElsewhere],
        { documentId: document.id, requestId: fulfilledElsewhere.id },
      ).ok,
    ).toBe(false)
  })

  it('lists only open same-matter requests and gates eligibility', () => {
    const document = clientUpload()
    const open = openRequest()
    const fulfilled: DemoDocumentRequest = {
      ...openRequest({ id: 'req-fulfilled' }),
      status: 'fulfilled',
      fulfilled_document_id: 'doc-005',
    }
    const otherMatter = openRequest({ id: 'req-x', matter_id: 'matter-002' })
    const options = listOpenDocumentRequestsForClientUploadLinkRepair({
      document,
      documentRequests: [open, fulfilled, otherMatter],
    })
    expect(options.map((r) => r.id)).toEqual(['req-link-1'])
    expect(canStaffLinkClientUploadToDocumentRequest(document, [matter])).toBe(true)
    expect(canStaffLinkClientUploadToDocumentRequest(clientUpload({ source: null }), [matter])).toBe(false)
  })

  it('includes the seeded unlinked client-portal upload fixture', () => {
    const unlinked = demoSeedData.documents.find((d) => d.id === 'doc-006')
    expect(unlinked?.source).toBe(CLIENT_PORTAL_DOCUMENT_SOURCE)
    const linkedToUnlinked = demoSeedData.documentRequests.some(
      (r) => r.fulfilled_document_id === 'doc-006',
    )
    expect(linkedToUnlinked).toBe(false)
    expect(canStaffLinkClientUploadToDocumentRequest(unlinked, demoSeedData.matters)).toBe(true)
  })
})
