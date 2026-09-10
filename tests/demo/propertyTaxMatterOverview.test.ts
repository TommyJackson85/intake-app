import { describe, expect, it } from 'vitest'
import { mapIntakeLeadToNewMatterInitialValues } from '@/lib/demo/demoIntakeFlow'
import {
  buildPropertyTaxMatterOverviewModel,
  createEmptyPropertyTaxIssue,
  getMostRelevantPropertyTaxDate,
  getOverallPropertyTaxIssueStatus,
  getPropertyTaxKindFactualSummaryLines,
  getPropertyTaxKindNextStep,
  getPropertyTaxStatedDeadlineBanner,
  normalizePropertyTaxIssue,
  patchPropertyTaxAssessmentBranch,
  patchPropertyTaxDatedField,
  patchPropertyTaxDelinquentBranch,
  patchPropertyTaxOwnershipBranch,
  propertyTaxIssueStatusPresentation,
  setPropertyTaxInvolvement,
  shouldShowPropertyTaxMatterOverviewPanel,
  togglePropertyTaxIssueKind,
} from '@/lib/demo/propertyTaxIssue'
import type { DemoIntakeLead, DemoMatter } from '@/lib/demo/types'

function baseLead(overrides: Partial<DemoIntakeLead> = {}): DemoIntakeLead {
  const intake: DemoIntakeLead['intake'] = {
    clientName: 'Alex Buyer',
    clientEmail: 'alex@example.com',
    clientPhone: '555-0100',
    transactionRole: 'buyer',
    transactionRoleOther: '',
    buyerType: 'individual',
    matterType: 'Financed Residential Purchase',
    propertyAddress: '100 Main St, Orlando, FL 32801',
    propertyType: 'Single-Family Home',
    county: 'Orange',
    targetClosingDate: '2026-11-01',
    notes: '',
  }
  return {
    id: 'lead-1',
    token: 'tok-1',
    fileReference: 'FL-2026-100',
    createdAt: '2026-09-01T12:00:00.000Z',
    status: 'submitted',
    emailRecipientName: 'Test',
    emailRecipientEmail: 'test@example.com',
    emailSubject: 'Intake',
    emailBody: 'Please complete',
    intakeUrl: '/demo/intake/tok-1',
    demoDelivery: 'link_saved',
    conflict_check_status: 'clear',
    clientSubmittedAt: '2026-09-01T13:00:00.000Z',
    intake,
    submittedIntake: intake,
    ...overrides,
  }
}

