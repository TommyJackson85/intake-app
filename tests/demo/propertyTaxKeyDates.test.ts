import { describe, expect, it } from 'vitest'
import {
  PROPERTY_TAX_KEY_DATES_EMPTY_COPY,
  buildPropertyTaxKeyDatesModel,
  formatPropertyTaxDateOnlyDisplay,
  getPropertyTaxKeyDateUrgencyPill,
  getPropertyTaxKeyDateVerificationLabel,
  propertyTaxDateOnlyDiffDays,
  shouldShowPropertyTaxKeyDatesSection,
  togglePropertyTaxIssueKind,
  patchPropertyTaxAssessmentBranch,
  patchPropertyTaxDatedField,
  patchPropertyTaxDelinquentBranch,
  patchPropertyTaxOwnershipBranch,
  setPropertyTaxInvolvement,
} from '@/lib/demo/propertyTaxIssue'

describe('property-tax Key Dates helpers (Step 5)', () => {
  it('groups Assessment/VAB dates with correct verification badges', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    issue = patchPropertyTaxDatedField(issue, 'assessment_vab', 'trimNoticeDate', {
      date: '2026-08-15',
      source: 'client_reported',
    })
    issue = patchPropertyTaxDatedField(issue, 'assessment_vab', 'vabHearingDate', {
      date: '2026-09-20',
      source: 'documented',
    })

    const model = buildPropertyTaxKeyDatesModel(issue, '2026-09-10')
    expect(model.groups).toHaveLength(1)
    expect(model.groups[0]?.kind).toBe('assessment_vab')
    expect(model.groups[0]?.kindLabel).toMatch(/VAB/i)
    expect(model.recordedDateCount).toBe(2)

    const trim = model.groups[0]?.rows.find((r) => r.fieldKey === 'trimNoticeDate')
    const hearing = model.groups[0]?.rows.find((r) => r.fieldKey === 'vabHearingDate')
    expect(trim?.verificationLabel).toBe('Client-reported')
    expect(hearing?.verificationLabel).toBe('Documented')
    expect(model.groups[0]?.rows.every((r) => r.kind === 'assessment_vab')).toBe(true)
    expect(model.footer).not.toMatch(/legally binding|legally controlling/i)
    expect(model.footer).toMatch(/not calculated statutory deadlines/i)
  })

  it('shows Buyer Tax-Estimate closing date only under ownership group', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'ownership_change_tax_risk', true)
    issue = patchPropertyTaxOwnershipBranch(issue, {
      buyerIntendedUse: 'flipper_investor',
      sellerHomesteadStatus: 'yes',
      closingOrTransferDate: { date: '2026-11-01', source: 'firm_verified' },
    })

    const model = buildPropertyTaxKeyDatesModel(issue, '2026-09-10')
    expect(model.groups.map((g) => g.kind)).toEqual(['ownership_change_tax_risk'])
    const closing = model.groups[0]?.rows.find((r) => r.fieldKey === 'closingOrTransferDate')
    expect(closing?.date).toBe('2026-11-01')
    expect(closing?.verificationLabel).toBe('Firm-verified')
    expect(model.groups[0]?.rows.some((r) => /VAB|TRIM notice date/i.test(r.label))).toBe(false)
  })

  it('groups delinquent-tax dates without legal conclusions', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'delinquent_tax_deed_surplus', true)
    issue = patchPropertyTaxDelinquentBranch(issue, {
      clientRole: 'former_owner',
      taxDeedSaleDate: { date: '2026-07-01', source: 'documented' },
      surplusNoticeDate: { date: '2026-07-15', source: 'client_reported' },
    })

    const model = buildPropertyTaxKeyDatesModel(issue, '2026-09-10')
    expect(model.groups[0]?.kind).toBe('delinquent_tax_deed_surplus')
    expect(model.groups[0]?.rows.some((r) => r.fieldKey === 'taxDeedSaleDate')).toBe(true)
    expect(model.groups[0]?.rows.some((r) => r.fieldKey === 'surplusNoticeDate')).toBe(true)
    const text = JSON.stringify(model)
    expect(text).not.toMatch(/entitled|time-barred|you must file|redemption expires/i)
  })

  it('client-reported stated deadline shows firm verification required', () => {
    let issue = togglePropertyTaxIssueKind(null, 'delinquent_tax_deed_surplus', true)
    issue = patchPropertyTaxDatedField(issue, 'delinquent_tax_deed_surplus', 'surplusNoticeDeadlineDate', {
      date: '2026-10-01',
      source: 'client_reported',
    })
    const row = buildPropertyTaxKeyDatesModel(issue, '2026-09-10').groups[0]?.rows.find(
      (r) => r.fieldKey === 'surplusNoticeDeadlineDate',
    )
    expect(row?.statedDeadlineBanner).toBe(
      'Deadline reported or documented — firm verification required.',
    )
    expect(row?.verificationLabel).toBe('Client-reported')
  })

  it('documented but not firm-verified deadline uses verification-required wording', () => {
    let issue = togglePropertyTaxIssueKind(null, 'delinquent_tax_deed_surplus', true)
    issue = patchPropertyTaxDatedField(issue, 'delinquent_tax_deed_surplus', 'surplusNoticeDeadlineDate', {
      date: '2026-10-01',
      source: 'documented',
    })
    const row = buildPropertyTaxKeyDatesModel(issue, '2026-09-10').groups[0]?.rows.find(
      (r) => r.fieldKey === 'surplusNoticeDeadlineDate',
    )
    expect(row?.statedDeadlineBanner).toMatch(/firm verification required/i)
    expect(row?.verificationLabel).not.toMatch(/legal deadline confirmed/i)
  })

  it('firm-verified deadline shows Firm-verified date treatment without legal confirmation', () => {
    let issue = togglePropertyTaxIssueKind(null, 'delinquent_tax_deed_surplus', true)
    issue = patchPropertyTaxDatedField(issue, 'delinquent_tax_deed_surplus', 'surplusNoticeDeadlineDate', {
      date: '2026-10-01',
      source: 'firm_verified',
    })
    const row = buildPropertyTaxKeyDatesModel(issue, '2026-09-10').groups[0]?.rows.find(
      (r) => r.fieldKey === 'surplusNoticeDeadlineDate',
    )
    expect(row?.statedDeadlineBanner).toBeNull()
    expect(row?.verificationLabel).toBe('Firm-verified')
    expect(getPropertyTaxKeyDateVerificationLabel(row!)).toBe('Firm-verified')
    expect(JSON.stringify(row)).not.toMatch(/legal deadline confirmed|legally controlling/i)
  })

  it('active track with no dates shows neutral empty copy', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    issue = patchPropertyTaxAssessmentBranch(issue, { reportedIssueType: 'assessed_value' })
    const model = buildPropertyTaxKeyDatesModel(issue, '2026-09-10')
    expect(model.recordedDateCount).toBe(0)
    expect(model.groups[0]?.emptyCopy).toBe(PROPERTY_TAX_KEY_DATES_EMPTY_COPY)
    expect(model.groups[0]?.emptyCopy).not.toMatch(/deadline exists|required by law/i)
  })

  it('multi-track groups dates without duplicating rows', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    issue = togglePropertyTaxIssueKind(issue, 'delinquent_tax_deed_surplus', true)
    issue = patchPropertyTaxDatedField(issue, 'assessment_vab', 'trimNoticeDate', {
      date: '2026-08-01',
      source: 'documented',
    })
    issue = patchPropertyTaxDatedField(issue, 'delinquent_tax_deed_surplus', 'taxDeedSaleDate', {
      date: '2026-07-01',
      source: 'client_reported',
    })

    const model = buildPropertyTaxKeyDatesModel(issue, '2026-09-10')
    expect(model.groups.map((g) => g.kind)).toEqual([
      'assessment_vab',
      'delinquent_tax_deed_surplus',
    ])
    const ids = model.groups.flatMap((g) => g.rows.map((r) => r.id))
    expect(new Set(ids).size).toBe(ids.length)
    expect(model.groups[0]?.rows.every((r) => r.kind === 'assessment_vab')).toBe(true)
    expect(model.groups[1]?.rows.every((r) => r.kind === 'delinquent_tax_deed_surplus')).toBe(true)
  })

  it('hides section for legacy and non-Florida matters', () => {
    expect(
      shouldShowPropertyTaxKeyDatesSection({
        propertyAddress: '100 Main St, Orlando, FL 32801',
        propertyTaxIssue: undefined,
      }),
    ).toBe(false)

    let issue = togglePropertyTaxIssueKind(null, 'assessment_vab', true)
    expect(
      shouldShowPropertyTaxKeyDatesSection({
        propertyAddress: '500 Peachtree St, Atlanta, GA 30308',
        propertyTaxIssue: issue,
      }),
    ).toBe(false)

    expect(
      shouldShowPropertyTaxKeyDatesSection({
        propertyAddress: '100 Main St, Orlando, FL 32801',
        propertyTaxIssue: setPropertyTaxInvolvement(null, 'no'),
      }),
    ).toBe(false)
  })

  it('Soon/Passed urgency pairs verify copy when date is not firm-verified', () => {
    let issue = togglePropertyTaxIssueKind(null, 'assessment_vab', true)
    issue = patchPropertyTaxDatedField(issue, 'assessment_vab', 'vabHearingDate', {
      date: '2026-09-11',
      source: 'client_reported',
    })
    const soon = buildPropertyTaxKeyDatesModel(issue, '2026-09-10').groups[0]?.rows.find(
      (r) => r.fieldKey === 'vabHearingDate',
    )
    expect(soon?.urgencyPill).toBe('Soon')
    expect(soon?.verifyAlongsideUrgency).toBe('Verify date')

    issue = patchPropertyTaxDatedField(issue, 'assessment_vab', 'trimNoticeDate', {
      date: '2026-08-01',
      source: 'documented',
    })
    const passed = buildPropertyTaxKeyDatesModel(issue, '2026-09-10').groups[0]?.rows.find(
      (r) => r.fieldKey === 'trimNoticeDate',
    )
    expect(passed?.urgencyPill).toBe('Passed')
    expect(passed?.verifyAlongsideUrgency).toBe('Verify date')

    issue = patchPropertyTaxDatedField(issue, 'assessment_vab', 'vabFilingDate', {
      date: '2026-09-11',
      source: 'firm_verified',
    })
    const firmSoon = buildPropertyTaxKeyDatesModel(issue, '2026-09-10').groups[0]?.rows.find(
      (r) => r.fieldKey === 'vabFilingDate',
    )
    expect(firmSoon?.urgencyPill).toBe('Soon')
    expect(firmSoon?.verifyAlongsideUrgency).toBeNull()
  })

  it('date-only formatting and diff do not shift YYYY-MM-DD across timezones', () => {
    expect(formatPropertyTaxDateOnlyDisplay('2026-01-15')).toBe('Jan 15, 2026')
    expect(formatPropertyTaxDateOnlyDisplay(null)).toBe('Date not provided')
    expect(propertyTaxDateOnlyDiffDays('2026-09-10', '2026-09-10')).toBe(0)
    expect(propertyTaxDateOnlyDiffDays('2026-09-13', '2026-09-10')).toBe(3)
    expect(propertyTaxDateOnlyDiffDays('2026-09-09', '2026-09-10')).toBe(-1)
    expect(getPropertyTaxKeyDateUrgencyPill('2026-09-13', '2026-09-10')).toBe('Soon')
    expect(getPropertyTaxKeyDateUrgencyPill('2026-09-14', '2026-09-10')).toBeNull()
    expect(getPropertyTaxKeyDateUrgencyPill('2026-09-01', '2026-09-10')).toBe('Passed')
  })
})
