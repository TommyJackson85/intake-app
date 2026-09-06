import { describe, expect, it } from 'vitest'
import { demoSeedData } from '@/lib/demo/demoData'
import { buildClientDocumentRequestStatusView } from '@/lib/demo/clientDocumentRequestStatus'
import { canClientUploadDocumentRequest } from '@/lib/demo/clientDocumentRequestUpload'
import {
  applyCancelClientDocumentRequest,
  canCancelClientDocumentRequest,
  isActiveClientDocumentRequest,
} from '@/lib/demo/staffCancelClientDocumentRequest'
import {
  applyReactivateClientDocumentRequest,
  canReactivateClientDocumentRequest,
  createClientDocumentRequestReactivationPatch,
  getClientDocumentRequestReactivateContext,
  isEligibleClientDocumentRequestForReactivation,
  validateClientDocumentRequestReactivateDraft,
} from '@/lib/demo/staffReactivateClientDocumentRequest'
import type { DemoDocumentRequest } from '@/lib/demo/types'

const matter = demoSeedData.matters.find((m) => !m.deletedAt)!
const staff = demoSeedData.staff
const staffId = staff[0]!.id
const openRequest = demoSeedData.documentRequests.find(
  (r) => r.matter_id === matter.id && r.status === 'open' && !r.fulfilled_document_id,
)!

function cancelledRequest(): DemoDocumentRequest {
  const next = applyCancelClientDocumentRequest(
    demoSeedData.documentRequests,
    demoSeedData.matters,
    staff,
    { requestId: openRequest.id, staffId },
    { nowIso: () => '2026-03-20T12:00:00.000Z' },
  )
  return next.find((r) => r.id === openRequest.id)!
}

describe('staffReactivateClientDocumentRequest helpers', () => {
  it('isEligible / canReactivate only for cancelled open unfulfilled requests', () => {
    expect(canReactivateClientDocumentRequest(openRequest, demoSeedData.matters)).toBe(false)
    expect(isEligibleClientDocumentRequestForReactivation(null, demoSeedData.matters)).toBe(false)

    const cancelled = cancelledRequest()
    expect(isActiveClientDocumentRequest(cancelled)).toBe(false)
    expect(isEligibleClientDocumentRequestForReactivation(cancelled, demoSeedData.matters)).toBe(
      true,
    )
    expect(canReactivateClientDocumentRequest(cancelled, demoSeedData.matters)).toBe(true)
    expect(canCancelClientDocumentRequest(cancelled, demoSeedData.matters)).toBe(false)
  })

  it('getClientDocumentRequestReactivateContext exposes Matter/Client/Document request/Cancelled', () => {
    const cancelled = cancelledRequest()
    const ok = getClientDocumentRequestReactivateContext({
      request: cancelled,
      matters: demoSeedData.matters,
    })
    expect(ok.canReactivate).toBe(true)
    expect(ok.actionLabel).toBe('Reactivate client document request')
    expect(ok.matterLabel).toBe(matter.file_id)
    expect(ok.clientLabel).toBe(matter.buyer.name.trim())
    expect(ok.requestTitle).toBe(openRequest.title)
    expect(ok.currentStateLabel).toBe('Cancelled')
    expect(ok.detailLabel).toContain('appear again as an active request in the client portal')
    expect(ok.detailLabel).toContain('does not delete the request')
  })

  it('validate + reactivation patch restores active lifecycle and portal/upload eligibility', () => {
    const cancelledList = applyCancelClientDocumentRequest(
      demoSeedData.documentRequests,
      demoSeedData.matters,
      staff,
      { requestId: openRequest.id, staffId },
      { nowIso: () => '2026-03-20T12:00:00.000Z' },
    )
    const cancelled = cancelledList.find((r) => r.id === openRequest.id)!

    const validation = validateClientDocumentRequestReactivateDraft({
      draft: { requestId: ` ${cancelled.id} `, staffId: ` ${staffId} ` },
      documentRequests: cancelledList,
      matters: demoSeedData.matters,
      staff,
    })
    expect(validation.ok).toBe(true)
    if (!validation.ok) return

    expect(createClientDocumentRequestReactivationPatch(validation.draft)).toEqual({
      status: 'active',
      cancelledAt: null,
      cancelledById: null,
      cancelledByName: null,
    })

    const next = applyReactivateClientDocumentRequest(
      cancelledList,
      demoSeedData.matters,
      staff,
      validation.draft,
    )
    expect(next).not.toBe(cancelledList)
    const reactivated = next.find((r) => r.id === openRequest.id)!
    expect(reactivated).toMatchObject({
      id: openRequest.id,
      matter_id: openRequest.matter_id,
      title: openRequest.title,
      status: 'open',
      fulfilled_document_id: null,
      staff_follow_up: openRequest.staff_follow_up,
      lifecycle: {
        status: 'active',
        cancelledAt: null,
        cancelledById: null,
        cancelledByName: null,
      },
    })

    expect(isActiveClientDocumentRequest(reactivated)).toBe(true)
    expect(canReactivateClientDocumentRequest(reactivated, demoSeedData.matters)).toBe(false)
    expect(canCancelClientDocumentRequest(reactivated, demoSeedData.matters)).toBe(true)
    expect(canClientUploadDocumentRequest(reactivated, matter.id)).toBe(true)

    const portal = buildClientDocumentRequestStatusView({
      matterId: matter.id,
      documentRequests: next,
      documents: demoSeedData.documents,
    })
    expect(portal.rows.some((r) => r.id === openRequest.id && r.statusLabel === 'Awaiting upload')).toBe(
      true,
    )
  })
})
