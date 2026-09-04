import { describe, expect, it } from 'vitest'
import {
  CORE_CONDO_DILIGENCE_DOC_PACK_IDS,
  ORIGINAL_CONDO_DILIGENCE_REQUIRED_DOC_IDS,
  buildCondoDiligenceOperationalSummary,
  buildDefaultCondoDiligence,
  buildDefaultCondoEstoppelReview,
  condoDiligenceMatterStatusPresentation,
  condoEstoppelDueDateWarning,
  condoEstoppelReviewStatusPresentation,
  condoRequiredDocMatchesLinkageHaystack,
  condoRequiredDocSavedStatusAfterLinkedSync,
  deriveCondoDiligenceMatterStatusFromChecklist,
  deriveCondoRequiredDocumentStatus,
  formatCondoDiligenceSummaryTargetDate,
  isCondoDiligenceUntouched,
  isCondoDiligenceEligible,
  isCondoEstoppelReviewUntouched,
  isCondoOrCoopMatter,
  isFloridaPropertyAddress,
  normalizeCondoEstoppelReview,
  parseDemoCondoEstoppelReview,
  syncRequiredDocumentsFromDerivedLinkage,
} from '@/lib/demo/condoDiligence'
import type { DemoCondoDiligence, DemoDocument, DemoDocumentRequest, DemoMatter } from '@/lib/demo/types'

function matter(partial: Partial<DemoMatter> & Pick<DemoMatter, 'matter_type' | 'property'>): DemoMatter {
  return {
    id: 'm-test',
    file_id: 'FL-TEST',
    status: 'Title Search',
    deletedAt: null,
    portal_token: 'demo-portal-test',
    buyer: { id: 'b', name: 'B', email: '', phone: '' },
    seller: { id: 's', name: 'S', email: '', phone: '' },
    transactionType: 'Purchase',
    purchasePrice: 100000,
    financingType: 'Cash',
    loanNumber: '',
    lenderName: '',
    lenderEmail: '',
    buyerEmail: '',
    buyerPhone: '',
    sellerEmail: '',
    sellerPhone: '',
    buyerAgent: '',
    listingAgent: '',
    assignedAttorney: '',
    assignedParalegal: '',
    contractDate: '',
    inspectionDeadline: '',
    financingDeadline: '',
    titleCommitmentDeadline: '',
    possessionDate: '',
    fileOpenedDate: '',
    hoaFlag: false,
    referralSource: '',
    specialNotes: '',
    key_dates: {
      effective_date: '',
      inspection_deadline: '',
      loan_approval_deadline: '',
      closing_date: '2026-12-01',
    },
    tasks: [],
    timeline: [],
    ...partial,
  }
}

