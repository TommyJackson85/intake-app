import { describe, expect, it } from 'vitest'
import { demoSeedData } from '@/lib/demo/demoData'
import { buildClientDocumentRequestStatusView } from '@/lib/demo/clientDocumentRequestStatus'
import {
  canCreateClientDocumentRequestForMatter,
  createClientDocumentRequestPayload,
  createStaffClientDocumentRequest,
  getClientDocumentRequestCreationContext,
  getEligibleMattersForStaffCreateClientDocumentRequest,
  isClientSafeDocumentRequestDraft,
  validateClientDocumentRequestDraft,
} from '@/lib/demo/staffCreateClientDocumentRequest'
import { normalizeDocumentRequestFollowUp } from '@/lib/demo/staffDocumentRequestFollowUp'

const matter = demoSeedData.matters.find((m) => !m.deletedAt)!
const staff = demoSeedData.staff
const staffId = staff[0]!.id

describe('staffCreateClientDocumentRequest helpers', () => {
  it('canCreateClientDocumentRequestForMatter denies deleted/missing matters', () => {
    expect(canCreateClientDocumentRequestForMatter(matter)).toBe(true)
    expect(canCreateClientDocumentRequestForMatter(null)).toBe(false)
    expect(
      canCreateClientDocumentRequestForMatter({
        ...matter,
        deletedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toBe(false)
    const eligible = getEligibleMattersForStaffCreateClientDocumentRequest(demoSeedData.matters)
    expect(eligible.every((m) => !m.deletedAt)).toBe(true)
  })

  it('getClientDocumentRequestCreationContext exposes create labels and eligibility', () => {
    const ok = getClientDocumentRequestCreationContext({
      matter,
      matters: demoSeedData.matters,
    })
    expect(ok.canCreate).toBe(true)
    expect(ok.actionLabel).toBe('Create client document request')
    expect(ok.matterId).toBe(matter.id)
    expect(ok.eligibleMatterIds).toContain(matter.id)

    const denied = getClientDocumentRequestCreationContext({ matter: null })
    expect(denied.canCreate).toBe(false)
    expect(denied.matterId).toBeNull()
  })

  it('isClientSafeDocumentRequestDraft accepts only ordinary client-safe fields', () => {
    expect(
      isClientSafeDocumentRequestDraft({
        matterId: matter.id,
        title: 'Survey',
        category: 'Title',
        staffId,
      }),
    ).toBe(true)
    expect(
      isClientSafeDocumentRequestDraft({
        matterId: matter.id,
        title: 'Survey',
        category: 'Title',
        staffId,
        // @ts-expect-error internal-only key must fail the client-safe check
        condoFindingId: 'x',
      }),
    ).toBe(false)
    expect(
      isClientSafeDocumentRequestDraft({
        matterId: '',
        title: 'Survey',
        category: 'Title',
        staffId,
      }),
    ).toBe(false)
  })

  it('validateClientDocumentRequestDraft normalizes and createClientDocumentRequestPayload builds open request', () => {
    const validation = validateClientDocumentRequestDraft({
      draft: {
        matterId: ` ${matter.id} `,
        title: '  Survey  ',
        description: '  Upload signed survey  ',
        category: 'Title',
        staffId: ` ${staffId} `,
      },
      matters: demoSeedData.matters,
      staff,
    })
    expect(validation.ok).toBe(true)
    if (!validation.ok) return

    expect(validation.draft).toEqual({
      matterId: matter.id,
      title: 'Survey',
      description: 'Upload signed survey',
      category: 'Title',
      staffId,
    })
    expect(createClientDocumentRequestPayload(validation.draft)).toEqual({
      matter_id: matter.id,
      title: 'Survey',
      description: 'Upload signed survey',
      category: 'Title',
      requested_by_staff_id: staffId,
      status: 'open',
    })

    expect(
      validateClientDocumentRequestDraft({
        draft: {
          matterId: matter.id,
          title: '',
          category: 'Title',
          staffId,
        },
        matters: demoSeedData.matters,
        staff,
      }).ok,
    ).toBe(false)
  })

  it('createStaffClientDocumentRequest uses helpers and stays portal-visible as Awaiting upload', () => {
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
        staffId,
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
  })
})
