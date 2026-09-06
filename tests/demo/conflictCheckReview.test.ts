import { describe, expect, it } from 'vitest'
import {
  buildConflictCheckReviewMemoContent,
  canCompleteConflictCheckReview,
  createConflictCheckGatePatch,
  createConflictCheckReviewMemoDocumentInput,
  createConflictCheckReviewPatch,
  findIntakeLeadForMatter,
  isConflictCheckReviewMemoDocument,
  listConflictCheckReviewMemoDocuments,
  normalizeConflictCheckReview,
  runConflictCheckScreening,
} from '@/lib/demo/conflictCheckReview'
import type { DemoClient, DemoDocument, DemoIntakeLead, DemoMatter } from '@/lib/demo/types'

function makeLead(overrides: Partial<DemoIntakeLead> = {}): DemoIntakeLead {
  return {
    id: 'lead-1',
    token: 'tok-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    fileReference: 'FL-2026-100',
    emailRecipientName: 'Noah Carter',
    emailRecipientEmail: 'noah@example.com',
    emailSubject: 'Intake',
    emailBody: 'Please complete',
    intake: {
      clientName: 'Noah Carter',
      clientEmail: 'noah@example.com',
      clientPhone: '555-0100',
      transactionRole: 'buyer',
      transactionRoleOther: '',
      matterType: 'Purchase',
      propertyAddress: '22 Maple Ave, Winter Park, FL 32789',
      county: 'Orange',
      targetClosingDate: '2026-03-01',
      notes: '',
    },
    status: 'submitted',
    clientSubmittedAt: '2026-01-02T00:00:00.000Z',
    submittedIntake: null,
    conflict_check_status: 'pending',
    conflict_check_completed_at: null,
    conflict_check_note: null,
    ...overrides,
  } as DemoIntakeLead
}

function makeMatter(overrides: Partial<DemoMatter> = {}): DemoMatter {
  return {
    id: 'matter-1',
    file_id: 'FL-2026-001',
    deletedAt: null,
    property: {
      address: '22 Maple Ave, Winter Park, FL 32789',
      county: 'Orange',
      property_type: 'Single-Family Home',
    },
    buyer: { id: 'b1', name: 'Other Buyer', email: '', phone: '' },
    seller: { id: 's1', name: 'Other Seller', email: '', phone: '' },
    specialNotes: '',
    ...overrides,
  } as DemoMatter
}

function makeClient(overrides: Partial<DemoClient> = {}): DemoClient {
  return {
    id: 'client-1',
    full_name: 'Noah Carter',
    email: 'noah@example.com',
    phone: '555-0100',
    deletedAt: null,
    ...overrides,
  } as DemoClient
}

describe('conflictCheckReview', () => {
  it('flags person and property overlaps during screening', () => {
    const lead = makeLead()
    const matter = makeMatter({
      buyer: { id: 'b1', name: 'Noah Carter', email: '', phone: '' },
    })
    const result = runConflictCheckScreening({
      lead,
      matters: [matter],
      clients: [makeClient()],
      intakeLeads: [],
      nowIso: '2026-02-01T12:00:00.000Z',
    })
    expect(result.status).toBe('flagged')
    expect(result.hits.some((h) => h.kind === 'person')).toBe(true)
    expect(result.hits.some((h) => h.kind === 'property')).toBe(true)
  })

  it('returns clear when no overlaps exist', () => {
    const base = makeLead()
    const lead = makeLead({
      intake: {
        ...base.intake,
        clientName: 'Unique Person',
        propertyAddress: '999 Nowhere Rd, Orlando, FL 32801',
      },
    })
    const result = runConflictCheckScreening({
      lead,
      matters: [makeMatter()],
      clients: [makeClient({ full_name: 'Someone Else' })],
      intakeLeads: [],
    })
    expect(result.status).toBe('clear')
    expect(result.hits).toEqual([])
  })

  it('creates gate patch and advances review from not_started', () => {
    const screening = runConflictCheckScreening({
      lead: makeLead(),
      matters: [],
      clients: [],
      nowIso: '2026-02-01T12:00:00.000Z',
    })
    const patch = createConflictCheckGatePatch({
      status: 'clear',
      screening,
      existingReview: null,
      nowIso: '2026-02-01T12:00:00.000Z',
    })
    expect(patch.conflict_check_status).toBe('clear')
    expect(patch.conflictCheckReview?.status).toBe('in_progress')
    expect(patch.conflictCheckReview?.screeningSummary).toBeTruthy()
  })

  it('requires internal note to complete review', () => {
    expect(
      canCompleteConflictCheckReview({
        status: 'completed',
        informationGaps: '',
        internalNote: '',
      }).ok
    ).toBe(false)
    expect(
      canCompleteConflictCheckReview({
        status: 'completed',
        informationGaps: '',
        internalNote: 'Reviewed — no conflict indicators require escalation.',
      }).ok
    ).toBe(true)
  })

  it('builds and detects memo documents', () => {
    const lead = makeLead({
      linkedMatterFileId: 'FL-2026-001',
      conflict_check_status: 'clear',
      conflictCheckReview: normalizeConflictCheckReview({
        status: 'completed',
        informationGaps: '',
        internalNote: 'No conflict.',
        reviewerId: 'staff-1',
        reviewerName: 'Katherine Ruiz, Esq.',
        reviewedAt: '2026-02-01T12:00:00.000Z',
        linkedMemoDocumentId: null,
        screeningSummary: 'Clear',
      }),
    })
    const matter = makeMatter()
    const content = buildConflictCheckReviewMemoContent({
      lead,
      matter,
      review: lead.conflictCheckReview,
    })
    expect(content.toUpperCase()).toContain('CONFLICT CHECK REVIEW MEMO')
    expect(content.toLowerCase()).toContain('not a legal opinion')

    const input = createConflictCheckReviewMemoDocumentInput({
      matter,
      lead,
      uploadedByStaffId: 'staff-1',
      review: lead.conflictCheckReview,
      content,
      generatedAt: '2026-02-01T12:00:00.000Z',
      id: 'doc-conflict-1',
    })
    expect(input?.generatedInternalSummary?.generatedType).toBe('conflict_check_review_memo')
    expect(input?.category).toBe('Compliance')

    const doc = {
      id: 'doc-conflict-1',
      matter_id: matter.id,
      name: input!.name,
      category: 'Compliance',
      document_subtype: input!.document_subtype ?? null,
      uploaded_at: '2026-02-01T12:00:00.000Z',
      uploaded_by_staff_id: 'staff-1',
      status: 'draft',
      deletedAt: null,
      generatedInternalSummary: input!.generatedInternalSummary,
    } as DemoDocument

    expect(isConflictCheckReviewMemoDocument(doc)).toBe(true)
    expect(listConflictCheckReviewMemoDocuments([doc], matter.id)).toHaveLength(1)
    expect(findIntakeLeadForMatter([lead], matter)?.id).toBe('lead-1')

    const reviewPatch = createConflictCheckReviewPatch({
      draft: {
        status: 'completed',
        informationGaps: '',
        internalNote: 'No conflict.',
      },
      actor: { staffId: 'staff-1', staffName: 'Katherine Ruiz, Esq.' },
      existing: lead.conflictCheckReview,
      linkedMemoDocumentId: 'doc-conflict-1',
      nowIso: '2026-02-01T13:00:00.000Z',
    })
    expect(reviewPatch.linkedMemoDocumentId).toBe('doc-conflict-1')
    expect(reviewPatch.reviewerName).toBe('Katherine Ruiz, Esq.')
  })
})
