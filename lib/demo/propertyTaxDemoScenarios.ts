/**
 * Florida Property-Tax & Tax-Deed demo scenarios (Step 6).
 *
 * Fictional fixtures for prospect walkthroughs only. Organizes intake facts and
 * review surfaces — not legal/tax advice, deadline calculators, entitlement
 * determinations, filing, or outbound communications.
 */
import type { DemoIntakeLead, DemoMatter, DemoPropertyTaxIssue, DemoPropertyTaxIssueKind } from '@/lib/demo/types'
import {
  createEmptyAssessmentVabIssue,
  createEmptyDelinquentTaxDeedSurplusIssue,
  createEmptyOwnershipChangeTaxRiskIssue,
  createEmptyPropertyTaxIssue,
  getPropertyTaxIssueKindLabel,
  getPropertyTaxStatedDeadlineBanner,
  normalizePropertyTaxIssue,
} from '@/lib/demo/propertyTaxIssue'

export type PropertyTaxDemoScenarioId =
  | 'assessment_vab'
  | 'buyer_tax_estimate'
  | 'tax_deed_surplus'

export type PropertyTaxDemoScenarioTag =
  | 'Assessment / VAB'
  | 'Buyer Tax-Estimate Risk'
  | 'Delinquent Tax / Tax Deed'

export type PropertyTaxDemoScenario = {
  id: PropertyTaxDemoScenarioId
  /** Prospect-facing scenario title. */
  title: string
  /** One-sentence plain-English purpose. */
  purpose: string
  tag: PropertyTaxDemoScenarioTag
  issueKind: DemoPropertyTaxIssueKind
  matterId: string
  fileId: string
  intakeToken: string
  intakeLeadId: string
  portalToken: string
  clientName: string
  matterHref: string
  intakeHref: string
}

/** Stable intake tokens for property-tax demo scenarios (reset-safe seed). */
export const PROPERTY_TAX_DEMO_INTAKE_TOKENS = {
  assessmentVab: 'demo-token-seed-003',
  buyerTaxEstimate: 'demo-token-seed-004',
  taxDeedSurplus: 'demo-token-seed-005',
} as const

export const PROPERTY_TAX_DEMO_SCENARIOS_SECTION_TITLE =
  'Florida Property-Tax & Tax-Deed Demo Scenarios'

export const PROPERTY_TAX_DEMO_SCENARIOS_DISCLAIMER =
  'Fictional examples for workflow demonstration. The product organizes intake facts and review; it does not provide legal or tax advice.'

export const PROPERTY_TAX_DEMO_FICTIONAL_LABEL = 'Demo data is fictional'

/** Landing + walkthrough registry (deterministic, reset-safe ids). */
export const PROPERTY_TAX_DEMO_SCENARIOS: readonly PropertyTaxDemoScenario[] = [
  {
    id: 'assessment_vab',
    title: 'Assessment Review — Bayview Residence',
    purpose:
      'Show a Florida homeowner who reports an assessment that appears too high and a TRIM / possible VAB issue for firm fact collection.',
    tag: 'Assessment / VAB',
    issueKind: 'assessment_vab',
    matterId: 'matter-005',
    fileId: 'FL-2026-007',
    intakeToken: PROPERTY_TAX_DEMO_INTAKE_TOKENS.assessmentVab,
    intakeLeadId: 'intake-lead-seed-003',
    portalToken: 'demo-portal-matter-005',
    clientName: 'Jordan Hale (Demo)',
    matterHref: '/demo/matters?matter=FL-2026-007',
    intakeHref: `/demo/intake/${PROPERTY_TAX_DEMO_INTAKE_TOKENS.assessmentVab}`,
  },
  {
    id: 'buyer_tax_estimate',
    title: 'Investor Purchase — Post-Closing Tax Estimate Review',
    purpose:
      'Show a Florida investor/LLC buyer where the seller’s current tax bill may not be suitable as the buyer’s future tax estimate.',
    tag: 'Buyer Tax-Estimate Risk',
    issueKind: 'ownership_change_tax_risk',
    matterId: 'matter-006',
    fileId: 'FL-2026-008',
    intakeToken: PROPERTY_TAX_DEMO_INTAKE_TOKENS.buyerTaxEstimate,
    intakeLeadId: 'intake-lead-seed-004',
    portalToken: 'demo-portal-matter-006',
    clientName: 'Bayflip Holdings LLC (Demo)',
    matterHref: '/demo/matters?matter=FL-2026-008',
    intakeHref: `/demo/intake/${PROPERTY_TAX_DEMO_INTAKE_TOKENS.buyerTaxEstimate}`,
  },
  {
    id: 'tax_deed_surplus',
    title: 'Tax-Deed Notice — Potential Surplus-Proceeds Review',
    purpose:
      'Show a former-owner/heir client who reports a tax-deed-related notice and needs organized facts, documents, dates, and attorney review.',
    tag: 'Delinquent Tax / Tax Deed',
    issueKind: 'delinquent_tax_deed_surplus',
    matterId: 'matter-007',
    fileId: 'FL-2026-009',
    intakeToken: PROPERTY_TAX_DEMO_INTAKE_TOKENS.taxDeedSurplus,
    intakeLeadId: 'intake-lead-seed-005',
    portalToken: 'demo-portal-matter-007',
    clientName: 'Riley Quinn (Demo)',
    matterHref: '/demo/matters?matter=FL-2026-009',
    intakeHref: `/demo/intake/${PROPERTY_TAX_DEMO_INTAKE_TOKENS.taxDeedSurplus}`,
  },
] as const

