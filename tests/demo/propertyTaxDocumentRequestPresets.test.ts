import { describe, expect, it } from 'vitest'
import {
  PROPERTY_TAX_SUGGESTED_DOCS_SAFE_COPY,
  annotatePropertyTaxDocumentRequestPresets,
  buildPropertyTaxDocumentRequestPayload,
  buildPropertyTaxDocumentRequestPresets,
  findOpenPropertyTaxPresetRequest,
  selectPropertyTaxDocumentRequestsToCreate,
  shouldShowPropertyTaxSuggestedDocuments,
} from '@/lib/demo/staffPropertyTaxDocumentRequestPresets'
import {
  patchPropertyTaxAssessmentBranch,
  patchPropertyTaxDelinquentBranch,
  patchPropertyTaxOwnershipBranch,
  setPropertyTaxInvolvement,
  togglePropertyTaxAvailableDocument,
  togglePropertyTaxIssueKind,
} from '@/lib/demo/propertyTaxIssue'
import type { DemoDocumentRequest, DemoMatter } from '@/lib/demo/types'

function flMatter(issue: DemoMatter['propertyTaxIssue']): DemoMatter {
  return {
    id: 'matter-ptx-1',
    file_id: 'FL-2026-PTX',
    status: 'Intake',
    deletedAt: null,
    matter_type: 'Financed Residential Purchase',
    portal_token: 'tok',
    property: {
      address: '100 Main St, Orlando, FL 32801',
      county: 'Orange',
      property_type: 'Single-Family Home',
    },
    buyer: { id: 'b1', name: 'Buyer', type: 'individual', email: '', phone: '' },
    seller: { id: 's1', name: 'Seller', type: 'individual', email: '', phone: '' },
    transactionType: 'Purchase',
    purchasePrice: 1,
    financingType: 'Conventional',
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
      closing_date: '',
    },
    tasks: [],
    timeline: [],
    propertyTaxIssue: issue,
  }
}

