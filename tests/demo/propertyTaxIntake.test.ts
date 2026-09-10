import { describe, expect, it } from 'vitest'
import {
  PROPERTY_TAX_INTAKE_SECTION_TITLE,
  PROPERTY_TAX_INVOLVEMENT_QUESTION,
  createEmptyPropertyTaxIssue,
  getPropertyTaxDateFieldsForKind,
  getPropertyTaxDocumentChecklist,
  getPropertyTaxIssueKindLabel,
  getPropertyTaxStatedDeadlineBanner,
  isPropertyTaxBranchActive,
  normalizePropertyTaxIssue,
  patchPropertyTaxAssessmentBranch,
  patchPropertyTaxDatedField,
  patchPropertyTaxDelinquentBranch,
  patchPropertyTaxOwnershipBranch,
  propertyTaxIssueForIntakeSnapshot,
  setPropertyTaxInvolvement,
  shouldShowPropertyTaxIntakeSection,
  togglePropertyTaxIssueKind,
} from '@/lib/demo/propertyTaxIssue'

describe('property tax intake (Step 2) visibility and state', () => {
  it('shows the Florida section parent question only for Florida addresses', () => {
    expect(shouldShowPropertyTaxIntakeSection('100 Main St, Orlando, FL 32801')).toBe(true)
    expect(shouldShowPropertyTaxIntakeSection('100 Main St, Atlanta, GA 30301')).toBe(false)
    expect(shouldShowPropertyTaxIntakeSection('')).toBe(false)
    expect(PROPERTY_TAX_INTAKE_SECTION_TITLE).toMatch(/Florida Property-Tax/i)
    expect(PROPERTY_TAX_INVOLVEMENT_QUESTION).toMatch(/property-tax/i)
  })

  it('reveals multi-select issue kinds when Yes, and allows multiple kinds together', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    expect(isPropertyTaxBranchActive(issue)).toBe(true)
    expect(issue.kinds).toEqual([])

    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    issue = togglePropertyTaxIssueKind(issue, 'ownership_change_tax_risk', true)
    issue = togglePropertyTaxIssueKind(issue, 'delinquent_tax_deed_surplus', true)

    expect(issue.kinds).toEqual([
      'assessment_vab',
      'ownership_change_tax_risk',
      'delinquent_tax_deed_surplus',
    ])
    expect(issue.byKind.assessment_vab).toBeDefined()
    expect(issue.byKind.ownership_change_tax_risk).toBeDefined()
    expect(issue.byKind.delinquent_tax_deed_surplus).toBeDefined()

    const roundTrip = normalizePropertyTaxIssue(JSON.parse(JSON.stringify(issue)))
    expect(roundTrip.kinds).toEqual(issue.kinds)
    expect(roundTrip.involvement).toBe('yes')
  })

  it('allows Unknown parent answer without forcing a precise issue kind', () => {
    const issue = setPropertyTaxInvolvement(null, 'unknown')
    expect(issue.involvement).toBe('unknown')
    expect(issue.enabled).toBe(true)
    expect(issue.kinds).toEqual([])
    expect(issue.byKind).toEqual({})
    expect(isPropertyTaxBranchActive(issue)).toBe(true)

    const snap = propertyTaxIssueForIntakeSnapshot(issue, '12 Pine Rd, Miami, FL 33101')
    expect(snap?.involvement).toBe('unknown')
    expect(snap?.kinds).toEqual([])
  })

  it('reveals only track-specific fields for each selected kind', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    expect(getPropertyTaxDateFieldsForKind('assessment_vab').map((f) => f.key)).toEqual([
      'trimNoticeDate',
      'vabFilingDate',
      'vabHearingDate',
    ])
    expect(issue.byKind.ownership_change_tax_risk).toBeUndefined()
    expect(issue.byKind.delinquent_tax_deed_surplus).toBeUndefined()

    issue = togglePropertyTaxIssueKind(issue, 'ownership_change_tax_risk', true)
    expect(getPropertyTaxDateFieldsForKind('ownership_change_tax_risk').map((f) => f.key)).toEqual([
      'closingOrTransferDate',
    ])
    expect(getPropertyTaxIssueKindLabel('ownership_change_tax_risk')).toMatch(/Buyer tax-estimate/i)

    issue = togglePropertyTaxIssueKind(issue, 'delinquent_tax_deed_surplus', true)
    const delinquentDates = getPropertyTaxDateFieldsForKind('delinquent_tax_deed_surplus').map(
      (f) => f.key,
    )
    expect(delinquentDates).toContain('taxCertificateDate')
    expect(delinquentDates).toContain('surplusNoticeDeadlineDate')
    expect(getPropertyTaxDocumentChecklist(['delinquent_tax_deed_surplus']).length).toBeGreaterThanOrEqual(
      6,
    )
    expect(getPropertyTaxDocumentChecklist(['assessment_vab']).map((d) => d.id)).toContain(
      'ptx-trim-notice',
    )
  })

  it('retains date verification state on entered dates', () => {
    let issue = togglePropertyTaxIssueKind(null, 'assessment_vab', true)
    issue = patchPropertyTaxDatedField(issue, 'assessment_vab', 'trimNoticeDate', {
      date: '2026-08-15',
      source: 'documented',
    })
    expect(issue.byKind.assessment_vab?.trimNoticeDate).toEqual({
      date: '2026-08-15',
      source: 'documented',
    })

    const again = normalizePropertyTaxIssue(JSON.parse(JSON.stringify(issue)))
    expect(again.byKind.assessment_vab?.trimNoticeDate).toEqual({
      date: '2026-08-15',
      source: 'documented',
    })
  })

  it('uses firm-verification wording for unverified stated deadlines', () => {
    expect(
      getPropertyTaxStatedDeadlineBanner({ date: '2026-09-30', source: 'client_reported' }),
    ).toBe('Deadline reported or documented — firm verification required.')
    expect(
      getPropertyTaxStatedDeadlineBanner({ date: '2026-09-30', source: 'documented' }),
    ).toBe('Deadline reported or documented — firm verification required.')
    expect(getPropertyTaxStatedDeadlineBanner({ date: '2026-09-30', source: 'firm_verified' })).toBeNull()
    expect(getPropertyTaxStatedDeadlineBanner({ date: null, source: 'unknown' })).toBeNull()
  })

  it('clears active child workflow state when parent answer becomes No', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    issue = patchPropertyTaxAssessmentBranch(issue, {
      noticeReceived: true,
      reportedIssueType: 'assessed_value',
    })
    issue = setPropertyTaxInvolvement(issue, 'no')

    expect(issue.involvement).toBe('no')
    expect(issue.enabled).toBe(false)
    expect(issue.kinds).toEqual([])
    expect(issue.byKind).toEqual({})
    expect(isPropertyTaxBranchActive(issue)).toBe(false)
    expect(propertyTaxIssueForIntakeSnapshot(issue, '1 Ocean Dr, Miami Beach, FL 33139')).toBeUndefined()
  })

  it('omits property-tax from snapshot when jurisdiction is not Florida', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'delinquent_tax_deed_surplus', true)
    expect(propertyTaxIssueForIntakeSnapshot(issue, '500 Peachtree St, Atlanta, GA 30308')).toBeUndefined()
  })

  it('legacy leads with no property-tax object normalize and snapshot safely', () => {
    const empty = normalizePropertyTaxIssue(undefined)
    expect(empty.enabled).toBe(false)
    expect(empty.involvement).toBe('no')
    expect(propertyTaxIssueForIntakeSnapshot(undefined, '100 Main St, Orlando, FL 32801')).toBeUndefined()
    expect(propertyTaxIssueForIntakeSnapshot(null, '100 Main St, Orlando, FL 32801')).toBeUndefined()

    // Legacy Step 1 payload with only `enabled` still works
    const legacy = normalizePropertyTaxIssue({
      enabled: true,
      kinds: ['ownership_change_tax_risk'],
      byKind: {
        ownership_change_tax_risk: {
          kind: 'ownership_change_tax_risk',
          status: 'not_started',
          notes: '',
          parcelOrFolio: '',
          relyingOnSellerCurrentBill: null,
          closingOrTransferDate: { date: null, source: 'unknown' },
          estimatedTaxBillDate: { date: null, source: 'unknown' },
        },
      },
      internalNotes: '',
    })
    expect(legacy.involvement).toBe('yes')
    expect(legacy.byKind.ownership_change_tax_risk?.buyerIntendedUse).toBe('unknown')
    expect(legacy.byKind.ownership_change_tax_risk?.sellerHomesteadStatus).toBe('unknown')
    expect(legacy.floridaCounty).toBe('')
  })

  it('persists track-specific answers for assessment, buyer-tax, and tax-deed tracks', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    issue = patchPropertyTaxAssessmentBranch(issue, {
      noticeReceived: true,
      reportedIssueType: 'exemption',
      vabPetitionFiled: false,
    })

    issue = togglePropertyTaxIssueKind(issue, 'ownership_change_tax_risk', true)
    issue = patchPropertyTaxOwnershipBranch(issue, {
      buyerIntendedUse: 'owner_occupant',
      sellerHomesteadStatus: 'yes',
      taxBillOrTrimAvailable: true,
      relyingOnSellerCurrentBill: true,
    })

    issue = togglePropertyTaxIssueKind(issue, 'delinquent_tax_deed_surplus', true)
    issue = patchPropertyTaxDelinquentBranch(issue, {
      situations: ['tax_deed_sale', 'clerk_surplus_notice'],
      clientRole: 'former_owner',
      surplusNoticeDeadlineDate: { date: '2026-10-01', source: 'client_reported' },
    })

    const snap = propertyTaxIssueForIntakeSnapshot(issue, '22 Bay St, Tampa, FL 33602')
    expect(snap?.byKind.assessment_vab?.reportedIssueType).toBe('exemption')
    expect(snap?.byKind.ownership_change_tax_risk?.buyerIntendedUse).toBe('owner_occupant')
    expect(snap?.byKind.delinquent_tax_deed_surplus?.situations).toEqual([
      'tax_deed_sale',
      'clerk_surplus_notice',
    ])
    expect(
      getPropertyTaxStatedDeadlineBanner(snap!.byKind.delinquent_tax_deed_surplus!.surplusNoticeDeadlineDate),
    ).toMatch(/firm verification required/i)
  })
})
