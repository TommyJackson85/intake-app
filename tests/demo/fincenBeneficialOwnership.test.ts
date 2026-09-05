import { describe, expect, it } from 'vitest'
import { isFincenEligibleMatter } from '@/lib/demo/fincenEligibility'
import { buildFinCENBeneficialOwnershipReviewDashboard } from '@/lib/demo/fincenBeneficialOwnership'
import { FINCEN_SECTION_IDS } from '@/lib/demo/fincenReportability'
import type { DemoMatter, DemoFinCEN, FinCENBeneficialOwner } from '@/lib/demo/types'

function emptyFincen(overrides: Partial<DemoFinCEN> = {}): DemoFinCEN {
  return {
    reportStatus: 'not_started',
    completedFields: 0,
    reportingParty: {
      firmName: '',
      firmAddress: '',
      firmEin: '',
      filingAttorney: '',
    },
    propertyInfo: {
      purchaserEntityName: '',
      purchaserEntityType: '',
      purchaserEin: '',
      stateOfFormation: '',
      paymentMethods: [],
      totalCashAmount: '',
    },
    beneficialOwners: [],
    certRequest: null,
    retentionDeadline: null,
    ...overrides,
  }
}

function owner(overrides: Partial<FinCENBeneficialOwner> = {}): FinCENBeneficialOwner {
  return {
    id: 'bo-1',
    fullName: 'Marcus T. Delgado',
    dob: '1978-06-14',
    address: '4201 Bayshore Blvd, Tampa, FL 33611',
    citizenship: 'US Citizen',
    tin: '***-**-4421',
    govIdType: "Driver's License",
    govIdNumber: 'D123-456-78-910-0',
    govIdIssuer: 'Florida',
    certifiedAt: '2026-03-18T14:22:00.000Z',
    ...overrides,
  }
}

function matter(
  partial: Partial<Pick<DemoMatter, 'financingType' | 'fincen'>> & {
    buyer?: Partial<DemoMatter['buyer']>
  },
): Pick<DemoMatter, 'financingType' | 'buyer' | 'fincen'> {
  return {
    financingType: partial.financingType ?? 'Conventional',
    buyer: {
      id: 'b1',
      name: 'Buyer',
      email: '',
      phone: '',
      type: 'individual',
      ...partial.buyer,
    },
    ...(partial.fincen !== undefined ? { fincen: partial.fincen } : {}),
  }
}

