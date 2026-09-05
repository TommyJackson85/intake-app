import { describe, expect, it } from 'vitest'
import { isFincenEligibleMatter } from '@/lib/demo/fincenEligibility'
import { buildFinCENReportabilityReviewDashboard } from '@/lib/demo/fincenReportability'
import type { DemoMatter } from '@/lib/demo/types'

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
      expect(dashboard.rows).toHaveLength(6)
      expect(dashboard.disclaimer.toLowerCase()).toContain('issue-spotting only')
      expect(dashboard.disclaimer.toLowerCase()).not.toContain('must file')
      expect(dashboard.regulatoryNote.toLowerCase()).toContain('vacatur')
      expect(JSON.stringify(dashboard).toLowerCase()).not.toContain('ready to file')
      expect(dashboard.nextAction.toLowerCase()).not.toContain('file the report')
    })

    it('flags attention when financed individual is outside the demo gate', () => {
      const dashboard = buildFinCENReportabilityReviewDashboard(
        matter({ financingType: 'Conventional', buyer: { type: 'individual' } }),
      )
      expect(dashboard.eligibleUnderDemoGate).toBe(false)
      expect(dashboard.workspaceStatus.label).toBe('Quiet')
      expect(dashboard.rows.find((r) => r.id === 'financing')?.attention).toBe(true)
      expect(dashboard.rows.find((r) => r.id === 'purchaser_type')?.attention).toBe(true)
    })

    it('surfaces pending client certification as attention when gate is open', () => {
      const dashboard = buildFinCENReportabilityReviewDashboard(
        matter({
          financingType: 'Cash',
          buyer: { type: 'entity' },
          fincen: {
            reportStatus: 'in_progress',
            completedFields: 40,
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
            retentionDeadline: null,
          },
        }),
      )
      expect(dashboard.eligibleUnderDemoGate).toBe(true)
      expect(dashboard.rows.find((r) => r.id === 'client_cert')?.attention).toBe(true)
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
    })
  })
})