describe('property-tax document request presets (Step 4)', () => {
  it('Assessment/VAB matter produces only assessment-related suggestions', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    const presets = buildPropertyTaxDocumentRequestPresets(issue)
    expect(presets.length).toBeGreaterThan(0)
    expect(presets.every((p) => p.associatedKinds.includes('assessment_vab'))).toBe(true)
    expect(presets.some((p) => p.id === 'ptx-trim-notice')).toBe(true)
    expect(presets.some((p) => p.id === 'ptx-vab-petition')).toBe(true)
    expect(presets.some((p) => p.id === 'ptx-tax-deed-application-sale')).toBe(false)
    expect(presets.some((p) => /required by florida law|proof of entitlement/i.test(p.description))).toBe(
      false,
    )
  })

  it('buyer tax-estimate matter produces only ownership-related suggestions', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'ownership_change_tax_risk', true)
    const presets = buildPropertyTaxDocumentRequestPresets(issue)
    expect(presets.every((p) => p.associatedKinds.includes('ownership_change_tax_risk'))).toBe(true)
    expect(presets.some((p) => p.id === 'ptx-purchase-closing-info')).toBe(true)
    expect(presets.some((p) => p.id === 'ptx-vab-petition')).toBe(false)
    expect(presets.some((p) => p.id === 'ptx-surplus-notice')).toBe(false)
  })

  it('delinquent-tax/tax-deed matter produces only delinquent suggestions', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'delinquent_tax_deed_surplus', true)
    const presets = buildPropertyTaxDocumentRequestPresets(issue)
    expect(presets.every((p) => p.associatedKinds.includes('delinquent_tax_deed_surplus'))).toBe(true)
    expect(presets.some((p) => p.id === 'ptx-surplus-notice')).toBe(true)
    expect(presets.some((p) => p.id === 'ptx-vab-petition')).toBe(false)
    expect(presets.some((p) => p.id === 'ptx-seller-homestead-info')).toBe(false)
  })

  it('multi-kind union de-duplicates shared TRIM notice and retains both kind labels', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    issue = togglePropertyTaxIssueKind(issue, 'delinquent_tax_deed_surplus', true)
    issue = togglePropertyTaxIssueKind(issue, 'ownership_change_tax_risk', true)
    const presets = buildPropertyTaxDocumentRequestPresets(issue)
    const trim = presets.filter((p) => p.id === 'ptx-trim-notice')
    expect(trim).toHaveLength(1)
    expect(trim[0]?.associatedKinds).toEqual(
      expect.arrayContaining(['assessment_vab', 'ownership_change_tax_risk']),
    )
    expect(presets.some((p) => p.id === 'ptx-vab-petition')).toBe(true)
    expect(presets.some((p) => p.id === 'ptx-surplus-notice')).toBe(true)
  })

  it('client-reported available TRIM is not preselected', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    issue = togglePropertyTaxAvailableDocument(issue, 'assessment_vab', 'ptx-trim-notice', true)
    const presets = buildPropertyTaxDocumentRequestPresets(issue)
    const trim = presets.find((p) => p.id === 'ptx-trim-notice')
    expect(trim?.availability).toBe('reported_available')
    expect(trim?.defaultSelected).toBe(false)
    expect(trim?.reason).toMatch(/Reported available/i)
  })

  it('unknown/unavailable documents can be preselected and remain deselectable in create selection', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    const presets = buildPropertyTaxDocumentRequestPresets(issue)
    const vab = presets.find((p) => p.id === 'ptx-vab-petition')
    expect(vab?.availability).toBe('unknown')
    expect(vab?.defaultSelected).toBe(true)
    expect(vab?.reason).toMatch(/unavailable or unknown/i)

    const matter = flMatter(issue)
    // Staff deselects all but one
    const payloads = selectPropertyTaxDocumentRequestsToCreate({
      matter,
      staffId: 'staff-1',
      documentRequests: [],
      selectedPresetIds: ['ptx-vab-petition'],
    })
    expect(payloads).toHaveLength(1)
    expect(payloads[0]?.title).toMatch(/VAB petition/i)
    expect(payloads[0]?.description).toMatch(/property_tax_issue/)
  })

  it('creates only selected requests and none until selection is provided', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'delinquent_tax_deed_surplus', true)
    const matter = flMatter(issue)

    expect(
      selectPropertyTaxDocumentRequestsToCreate({
        matter,
        staffId: 'staff-1',
        documentRequests: [],
        selectedPresetIds: [],
      }),
    ).toEqual([])

    const created = selectPropertyTaxDocumentRequestsToCreate({
      matter,
      staffId: 'staff-1',
      documentRequests: [],
      selectedPresetIds: ['ptx-surplus-notice', 'ptx-deed-title-lien'],
      titleOverrides: { 'ptx-surplus-notice': 'Clerk surplus notice (edited)' },
    })
    expect(created).toHaveLength(2)
    expect(created.map((c) => c.title)).toContain('Clerk surplus notice (edited)')
    expect(created.every((c) => c.matter_id === matter.id)).toBe(true)
    expect(created.every((c) => c.status === 'open')).toBe(true)
  })

  it('detects existing active requests and does not duplicate them', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    const matter = flMatter(issue)
    const existing: DemoDocumentRequest = {
      id: 'req-1',
      matter_id: matter.id,
      title: 'Latest tax bill or TRIM notice',
      description: 'Requested from Property-Tax checklist (ptx-trim-notice). source=property_tax_issue',
      category: 'Compliance',
      requested_at: '2026-09-01T12:00:00.000Z',
      requested_by_staff_id: 'staff-1',
      status: 'open',
      fulfilled_document_id: null,
      staff_receipt_acknowledged_at: null,
      staff_receipt_reviewed_by_staff_id: null,
      staff_receipt_reviewed_document_id: null,
      staff_follow_up: { status: 'none', note: '', markedById: null, markedByName: null, markedAt: null },
      lifecycle: { status: 'active' },
    }

    expect(findOpenPropertyTaxPresetRequest([existing], matter.id, 'ptx-trim-notice')?.id).toBe('req-1')
    const annotated = annotatePropertyTaxDocumentRequestPresets({
      issue,
      matterId: matter.id,
      documentRequests: [existing],
    })
    expect(annotated.find((r) => r.id === 'ptx-trim-notice')?.alreadyRequested).toBe(true)

    const payloads = selectPropertyTaxDocumentRequestsToCreate({
      matter,
      staffId: 'staff-1',
      documentRequests: [existing],
      selectedPresetIds: ['ptx-trim-notice', 'ptx-vab-petition'],
    })
    expect(payloads.map((p) => p.title).join(' ')).not.toMatch(/TRIM notice/i)
    expect(payloads).toHaveLength(1)
    expect(payloads[0]?.description).toMatch(/ptx-vab-petition/)
  })

  it('hides suggested docs for legacy / non-Florida / No-involvement matters', () => {
    expect(
      shouldShowPropertyTaxSuggestedDocuments({
        propertyAddress: '100 Main St, Orlando, FL 32801',
        propertyTaxIssue: undefined,
      }),
    ).toBe(false)

    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'assessment_vab', true)
    expect(
      shouldShowPropertyTaxSuggestedDocuments({
        propertyAddress: '500 Peachtree St, Atlanta, GA 30308',
        propertyTaxIssue: issue,
      }),
    ).toBe(false)

    expect(
      shouldShowPropertyTaxSuggestedDocuments({
        propertyAddress: '100 Main St, Orlando, FL 32801',
        propertyTaxIssue: setPropertyTaxInvolvement(null, 'no'),
      }),
    ).toBe(false)

    // Unknown without kinds — overview may show, but no suggested docs
    expect(
      shouldShowPropertyTaxSuggestedDocuments({
        propertyAddress: '100 Main St, Orlando, FL 32801',
        propertyTaxIssue: setPropertyTaxInvolvement(null, 'unknown'),
      }),
    ).toBe(false)
  })

  it('safe copy does not claim legal necessity', () => {
    expect(PROPERTY_TAX_SUGGESTED_DOCS_SAFE_COPY).toMatch(/not a legal document requirement/i)
    expect(PROPERTY_TAX_SUGGESTED_DOCS_SAFE_COPY).not.toMatch(/required by florida law/i)
    const payload = buildPropertyTaxDocumentRequestPayload({
      matterId: 'm1',
      staffId: 's1',
      preset: {
        id: 'ptx-surplus-notice',
        title: 'Clerk surplus-proceeds notice',
        description: 'Request if available — suggested for firm review.',
        category: 'Compliance',
        associatedKinds: ['delinquent_tax_deed_surplus'],
      },
    })
    expect(payload.description).not.toMatch(/entitled|file with|submit to the clerk|mandatory deadline/i)
  })

  it('ownership taxBillOrTrimAvailable=true marks TRIM as reported available', () => {
    let issue = setPropertyTaxInvolvement(null, 'yes')
    issue = togglePropertyTaxIssueKind(issue, 'ownership_change_tax_risk', true)
    issue = patchPropertyTaxOwnershipBranch(issue, { taxBillOrTrimAvailable: true })
    const trim = buildPropertyTaxDocumentRequestPresets(issue).find((p) => p.id === 'ptx-trim-notice')
    expect(trim?.defaultSelected).toBe(false)
    expect(trim?.availability).toBe('reported_available')
  })

  it('track-specific summaries remain isolated in preset sets', () => {
    let assessment = togglePropertyTaxIssueKind(null, 'assessment_vab', true)
    assessment = patchPropertyTaxAssessmentBranch(assessment, { reportedIssueType: 'assessed_value' })
    const a = buildPropertyTaxDocumentRequestPresets(assessment)
    expect(a.map((p) => p.title).join(' ')).not.toMatch(/tax-deed|surplus-proceeds/i)

    let delinquent = togglePropertyTaxIssueKind(null, 'delinquent_tax_deed_surplus', true)
    delinquent = patchPropertyTaxDelinquentBranch(delinquent, { clientRole: 'former_owner' })
    const d = buildPropertyTaxDocumentRequestPresets(delinquent)
    expect(d.map((p) => p.title).join(' ')).not.toMatch(/VAB petition|portability/i)
  })
})
