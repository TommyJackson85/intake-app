import { describe, expect, it } from 'vitest'
import {
  buildDefaultCondoDiligence,
  condoDiligenceMatterStatusPresentation,
  condoRequiredDocMatchesLinkageHaystack,
  condoRequiredDocSavedStatusAfterLinkedSync,
  deriveCondoDiligenceMatterStatusFromChecklist,
  deriveCondoRequiredDocumentStatus,
  isCondoDiligenceUntouched,
  isCondoDiligenceEligible,
  isCondoOrCoopMatter,
  isFloridaPropertyAddress,
  syncRequiredDocumentsFromDerivedLinkage,
} from '@/lib/demo/condoDiligence'
import type { DemoMatter } from '@/lib/demo/types'

function matter(partial: Partial<DemoMatter> & Pick<DemoMatter, 'matter_type' | 'property'>): DemoMatter {
  return {
    id: 'm-test',
    file_id: 'FL-TEST',
    status: 'Title Search',
    deletedAt: null,
    matter_type: partial.matter_type,
    portal_token: 'demo-portal-test',
    property: partial.property,
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
    const six = () =>
      buildDefaultCondoDiligence({ nowIso: () => '2026-01-01T00:00:00.000Z' }).requiredDocuments.map((d) => ({
        status: d.status,
      }))

    it('returns not_started when all required docs are outstanding', () => {
      expect(deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments: six(), findings: [] })).toBe(
        'not_started',
      )
    })

    it('returns cleared when every required doc is received', () => {
      expect(
        deriveCondoDiligenceMatterStatusFromChecklist({
          requiredDocuments: six().map(() => ({ status: 'received' as const })),
          findings: [],
        }),
      ).toBe('cleared')
    })

    it('returns in_progress when there is a mix of outstanding and requested', () => {
      const rows = six()
      rows[0] = { status: 'requested' }
      expect(deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments: rows, findings: [] })).toBe(
        'in_progress',
      )
    })

    it('returns under_review when nothing is outstanding, something is requested, and not all received', () => {
      const rows = six().map(() => ({ status: 'received' as const }))
      rows[0] = { status: 'requested' }
      expect(deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments: rows, findings: [] })).toBe(
        'under_review',
      )
    })

    it('returns flagged when a finding matches the demo flag signal', () => {
      expect(
        deriveCondoDiligenceMatterStatusFromChecklist({
          requiredDocuments: six(),
          findings: [{ text: 'Seller disclosure looks fine' }, { text: 'This item should be flagged for counsel.' }],
        }),
      ).toBe('flagged')
    })

    it('returns not_started for an empty requiredDocuments list', () => {
      expect(deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments: [], findings: [] })).toBe(
        'not_started',
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
        'estoppel',
        'milestone_inspection_summary',
        'sirs_reserve_study',
        'current_budget',
        'insurance_summary',
        'recent_board_minutes',
      ])
      expect(d.requiredDocuments.every((x) => x.status === 'outstanding')).toBe(true)
    })
  })
})