export function getPropertyTaxDemoScenario(
  id: PropertyTaxDemoScenarioId,
): PropertyTaxDemoScenario {
  const found = PROPERTY_TAX_DEMO_SCENARIOS.find((s) => s.id === id)
  if (!found) throw new Error(`Unknown property-tax demo scenario: ${id}`)
  return found
}

/** Scenario 1 — Assessment / VAB only. */
export function buildAssessmentVabDemoPropertyTaxIssue(): DemoPropertyTaxIssue {
  return createEmptyPropertyTaxIssue({
    involvement: 'yes',
    kinds: ['assessment_vab'],
    floridaCounty: 'Sample Coastal County (fictional demo)',
    parcelOrFolio: 'DEMO-FOLIO-1001-BV',
    clientIssueDescription:
      'Client reports the Sample Coastal County (fictional) assessment for the Bayview demo residence appears too high and has a TRIM notice. Demo sample only — not a legal claim.',
    opposingPartyOrAgency: 'Sample Coastal County Property Appraiser (fictional demo)',
    internalNotes:
      'Demo next step: Request available assessment records and verify reported dates for attorney review. Not a validity determination.',
    byKind: {
      assessment_vab: createEmptyAssessmentVabIssue({
        status: 'needs_more_info',
        notes: 'TRIM available; Property Appraiser correspondence and valuation support still unknown/unavailable.',
        parcelOrFolio: 'DEMO-FOLIO-1001-BV',
        noticeReceived: true,
        reportedIssueType: 'assessed_value',
        vabPetitionFiled: null,
        trimNoticeDate: { date: '2026-08-18', source: 'client_reported' },
        vabHearingDate: { date: '2026-10-22', source: 'documented' },
        availableDocumentIds: ['ptx-trim-notice'],
      }),
    },
  })
}

/** Scenario 2 — Buyer tax-estimate risk only. */
export function buildBuyerTaxEstimateDemoPropertyTaxIssue(): DemoPropertyTaxIssue {
  return createEmptyPropertyTaxIssue({
    involvement: 'yes',
    kinds: ['ownership_change_tax_risk'],
    floridaCounty: 'Demo Lakefront County (fictional)',
    parcelOrFolio: 'DEMO-PARCEL-88-FLIP',
    clientIssueDescription:
      'Investor/LLC buyer may be relying on the seller’s current homestead tax bill as a post-closing estimate. Demo sample only — no tax projection.',
    opposingPartyOrAgency: '',
    internalNotes:
      'Demo next step: Confirm buyer use and review available tax records before relying on the seller’s current tax information. Not a reassessment estimate.',
    byKind: {
      ownership_change_tax_risk: createEmptyOwnershipChangeTaxRiskIssue({
        status: 'in_progress',
        notes: 'Current tax bill/TRIM reported available; purchase/closing worksheet not yet confirmed.',
        parcelOrFolio: 'DEMO-PARCEL-88-FLIP',
        buyerIntendedUse: 'flipper_investor',
        sellerHomesteadStatus: 'yes',
        taxBillOrTrimAvailable: true,
        relyingOnSellerCurrentBill: true,
        closingOrTransferDate: { date: '2026-04-30', source: 'firm_verified' },
        availableDocumentIds: ['ptx-trim-notice'],
      }),
    },
  })
}

