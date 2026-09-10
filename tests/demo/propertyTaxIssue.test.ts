import { describe, expect, it } from 'vitest'
import {
  PROPERTY_TAX_ISSUE_BOUNDARY_DISCLAIMER,
  createEmptyPropertyTaxIssue,
  getPropertyTaxDateFieldsForKind,
  getPropertyTaxDateVerificationLabel,
  getPropertyTaxDocumentChecklist,
  getPropertyTaxIssueKindLabel,
  hasPropertyTaxIssueKind,
  isIsoDateOnly,
  isPropertyTaxBranchActive,
  isPropertyTaxDateWithinSoftUrgencyWindow,
  normalizePropertyTaxIssue,
  parseOrNullIsoDateOnly,
  propertyTaxDateNeedsVerification,
  setPropertyTaxIssueEnabled,
  togglePropertyTaxIssueKind,
} from '@/lib/demo/propertyTaxIssue'

describe('propertyTaxIssue helpers', () => {
  it('creates a disabled empty issue by default', () => {
    const issue = createEmptyPropertyTaxIssue()
    expect(issue.enabled).toBe(false)
    expect(issue.involvement).toBe('no')
    expect(issue.kinds).toEqual([])
    expect(issue.byKind).toEqual({})
    expect(issue.floridaCounty).toBe('')
    expect(issue.parcelOrFolio).toBe('')
    expect(issue.clientIssueDescription).toBe('')
    expect(issue.opposingPartyOrAgency).toBe('')
    expect(issue.internalNotes).toBe('')
    expect(isPropertyTaxBranchActive(issue)).toBe(false)
  })

  it('normalizes null/invalid persistence payloads to disabled defaults', () => {
    expect(normalizePropertyTaxIssue(null).enabled).toBe(false)
    expect(normalizePropertyTaxIssue(undefined).kinds).toEqual([])
    expect(normalizePropertyTaxIssue('nope').byKind).toEqual({})
    expect(normalizePropertyTaxIssue({ enabled: true, kinds: ['not-a-kind'] }).kinds).toEqual([])
  })

  it('supports multi-select kinds with independent nested data', () => {
    let issue = createEmptyPropertyTaxIssue({ enabled: true })
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    issue = togglePropertyTaxIssueKind(issue, 'delinquent_tax_deed_surplus', true)

    expect(issue.enabled).toBe(true)
    expect(issue.kinds).toEqual(['assessment_vab', 'delinquent_tax_deed_surplus'])
    expect(issue.byKind.assessment_vab?.kind).toBe('assessment_vab')
    expect(issue.byKind.delinquent_tax_deed_surplus?.kind).toBe('delinquent_tax_deed_surplus')
    expect(issue.byKind.ownership_change_tax_risk).toBeUndefined()
    expect(hasPropertyTaxIssueKind(issue, 'assessment_vab')).toBe(true)
    expect(isPropertyTaxBranchActive(issue)).toBe(true)

    // Independent status fields exist per kind
    expect(issue.byKind.assessment_vab?.status).toBe('not_started')
    expect(issue.byKind.delinquent_tax_deed_surplus?.status).toBe('not_started')
  })

  it('preserves nested fields when normalizing a selected kind', () => {
    const issue = normalizePropertyTaxIssue({
      enabled: true,
      kinds: ['ownership_change_tax_risk'],
      byKind: {
        ownership_change_tax_risk: {
          kind: 'ownership_change_tax_risk',
          status: 'in_progress',
          notes: 'Buyer asked about tax bill',
          parcelOrFolio: '12-34-56',
          relyingOnSellerCurrentBill: true,
          closingOrTransferDate: { date: '2026-04-15', source: 'documented' },
          estimatedTaxBillDate: { date: 'not-a-date', source: 'client_reported' },
        },
      },
      internalNotes: 'staff note',
    })

    expect(issue.kinds).toEqual(['ownership_change_tax_risk'])
    expect(issue.byKind.ownership_change_tax_risk?.status).toBe('in_progress')
    expect(issue.byKind.ownership_change_tax_risk?.notes).toBe('Buyer asked about tax bill')
    expect(issue.byKind.ownership_change_tax_risk?.parcelOrFolio).toBe('12-34-56')
    expect(issue.byKind.ownership_change_tax_risk?.relyingOnSellerCurrentBill).toBe(true)
    expect(issue.byKind.ownership_change_tax_risk?.closingOrTransferDate).toEqual({
      date: '2026-04-15',
      source: 'documented',
    })
    // Invalid date coerced to null; source kept when valid
    expect(issue.byKind.ownership_change_tax_risk?.estimatedTaxBillDate).toEqual({
      date: null,
      source: 'client_reported',
    })
    expect(issue.internalNotes).toBe('staff note')
  })

  it('drops nested kind data when deselected', () => {
    let issue = togglePropertyTaxIssueKind(null, 'assessment_vab', true)
    issue = togglePropertyTaxIssueKind(issue, 'ownership_change_tax_risk', true)
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', false)
    expect(issue.kinds).toEqual(['ownership_change_tax_risk'])
    expect(issue.byKind.assessment_vab).toBeUndefined()
    expect(issue.byKind.ownership_change_tax_risk).toBeDefined()
  })

  it('disables the additive branch without inventing kinds', () => {
    const enabled = togglePropertyTaxIssueKind(null, 'assessment_vab', true)
    const disabled = setPropertyTaxIssueEnabled(enabled, false)
    expect(disabled.enabled).toBe(false)
    expect(disabled.kinds).toEqual([])
    expect(disabled.byKind).toEqual({})
    expect(isPropertyTaxBranchActive(disabled)).toBe(false)
  })

  it('parses ISO date-only values and rejects datetimes / invalid calendars', () => {
    expect(isIsoDateOnly('2026-03-18')).toBe(true)
    expect(isIsoDateOnly('2026-03-18T12:00:00.000Z')).toBe(false)
    expect(isIsoDateOnly('2026-02-30')).toBe(false)
    expect(parseOrNullIsoDateOnly('2026-03-18')).toBe('2026-03-18')
    expect(parseOrNullIsoDateOnly('')).toBeNull()
    expect(parseOrNullIsoDateOnly(null)).toBeNull()
  })

  it('uses Verify deadline copy for unverified sources and never Deadline confirmed', () => {
    expect(
      getPropertyTaxDateVerificationLabel({ date: '2026-05-01', source: 'client_reported' }),
    ).toBe('Verify deadline')
    expect(getPropertyTaxDateVerificationLabel({ date: null, source: 'unknown' })).toBe(
      'Verify deadline',
    )
    expect(
      getPropertyTaxDateVerificationLabel({ date: '2026-05-01', source: 'documented' }),
    ).toBe('Verify deadline')
    expect(
      getPropertyTaxDateVerificationLabel({ date: '2026-05-01', source: 'firm_verified' }),
    ).toBe('Firm-recorded date (not a legal determination)')

    expect(propertyTaxDateNeedsVerification({ date: '2026-05-01', source: 'client_reported' })).toBe(
      true,
    )
    expect(propertyTaxDateNeedsVerification({ date: '2026-05-01', source: 'firm_verified' })).toBe(
      false,
    )

    const labels = [
      getPropertyTaxDateVerificationLabel({ date: '2026-01-01', source: 'client_reported' }),
      getPropertyTaxDateVerificationLabel({ date: '2026-01-01', source: 'documented' }),
      getPropertyTaxDateVerificationLabel({ date: '2026-01-01', source: 'firm_verified' }),
      getPropertyTaxDateVerificationLabel({ date: null, source: 'unknown' }),
    ]
    expect(labels.some((l) => /deadline confirmed/i.test(l))).toBe(false)
  })

  it('builds kind-specific date field maps and document checklists', () => {
    expect(getPropertyTaxDateFieldsForKind('assessment_vab').map((f) => f.key)).toEqual([
      'trimNoticeDate',
      'vabFilingDate',
      'vabHearingDate',
    ])
    expect(getPropertyTaxDateFieldsForKind('delinquent_tax_deed_surplus').map((f) => f.key)).toContain(
      'surplusNoticeDeadlineDate',
    )

    const checklist = getPropertyTaxDocumentChecklist([
      'assessment_vab',
      'ownership_change_tax_risk',
      'delinquent_tax_deed_surplus',
    ])
    expect(checklist.length).toBeGreaterThanOrEqual(9)
    expect(checklist.every((i) => i.title.length > 0)).toBe(true)
    expect(new Set(checklist.map((i) => i.id)).size).toBe(checklist.length)
  })

  it('soft urgency window is calendar-only and not a statutory engine', () => {
    expect(
      isPropertyTaxDateWithinSoftUrgencyWindow(
        { date: '2026-04-10', source: 'client_reported' },
        '2026-04-01',
        14,
      ),
    ).toBe(true)
    expect(
      isPropertyTaxDateWithinSoftUrgencyWindow(
        { date: '2026-05-01', source: 'firm_verified' },
        '2026-04-01',
        14,
      ),
    ).toBe(false)
    expect(
      isPropertyTaxDateWithinSoftUrgencyWindow({ date: null, source: 'unknown' }, '2026-04-01'),
    ).toBe(false)
  })

  it('exposes human labels and boundary disclaimer', () => {
    expect(getPropertyTaxIssueKindLabel('assessment_vab')).toMatch(/VAB/i)
    expect(getPropertyTaxIssueKindLabel('ownership_change_tax_risk')).toMatch(/Buyer tax-estimate risk/i)
    expect(PROPERTY_TAX_ISSUE_BOUNDARY_DISCLAIMER).toMatch(/does not provide tax or legal advice/i)
    expect(PROPERTY_TAX_ISSUE_BOUNDARY_DISCLAIMER).toMatch(/filing deadline/i)
    expect(PROPERTY_TAX_ISSUE_BOUNDARY_DISCLAIMER).toMatch(/entitlement to proceeds/i)
  })
})
