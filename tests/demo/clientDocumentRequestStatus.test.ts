import { describe, expect, it } from 'vitest'
import { buildClientDocumentRequestStatusView } from '@/lib/demo/clientDocumentRequestStatus'
import type { DemoDocument, DemoDocumentRequest } from '@/lib/demo/types'

function request(partial: Partial<DemoDocumentRequest> & Pick<DemoDocumentRequest, 'id' | 'title' | 'status'>): DemoDocumentRequest {
  return {
    matter_id: 'matter-001',
    description: null,
    category: 'Compliance',
    requested_at: '2026-03-05T14:00:00.000Z',
    requested_by_staff_id: 'staff-emma-kline',
    fulfilled_document_id: null,
    ...partial,
  }
}

const docs: DemoDocument[] = [
  {
    id: 'doc-001',
    matter_id: 'matter-001',
    name: 'Executed Purchase Contract.pdf',
    category: 'Contract',
    uploaded_at: '2026-03-04T09:35:00.000Z',
    uploaded_by_staff_id: 'staff-emma-kline',
    status: 'final',
    deletedAt: null,
  },
]

describe('clientDocumentRequestStatus', () => {
  describe('buildClientDocumentRequestStatusView', () => {
    it('returns empty summary when matter has no requests', () => {
      const view = buildClientDocumentRequestStatusView({
        matterId: 'matter-001',
        documentRequests: [],
        documents: [],
      })
      expect(view.totalCount).toBe(0)
      expect(view.openCount).toBe(0)
      expect(view.fulfilledCount).toBe(0)
      expect(view.rows).toEqual([])
      expect(view.summaryLabel.toLowerCase()).toContain('no document requests')
    })

    it('lists open and fulfilled requests with client status labels', () => {
      const view = buildClientDocumentRequestStatusView({
        matterId: 'matter-001',
        documentRequests: [
          request({
            id: 'r-open',
            title: 'Photo ID',
            status: 'open',
            requested_at: '2026-03-06T12:00:00.000Z',
          }),
          request({
            id: 'r-done',
            title: 'Purchase contract',
            status: 'fulfilled',
            category: 'Contract',
            requested_at: '2026-03-04T10:00:00.000Z',
            fulfilled_document_id: 'doc-001',
          }),
          request({
            id: 'r-other',
            title: 'Other matter',
            status: 'open',
            matter_id: 'matter-999',
          }),
        ],
        documents: docs,
      })

      expect(view.totalCount).toBe(2)
      expect(view.openCount).toBe(1)
      expect(view.fulfilledCount).toBe(1)
      expect(view.summaryLabel).toContain('awaiting upload')
      expect(view.summaryLabel).toContain('received')
      expect(view.rows.map((r) => r.id)).toEqual(['r-open', 'r-done'])
      expect(view.rows[0].statusLabel).toBe('Awaiting upload')
      expect(view.rows[0].canUpload).toBe(true)
      expect(view.rows[1].statusLabel).toBe('Received')
      expect(view.rows[1].canUpload).toBe(false)
      expect(view.rows[1].fulfilledDocumentName).toBe('Executed Purchase Contract.pdf')
      expect(view.disclaimer.toLowerCase()).toContain('demo')
    })

    it('summarizes when only open requests remain', () => {
      const view = buildClientDocumentRequestStatusView({
        matterId: 'matter-001',
        documentRequests: [
          request({ id: 'a', title: 'A', status: 'open' }),
          request({ id: 'b', title: 'B', status: 'open', requested_at: '2026-03-01T00:00:00.000Z' }),
        ],
        documents: [],
      })
      expect(view.openCount).toBe(2)
      expect(view.fulfilledCount).toBe(0)
      expect(view.summaryLabel.toLowerCase()).toContain('awaiting your upload')
      expect(view.rows.every((r) => r.canUpload)).toBe(true)
    })

    it('summarizes when all requests are received', () => {
      const view = buildClientDocumentRequestStatusView({
        matterId: 'matter-001',
        documentRequests: [
          request({
            id: 'done',
            title: 'Contract',
            status: 'fulfilled',
            fulfilled_document_id: 'doc-001',
          }),
        ],
        documents: docs,
      })
      expect(view.openCount).toBe(0)
      expect(view.fulfilledCount).toBe(1)
      expect(view.summaryLabel.toLowerCase()).toContain('received')
      expect(view.rows[0].canUpload).toBe(false)
    })
  })
})
