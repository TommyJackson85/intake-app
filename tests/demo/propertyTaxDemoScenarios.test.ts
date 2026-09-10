import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { DEMO_MATTERS, getDemoMatterById } from '@/lib/demo/demoMatters'
import { DEMO_SEED_INTAKE_TOKENS, demoSeedData } from '@/lib/demo/demoData'
import {
  PROPERTY_TAX_DEMO_FICTIONAL_LABEL,
  PROPERTY_TAX_DEMO_SCENARIOS,
  PROPERTY_TAX_DEMO_SCENARIOS_DISCLAIMER,
  PROPERTY_TAX_DEMO_SCENARIOS_SECTION_TITLE,
  buildPropertyTaxIssueForScenario,
  getPropertyTaxDemoScenario,
  getTaxDeedSurplusDemoStatedDeadlineBanner,
} from '@/lib/demo/propertyTaxDemoScenarios'
import {
  buildPropertyTaxMatterOverviewModel,
  normalizePropertyTaxIssue,
  shouldShowPropertyTaxMatterOverviewPanel,
} from '@/lib/demo/propertyTaxIssue'
import { buildPropertyTaxDocumentRequestPresets } from '@/lib/demo/staffPropertyTaxDocumentRequestPresets'
import {
  DEMO_MATTERS_STORAGE_KEY,
  DEMO_INTAKE_LEADS_STORAGE_KEY,
  clearAllDemoPersistedState,
  readDemoPersistedData,
  serializeDemoPersistedData,
  validateDemoMattersStoredArray,
  writeDemoPersistedData,
} from '@/lib/demo/demoPersistence'