describe('property tax lead → matter mapping (Step 3)', () => {
  it('maps a Florida lead with one selected kind onto new-matter initial values', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    issue = patchPropertyTaxAssessmentBranch(issue, {
      noticeReceived: true,
      reportedIssueType: 'assessed_value',
      status: 'needs_more_info',
    })
    issue = patchPropertyTaxDatedField(issue, 'assessment_vab', 'trimNoticeDate', {
      date: '2026-08-15',
      source: 'client_reported',
    })

    const lead = baseLead({
      intake: {
        ...baseLead().intake,
        propertyTaxIssue: issue,
      },
      submittedIntake: {
        ...baseLead().intake,
        propertyTaxIssue: issue,
      },
    })

    const mapped = mapIntakeLeadToNewMatterInitialValues(lead)
    expect(mapped.propertyTaxIssue?.kinds).toEqual(['assessment_vab'])
    expect(mapped.propertyTaxIssue?.byKind.assessment_vab?.reportedIssueType).toBe('assessed_value')
    expect(mapped.propertyTaxIssue?.byKind.assessment_vab?.trimNoticeDate).toEqual({
      date: '2026-08-15',
      source: 'client_reported',
    })
  })

  it('preserves multiple kinds and independent facts through mapping', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    issue = togglePropertyTaxIssueKind(issue, 'delinquent_tax_deed_surplus', true)
    issue = patchPropertyTaxAssessmentBranch(issue, { reportedIssueType: 'exemption' })
    issue = patchPropertyTaxDelinquentBranch(issue, {
      situations: ['clerk_surplus_notice'],
      clientRole: 'former_owner',
      surplusNoticeDeadlineDate: { date: '2026-10-01', source: 'documented' },
    })

    const lead = baseLead({
      submittedIntake: { ...baseLead().intake, propertyTaxIssue: issue },
    })
    const mapped = mapIntakeLeadToNewMatterInitialValues(lead)
    expect(mapped.propertyTaxIssue?.kinds).toEqual([
      'assessment_vab',
      'delinquent_tax_deed_surplus',
    ])
    expect(mapped.propertyTaxIssue?.byKind.assessment_vab?.reportedIssueType).toBe('exemption')
    expect(mapped.propertyTaxIssue?.byKind.delinquent_tax_deed_surplus?.clientRole).toBe(
      'former_owner',
    )
    expect(
      mapped.propertyTaxIssue?.byKind.delinquent_tax_deed_surplus?.surplusNoticeDeadlineDate,
    ).toEqual({ date: '2026-10-01', source: 'documented' })
  })

  it('omits property-tax when intake parent answer is No', () => {
    const issue = setPropertyTaxInvolvement(null, 'no')
    const lead = baseLead({
      submittedIntake: { ...baseLead().intake, propertyTaxIssue: issue },
    })
    expect(mapIntakeLeadToNewMatterInitialValues(lead).propertyTaxIssue).toBeUndefined()
  })

  it('omits property-tax for non-Florida leads even if object present', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'ownership_change_tax_risk', true)
    const lead = baseLead({
      submittedIntake: {
        ...baseLead().intake,
        propertyAddress: '500 Peachtree St, Atlanta, GA 30308',
        propertyTaxIssue: issue,
      },
    })
    expect(mapIntakeLeadToNewMatterInitialValues(lead).propertyTaxIssue).toBeUndefined()
  })
})