describe('condoDiligence', () => {
  describe('isFloridaPropertyAddress', () => {
    it('detects FL in typical demo addresses', () => {
      expect(isFloridaPropertyAddress('88 Gulf View Ct Unit 5B, Sarasota, FL 34236')).toBe(true)
    })
    it('returns false when no Florida marker', () => {
      expect(isFloridaPropertyAddress('123 Main St, Los Angeles, CA 90001')).toBe(false)
    })
  })

  describe('isCondoOrCoopMatter', () => {
    it('is true for Condo property type', () => {
      expect(
        isCondoOrCoopMatter({
          matter_type: 'Cash Residential Purchase',
          property: { address: 'x', county: 'Orange County', property_type: 'Condo' },
        }),
      ).toBe(true)
    })
    it('is true when matter_type mentions co-op', () => {
      expect(
        isCondoOrCoopMatter({
          matter_type: 'Co-op purchase',
          property: { address: 'x', county: 'x', property_type: 'Townhouse' },
        }),
      ).toBe(true)
    })
    it('is false for single-family without co-op wording', () => {
      expect(
        isCondoOrCoopMatter({
          matter_type: 'Financed Residential Purchase',
          property: { address: 'x', county: 'x', property_type: 'Single-Family Home' },
        }),
      ).toBe(false)
    })
  })

  describe('isCondoDiligenceEligible', () => {
    it('eligible for Florida condo (seed-style matter)', () => {
      expect(
        isCondoDiligenceEligible(
          matter({
            matter_type: 'Cash Residential Purchase',
            property: {
              address: '88 Gulf View Ct Unit 5B, Sarasota, FL 34236',
              county: 'Sarasota County',
              property_type: 'Condo',
            },
          }),
        ),
      ).toBe(true)
    })

    it('not eligible: condo outside Florida', () => {
      expect(
        isCondoDiligenceEligible(
          matter({
            matter_type: 'Purchase',
            property: {
              address: '100 Bay St, Toronto, ON M5J 2R8',
              county: '',
              property_type: 'Condo',
            },
          }),
        ),
      ).toBe(false)
    })

    it('not eligible: Florida single-family', () => {
      expect(
        isCondoDiligenceEligible(
          matter({
            matter_type: 'Financed Residential Purchase',
            property: {
              address: '1427 Orange Blossom Dr, Winter Garden, FL 34787',
              county: 'Orange County',
              property_type: 'Single-Family Home',
            },
          }),
        ),
      ).toBe(false)
    })

    it('not eligible: Florida townhouse without co-op wording', () => {
      expect(
        isCondoDiligenceEligible(
          matter({
            matter_type: 'Purchase',
            property: {
              address: '1 Example Rd, Miami, FL 33101',
              county: 'Miami-Dade County',
              property_type: 'Townhouse',
            },
          }),
        ),
      ).toBe(false)
    })
  })

  describe('deriveCondoRequiredDocumentStatus', () => {
    const base = {
      matterId: 'matter-002',
      condoDocId: 'estoppel',
      storedStatus: 'outstanding' as const,
      documents: [] as Array<{
        matter_id: string
        name: string
        category: 'Compliance' | 'Contract' | 'Title' | 'Closing' | 'Post-Closing'
        document_subtype: string | null
        description: string | null
        deletedAt: string | null
      }>,
      documentRequests: [] as {
        matter_id: string
        title: string
        description: string | null
        category: 'Compliance' | 'Contract' | 'Title' | 'Closing' | 'Post-Closing'
        status: 'open' | 'fulfilled'
      }[],
    }

    it('returns received when a matter document matches the condo checklist id', () => {
      expect(
        deriveCondoRequiredDocumentStatus({
          ...base,
          documents: [
            {
              matter_id: 'matter-002',
              name: 'Condo Estoppel Certificate.pdf',
              category: 'Compliance',
              document_subtype: null,
              description: null,
              deletedAt: null,
            },
          ],
        }),
      ).toBe('received')
    })

    it('returns requested when an open document request matches', () => {
      expect(
        deriveCondoRequiredDocumentStatus({
          ...base,
          documentRequests: [
            {
              matter_id: 'matter-002',
              title: 'Please upload estoppel certificate',
              description: null,
              category: 'Compliance',
              status: 'open',
            },
          ],
        }),
      ).toBe('requested')
    })

    it('prefers received over requested when both match', () => {
      expect(
        deriveCondoRequiredDocumentStatus({
          ...base,
          documents: [
            {
              matter_id: 'matter-002',
              name: 'Estoppel.pdf',
              category: 'Title',
              document_subtype: null,
              description: null,
              deletedAt: null,
            },
          ],
          documentRequests: [
            {
              matter_id: 'matter-002',
              title: 'Estoppel still needed',
              description: null,
              category: 'Compliance',
              status: 'open',
            },
          ],
        }),
      ).toBe('received')
    })

    it('ignores fulfilled requests for linkage', () => {
      expect(
        deriveCondoRequiredDocumentStatus({
          ...base,
          documentRequests: [
            {
              matter_id: 'matter-002',
              title: 'Estoppel certificate',
              description: null,
              category: 'Compliance',
              status: 'fulfilled',
            },
          ],
        }),
      ).toBe('outstanding')
    })

    it('falls back to stored status when no document or open request matches', () => {
      expect(
        deriveCondoRequiredDocumentStatus({
          ...base,
          storedStatus: 'requested',
          documents: [
            {
              matter_id: 'matter-002',
              name: 'Random.pdf',
              category: 'Contract',
              document_subtype: null,
              description: null,
              deletedAt: null,
            },
          ],
        }),
      ).toBe('requested')
    })

    it('ignores documents for other matters', () => {
      expect(
        deriveCondoRequiredDocumentStatus({
          ...base,
          documents: [
            {
              matter_id: 'matter-001',
              name: 'Condo Estoppel Certificate.pdf',
              category: 'Compliance',
              document_subtype: null,
              description: null,
              deletedAt: null,
            },
          ],
        }),
      ).toBe('outstanding')
    })

    it('links core doc-pack rows without changing existing estoppel matching', () => {
      expect(
        deriveCondoRequiredDocumentStatus({
          ...base,
          condoDocId: 'association_financial_statements',
          documents: [
            {
              matter_id: 'matter-002',
              name: 'Association financial statements 2025.pdf',
              category: 'Compliance',
              document_subtype: null,
              description: null,
              deletedAt: null,
            },
          ],
        }),
      ).toBe('received')
      expect(
        deriveCondoRequiredDocumentStatus({
          ...base,
          condoDocId: 'estoppel',
          documents: [
            {
              matter_id: 'matter-002',
              name: 'Association financial statements 2025.pdf',
              category: 'Compliance',
              document_subtype: null,
              description: null,
              deletedAt: null,
            },
          ],
        }),
      ).toBe('outstanding')
    })
  })

  describe('condoRequiredDocSavedStatusAfterLinkedSync', () => {
    it('copies received and requested from linkage; leaves saved when linkage is outstanding', () => {
      expect(condoRequiredDocSavedStatusAfterLinkedSync('received', 'outstanding')).toBe('received')
      expect(condoRequiredDocSavedStatusAfterLinkedSync('requested', 'outstanding')).toBe('requested')
      expect(condoRequiredDocSavedStatusAfterLinkedSync('outstanding', 'received')).toBe('received')
      expect(condoRequiredDocSavedStatusAfterLinkedSync('outstanding', 'requested')).toBe('requested')
    })
  })

  describe('syncRequiredDocumentsFromDerivedLinkage', () => {
    it('updates only rows where linkage implies received or requested', () => {
      const required = buildDefaultCondoDiligence({ nowIso: () => '2026-01-01T00:00:00.000Z' }).requiredDocuments
      const next = syncRequiredDocumentsFromDerivedLinkage(required, {
        matterId: 'matter-002',
        documents: [
          {
            matter_id: 'matter-002',
            name: 'Condo Estoppel Certificate.pdf',
            category: 'Compliance',
            document_subtype: null,
            description: null,
            deletedAt: null,
          },
        ],
        documentRequests: [
          {
            matter_id: 'matter-002',
            title: 'Please upload HOA budget',
            description: null,
            category: 'Compliance',
            status: 'open',
          },
        ],
      })
      const estoppel = next.find((d) => d.id === 'estoppel')
      const budget = next.find((d) => d.id === 'current_budget')
      expect(estoppel?.status).toBe('received')
      expect(budget?.status).toBe('requested')
      expect(next.find((d) => d.id === 'milestone_inspection_summary')?.status).toBe('outstanding')
      expect(next.find((d) => d.id === 'association_financial_statements')?.status).toBe('outstanding')
    })
  })

  describe('condoRequiredDocMatchesLinkageHaystack', () => {
    it('matches milestone and SIRS phrases without cross-contamination on simple strings', () => {
      expect(condoRequiredDocMatchesLinkageHaystack('milestone inspection summary 2024', 'milestone_inspection_summary')).toBe(
        true,
      )
      expect(condoRequiredDocMatchesLinkageHaystack('SIRS / reserve study package', 'sirs_reserve_study')).toBe(true)
      expect(condoRequiredDocMatchesLinkageHaystack('milestone inspection summary 2024', 'sirs_reserve_study')).toBe(false)
    })

    it('matches core doc-pack phrases without stealing SIRS / reserve study', () => {
      expect(
        condoRequiredDocMatchesLinkageHaystack('reserve schedule / funding detail', 'reserve_schedule_funding_detail'),
      ).toBe(true)
      expect(condoRequiredDocMatchesLinkageHaystack('SIRS / reserve study package', 'reserve_schedule_funding_detail')).toBe(
        false,
      )
      expect(
        condoRequiredDocMatchesLinkageHaystack('declaration bylaws and amendments', 'declaration_bylaws_rules_amendments'),
      ).toBe(true)
      expect(
        condoRequiredDocMatchesLinkageHaystack('special assessment notice schedule', 'special_assessment_notice_schedule'),
      ).toBe(true)
      expect(
        condoRequiredDocMatchesLinkageHaystack('pending litigation and DBPR disclosure', 'litigation_claims_arbitration_dbpr'),
      ).toBe(true)
      expect(
        condoRequiredDocMatchesLinkageHaystack(
          'association approval & leasing restrictions package',
          'association_approval_leasing_restrictions',
        ),
      ).toBe(true)
      expect(
        condoRequiredDocMatchesLinkageHaystack('management company and association contacts', 'management_association_contacts'),
      ).toBe(true)
    })
  })

  describe('condoDiligenceMatterStatusPresentation', () => {
    it('returns expected labels for each matter status', () => {
      expect(condoDiligenceMatterStatusPresentation('not_started').label).toBe('Not started')
      expect(condoDiligenceMatterStatusPresentation('in_progress').label).toBe('In progress')
      expect(condoDiligenceMatterStatusPresentation('under_review').label).toBe('Under review')
      expect(condoDiligenceMatterStatusPresentation('cleared').label).toBe('Cleared')
      expect(condoDiligenceMatterStatusPresentation('flagged').label).toBe('Flagged')
    })
  })

  describe('deriveCondoDiligenceMatterStatusFromChecklist', () => {
    const defaultStatuses = () =>
      buildDefaultCondoDiligence({ nowIso: () => '2026-01-01T00:00:00.000Z' }).requiredDocuments.map((d) => ({
        status: d.status,
      }))

    it('returns not_started when all required docs are outstanding', () => {
      expect(
        deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments: defaultStatuses(), findings: [] }),
      ).toBe('not_started')
    })

    it('returns cleared when every required doc is received', () => {
      expect(
        deriveCondoDiligenceMatterStatusFromChecklist({
          requiredDocuments: defaultStatuses().map(() => ({ status: 'received' as const })),
          findings: [],
        }),
      ).toBe('cleared')
    })

    it('returns in_progress when there is a mix of outstanding and requested', () => {
      const rows = defaultStatuses()
      rows[0] = { status: 'requested' }
      expect(deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments: rows, findings: [] })).toBe(
        'in_progress',
      )
    })

    it('returns under_review when nothing is outstanding, something is requested, and not all received', () => {
      const rows: Array<{ status: 'outstanding' | 'requested' | 'received' }> = defaultStatuses().map(() => ({
        status: 'received',
      }))
      rows[0] = { status: 'requested' }
      expect(deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments: rows, findings: [] })).toBe(
        'under_review',
      )
    })

    it('returns flagged when a finding matches the demo flag signal', () => {
      expect(
        deriveCondoDiligenceMatterStatusFromChecklist({
          requiredDocuments: defaultStatuses(),
          findings: [{ text: 'Seller disclosure looks fine' }, { text: 'This item should be flagged for counsel.' }],
        }),
      ).toBe('flagged')
    })

    it('returns not_started for an empty requiredDocuments list', () => {
      expect(deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments: [], findings: [] })).toBe(
        'not_started',
      )
    })

    it('still derives status for older six-row saved checklists', () => {
      const olderSix: Array<{ status: 'outstanding' | 'requested' | 'received' }> =
        ORIGINAL_CONDO_DILIGENCE_REQUIRED_DOC_IDS.map(() => ({ status: 'outstanding' }))
      olderSix[0] = { status: 'requested' }
      expect(deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments: olderSix, findings: [] })).toBe(
        'in_progress',
      )
    })
  })

  describe('isCondoDiligenceUntouched', () => {
    it('is true for the seeded default condo diligence row', () => {
      const d = buildDefaultCondoDiligence({ nowIso: () => '2026-04-27T12:00:00.000Z' })
      expect(isCondoDiligenceUntouched(d)).toBe(true)
    })

    it('is false when notes, findings, or checklist progress exist', () => {
      const base = buildDefaultCondoDiligence({ nowIso: () => '2026-04-27T12:00:00.000Z' })
      expect(isCondoDiligenceUntouched({ ...base, notes: 'Call HOA tomorrow.' })).toBe(false)
      expect(isCondoDiligenceUntouched({ ...base, findings: [{ id: 'f1', text: 'Potential issue' }] })).toBe(false)
      expect(
        isCondoDiligenceUntouched({
          ...base,
          requiredDocuments: base.requiredDocuments.map((d, i) => (i === 0 ? { ...d, status: 'requested' } : d)),
          status: 'in_progress',
        }),
      ).toBe(false)
    })

    it('treats older saved six-row checklists as untouched when still at defaults', () => {
      const older: DemoCondoDiligence = {
        applicable: true,
        status: 'not_started',
        notes: '',
        findings: [],
        updated_at: '2026-01-01T00:00:00.000Z',
        requiredDocuments: ORIGINAL_CONDO_DILIGENCE_REQUIRED_DOC_IDS.map((id) => ({
          id,
          label: id,
          status: 'outstanding' as const,
          detail: null,
        })),
      }
      expect(isCondoDiligenceUntouched(older)).toBe(true)
      expect(
        isCondoDiligenceUntouched({
          ...older,
          requiredDocuments: older.requiredDocuments.map((d, i) => (i === 0 ? { ...d, status: 'received' } : d)),
          status: 'in_progress',
        }),
      ).toBe(false)
    })
  })

  describe('buildDefaultCondoDiligence', () => {
    it('returns seeded checklist with stable ids and empty findings', () => {
      const d = buildDefaultCondoDiligence({ nowIso: () => '2026-04-27T12:00:00.000Z' })
      expect(d.applicable).toBe(true)
      expect(d.status).toBe('not_started')
      expect(d.notes).toBe('')
      expect(d.findings).toEqual([])
      expect(d.updated_at).toBe('2026-04-27T12:00:00.000Z')
      expect(d.requiredDocuments.map((x) => x.id)).toEqual([
        ...ORIGINAL_CONDO_DILIGENCE_REQUIRED_DOC_IDS,
        ...CORE_CONDO_DILIGENCE_DOC_PACK_IDS,
      ])
      expect(d.requiredDocuments.every((x) => x.status === 'outstanding')).toBe(true)
      expect(d.estoppelReview).toEqual(buildDefaultCondoEstoppelReview())
      expect(isCondoEstoppelReviewUntouched(d.estoppelReview)).toBe(true)
    })

    it('keeps the original six rows and adds exactly seven new core doc-pack rows without duplicates', () => {
      const d = buildDefaultCondoDiligence({ nowIso: () => '2026-04-27T12:00:00.000Z' })
      const ids = d.requiredDocuments.map((x) => x.id)
      const labels = d.requiredDocuments.map((x) => x.label)

      for (const id of ORIGINAL_CONDO_DILIGENCE_REQUIRED_DOC_IDS) {
        expect(ids).toContain(id)
      }
      expect(CORE_CONDO_DILIGENCE_DOC_PACK_IDS).toHaveLength(7)
      for (const id of CORE_CONDO_DILIGENCE_DOC_PACK_IDS) {
        expect(ids).toContain(id)
      }
      expect(ids).toHaveLength(ORIGINAL_CONDO_DILIGENCE_REQUIRED_DOC_IDS.length + CORE_CONDO_DILIGENCE_DOC_PACK_IDS.length)
      expect(new Set(ids).size).toBe(ids.length)
      expect(new Set(labels).size).toBe(labels.length)

      expect(d.requiredDocuments.find((x) => x.id === 'association_financial_statements')?.label).toBe(
        'Association financial statements',
      )
      expect(d.requiredDocuments.find((x) => x.id === 'declaration_bylaws_rules_amendments')?.label).toBe(
        'Declaration, bylaws, rules & amendments',
      )
      expect(d.requiredDocuments.find((x) => x.id === 'reserve_schedule_funding_detail')?.label).toBe(
        'Reserve schedule / funding detail',
      )
      expect(d.requiredDocuments.find((x) => x.id === 'special_assessment_notice_schedule')?.label).toBe(
        'Special assessment notice / schedule',
      )
      expect(d.requiredDocuments.find((x) => x.id === 'litigation_claims_arbitration_dbpr')?.label).toBe(
        'Litigation, claims, arbitration or DBPR disclosure',
      )
      expect(d.requiredDocuments.find((x) => x.id === 'association_approval_leasing_restrictions')?.label).toBe(
        'Association approval & leasing restrictions',
      )
      expect(d.requiredDocuments.find((x) => x.id === 'management_association_contacts')?.label).toBe(
        'Management & association contacts',
      )
    })
  })

  describe('estoppelReview', () => {
    it('parses missing or invalid estoppelReview as undefined for older persisted rows', () => {
      expect(parseDemoCondoEstoppelReview(undefined)).toBeUndefined()
      expect(parseDemoCondoEstoppelReview(null)).toBeUndefined()
      expect(parseDemoCondoEstoppelReview('nope')).toBeUndefined()
      expect(parseDemoCondoEstoppelReview([])).toBeUndefined()
    })

    it('fills defaults for partial valid estoppelReview objects', () => {
      expect(
        parseDemoCondoEstoppelReview({
          requestDate: '2026-05-01',
          amountDue: 450.5,
          reviewStatus: 'requested',
        }),
      ).toEqual({
        ...buildDefaultCondoEstoppelReview(),
        requestDate: '2026-05-01',
        amountDue: 450.5,
        reviewStatus: 'requested',
      })
    })

    it('normalizeCondoEstoppelReview merges onto defaults', () => {
      expect(normalizeCondoEstoppelReview(undefined)).toEqual(buildDefaultCondoEstoppelReview())
      expect(normalizeCondoEstoppelReview({ notes: 'Wire instructions pending' })).toEqual({
        ...buildDefaultCondoEstoppelReview(),
        notes: 'Wire instructions pending',
      })
    })

    it('marks diligence as touched when estoppel review has progress', () => {
      const base = buildDefaultCondoDiligence({ nowIso: () => '2026-04-27T12:00:00.000Z' })
      expect(isCondoDiligenceUntouched(base)).toBe(true)
      expect(
        isCondoDiligenceUntouched({
          ...base,
          estoppelReview: {
            ...buildDefaultCondoEstoppelReview(),
            reviewStatus: 'requested',
            requestDate: '2026-05-01',
          },
        }),
      ).toBe(false)
    })

    it('keeps older six-row saved checklists without estoppelReview loadable and untouched', () => {
      const older: DemoCondoDiligence = {
        applicable: true,
        status: 'not_started',
        notes: '',
        findings: [],
        updated_at: '2026-01-01T00:00:00.000Z',
        requiredDocuments: ORIGINAL_CONDO_DILIGENCE_REQUIRED_DOC_IDS.map((id) => ({
          id,
          label: id,
          status: 'outstanding' as const,
          detail: null,
        })),
      }
      expect(older.estoppelReview).toBeUndefined()
      expect(isCondoDiligenceUntouched(older)).toBe(true)
      expect(deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments: older.requiredDocuments, findings: [] })).toBe(
        'not_started',
      )
    })

    it('derives due-date warnings without changing checklist matter-status rules', () => {
      const now = new Date('2026-05-10T12:00:00')
      expect(condoEstoppelDueDateWarning('2026-05-01', { now })?.kind).toBe('overdue')
      expect(condoEstoppelDueDateWarning('2026-05-11', { now })?.kind).toBe('due_soon')
      expect(condoEstoppelDueDateWarning('2026-05-10', { now })?.label).toBe('Due today')
      expect(condoEstoppelDueDateWarning('2026-06-01', { now })).toBeNull()
      expect(condoEstoppelDueDateWarning('', { now })).toBeNull()

      const checklist = buildDefaultCondoDiligence({ nowIso: () => '2026-01-01T00:00:00.000Z' }).requiredDocuments
      expect(
        deriveCondoDiligenceMatterStatusFromChecklist({
          requiredDocuments: checklist,
          findings: [],
        }),
      ).toBe('not_started')
      expect(condoEstoppelReviewStatusPresentation('issue_found').label).toBe('Issue found')
    })

    it('does not change estoppel document linkage matching', () => {
      expect(condoRequiredDocMatchesLinkageHaystack('Condo Estoppel Certificate.pdf', 'estoppel')).toBe(true)
      expect(condoRequiredDocMatchesLinkageHaystack('Association financial statements', 'estoppel')).toBe(false)
    })
  })

  describe('buildCondoDiligenceOperationalSummary', () => {
    const matterId = 'm-summary'
    const now = new Date('2026-09-15T12:00:00')

    function docs(
      required: DemoCondoDiligence['requiredDocuments'],
      extras?: Partial<Omit<DemoCondoDiligence, 'requiredDocuments'>>,
    ): DemoCondoDiligence {
      const findings = extras?.findings ?? []
      return {
        applicable: true,
        status: deriveCondoDiligenceMatterStatusFromChecklist({
          requiredDocuments: required,
          findings,
        }),
        requiredDocuments: required,
        findings,
        notes: extras?.notes ?? '',
        updated_at: extras?.updated_at ?? '2026-01-01T00:00:00.000Z',
        ...(extras?.estoppelReview !== undefined ? { estoppelReview: extras.estoppelReview } : {}),
        ...(extras?.applicable !== undefined ? { applicable: extras.applicable } : {}),
        ...(extras?.status !== undefined ? { status: extras.status } : {}),
      }
    }

    it('counts received, requested, outstanding, and total from saved + linkage state', () => {
      const condo = docs([
        { id: 'estoppel', label: 'Estoppel', status: 'outstanding', detail: null },
        { id: 'current_budget', label: 'Current budget', status: 'requested', detail: null },
        { id: 'insurance_summary', label: 'Insurance summary', status: 'received', detail: null },
        { id: 'recent_board_minutes', label: 'Recent board minutes', status: 'outstanding', detail: null },
      ])
      const documents: Pick<DemoDocument, 'matter_id' | 'name' | 'category' | 'document_subtype' | 'description' | 'deletedAt'>[] = [
        {
          matter_id: matterId,
          name: 'Condo Estoppel Certificate.pdf',
          category: 'Compliance',
          document_subtype: null,
          description: null,
          deletedAt: null,
        },
      ]
      const documentRequests: Pick<DemoDocumentRequest, 'matter_id' | 'title' | 'description' | 'category' | 'status'>[] = [
        {
          matter_id: matterId,
          title: 'Board minutes request',
          description: 'Recent board minutes',
          category: 'Compliance',
          status: 'open',
        },
      ]
      const summary = buildCondoDiligenceOperationalSummary({
        matterId,
        condo,
        documents,
        documentRequests,
        now,
      })
      expect(summary.documentCounts).toEqual({ received: 2, requested: 2, outstanding: 0, total: 4 })
      expect(summary.documentsLine).toBe('Documents: 2 received · 2 requested · 0 outstanding · 4 total')
    })

    it('behaves safely with missing condo diligence or empty checklist', () => {
      const missing = buildCondoDiligenceOperationalSummary({ matterId, condo: null, now })
      expect(missing.documentCounts).toEqual({ received: 0, requested: 0, outstanding: 0, total: 0 })
      expect(missing.findingsLine).toBe('No findings recorded')
      expect(missing.estoppelStatusLabel).toBe('Not requested')
      expect(missing.nextAction).toBe('Request the Estoppel certificate.')

      const empty = buildCondoDiligenceOperationalSummary({
        matterId,
        condo: docs([]),
        now,
      })
      expect(empty.documentCounts.total).toBe(0)
      expect(empty.nextActionKind).toBe('request_estoppel')
    })

    it('prefers explicit estoppelReview.reviewStatus over checklist status', () => {
      const condo = docs(
        [{ id: 'estoppel', label: 'Estoppel', status: 'outstanding', detail: null }],
        {
          estoppelReview: {
            ...buildDefaultCondoEstoppelReview(),
            reviewStatus: 'reviewed',
          },
        },
      )
      const summary = buildCondoDiligenceOperationalSummary({ matterId, condo, now })
      expect(summary.estoppelKind).toBe('reviewed')
      expect(summary.estoppelStatusLabel).toBe('Reviewed')
    })

    it('falls back to Estoppel checklist status when no structured review exists', () => {
      const condo = docs([{ id: 'estoppel', label: 'Estoppel', status: 'received', detail: null }])
      expect(condo.estoppelReview).toBeUndefined()
      const summary = buildCondoDiligenceOperationalSummary({ matterId, condo, now })
      expect(summary.estoppelKind).toBe('received_review_pending')
      expect(summary.estoppelStatusLabel).toBe('Received — review pending')
    })

    it('renders requested Estoppel with a derived target date safely', () => {
      expect(formatCondoDiligenceSummaryTargetDate('2026-09-12')).toBe('Sep 12')
      const condo = docs(
        [{ id: 'estoppel', label: 'Estoppel', status: 'outstanding', detail: null }],
        {
          estoppelReview: {
            ...buildDefaultCondoEstoppelReview(),
            reviewStatus: 'requested',
            dueDate: '2026-09-12',
          },
        },
      )
      const summary = buildCondoDiligenceOperationalSummary({ matterId, condo, now })
      expect(summary.estoppelStatusLabel).toBe('Requested — target response date Sep 12')
      expect(summary.estoppelAttention).toBe('Target date passed — review needed')
    })

    it('follows next-action priority order', () => {
      const baseDocs = buildDefaultCondoDiligence({ nowIso: () => '2026-01-01T00:00:00.000Z' }).requiredDocuments.map(
        (d) => ({ ...d, status: 'received' as const }),
      )

      expect(
        buildCondoDiligenceOperationalSummary({
          matterId,
          condo: docs(baseDocs.map((d) => (d.id === 'estoppel' ? { ...d, status: 'outstanding' } : d)), {
            estoppelReview: { ...buildDefaultCondoEstoppelReview(), reviewStatus: 'requested' },
          }),
          now,
        }).nextAction,
      ).toBe('Review or chase the Estoppel request.')

      expect(
        buildCondoDiligenceOperationalSummary({
          matterId,
          condo: docs(baseDocs.map((d) => (d.id === 'estoppel' ? { ...d, status: 'outstanding' } : d)), {
            estoppelReview: { ...buildDefaultCondoEstoppelReview(), reviewStatus: 'not_started' },
          }),
          now,
        }).nextAction,
      ).toBe('Request the Estoppel certificate.')

      expect(
        buildCondoDiligenceOperationalSummary({
          matterId,
          condo: docs(
            baseDocs.map((d) =>
              d.id === 'estoppel'
                ? { ...d, status: 'received' }
                : d.id === 'current_budget'
                  ? { ...d, status: 'outstanding' }
                  : d,
            ),
            { estoppelReview: { ...buildDefaultCondoEstoppelReview(), reviewStatus: 'reviewed' } },
          ),
          now,
        }).nextAction,
      ).toBe('Request outstanding association documents.')

      expect(
        buildCondoDiligenceOperationalSummary({
          matterId,
          condo: docs(
            baseDocs.map((d) =>
              d.id === 'estoppel'
                ? { ...d, status: 'received' }
                : d.id === 'current_budget'
                  ? { ...d, status: 'requested' }
                  : d,
            ),
            { estoppelReview: { ...buildDefaultCondoEstoppelReview(), reviewStatus: 'reviewed' } },
          ),
          now,
        }).nextAction,
      ).toBe('Follow up on requested association documents.')

      expect(
        buildCondoDiligenceOperationalSummary({
          matterId,
          condo: docs(baseDocs, {
            estoppelReview: { ...buildDefaultCondoEstoppelReview(), reviewStatus: 'reviewed' },
            findings: [{ id: 'f1', text: 'Special assessment disclosed' }],
          }),
          now,
        }).nextAction,
      ).toBe('Review and resolve open diligence findings.')

      expect(
        buildCondoDiligenceOperationalSummary({
          matterId,
          condo: docs(baseDocs, {
            estoppelReview: { ...buildDefaultCondoEstoppelReview(), reviewStatus: 'reviewed' },
          }),
          now,
        }).nextAction,
      ).toBe('Review the document pack and record lawyer findings.')
    })

    it('does not mutate input condo state', () => {
      const condo = docs(
        [{ id: 'estoppel', label: 'Estoppel', status: 'requested', detail: null }],
        {
          findings: [{ id: 'f1', text: 'Note' }],
          estoppelReview: {
            ...buildDefaultCondoEstoppelReview(),
            reviewStatus: 'requested',
            dueDate: '2026-09-01',
          },
        },
      )
      const before = structuredClone(condo)
      buildCondoDiligenceOperationalSummary({ matterId, condo, now })
      expect(condo).toEqual(before)
    })

    it('leaves existing Condo Diligence matter-status derivation unchanged', () => {
      const requiredDocuments = [
        { id: 'estoppel', label: 'Estoppel', status: 'received' as const, detail: null },
        { id: 'current_budget', label: 'Current budget', status: 'requested' as const, detail: null },
      ]
      expect(deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments, findings: [] })).toBe('under_review')
      buildCondoDiligenceOperationalSummary({
        matterId,
        condo: docs(requiredDocuments),
        now,
      })
      expect(deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments, findings: [] })).toBe('under_review')
      expect(deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments, findings: [{ text: 'flagged' }] })).toBe(
        'flagged',
      )
    })
  })
})
