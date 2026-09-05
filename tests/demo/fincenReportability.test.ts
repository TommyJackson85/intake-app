import { describe, expect, it } from 'vitest'
import { isFincenEligibleMatter } from '@/lib/demo/fincenEligibility'
import {
  buildFinCENReportabilityReviewDashboard,
  FINCEN_SECTION_IDS,
} from '@/lib/demo/fincenReportability'
import type { DemoMatter, DemoFinCEN } from '@/lib/demo/types'

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

describe('fincenReportability', () => {
  describe('buildFinCENReportabilityReviewDashboard', () => {
    it('opens the demo gate for cash + entity and keeps issue-spotting language', () => {
      const input = matter({
        financingType: 'Cash',
        buyer: { type: 'entity', name: 'Palm Harbor Ventures LLC' },
      })
      expect(isFincenEligibleMatter(input as DemoMatter)).toBe(true)
      const dashboard = buildFinCENReportabilityReviewDashboard(input)
      expect(dashboard.eligibleUnderDemoGate).toBe(true)
      expect(dashboard.financingTypeLabel).toBe('Cash')
      expect(dashboard.purchaserTypeLabel).toBe('Entity / trust')
      expect(dashboard.rows).toHaveLength(10)
      expect(dashboard.disclaimer.toLowerCase()).toContain('issue-spotting only')
      expect(dashboard.disclaimer.toLowerCase()).not.toContain('must file')
      expect(dashboard.regulatoryNote.toLowerCase()).toContain('vacatur')
      expect(JSON.stringify(dashboard).toLowerCase()).not.toContain('ready to file')
      expect(dashboard.nextAction.toLowerCase()).not.toContain('file the report')
      expect(dashboard.rows.every((r) => r.sectionId.startsWith('fincen-'))).toBe(true)
    })

    it('flags attention when financed individual is outside the demo gate', () => {
      const dashboard = buildFinCENReportabilityReviewDashboard(
        matter({ financingType: 'Conventional', buyer: { type: 'individual' } }),
      )
      expect(dashboard.eligibleUnderDemoGate).toBe(false)
      expect(dashboard.workspaceStatus.label).toBe('Quiet')
      expect(dashboard.rows.find((r) => r.id === 'financing')?.attention).toBe(true)
      expect(dashboard.rows.find((r) => r.id === 'purchaser_type')?.attention).toBe(true)
      expect(dashboard.rows.find((r) => r.id === 'eligibility_gate')?.sectionId).toBe(
        FINCEN_SECTION_IDS.eligibility,
      )
    })

    it('surfaces pending client certification as attention when gate is open', () => {
      const dashboard = buildFinCENReportabilityReviewDashboard(
        matter({
          financingType: 'Cash',
          buyer: { type: 'entity' },
          fincen: emptyFincen({
            reportStatus: 'in_progress',
            completedFields: 40,
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
      expect(dashboard.eligibleUnderDemoGate).toBe(true)
      expect(dashboard.rows.find((r) => r.id === 'client_cert')?.attention).toBe(true)
      expect(dashboard.rows.find((r) => r.id === 'beneficial_owners')?.attention).toBe(true)
      expect(dashboard.attentionRowCount).toBeGreaterThan(0)
      expect(dashboard.nextAction.toLowerCase()).toContain('certification')
    })

    it('keeps regulatory posture row informational and non-attention', () => {
      const dashboard = buildFinCENReportabilityReviewDashboard(
        matter({ financingType: 'Cash', buyer: { type: 'entity' } }),
      )
      const posture = dashboard.rows.find((r) => r.id === 'regulatory_posture')
      expect(posture?.attention).toBe(false)
      expect(posture?.detail?.toLowerCase()).toContain('vacatur')
      expect(posture?.sectionId).toBe(FINCEN_SECTION_IDS.regulatory)
    })

    it('summarizes reporting-party and property gaps from intake fields', () => {
      const dashboard = buildFinCENReportabilityReviewDashboard(
        matter({
          financingType: 'Cash',
          buyer: { type: 'entity' },
          fincen: emptyFincen({
            reportStatus: 'in_progress',
            completedFields: 20,
            reportingParty: {
              firmName: 'Harbor Law',
              firmAddress: '1 Main St',
              firmEin: '',
              filingAttorney: '',
            },
            propertyInfo: {
              purchaserEntityName: 'Palm Harbor Ventures LLC',
              purchaserEntityType: 'LLC',
              purchaserEin: '',
              stateOfFormation: 'FL',
              paymentMethods: ['Wire Transfer'],
              totalCashAmount: '450000',
            },
          }),
        }),
      )
      const rp = dashboard.rows.find((r) => r.id === 'reporting_party')
      const pi = dashboard.rows.find((r) => r.id === 'property_purchaser')
      expect(rp?.attention).toBe(true)
      expect(rp?.badge.label).toBe('2/4 fields')
      expect(rp?.sectionId).toBe(FINCEN_SECTION_IDS.reportingParty)
      expect(pi?.attention).toBe(true)
      expect(pi?.badge.label).toBe('5/6 items')
      expect(pi?.detail).toContain('450000')
      expect(pi?.sectionId).toBe(FINCEN_SECTION_IDS.propertyPurchaser)
    })

    it('flags retention deadlines within 90 days', () => {
      const soon = new Date()
      soon.setDate(soon.getDate() + 30)
      const iso = soon.toISOString().slice(0, 10)
      const dashboard = buildFinCENReportabilityReviewDashboard(
        matter({
          financingType: 'Cash',
          buyer: { type: 'entity' },
          fincen: emptyFincen({
            reportStatus: 'ready',
            completedFields: 111,
            reportingParty: {
              firmName: 'A',
              firmAddress: 'B',
              firmEin: '1',
              filingAttorney: 'C',
            },
            propertyInfo: {
              purchaserEntityName: 'E',
              purchaserEntityType: 'LLC',
              purchaserEin: '2',
              stateOfFormation: 'FL',
              paymentMethods: ['Wire Transfer'],
              totalCashAmount: '1',
            },
            retentionDeadline: iso,
          }),
        }),
      )
      const retention = dashboard.rows.find((r) => r.id === 'retention')
      expect(retention?.attention).toBe(true)
      expect(retention?.sectionId).toBe(FINCEN_SECTION_IDS.retention)
    })
  })
})