describe('property tax matter Overview helpers (Step 3)', () => {
  it('hides panel for legacy matters without property-tax data', () => {
    expect(
      shouldShowPropertyTaxMatterOverviewPanel({
        propertyAddress: '100 Main St, Orlando, FL 32801',
        propertyTaxIssue: undefined,
      }),
    ).toBe(false)
  })

  it('hides panel for non-Florida matters even with malformed property-tax data', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    expect(
      shouldShowPropertyTaxMatterOverviewPanel({
        propertyAddress: '500 Peachtree St, Atlanta, GA 30308',
        propertyTaxIssue: issue,
      }),
    ).toBe(false)
  })

  it('hides panel when involvement is No', () => {
    expect(
      shouldShowPropertyTaxMatterOverviewPanel({
        propertyAddress: '100 Main St, Orlando, FL 32801',
        propertyTaxIssue: createEmptyPropertyTaxIssue({ involvement: 'no' }),
      }),
    ).toBe(false)
  })

  it('shows Unknown involvement with information-needed language', () => {
    const issue = setPropertyTaxInvolvement(null, 'unknown')
    expect(
      shouldShowPropertyTaxMatterOverviewPanel({
        propertyAddress: '100 Main St, Orlando, FL 32801',
        propertyTaxIssue: issue,
      }),
    ).toBe(true)
    expect(getOverallPropertyTaxIssueStatus(issue)).toBe('needs_more_info')
    expect(propertyTaxIssueStatusPresentation('needs_more_info').label).toBe('Information needed')
    const model = buildPropertyTaxMatterOverviewModel(issue)
    expect(model.involvementBanner).toMatch(/not been confirmed/i)
    expect(model.overallStatusPresentation.label).toBe('Information needed')
  })

  it('Assessment/VAB row summaries exclude tax-deed language', () => {
    let issue = togglePropertyTaxIssueKind(null, 'assessment_vab', true)
    issue = patchPropertyTaxAssessmentBranch(issue, {
      noticeReceived: true,
      reportedIssueType: 'assessed_value',
      vabPetitionFiled: false,
    })
    const lines = getPropertyTaxKindFactualSummaryLines('assessment_vab', issue).join(' ')
    expect(lines).toMatch(/assessed value/i)
    expect(lines).toMatch(/TRIM notice: received/i)
    expect(lines).not.toMatch(/tax-deed|surplus|certificate holder/i)
  })

  it('tax-deed row summaries exclude VAB/assessment language', () => {
    let issue = togglePropertyTaxIssueKind(null, 'delinquent_tax_deed_surplus', true)
    issue = patchPropertyTaxDelinquentBranch(issue, {
      situations: ['tax_deed_sale', 'clerk_surplus_notice'],
      clientRole: 'former_owner',
    })
    const lines = getPropertyTaxKindFactualSummaryLines('delinquent_tax_deed_surplus', issue).join(
      ' ',
    )
    expect(lines).toMatch(/tax-deed sale/i)
    expect(lines).toMatch(/former owner/i)
    expect(lines).not.toMatch(/VAB|TRIM notice:|assessed value/i)
  })

  it('unverified stated deadline shows firm verification required', () => {
    let issue = togglePropertyTaxIssueKind(null, 'delinquent_tax_deed_surplus', true)
    issue = patchPropertyTaxDatedField(issue, 'delinquent_tax_deed_surplus', 'surplusNoticeDeadlineDate', {
      date: '2026-10-01',
      source: 'documented',
    })
    const relevant = getMostRelevantPropertyTaxDate('delinquent_tax_deed_surplus', issue)
    expect(relevant?.isStatedDeadline).toBe(true)
    expect(getPropertyTaxStatedDeadlineBanner(relevant!.dated)).toMatch(/firm verification required/i)
    const model = buildPropertyTaxMatterOverviewModel(issue)
    expect(model.kinds[0]?.statedDeadlineBanner).toMatch(/firm verification required/i)
    expect(getPropertyTaxKindNextStep('delinquent_tax_deed_surplus', issue)).toMatch(
      /Verify the date stated/i,
    )
  })

  it('preserves date verification through normalize round-trip onto a matter-shaped object', () => {
    let issue = togglePropertyTaxIssueKind(null, 'ownership_change_tax_risk', true)
    issue = patchPropertyTaxOwnershipBranch(issue, {
      buyerIntendedUse: 'flipper_investor',
      sellerHomesteadStatus: 'yes',
      taxBillOrTrimAvailable: true,
      closingOrTransferDate: { date: '2026-11-15', source: 'firm_verified' },
    })
    const matterLike: Pick<DemoMatter, 'property' | 'propertyTaxIssue'> = {
      property: {
        address: '22 Bay St, Tampa, FL 33602',
        county: 'Hillsborough',
        property_type: 'Single-Family Home',
      },
      propertyTaxIssue: normalizePropertyTaxIssue(JSON.parse(JSON.stringify(issue))),
    }
    expect(shouldShowPropertyTaxMatterOverviewPanel({
      propertyAddress: matterLike.property.address,
      propertyTaxIssue: matterLike.propertyTaxIssue,
    })).toBe(true)
    expect(matterLike.propertyTaxIssue?.byKind.ownership_change_tax_risk?.closingOrTransferDate).toEqual({
      date: '2026-11-15',
      source: 'firm_verified',
    })
    const model = buildPropertyTaxMatterOverviewModel(matterLike.propertyTaxIssue)
    expect(model.kinds[0]?.dateVerificationLabel).toBe('Firm-verified date')
    expect(model.kinds[0]?.summaryLines.join(' ')).toMatch(/flipper\/investor/i)
    expect(model.kinds[0]?.nextStep).toMatch(/Confirm buyer use/i)
  })
})
