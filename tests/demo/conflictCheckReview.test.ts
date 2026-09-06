import { describe, expect, it } from 'vitest'
import {
  buildConflictCheckReviewMemoContent,
  canCompleteConflictCheckReview,
  createConflictCheckGatePatch,
  createConflictCheckReviewMemoDocumentInput,
  createConflictCheckReviewPatch,
  findIntakeLeadForMatter,
  formatConflictCheckMemoHistoryCount,
  getConflictCheckMemoGeneratedAt,
  getConflictCheckMemoHistoryItem,
  getIntakeConflictCheckMemoHistory,
  getMatterConflictCheckMemoHistory,
  isConflictCheckReviewMemoDocument,
  isGeneratedInternalConflictCheckMemo,
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
    expect(content).toContain('recorded conflict screening')
    expect(content).toContain('RECORDED SCREENING SUMMARY')
    expect(content).toContain('Clear')
    expect(content).toContain('No conflict.')

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
    expect(input?.generatedInternalSummary?.visibility).toBe('internal')
    expect(input?.generatedInternalSummary?.content).toBe(content)
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

  it('prefers recorded screening summary over live screening when building memo', () => {
    const lead = makeLead({
      linkedMatterFileId: 'FL-2026-001',
      conflict_check_status: 'flagged',
      conflict_check_note: 'Gate note from screening run',
      conflictCheckReview: normalizeConflictCheckReview({
        status: 'needs_more_info',
        informationGaps: 'Need opposing counsel identity',
        internalNote: 'Possible name overlap — escalate before engagement.',
        reviewerId: 'staff-1',
        reviewerName: 'Katherine Ruiz, Esq.',
        reviewedAt: '2026-02-01T12:00:00.000Z',
        linkedMemoDocumentId: null,
        screeningSummary: 'Recorded: person match on prior matter FL-2025-044',
      }),
    })
    const liveScreening = runConflictCheckScreening({
      lead,
      matters: [
        makeMatter({
          id: 'matter-other',
          file_id: 'FL-2025-044',
          buyer: { id: 'b2', name: 'Noah Carter', email: '', phone: '' },
        }),
      ],
      clients: [],
      nowIso: '2026-02-02T09:00:00.000Z',
    })
    const content = buildConflictCheckReviewMemoContent({
      lead,
      matter: makeMatter(),
      review: lead.conflictCheckReview,
      screening: liveScreening,
      generatedAt: '2026-02-02T09:00:00.000Z',
    })
    expect(content).toContain('Recorded: person match on prior matter FL-2025-044')
    expect(content).toContain('Possible name overlap — escalate before engagement.')
    expect(content).toContain('Need opposing counsel identity')
    expect(content).toContain('Needs more info')
    expect(content).toContain('SCREENING HITS')
  })

  it('lists saved memo snapshots newest first for history', () => {
    const matter = makeMatter()
    const lead = makeLead({
      linkedMatterFileId: matter.file_id,
      conflict_check_status: 'clear',
      conflictCheckReview: normalizeConflictCheckReview({
        status: 'completed',
        informationGaps: '',
        internalNote: 'Cleared for engagement.',
        reviewerId: 'staff-1',
        reviewerName: 'Katherine Ruiz, Esq.',
        reviewedAt: '2026-02-01T12:00:00.000Z',
        linkedMemoDocumentId: null,
        screeningSummary: 'No overlaps recorded.',
      }),
    })
    const older = createConflictCheckReviewMemoDocumentInput({
      matter,
      lead,
      uploadedByStaffId: 'staff-1',
      review: lead.conflictCheckReview,
      generatedAt: '2026-02-01T10:00:00.000Z',
      id: 'doc-conflict-old',
    })
    const newer = createConflictCheckReviewMemoDocumentInput({
      matter,
      lead,
      uploadedByStaffId: 'staff-1',
      review: lead.conflictCheckReview,
      generatedAt: '2026-02-01T15:00:00.000Z',
      id: 'doc-conflict-new',
    })
    expect(older).toBeTruthy()
    expect(newer).toBeTruthy()

    const docs = [
      {
        id: 'doc-conflict-old',
        matter_id: matter.id,
        name: older!.name,
        category: 'Compliance',
        document_subtype: older!.document_subtype ?? null,
        uploaded_at: '2026-02-01T10:00:00.000Z',
        uploaded_by_staff_id: 'staff-1',
        status: 'draft',
        deletedAt: null,
        generatedInternalSummary: older!.generatedInternalSummary,
      },
      {
        id: 'doc-conflict-new',
        matter_id: matter.id,
        name: newer!.name,
        category: 'Compliance',
        document_subtype: newer!.document_subtype ?? null,
        uploaded_at: '2026-02-01T15:00:00.000Z',
        uploaded_by_staff_id: 'staff-1',
        status: 'draft',
        deletedAt: null,
        generatedInternalSummary: newer!.generatedInternalSummary,
      },
      {
        id: 'doc-other',
        matter_id: matter.id,
        name: 'Other Doc',
        category: 'Correspondence',
        document_subtype: null,
        uploaded_at: '2026-02-01T16:00:00.000Z',
        uploaded_by_staff_id: 'staff-1',
        status: 'draft',
        deletedAt: null,
      },
    ] as DemoDocument[]

    const history = listConflictCheckReviewMemoDocuments(docs, matter.id)
    expect(history.map((d) => d.id)).toEqual(['doc-conflict-new', 'doc-conflict-old'])
    expect(history[0]?.generatedInternalSummary?.content).toContain('No overlaps recorded.')
    expect(history[0]?.generatedInternalSummary?.content).toContain('Cleared for engagement.')
  })

  it('exposes Internal only history helpers for matter and intake scopes', () => {
    const matter = makeMatter()
    const lead = makeLead({
      linkedMatterFileId: matter.file_id,
      conflict_check_status: 'clear',
      conflictCheckReview: normalizeConflictCheckReview({
        status: 'completed',
        informationGaps: '',
        internalNote: 'Cleared for engagement.',
        reviewerId: 'staff-1',
        reviewerName: 'Katherine Ruiz, Esq.',
        reviewedAt: '2026-02-01T12:00:00.000Z',
        linkedMemoDocumentId: null,
        screeningSummary: 'No overlaps recorded.',
      }),
    })
    const input = createConflictCheckReviewMemoDocumentInput({
      matter,
      lead,
      uploadedByStaffId: 'staff-1',
      review: lead.conflictCheckReview,
      generatedAt: '2026-02-01T15:00:00.000Z',
      id: 'doc-conflict-helpers',
    })
    expect(input?.generatedInternalSummary?.visibility).toBe('internal')
    expect(input?.generatedInternalSummary?.sourceIntakeLeadId).toBe(lead.id)

    const doc = {
      id: 'doc-conflict-helpers',
      matter_id: matter.id,
      name: input!.name,
      category: 'Compliance',
      document_subtype: input!.document_subtype ?? null,
      uploaded_at: '2026-02-01T15:00:00.000Z',
      uploaded_by_staff_id: 'staff-1',
      status: 'draft',
      deletedAt: null,
      generatedInternalSummary: input!.generatedInternalSummary,
    } as DemoDocument

    expect(isGeneratedInternalConflictCheckMemo(doc)).toBe(true)
    expect(getConflictCheckMemoGeneratedAt(doc)).toBe('2026-02-01T15:00:00.000Z')
    expect(getConflictCheckMemoHistoryItem(doc)?.visibility).toBe('internal')
    expect(getConflictCheckMemoHistoryItem(doc)?.intakeLeadId).toBe(lead.id)
    expect(getMatterConflictCheckMemoHistory([doc], matter.id).map((d) => d.id)).toEqual([
      'doc-conflict-helpers',
    ])
    expect(getIntakeConflictCheckMemoHistory([doc], lead.id).map((d) => d.id)).toEqual([
      'doc-conflict-helpers',
    ])
    expect(formatConflictCheckMemoHistoryCount(0)).toBe('No saved internal memos')
    expect(formatConflictCheckMemoHistoryCount(1)).toBe('1 saved internal memo')
    expect(formatConflictCheckMemoHistoryCount(2)).toBe('2 saved internal memos')
  })

})
