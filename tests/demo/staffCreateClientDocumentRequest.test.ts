import { describe, expect, it } from 'vitest'
import { demoSeedData } from '@/lib/demo/demoData'
import { buildClientDocumentRequestStatusView } from '@/lib/demo/clientDocumentRequestStatus'
import {
  canStaffCreateClientDocumentRequest,
  createStaffClientDocumentRequest,
  getEligibleMattersForStaffCreateClientDocumentRequest,
  getStaffCreateClientDocumentRequestPresentation,
} from '@/lib/demo/staffCreateClientDocumentRequest'
import { normalizeDocumentRequestFollowUp } from '@/lib/demo/staffDocumentRequestFollowUp'

const matter = demoSeedData.matters.find((m) => !m.deletedAt)!
const staff = demoSeedData.staff

describe('staffCreateClientDocumentRequest', () => {
  it('lists only active matters and denies deleted matters', () => {
    const eligible = getEligibleMattersForStaffCreateClientDocumentRequest(demoSeedData.matters)
    expect(eligible.every((m) => !m.deletedAt)).toBe(true)
    expect(
      canStaffCreateClientDocumentRequest({
        matter,
        staffId: staff[0]!.id,
      }),
    ).toBe(true)
    expect(
      canStaffCreateClientDocumentRequest({
        matter: { ...matter, deletedAt: '2026-01-01T00:00:00.000Z' },
        staffId: staff[0]!.id,
      }),
    ).toBe(false)
  })

  it('creates an open client-visible request with no follow-up signal', () => {
    const before = demoSeedData.documentRequests.length
    const next = createStaffClientDocumentRequest(
      demoSeedData.matters,
      demoSeedData.documentRequests,
      staff,
      {
        matterId: matter.id,
        title: 'Survey',
        description: 'Upload signed survey',
        category: 'Title',
        staffId: staff[0]!.id,
      },
      { idFactory: () => 'docreq-new-1', nowIso: () => '2026-03-15T12:00:00.000Z' },
    )
    expect(next).not.toBe(demoSeedData.documentRequests)
    expect(next.length).toBe(before + 1)
    const created = next.find((r) => r.id === 'docreq-new-1')!
    expect(created).toMatchObject({
      matter_id: matter.id,
      title: 'Survey',
      description: 'Upload signed survey',
      category: 'Title',
      status: 'open',
      fulfilled_document_id: null,
      staff_receipt_acknowledged_at: null,
    })
    expect(normalizeDocumentRequestFollowUp(created.staff_follow_up).status).toBe('none')

    const portal = buildClientDocumentRequestStatusView({
      matterId: matter.id,
      documentRequests: next,
      documents: demoSeedData.documents,
    })
    expect(portal.rows.some((r) => r.id === 'docreq-new-1' && r.statusLabel === 'Awaiting upload')).toBe(
      true,
    )
  })

  it('returns the same array when denied', () => {
    const same = createStaffClientDocumentRequest(
      demoSeedData.matters,
      demoSeedData.documentRequests,
      staff,
      {
        matterId: matter.id,
        title: 'Survey',
        category: 'Title',
        staffId: '',
      },
    )
    expect(same).toBe(demoSeedData.documentRequests)
    const presentation = getStaffCreateClientDocumentRequestPresentation({
      matter: null,
      staffId: staff[0]!.id,
    })
    expect(presentation.canCreate).toBe(false)
    expect(presentation.actionLabel).toBe('Create client document request')
  })
})
