import { describe, expect, it } from 'vitest'
import {
  attemptClientDocumentRequestUpload,
  canClientUploadDocumentRequest,
  validateClientDocumentUploadFileName,
} from '@/lib/demo/clientDocumentRequestUpload'
import { demoSeedData } from '@/lib/demo/demoData'
import type { DemoDocumentRequest } from '@/lib/demo/types'

const matter = demoSeedData.matters.find((m) => m.id === 'matter-001')!

const openReq: DemoDocumentRequest = {
  id: 'req-upload-1',
  matter_id: 'matter-001',
  title: 'Buyer photo ID',
  description: null,
  category: 'Compliance',
  requested_at: '2026-03-05T14:00:00.000Z',
  requested_by_staff_id: 'staff-emma-kline',
  status: 'open',
  fulfilled_document_id: null,
}

describe('clientDocumentRequestUpload', () => {
  describe('validateClientDocumentUploadFileName', () => {
    it('rejects blank names', () => {
      const r = validateClientDocumentUploadFileName('   ')
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toBe('empty_file_name')
    })

    it('trims a valid file name', () => {
      const r = validateClientDocumentUploadFileName('  ID scan.pdf  ')
      expect(r).toEqual({ ok: true, fileName: 'ID scan.pdf' })
    })
  })

  describe('canClientUploadDocumentRequest', () => {
    it('allows only open requests on the portal matter', () => {
      expect(canClientUploadDocumentRequest(openReq, 'matter-001')).toBe(true)
      expect(canClientUploadDocumentRequest({ ...openReq, status: 'fulfilled' }, 'matter-001')).toBe(false)
      expect(canClientUploadDocumentRequest(openReq, 'matter-other')).toBe(false)
      expect(canClientUploadDocumentRequest(null, 'matter-001')).toBe(false)
    })
  })

  describe('attemptClientDocumentRequestUpload', () => {
    it('fulfills an open request for the portal matter', () => {
      const result = attemptClientDocumentRequestUpload(
        [matter],
        [],
        [openReq],
        {
          portalToken: matter.portal_token,
          requestId: openReq.id,
          fileName: ' Buyer-ID.pdf ',
          uploadedByStaffId: 'staff-emma-kline',
        },
        { idFactory: () => 'doc-upload-1', nowIso: () => '2026-09-05T18:00:00.000Z' },
      )
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.fileName).toBe('Buyer-ID.pdf')
      expect(result.requestTitle).toBe('Buyer photo ID')
      expect(result.documents).toHaveLength(1)
      expect(result.documents[0].name).toBe('Buyer-ID.pdf')
      expect(result.documentRequests[0].status).toBe('fulfilled')
      expect(result.documentRequests[0].fulfilled_document_id).toBe('doc-upload-1')
    })

    it('rejects wrong portal token and already-fulfilled requests', () => {
      expect(
        attemptClientDocumentRequestUpload(
          [matter],
          [],
          [openReq],
          {
            portalToken: 'nope',
            requestId: openReq.id,
            fileName: 'x.pdf',
            uploadedByStaffId: 'staff-emma-kline',
          },
        ).ok,
      ).toBe(false)

      expect(
        attemptClientDocumentRequestUpload(
          [matter],
          [],
          [{ ...openReq, status: 'fulfilled', fulfilled_document_id: 'd0' }],
          {
            portalToken: matter.portal_token,
            requestId: openReq.id,
            fileName: 'x.pdf',
            uploadedByStaffId: 'staff-emma-kline',
          },
        ).ok,
      ).toBe(false)
    })
  })
})