describe('property-tax demo scenarios (Step 6)', () => {
  const memory = new Map<string, string>()

  beforeEach(() => {
    memory.clear()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => memory.get(`local:${k}`) ?? null,
        setItem: (k: string, v: string) => {
          memory.set(`local:${k}`, v)
        },
        removeItem: (k: string) => {
          memory.delete(`local:${k}`)
        },
      },
      sessionStorage: {
        getItem: (k: string) => memory.get(`session:${k}`) ?? null,
        setItem: (k: string, v: string) => {
          memory.set(`session:${k}`, v)
        },
        removeItem: (k: string) => {
          memory.delete(`session:${k}`)
        },
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('registers three distinct scenarios with intake and matter entry points', () => {
    expect(PROPERTY_TAX_DEMO_SCENARIOS).toHaveLength(3)
    expect(PROPERTY_TAX_DEMO_SCENARIOS_SECTION_TITLE).toMatch(/Florida Property-Tax & Tax-Deed Demo Scenarios/)
    expect(PROPERTY_TAX_DEMO_SCENARIOS_DISCLAIMER).toMatch(/does not provide legal or tax advice/i)
    expect(PROPERTY_TAX_DEMO_FICTIONAL_LABEL).toMatch(/fictional/i)

    const ids = PROPERTY_TAX_DEMO_SCENARIOS.map((s) => s.id)
    expect(new Set(ids).size).toBe(3)
    for (const scenario of PROPERTY_TAX_DEMO_SCENARIOS) {
      expect(scenario.intakeHref).toBe(`/demo/intake/${scenario.intakeToken}`)
      expect(scenario.matterHref).toContain(scenario.fileId)
      expect(scenario.title.length).toBeGreaterThan(10)
      expect(scenario.purpose.length).toBeGreaterThan(20)
    }
  })

  it('seeds all three scenario matters and intake leads in demo fixtures', () => {
    for (const scenario of PROPERTY_TAX_DEMO_SCENARIOS) {
      const matter = getDemoMatterById(scenario.matterId)
      expect(matter).not.toBeNull()
      expect(matter?.file_id).toBe(scenario.fileId)
      expect(matter?.propertyTaxIssue).toBeTruthy()
      expect(matter?.specialNotes).toMatch(/fictional/i)

      const lead = demoSeedData.intakeLeads.find((l) => l.token === scenario.intakeToken)
      expect(lead).toBeTruthy()
      expect(lead?.id).toBe(scenario.intakeLeadId)
      expect(lead?.fileReference).toBe(scenario.fileId)
      expect(lead?.intake.propertyTaxIssue).toBeTruthy()
      expect(lead?.status).toBe('pending_client')
    }

    expect(DEMO_SEED_INTAKE_TOKENS.propertyTaxAssessmentVab).toBe('demo-token-seed-003')
    expect(DEMO_SEED_INTAKE_TOKENS.propertyTaxBuyerTaxEstimate).toBe('demo-token-seed-004')
    expect(DEMO_SEED_INTAKE_TOKENS.propertyTaxTaxDeedSurplus).toBe('demo-token-seed-005')
    expect(demoSeedData.matters.map((m) => m.id)).toEqual(DEMO_MATTERS.map((m) => m.id))
  })

  it('rehydrates propertyTaxIssue after clear + restore (reset-safe)', () => {
    clearAllDemoPersistedState()
    writeDemoPersistedData(DEMO_MATTERS_STORAGE_KEY, [...DEMO_MATTERS])
    writeDemoPersistedData(DEMO_INTAKE_LEADS_STORAGE_KEY, [...demoSeedData.intakeLeads])

    const restoredMatters = readDemoPersistedData(
      memory.get(`local:${DEMO_MATTERS_STORAGE_KEY}`) ?? null,
      validateDemoMattersStoredArray,
    )
    expect(restoredMatters).not.toBeNull()

    for (const scenario of PROPERTY_TAX_DEMO_SCENARIOS) {
      const matter = restoredMatters!.find((m) => m.id === scenario.matterId)
      expect(matter).toBeTruthy()
      const issue = normalizePropertyTaxIssue((matter as { propertyTaxIssue?: unknown }).propertyTaxIssue)
      expect(issue.enabled).toBe(true)
      expect(issue.involvement).toBe('yes')
      expect(issue.kinds).toEqual([scenario.issueKind])

      const leadRaw = memory.get(`local:${DEMO_INTAKE_LEADS_STORAGE_KEY}`)
      expect(leadRaw).toBeTruthy()
      const envelope = JSON.parse(leadRaw!) as { data: typeof demoSeedData.intakeLeads }
      const lead = envelope.data.find((l) => l.token === scenario.intakeToken)
      expect(lead?.intake.propertyTaxIssue).toBeTruthy()
      const leadIssue = normalizePropertyTaxIssue(lead!.intake.propertyTaxIssue)
      expect(leadIssue.kinds).toEqual([scenario.issueKind])
    }
  })

  it('scenario 1 has only Assessment/VAB issue data and dates', () => {
    const scenario = getPropertyTaxDemoScenario('assessment_vab')
    const matter = getDemoMatterById(scenario.matterId)!
    const issue = normalizePropertyTaxIssue(matter.propertyTaxIssue)
    expect(issue.kinds).toEqual(['assessment_vab'])
    expect(issue.byKind.ownership_change_tax_risk).toBeUndefined()
    expect(issue.byKind.delinquent_tax_deed_surplus).toBeUndefined()

    const branch = issue.byKind.assessment_vab!
    expect(branch.noticeReceived).toBe(true)
    expect(branch.reportedIssueType).toBe('assessed_value')
    expect(branch.vabPetitionFiled).toBeNull()
    expect(branch.trimNoticeDate).toEqual({ date: '2026-08-18', source: 'client_reported' })
    expect(branch.vabHearingDate.source).toMatch(/documented|client_reported/)
    expect(branch.availableDocumentIds).toContain('ptx-trim-notice')
    expect(branch.availableDocumentIds).not.toContain('ptx-property-appraiser-correspondence')
    expect(branch.availableDocumentIds).not.toContain('ptx-appraisal-comparables')
    expect(branch.status).toBe('needs_more_info')

    expect(
      shouldShowPropertyTaxMatterOverviewPanel({
        propertyAddress: matter.property.address,
        propertyTaxIssue: issue,
      }),
    ).toBe(true)

    const presets = buildPropertyTaxDocumentRequestPresets(issue)
    const trim = presets.find((p) => p.id === 'ptx-trim-notice')
    expect(trim?.defaultSelected).toBe(false)
    const appraiser = presets.find((p) => p.id === 'ptx-property-appraiser-correspondence')
    expect(appraiser?.defaultSelected).toBe(true)
  })

  it('scenario 2 has only Buyer Tax-Estimate Risk data and firm-verified closing', () => {
    const scenario = getPropertyTaxDemoScenario('buyer_tax_estimate')
    const matter = getDemoMatterById(scenario.matterId)!
    const issue = normalizePropertyTaxIssue(matter.propertyTaxIssue)
    expect(issue.kinds).toEqual(['ownership_change_tax_risk'])
    expect(issue.byKind.assessment_vab).toBeUndefined()
    expect(issue.byKind.delinquent_tax_deed_surplus).toBeUndefined()

    const branch = issue.byKind.ownership_change_tax_risk!
    expect(branch.buyerIntendedUse).toBe('flipper_investor')
    expect(branch.sellerHomesteadStatus).toBe('yes')
    expect(branch.taxBillOrTrimAvailable).toBe(true)
    expect(branch.closingOrTransferDate).toEqual({ date: '2026-04-30', source: 'firm_verified' })
    expect(matter.buyer.type).toBe('entity')
    expect(branch.status).toBe('in_progress')

    const presets = buildPropertyTaxDocumentRequestPresets(issue)
    const taxBill = presets.find((p) => p.id === 'ptx-trim-notice')
    expect(taxBill?.defaultSelected).toBe(false)
    const closing = presets.find((p) => p.id === 'ptx-purchase-closing-info')
    expect(closing?.defaultSelected).toBe(true)
  })

  it('scenario 3 has only tax-deed data and documented-but-not-firm-verified deadline banner', () => {
    const scenario = getPropertyTaxDemoScenario('tax_deed_surplus')
    const matter = getDemoMatterById(scenario.matterId)!
    const issue = normalizePropertyTaxIssue(matter.propertyTaxIssue)
    expect(issue.kinds).toEqual(['delinquent_tax_deed_surplus'])
    expect(issue.byKind.assessment_vab).toBeUndefined()
    expect(issue.byKind.ownership_change_tax_risk).toBeUndefined()

    const branch = issue.byKind.delinquent_tax_deed_surplus!
    expect(branch.situations).toEqual(expect.arrayContaining(['tax_deed_sale', 'clerk_surplus_notice']))
    expect(branch.clientRole).toBe('heir_personal_representative')
    expect(branch.taxDeedSaleDate.source).toBe('documented')
    expect(branch.surplusNoticeDate.source).toBe('documented')
    expect(branch.surplusNoticeDeadlineDate).toEqual({ date: '2026-05-15', source: 'documented' })
    expect(branch.surplusNoticeDeadlineDate.source).not.toBe('firm_verified')
    expect(branch.status).toBe('ready_for_attorney_review')

    const banner = getTaxDeedSurplusDemoStatedDeadlineBanner()
    expect(banner).toBe('Deadline reported or documented — firm verification required.')

    const model = buildPropertyTaxMatterOverviewModel(issue)
    expect(model.kinds).toHaveLength(1)
    expect(model.kinds[0]?.statedDeadlineBanner).toBe(
      'Deadline reported or documented — firm verification required.',
    )
    expect(model.overallStatus).toBe('ready_for_attorney_review')
    expect(model.overallStatusPresentation.label).toBe('Review required')

    const presets = buildPropertyTaxDocumentRequestPresets(issue)
    expect(presets.find((p) => p.id === 'ptx-surplus-notice')?.defaultSelected).toBe(false)
    expect(presets.find((p) => p.id === 'ptx-deed-title-lien')?.defaultSelected).toBe(true)
    expect(presets.find((p) => p.id === 'ptx-probate-authority')?.defaultSelected).toBe(true)
  })

  it('builders match seeded matter propertyTaxIssue payloads', () => {
    for (const scenario of PROPERTY_TAX_DEMO_SCENARIOS) {
      const built = buildPropertyTaxIssueForScenario(scenario.id)
      const matterIssue = normalizePropertyTaxIssue(getDemoMatterById(scenario.matterId)!.propertyTaxIssue)
      expect(normalizePropertyTaxIssue(built)).toEqual(matterIssue)
    }
  })

  it('serialize/deserialize envelope preserves scenario matter propertyTaxIssue', () => {
    const raw = serializeDemoPersistedData([...DEMO_MATTERS])
    const parsed = readDemoPersistedData(raw, validateDemoMattersStoredArray)
    expect(parsed).not.toBeNull()
    for (const scenario of PROPERTY_TAX_DEMO_SCENARIOS) {
      const row = parsed!.find((m) => m.id === scenario.matterId) as {
        propertyTaxIssue?: unknown
      }
      expect(normalizePropertyTaxIssue(row.propertyTaxIssue).kinds).toEqual([scenario.issueKind])
    }
  })
})