/** Scenario 3 — Delinquent tax / tax deed / surplus only. */
export function buildTaxDeedSurplusDemoPropertyTaxIssue(): DemoPropertyTaxIssue {
  return createEmptyPropertyTaxIssue({
    involvement: 'yes',
    kinds: ['delinquent_tax_deed_surplus'],
    floridaCounty: 'Fictional Pine Ridge County (demo)',
    parcelOrFolio: 'DEMO-TAXDEED-4419',
    clientIssueDescription:
      'Former owner / heir reports a tax-deed sale and clerk surplus-proceeds notice. Demo sample only — not an entitlement claim.',
    opposingPartyOrAgency: 'Fictional Pine Ridge County Clerk (demo)',
    internalNotes:
      'Demo next step: Obtain supporting ownership and notice records, and verify the recorded date for attorney review. Not a surplus-eligibility determination.',
    byKind: {
      delinquent_tax_deed_surplus: createEmptyDelinquentTaxDeedSurplusIssue({
        status: 'ready_for_attorney_review',
        notes: 'Clerk surplus notice available; title/lien and probate/heirship documents unknown.',
        parcelOrFolio: 'DEMO-TAXDEED-4419',
        taxCertificateOrDeedCaseRef: 'DEMO-TD-2026-00419 (fictional)',
        situations: ['tax_deed_sale', 'clerk_surplus_notice'],
        clientRole: 'heir_personal_representative',
        taxDeedSaleDate: { date: '2026-03-12', source: 'documented' },
        surplusNoticeDate: { date: '2026-03-28', source: 'documented' },
        surplusNoticeDeadlineDate: { date: '2026-05-15', source: 'documented' },
        availableDocumentIds: ['ptx-surplus-notice'],
      }),
    },
  })
}