describe('fincenBeneficialOwnership', () => {
  describe('buildFinCENBeneficialOwnershipReviewDashboard', () => {
    it('keeps issue-spotting language and vacatur posture for cash + entity', () => {
      const input = matter({
        financingType: 'Cash',
        buyer: { type: 'entity', name: 'Palm Harbor Ventures LLC' },
      })
      expect(isFincenEligibleMatter(input as DemoMatter)).toBe(true)
      const dashboard = buildFinCENBeneficialOwnershipReviewDashboard(input)
      expect(dashboard.eligibleUnderDemoGate).toBe(true)
      expect(dashboard.rows).toHaveLength(8)
      expect(dashboard.disclaimer.toLowerCase()).toContain('issue-spotting only')
      expect(dashboard.disclaimer.toLowerCase()).not.toContain('must file')
      expect(dashboard.regulatoryNote.toLowerCase()).toContain('vacatur')
      expect(JSON.stringify(dashboard).toLowerCase()).not.toContain('ready to file')
      expect(dashboard.nextAction.toLowerCase()).not.toContain('file the report')
      expect(dashboard.rows.every((r) => r.sectionId.startsWith('fincen-'))).toBe(true)
      expect(dashboard.workspaceStatus.label).toBe('Attention')
      expect(dashboard.certifiedOwnerCount).toBe(0)
    })

    it('is quiet for financed individual outside the demo gate', () => {
      const dashboard = buildFinCENBeneficialOwnershipReviewDashboard(
        matter({ financingType: 'Conventional', buyer: { type: 'individual' } }),
      )
      expect(dashboard.eligibleUnderDemoGate).toBe(false)
      expect(dashboard.workspaceStatus.label).toBe('Quiet')
      expect(dashboard.rows.find((r) => r.id === 'purchaser_context')?.attention).toBe(true)
      expect(dashboard.rows.find((r) => r.id === 'regulatory_posture')?.attention).toBe(false)
      expect(dashboard.rows.find((r) => r.id === 'regulatory_posture')?.sectionId).toBe(
        FINCEN_SECTION_IDS.regulatory,
      )
    })

    it('flags pending client certification and deep-links to beneficial owners', () => {
      const dashboard = buildFinCENBeneficialOwnershipReviewDashboard(
        matter({
          financingType: 'Cash',
          buyer: { type: 'entity', name: 'Palm Harbor Ventures LLC' },
          fincen: emptyFincen({
            reportStatus: 'in_progress',
            completedFields: 40,
            propertyInfo: {
              purchaserEntityName: 'Palm Harbor Ventures LLC',
              purchaserEntityType: 'LLC',
              purchaserEin: '',
              stateOfFormation: 'FL',
              paymentMethods: [],
              totalCashAmount: '',
            },
            certRequest: {
              id: 'cert-1',
              token: 'tok',
              matterId: 'm1',
              createdAt: '2026-09-01T00:00:00.000Z',
              recipientName: 'Buyer',
              recipientEmail: 'buyer@example.com',
              certUrl: '/demo/fincen-cert/tok',
              status: 'pending_client',
              submittedAt: null,
              submittedOwners: null,
            },
          }),
        }),
      )
      expect(dashboard.rows.find((r) => r.id === 'cert_workflow')?.attention).toBe(true)
      expect(dashboard.nextAction.toLowerCase()).toContain('certification')
      expect(dashboard.rows.find((r) => r.id === 'cert_workflow')?.sectionId).toBe(
        FINCEN_SECTION_IDS.beneficialOwners,
      )
    })

    it('summarizes certified owners and identity / gov-id gaps', () => {
      const dashboard = buildFinCENBeneficialOwnershipReviewDashboard(
        matter({
          financingType: 'Cash',
          buyer: { type: 'entity', name: 'Palm Harbor Ventures LLC' },
          fincen: emptyFincen({
            reportStatus: 'in_progress',
            completedFields: 80,
            propertyInfo: {
              purchaserEntityName: 'Palm Harbor Ventures LLC',
              purchaserEntityType: 'LLC',
              purchaserEin: '12-3456789',
              stateOfFormation: 'FL',
              paymentMethods: ['Wire Transfer'],
              totalCashAmount: '520000',
            },
            beneficialOwners: [
              owner(),
              owner({
                id: 'bo-2',
                fullName: 'Incomplete Owner',
                dob: '',
                tin: '',
                govIdType: '',
                govIdNumber: '',
                govIdIssuer: '',
                certifiedAt: '2026-03-19T10:00:00.000Z',
              }),
            ],
          }),
        }),
      )
      expect(dashboard.certifiedOwnerCount).toBe(2)
      expect(dashboard.ownerCount).toBe(2)
      expect(dashboard.rows.find((r) => r.id === 'identity_completeness')?.attention).toBe(true)
      expect(dashboard.rows.find((r) => r.id === 'gov_id_completeness')?.attention).toBe(true)
      expect(dashboard.rows.find((r) => r.id === 'identity_completeness')?.badge.label).toContain('gap')
      expect(dashboard.rows.find((r) => r.id === 'entity_alignment')?.attention).toBe(false)
    })

    it('flags purchaser entity name mismatch against matter buyer', () => {
      const dashboard = buildFinCENBeneficialOwnershipReviewDashboard(
        matter({
          financingType: 'Cash',
          buyer: { type: 'entity', name: 'Palm Harbor Ventures LLC' },
          fincen: emptyFincen({
            propertyInfo: {
              purchaserEntityName: 'Different Holdings LLC',
              purchaserEntityType: 'LLC',
              purchaserEin: '',
              stateOfFormation: '',
              paymentMethods: [],
              totalCashAmount: '',
            },
            beneficialOwners: [owner()],
          }),
        }),
      )
      const alignment = dashboard.rows.find((r) => r.id === 'entity_alignment')
      expect(alignment?.attention).toBe(true)
      expect(alignment?.detail).toContain('Different Holdings LLC')
      expect(alignment?.sectionId).toBe(FINCEN_SECTION_IDS.propertyPurchaser)
    })
  })
})