export function buildPropertyTaxIssueForScenario(id: PropertyTaxDemoScenarioId): DemoPropertyTaxIssue {
  switch (id) {
    case 'assessment_vab':
      return buildAssessmentVabDemoPropertyTaxIssue()
    case 'buyer_tax_estimate':
      return buildBuyerTaxEstimateDemoPropertyTaxIssue()
    case 'tax_deed_surplus':
      return buildTaxDeedSurplusDemoPropertyTaxIssue()
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

function baseMatterFields(scenario: PropertyTaxDemoScenario): Pick<
  DemoMatter,
  | 'id'
  | 'file_id'
  | 'deletedAt'
  | 'portal_token'
  | 'assignedAttorney'
  | 'assignedParalegal'
  | 'referralSource'
> {
  return {
    id: scenario.matterId,
    file_id: scenario.fileId,
    deletedAt: null,
    portal_token: scenario.portalToken,
    assignedAttorney: 'Katherine Ruiz, Esq.',
    assignedParalegal: 'Emma Kline',
    referralSource: 'Demo scenario seed — fictional',
  }
}

/** Staff-ready seeded matters for the three property-tax demo scenarios. */
export function buildPropertyTaxDemoScenarioMatters(): DemoMatter[] {
  const assessment = getPropertyTaxDemoScenario('assessment_vab')
  const buyer = getPropertyTaxDemoScenario('buyer_tax_estimate')
  const taxDeed = getPropertyTaxDemoScenario('tax_deed_surplus')

  return [
    {
      ...baseMatterFields(assessment),
      status: 'Title Search',
      matter_type: 'Cash Residential Purchase',
      property: {
        address: '418 Bayview Sample Lane, Sample City, FL 32001',
        county: 'Sample Coastal County (fictional demo)',
        property_type: 'Single-Family Home',
      },
      buyer: {
        id: 'buyer-005',
        name: assessment.clientName,
        type: 'individual',
        email: 'jordan.hale+demo@example.com',
        phone: '(352) 555-0107',
      },
      seller: {
        id: 'seller-005',
        name: 'Cedar Grove Sample Trust (Demo)',
        type: 'entity',
        email: 'trustee+bayview-demo@example.com',
        phone: '(352) 555-0188',
      },
      transactionType: 'Purchase',
      purchasePrice: 412000,
      financingType: 'Cash',
      loanNumber: '',
      lenderName: '',
      lenderEmail: '',
      buyerEmail: 'jordan.hale+demo@example.com',
      buyerPhone: '(352) 555-0107',
      sellerEmail: 'trustee+bayview-demo@example.com',
      sellerPhone: '(352) 555-0188',
      buyerAgent: 'Demo Agent — North Shore',
      listingAgent: 'Demo Listing — Bayview',
      contractDate: '2026-08-01',
      inspectionDeadline: '2026-08-15',
      financingDeadline: '',
      titleCommitmentDeadline: '2026-09-01',
      possessionDate: '2026-09-15',
      fileOpenedDate: '2026-08-05',
      hoaFlag: false,
      specialNotes: `${PROPERTY_TAX_DEMO_FICTIONAL_LABEL}. Scenario: ${assessment.title}. Sample dates are demo facts, not legal deadlines.`,
      propertyTaxIssue: buildAssessmentVabDemoPropertyTaxIssue(),
      key_dates: {
        effective_date: '2026-08-01',
        inspection_deadline: '2026-08-15',
        loan_approval_deadline: '2026-08-20',
        closing_date: '2026-09-15',
      },
      tasks: [
        { id: 't-005-1', title: 'Receive executed contract', status: 'completed', deletedAt: null },
        { id: 't-005-2', title: 'Open file & send welcome email', status: 'completed', deletedAt: null },
        {
          id: 't-005-3',
          title: 'Collect assessment / TRIM records for attorney review (demo)',
          status: 'in_progress',
          deletedAt: null,
        },
        { id: 't-005-4', title: 'Order title search', status: 'not_started', deletedAt: null },
      ],
      timeline: [
        {
          id: 'e-005-1',
          at: '2026-08-05 10:12',
          note: 'Demo matter opened — Assessment / VAB property-tax branch seeded for walkthrough.',
          deletedAt: null,
        },
      ],
    },
    {
      ...baseMatterFields(buyer),
      status: 'Title Search',
      matter_type: 'Cash Residential Purchase',
      property: {
        address: '902 Flipper Sample Loop, Demo Lakes, FL 32712',
        county: 'Demo Lakefront County (fictional)',
        property_type: 'Single-Family Home',
      },
      buyer: {
        id: 'buyer-006',
        name: buyer.clientName,
        type: 'entity',
        email: 'closings+bayflip-demo@example.com',
        phone: '(407) 555-0142',
      },
      seller: {
        id: 'seller-006',
        name: 'Morgan Ellis (Demo Homestead Seller)',
        type: 'individual',
        email: 'morgan.ellis+demo@example.com',
        phone: '(407) 555-0191',
      },
      transactionType: 'Purchase',
      purchasePrice: 275000,
      financingType: 'Cash',
      loanNumber: '',
      lenderName: '',
      lenderEmail: '',
      buyerEmail: 'closings+bayflip-demo@example.com',
      buyerPhone: '(407) 555-0142',
      sellerEmail: 'morgan.ellis+demo@example.com',
      sellerPhone: '(407) 555-0191',
      buyerAgent: 'Demo Investor Desk',
      listingAgent: 'Demo Lakes Listing',
      contractDate: '2026-04-02',
      inspectionDeadline: '2026-04-16',
      financingDeadline: '',
      titleCommitmentDeadline: '2026-04-22',
      possessionDate: '2026-04-30',
      fileOpenedDate: '2026-04-03',
      hoaFlag: false,
      specialNotes: `${PROPERTY_TAX_DEMO_FICTIONAL_LABEL}. Scenario: ${buyer.title}. Firm-verified closing date is an internal tracked fact, not a tax prediction.`,
      propertyTaxIssue: buildBuyerTaxEstimateDemoPropertyTaxIssue(),
      key_dates: {
        effective_date: '2026-04-02',
        inspection_deadline: '2026-04-16',
        loan_approval_deadline: '2026-04-20',
        closing_date: '2026-04-30',
      },
      tasks: [
        { id: 't-006-1', title: 'Receive executed contract', status: 'completed', deletedAt: null },
        { id: 't-006-2', title: 'Open file & send welcome email', status: 'completed', deletedAt: null },
        {
          id: 't-006-3',
          title: 'Review seller tax bill reliance facts (demo)',
          status: 'in_progress',
          deletedAt: null,
        },
        { id: 't-006-4', title: 'Schedule signing', status: 'not_started', deletedAt: null },
      ],
      timeline: [
        {
          id: 'e-006-1',
          at: '2026-04-03 11:40',
          note: 'Demo matter opened — Buyer tax-estimate risk branch seeded for walkthrough.',
          deletedAt: null,
        },
      ],
    },
    {
      ...baseMatterFields(taxDeed),
      status: 'Intake',
      matter_type: 'Cash Residential Purchase',
      property: {
        address: '77 Surplus Sample Trail, Pine Ridge Demo, FL 32148',
        county: 'Fictional Pine Ridge County (demo)',
        property_type: 'Single-Family Home',
      },
      buyer: {
        id: 'buyer-007',
        name: 'Sample Tax-Deed Purchaser LLC (Demo)',
        type: 'entity',
        email: 'purchaser+taxdeed-demo@example.com',
        phone: '(386) 555-0111',
      },
      seller: {
        id: 'seller-007',
        name: taxDeed.clientName,
        type: 'individual',
        email: 'riley.quinn+demo@example.com',
        phone: '(386) 555-0166',
      },
      transactionType: 'Sale',
      purchasePrice: 0,
      financingType: 'Cash',
      loanNumber: '',
      lenderName: '',
      lenderEmail: '',
      buyerEmail: 'purchaser+taxdeed-demo@example.com',
      buyerPhone: '(386) 555-0111',
      sellerEmail: 'riley.quinn+demo@example.com',
      sellerPhone: '(386) 555-0166',
      buyerAgent: '',
      listingAgent: '',
      contractDate: '',
      inspectionDeadline: '',
      financingDeadline: '',
      titleCommitmentDeadline: '',
      possessionDate: '',
      fileOpenedDate: '2026-04-01',
      hoaFlag: false,
      specialNotes: `${PROPERTY_TAX_DEMO_FICTIONAL_LABEL}. Scenario: ${taxDeed.title}. Notice-stated deadline is documented for review — firm verification required. Not an entitlement determination.`,
      propertyTaxIssue: buildTaxDeedSurplusDemoPropertyTaxIssue(),
      key_dates: {
        effective_date: '2026-03-12',
        inspection_deadline: '',
        loan_approval_deadline: '',
        closing_date: '',
      },
      tasks: [
        { id: 't-007-1', title: 'Open intake file', status: 'completed', deletedAt: null },
        {
          id: 't-007-2',
          title: 'Collect surplus notice and ownership records for attorney review (demo)',
          status: 'in_progress',
          deletedAt: null,
        },
        { id: 't-007-3', title: 'Route attorney review', status: 'not_started', deletedAt: null },
      ],
      timeline: [
        {
          id: 'e-007-1',
          at: '2026-04-01 09:05',
          note: 'Demo matter opened — Tax-deed / surplus-proceeds branch seeded for walkthrough.',
          deletedAt: null,
        },
      ],
    },
  ]
}

/** Pending client intake leads paired with each staff-ready scenario matter. */
export function buildPropertyTaxDemoScenarioIntakeLeads(): DemoIntakeLead[] {
  const assessment = getPropertyTaxDemoScenario('assessment_vab')
  const buyer = getPropertyTaxDemoScenario('buyer_tax_estimate')
  const taxDeed = getPropertyTaxDemoScenario('tax_deed_surplus')

  return [
    {
      id: assessment.intakeLeadId,
      token: assessment.intakeToken,
      createdAt: '2026-08-04T15:00:00.000Z',
      fileReference: assessment.fileId,
      emailRecipientName: assessment.clientName,
      emailRecipientEmail: 'jordan.hale+demo@example.com',
      emailSubject: `Intake form — ${assessment.fileId} (Assessment / VAB demo)`,
      emailBody: '',
      demoDelivery: 'link_saved',
      intake: {
        clientName: assessment.clientName,
        clientEmail: 'jordan.hale+demo@example.com',
        clientPhone: '(352) 555-0107',
        transactionRole: 'buyer',
        transactionRoleOther: '',
        matterType: 'Cash Residential Purchase',
        propertyAddress: '418 Bayview Sample Lane, Sample City, FL 32001',
        propertyType: 'Single-Family Home',
        county: 'Sample Coastal County (fictional demo)',
        targetClosingDate: '2026-09-15',
        notes: `${PROPERTY_TAX_DEMO_FICTIONAL_LABEL}. ${assessment.title}.`,
        buyerType: 'individual',
        propertyTaxIssue: buildAssessmentVabDemoPropertyTaxIssue(),
      },
      status: 'pending_client',
      clientSubmittedAt: null,
      submittedIntake: null,
      conflict_check_status: 'pending',
      conflict_check_completed_at: null,
      conflict_check_note: null,
    },
    {
      id: buyer.intakeLeadId,
      token: buyer.intakeToken,
      createdAt: '2026-04-02T16:20:00.000Z',
      fileReference: buyer.fileId,
      emailRecipientName: buyer.clientName,
      emailRecipientEmail: 'closings+bayflip-demo@example.com',
      emailSubject: `Intake form — ${buyer.fileId} (Buyer tax-estimate demo)`,
      emailBody: '',
      demoDelivery: 'link_saved',
      intake: {
        clientName: buyer.clientName,
        clientEmail: 'closings+bayflip-demo@example.com',
        clientPhone: '(407) 555-0142',
        transactionRole: 'buyer',
        transactionRoleOther: '',
        matterType: 'Cash Residential Purchase',
        propertyAddress: '902 Flipper Sample Loop, Demo Lakes, FL 32712',
        propertyType: 'Single-Family Home',
        county: 'Demo Lakefront County (fictional)',
        targetClosingDate: '2026-04-30',
        notes: `${PROPERTY_TAX_DEMO_FICTIONAL_LABEL}. ${buyer.title}.`,
        buyerType: 'entity',
        propertyTaxIssue: buildBuyerTaxEstimateDemoPropertyTaxIssue(),
      },
      status: 'pending_client',
      clientSubmittedAt: null,
      submittedIntake: null,
      conflict_check_status: 'pending',
      conflict_check_completed_at: null,
      conflict_check_note: null,
    },
    {
      id: taxDeed.intakeLeadId,
      token: taxDeed.intakeToken,
      createdAt: '2026-03-30T12:00:00.000Z',
      fileReference: taxDeed.fileId,
      emailRecipientName: taxDeed.clientName,
      emailRecipientEmail: 'riley.quinn+demo@example.com',
      emailSubject: `Intake form — ${taxDeed.fileId} (Tax-deed / surplus demo)`,
      emailBody: '',
      demoDelivery: 'link_saved',
      intake: {
        clientName: taxDeed.clientName,
        clientEmail: 'riley.quinn+demo@example.com',
        clientPhone: '(386) 555-0166',
        transactionRole: 'other',
        transactionRoleOther: 'Former owner / heir (demo)',
        matterType: 'Cash Residential Purchase',
        propertyAddress: '77 Surplus Sample Trail, Pine Ridge Demo, FL 32148',
        propertyType: 'Single-Family Home',
        county: 'Fictional Pine Ridge County (demo)',
        targetClosingDate: '',
        notes: `${PROPERTY_TAX_DEMO_FICTIONAL_LABEL}. ${taxDeed.title}.`,
        buyerType: 'individual',
        propertyTaxIssue: buildTaxDeedSurplusDemoPropertyTaxIssue(),
      },
      status: 'pending_client',
      clientSubmittedAt: null,
      submittedIntake: null,
      conflict_check_status: 'pending',
      conflict_check_completed_at: null,
      conflict_check_note: null,
    },
  ]
}

export function getPropertyTaxDemoScenarioKindLabel(id: PropertyTaxDemoScenarioId): string {
  return getPropertyTaxIssueKindLabel(getPropertyTaxDemoScenario(id).issueKind)
}

/** Helper for tests: stated-deadline banner copy for scenario 3. */
export function getTaxDeedSurplusDemoStatedDeadlineBanner(): string | null {
  const issue = normalizePropertyTaxIssue(buildTaxDeedSurplusDemoPropertyTaxIssue())
  const dated = issue.byKind.delinquent_tax_deed_surplus?.surplusNoticeDeadlineDate
  if (!dated) return null
  return getPropertyTaxStatedDeadlineBanner(dated)
}
