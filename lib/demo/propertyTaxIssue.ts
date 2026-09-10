/**
 * Florida property-tax / tax-deed issue helpers (demo).
 *
 * Organizes facts and suggested workflows only. Does not:
 * - give legal or tax advice
 * - calculate savings, reassessment, portability, redemption, surplus, or lien priority
 * - file VAB / tax-certificate / tax-deed / surplus claims
 * - judge whether a notice is legally sufficient
 * - compute universal Florida statutory deadlines
 */
import type {
  DemoPropertyTaxAssessmentReportedIssueType,
  DemoPropertyTaxAssessmentVabIssue,
  DemoPropertyTaxBuyerIntendedUse,
  DemoPropertyTaxDateSource,
  DemoPropertyTaxDatedValue,
  DemoPropertyTaxDelinquentClientRole,
  DemoPropertyTaxDelinquentSituation,
  DemoPropertyTaxDelinquentTaxDeedSurplusIssue,
  DemoPropertyTaxInvolvementAnswer,
  DemoPropertyTaxIssue,
  DemoPropertyTaxIssueByKind,
  DemoPropertyTaxIssueKind,
  DemoPropertyTaxIssueStatus,
  DemoPropertyTaxOwnershipChangeTaxRiskIssue,
  DemoPropertyTaxTriState,
} from '@/lib/demo/types'
import { isFloridaPropertyAddress } from '@/lib/demo/condoDiligence'

export const DEMO_PROPERTY_TAX_ISSUE_KINDS: readonly DemoPropertyTaxIssueKind[] = [
  'assessment_vab',
  'ownership_change_tax_risk',
  'delinquent_tax_deed_surplus',
] as const

export const DEMO_PROPERTY_TAX_DATE_SOURCES: readonly DemoPropertyTaxDateSource[] = [
  'client_reported',
  'documented',
  'firm_verified',
  'unknown',
] as const

export const DEMO_PROPERTY_TAX_ISSUE_STATUSES: readonly DemoPropertyTaxIssueStatus[] = [
  'not_started',
  'in_progress',
  'needs_more_info',
  'ready_for_attorney_review',
] as const

/** Soft urgency window (days) for UI hints only — not a statutory rule. */
export const PROPERTY_TAX_SOFT_URGENCY_DAYS = 14

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export type DemoPropertyTaxDocumentChecklistItem = {
  id: string
  kind: DemoPropertyTaxIssueKind
  title: string
  /** Suggested demo document category — staff may change when creating a request. */
  category: 'Contract' | 'Title' | 'Closing' | 'Compliance' | 'Post-Closing'
}

export type DemoPropertyTaxDateFieldDef = {
  key: string
  label: string
}

export function createDefaultPropertyTaxDatedValue(
  overrides: Partial<DemoPropertyTaxDatedValue> = {},
): DemoPropertyTaxDatedValue {
  return emptyDated(overrides)
}

function emptyDated(overrides?: Partial<DemoPropertyTaxDatedValue>): DemoPropertyTaxDatedValue {
  const date =
    overrides && 'date' in overrides ? parseOrNullIsoDateOnly(overrides.date ?? null) : null
  const source =
    overrides && isPropertyTaxDateSource(overrides.source) ? overrides.source : 'unknown'
  return { date, source }
}

export function createEmptyAssessmentVabIssue(
  overrides: Partial<Omit<DemoPropertyTaxAssessmentVabIssue, 'kind'>> = {},
): DemoPropertyTaxAssessmentVabIssue {
  return {
    kind: 'assessment_vab',
    status: isPropertyTaxIssueStatus(overrides.status) ? overrides.status : 'not_started',
    notes: typeof overrides.notes === 'string' ? overrides.notes : '',
    parcelOrFolio: typeof overrides.parcelOrFolio === 'string' ? overrides.parcelOrFolio : '',
    noticeReceived: normalizeNullableBoolean(overrides.noticeReceived),
    reportedIssueType: isAssessmentReportedIssueType(overrides.reportedIssueType)
      ? overrides.reportedIssueType
      : 'unknown',
    vabPetitionFiled: normalizeNullableBoolean(overrides.vabPetitionFiled),
    trimNoticeDate: emptyDated(overrides.trimNoticeDate),
    vabFilingDate: emptyDated(overrides.vabFilingDate),
    vabHearingDate: emptyDated(overrides.vabHearingDate),
    availableDocumentIds: normalizeStringIdList(overrides.availableDocumentIds),
  }
}

export function createEmptyOwnershipChangeTaxRiskIssue(
  overrides: Partial<Omit<DemoPropertyTaxOwnershipChangeTaxRiskIssue, 'kind'>> = {},
): DemoPropertyTaxOwnershipChangeTaxRiskIssue {
  return {
    kind: 'ownership_change_tax_risk',
    status: isPropertyTaxIssueStatus(overrides.status) ? overrides.status : 'not_started',
    notes: typeof overrides.notes === 'string' ? overrides.notes : '',
    parcelOrFolio: typeof overrides.parcelOrFolio === 'string' ? overrides.parcelOrFolio : '',
    buyerIntendedUse: isBuyerIntendedUse(overrides.buyerIntendedUse)
      ? overrides.buyerIntendedUse
      : 'unknown',
    sellerHomesteadStatus: isTriState(overrides.sellerHomesteadStatus)
      ? overrides.sellerHomesteadStatus
      : 'unknown',
    taxBillOrTrimAvailable: normalizeNullableBoolean(overrides.taxBillOrTrimAvailable),
    relyingOnSellerCurrentBill: normalizeNullableBoolean(overrides.relyingOnSellerCurrentBill),
    closingOrTransferDate: emptyDated(overrides.closingOrTransferDate),
    estimatedTaxBillDate: emptyDated(overrides.estimatedTaxBillDate),
    availableDocumentIds: normalizeStringIdList(overrides.availableDocumentIds),
  }
}

export function createEmptyDelinquentTaxDeedSurplusIssue(
  overrides: Partial<Omit<DemoPropertyTaxDelinquentTaxDeedSurplusIssue, 'kind'>> = {},
): DemoPropertyTaxDelinquentTaxDeedSurplusIssue {
  return {
    kind: 'delinquent_tax_deed_surplus',
    status: isPropertyTaxIssueStatus(overrides.status) ? overrides.status : 'not_started',
    notes: typeof overrides.notes === 'string' ? overrides.notes : '',
    parcelOrFolio: typeof overrides.parcelOrFolio === 'string' ? overrides.parcelOrFolio : '',
    taxCertificateOrDeedCaseRef:
      typeof overrides.taxCertificateOrDeedCaseRef === 'string' ? overrides.taxCertificateOrDeedCaseRef : '',
    situations: normalizeDelinquentSituations(overrides.situations),
    clientRole: isDelinquentClientRole(overrides.clientRole) ? overrides.clientRole : 'unknown',
    taxCertificateDate: emptyDated(overrides.taxCertificateDate),
    taxDeedApplicationDate: emptyDated(overrides.taxDeedApplicationDate),
    taxDeedSaleDate: emptyDated(overrides.taxDeedSaleDate),
    surplusNoticeDate: emptyDated(overrides.surplusNoticeDate),
    surplusNoticeDeadlineDate: emptyDated(overrides.surplusNoticeDeadlineDate),
    availableDocumentIds: normalizeStringIdList(overrides.availableDocumentIds),
  }
}

/** Persistence-safe default (inactive branch). */
export function createEmptyPropertyTaxIssue(
  overrides: Partial<DemoPropertyTaxIssue> = {},
): DemoPropertyTaxIssue {
  const involvement = normalizeInvolvementAnswer(overrides.involvement, overrides.enabled)
  const enabled = involvement === 'yes' || involvement === 'unknown'
  const kinds = enabled ? normalizePropertyTaxIssueKinds(overrides.kinds) : []
  const byKind = enabled ? normalizePropertyTaxIssueByKind(overrides.byKind, kinds) : {}
  return {
    enabled,
    involvement,
    kinds,
    byKind,
    floridaCounty: typeof overrides.floridaCounty === 'string' ? overrides.floridaCounty : '',
    parcelOrFolio: typeof overrides.parcelOrFolio === 'string' ? overrides.parcelOrFolio : '',
    clientIssueDescription:
      typeof overrides.clientIssueDescription === 'string' ? overrides.clientIssueDescription : '',
    opposingPartyOrAgency:
      typeof overrides.opposingPartyOrAgency === 'string' ? overrides.opposingPartyOrAgency : '',
    internalNotes: typeof overrides.internalNotes === 'string' ? overrides.internalNotes : '',
  }
}

/**
 * Normalize unknown/partial persisted JSON into a safe `DemoPropertyTaxIssue`.
 * Missing/invalid input → inactive empty issue (does not invent involvement=yes).
 */
export function normalizePropertyTaxIssue(input: unknown): DemoPropertyTaxIssue {
  if (!input || typeof input !== 'object') {
    return createEmptyPropertyTaxIssue()
  }
  const raw = input as Partial<DemoPropertyTaxIssue> & { enabled?: boolean }
  return createEmptyPropertyTaxIssue({
    enabled: raw.enabled === true,
    involvement: raw.involvement,
    kinds: Array.isArray(raw.kinds) ? raw.kinds : [],
    byKind: raw.byKind && typeof raw.byKind === 'object' ? raw.byKind : {},
    floridaCounty: typeof raw.floridaCounty === 'string' ? raw.floridaCounty : '',
    parcelOrFolio: typeof raw.parcelOrFolio === 'string' ? raw.parcelOrFolio : '',
    clientIssueDescription:
      typeof raw.clientIssueDescription === 'string' ? raw.clientIssueDescription : '',
    opposingPartyOrAgency:
      typeof raw.opposingPartyOrAgency === 'string' ? raw.opposingPartyOrAgency : '',
    internalNotes: typeof raw.internalNotes === 'string' ? raw.internalNotes : '',
  })
}

function normalizeInvolvementAnswer(
  involvement: unknown,
  enabledFallback: unknown,
): DemoPropertyTaxInvolvementAnswer {
  if (involvement === 'yes' || involvement === 'no' || involvement === 'unknown') return involvement
  // Legacy Step 1 payloads only had `enabled`
  return enabledFallback === true ? 'yes' : 'no'
}

function normalizeNullableBoolean(value: unknown): boolean | null {
  if (value === true || value === false || value === null) return value
  return null
}

function normalizeStringIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string' || !item.trim() || seen.has(item)) continue
    seen.add(item)
    out.push(item)
  }
  return out
}

export function isAssessmentReportedIssueType(
  value: unknown,
): value is DemoPropertyTaxAssessmentReportedIssueType {
  return (
    value === 'assessed_value' ||
    value === 'exemption' ||
    value === 'classification' ||
    value === 'portability' ||
    value === 'other' ||
    value === 'unknown'
  )
}

export function isBuyerIntendedUse(value: unknown): value is DemoPropertyTaxBuyerIntendedUse {
  return (
    value === 'owner_occupant' ||
    value === 'flipper_investor' ||
    value === 'rental_landlord' ||
    value === 'llc_entity' ||
    value === 'other' ||
    value === 'unknown'
  )
}

export function isTriState(value: unknown): value is DemoPropertyTaxTriState {
  return value === 'yes' || value === 'no' || value === 'unknown'
}

export function isDelinquentClientRole(value: unknown): value is DemoPropertyTaxDelinquentClientRole {
  return (
    value === 'current_owner' ||
    value === 'former_owner' ||
    value === 'heir_personal_representative' ||
    value === 'buyer_investor' ||
    value === 'lienholder' ||
    value === 'tax_certificate_holder' ||
    value === 'other' ||
    value === 'unknown'
  )
}

export function isDelinquentSituation(value: unknown): value is DemoPropertyTaxDelinquentSituation {
  return (
    value === 'unpaid_delinquent_taxes' ||
    value === 'tax_certificate' ||
    value === 'redemption' ||
    value === 'tax_deed_application' ||
    value === 'tax_deed_sale' ||
    value === 'clerk_surplus_notice' ||
    value === 'other_unknown'
  )
}

function normalizeDelinquentSituations(value: unknown): DemoPropertyTaxDelinquentSituation[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<DemoPropertyTaxDelinquentSituation>()
  const out: DemoPropertyTaxDelinquentSituation[] = []
  for (const item of value) {
    if (!isDelinquentSituation(item) || seen.has(item)) continue
    seen.add(item)
    out.push(item)
  }
  return out
}

export function isPropertyTaxIssueKind(value: unknown): value is DemoPropertyTaxIssueKind {
  return (
    value === 'assessment_vab' ||
    value === 'ownership_change_tax_risk' ||
    value === 'delinquent_tax_deed_surplus'
  )
}

export function isPropertyTaxDateSource(value: unknown): value is DemoPropertyTaxDateSource {
  return (
    value === 'client_reported' ||
    value === 'documented' ||
    value === 'firm_verified' ||
    value === 'unknown'
  )
}

export function isPropertyTaxIssueStatus(value: unknown): value is DemoPropertyTaxIssueStatus {
  return (
    value === 'not_started' ||
    value === 'in_progress' ||
    value === 'needs_more_info' ||
    value === 'ready_for_attorney_review'
  )
}

export function normalizePropertyTaxIssueKinds(
  kinds: unknown,
): DemoPropertyTaxIssueKind[] {
  if (!Array.isArray(kinds)) return []
  const seen = new Set<DemoPropertyTaxIssueKind>()
  const out: DemoPropertyTaxIssueKind[] = []
  for (const k of kinds) {
    if (!isPropertyTaxIssueKind(k) || seen.has(k)) continue
    seen.add(k)
    out.push(k)
  }
  return out
}

function normalizePropertyTaxIssueByKind(
  byKind: unknown,
  kinds: DemoPropertyTaxIssueKind[],
): DemoPropertyTaxIssueByKind {
  const raw =
    byKind && typeof byKind === 'object' ? (byKind as DemoPropertyTaxIssueByKind) : {}
  const next: DemoPropertyTaxIssueByKind = {}
  for (const kind of kinds) {
    if (kind === 'assessment_vab') {
      next.assessment_vab = createEmptyAssessmentVabIssue(
        raw.assessment_vab && typeof raw.assessment_vab === 'object' ? raw.assessment_vab : {},
      )
    } else if (kind === 'ownership_change_tax_risk') {
      next.ownership_change_tax_risk = createEmptyOwnershipChangeTaxRiskIssue(
        raw.ownership_change_tax_risk && typeof raw.ownership_change_tax_risk === 'object'
          ? raw.ownership_change_tax_risk
          : {},
      )
    } else if (kind === 'delinquent_tax_deed_surplus') {
      next.delinquent_tax_deed_surplus = createEmptyDelinquentTaxDeedSurplusIssue(
        raw.delinquent_tax_deed_surplus && typeof raw.delinquent_tax_deed_surplus === 'object'
          ? raw.delinquent_tax_deed_surplus
          : {},
      )
    }
  }
  return next
}

/** Branch is active when involvement is yes/unknown (kinds may still be empty). */
export function isPropertyTaxBranchActive(issue: DemoPropertyTaxIssue | null | undefined): boolean {
  const n = normalizePropertyTaxIssue(issue)
  return n.involvement === 'yes' || n.involvement === 'unknown'
}

export function hasPropertyTaxIssueKind(
  issue: DemoPropertyTaxIssue | null | undefined,
  kind: DemoPropertyTaxIssueKind,
): boolean {
  return normalizePropertyTaxIssue(issue).kinds.includes(kind)
}

/**
 * Show the Florida property-tax intake section when the property address looks Florida.
 * Uses the same address heuristic as condo diligence eligibility.
 */
export function shouldShowPropertyTaxIntakeSection(propertyAddress: string): boolean {
  return isFloridaPropertyAddress(propertyAddress)
}

/**
 * Set parent Yes / No / Unknown. No clears kinds/byKind and deactivates the branch.
 * Yes/Unknown keep existing kinds when present; Unknown does not force a kind.
 */
export function setPropertyTaxInvolvement(
  issue: DemoPropertyTaxIssue | null | undefined,
  involvement: DemoPropertyTaxInvolvementAnswer,
): DemoPropertyTaxIssue {
  const current = normalizePropertyTaxIssue(issue)
  if (involvement === 'no') {
    return createEmptyPropertyTaxIssue({
      involvement: 'no',
      enabled: false,
      kinds: [],
      byKind: {},
      floridaCounty: current.floridaCounty,
      parcelOrFolio: current.parcelOrFolio,
      clientIssueDescription: current.clientIssueDescription,
      opposingPartyOrAgency: current.opposingPartyOrAgency,
      internalNotes: current.internalNotes,
    })
  }
  return createEmptyPropertyTaxIssue({
    ...current,
    involvement,
    enabled: true,
    kinds: current.kinds,
    byKind: current.byKind,
  })
}

/**
 * Add or remove a kind. Selecting a kind creates empty nested data; deselecting drops that nest.
 * Selecting a kind also sets involvement to `yes` if it was `no`.
 */
export function togglePropertyTaxIssueKind(
  issue: DemoPropertyTaxIssue | null | undefined,
  kind: DemoPropertyTaxIssueKind,
  selected: boolean,
): DemoPropertyTaxIssue {
  const current = normalizePropertyTaxIssue(issue)
  const set = new Set(current.kinds)
  if (selected) set.add(kind)
  else set.delete(kind)
  const kinds = DEMO_PROPERTY_TAX_ISSUE_KINDS.filter((k) => set.has(k))
  const involvement: DemoPropertyTaxInvolvementAnswer =
    current.involvement === 'no' && selected ? 'yes' : current.involvement === 'no' ? 'no' : current.involvement
  return createEmptyPropertyTaxIssue({
    ...current,
    involvement: kinds.length > 0 && involvement === 'no' ? 'yes' : involvement,
    kinds,
    byKind: current.byKind,
  })
}

/** Explicitly enable/disable the additive branch. */
export function setPropertyTaxIssueEnabled(
  issue: DemoPropertyTaxIssue | null | undefined,
  enabled: boolean,
): DemoPropertyTaxIssue {
  return setPropertyTaxInvolvement(issue, enabled ? 'yes' : 'no')
}

export function getPropertyTaxIssueKindLabel(kind: DemoPropertyTaxIssueKind): string {
  switch (kind) {
    case 'assessment_vab':
      return 'Assessment / exemption / classification / portability / VAB'
    case 'ownership_change_tax_risk':
      return 'Buyer tax-estimate risk after purchase or sale'
    case 'delinquent_tax_deed_surplus':
      return 'Delinquent tax / tax certificate / tax deed / redemption / surplus proceeds'
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

export const PROPERTY_TAX_INVOLVEMENT_OPTIONS: readonly {
  value: DemoPropertyTaxInvolvementAnswer
  label: string
}[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Unknown' },
] as const

export const PROPERTY_TAX_ASSESSMENT_REPORTED_ISSUE_OPTIONS: readonly {
  value: DemoPropertyTaxAssessmentReportedIssueType
  label: string
}[] = [
  { value: 'assessed_value', label: 'Assessed value' },
  { value: 'exemption', label: 'Exemption' },
  { value: 'classification', label: 'Classification' },
  { value: 'portability', label: 'Portability' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
] as const

export const PROPERTY_TAX_BUYER_INTENDED_USE_OPTIONS: readonly {
  value: DemoPropertyTaxBuyerIntendedUse
  label: string
}[] = [
  { value: 'owner_occupant', label: 'Owner-occupant' },
  { value: 'flipper_investor', label: 'Flipper / investor' },
  { value: 'rental_landlord', label: 'Rental / landlord' },
  { value: 'llc_entity', label: 'LLC / entity' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
] as const

export const PROPERTY_TAX_DELINQUENT_SITUATION_OPTIONS: readonly {
  value: DemoPropertyTaxDelinquentSituation
  label: string
}[] = [
  { value: 'unpaid_delinquent_taxes', label: 'Unpaid / delinquent taxes' },
  { value: 'tax_certificate', label: 'Tax certificate' },
  { value: 'redemption', label: 'Redemption' },
  { value: 'tax_deed_application', label: 'Tax-deed application' },
  { value: 'tax_deed_sale', label: 'Tax-deed sale' },
  { value: 'clerk_surplus_notice', label: 'Clerk surplus-proceeds notice' },
  { value: 'other_unknown', label: 'Other / unknown' },
] as const

export const PROPERTY_TAX_DELINQUENT_CLIENT_ROLE_OPTIONS: readonly {
  value: DemoPropertyTaxDelinquentClientRole
  label: string
}[] = [
  { value: 'current_owner', label: 'Current owner' },
  { value: 'former_owner', label: 'Former owner' },
  { value: 'heir_personal_representative', label: 'Heir / personal representative' },
  { value: 'buyer_investor', label: 'Buyer / investor' },
  { value: 'lienholder', label: 'Lienholder' },
  { value: 'tax_certificate_holder', label: 'Tax-certificate holder' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
] as const

export function getPropertyTaxDateSourceLabel(source: DemoPropertyTaxDateSource): string {
  switch (source) {
    case 'client_reported':
      return 'Client-reported'
    case 'documented':
      return 'Documented'
    case 'firm_verified':
      return 'Firm-verified'
    case 'unknown':
      return 'Unknown'
    default: {
      const _exhaustive: never = source
      return _exhaustive
    }
  }
}

export function nullableBoolFromTriState(value: DemoPropertyTaxTriState): boolean | null {
  if (value === 'yes') return true
  if (value === 'no') return false
  return null
}

export function triStateFromNullableBool(value: boolean | null | undefined): DemoPropertyTaxTriState {
  if (value === true) return 'yes'
  if (value === false) return 'no'
  return 'unknown'
}

export function togglePropertyTaxDelinquentSituation(
  issue: DemoPropertyTaxIssue | null | undefined,
  situation: DemoPropertyTaxDelinquentSituation,
  selected: boolean,
): DemoPropertyTaxIssue {
  const current = normalizePropertyTaxIssue(issue)
  const branch =
    current.byKind.delinquent_tax_deed_surplus ?? createEmptyDelinquentTaxDeedSurplusIssue()
  const set = new Set(branch.situations)
  if (selected) set.add(situation)
  else set.delete(situation)
  const situations = PROPERTY_TAX_DELINQUENT_SITUATION_OPTIONS.map((o) => o.value).filter((s) =>
    set.has(s),
  )
  return createEmptyPropertyTaxIssue({
    ...current,
    kinds: current.kinds.includes('delinquent_tax_deed_surplus')
      ? current.kinds
      : [...current.kinds, 'delinquent_tax_deed_surplus'],
    byKind: {
      ...current.byKind,
      delinquent_tax_deed_surplus: { ...branch, situations },
    },
  })
}

export function togglePropertyTaxAvailableDocument(
  issue: DemoPropertyTaxIssue | null | undefined,
  kind: DemoPropertyTaxIssueKind,
  documentId: string,
  selected: boolean,
): DemoPropertyTaxIssue {
  const current = normalizePropertyTaxIssue(issue)
  if (kind === 'assessment_vab') {
    const branch = current.byKind.assessment_vab ?? createEmptyAssessmentVabIssue()
    const ids = selected
      ? normalizeStringIdList([...branch.availableDocumentIds, documentId])
      : branch.availableDocumentIds.filter((id) => id !== documentId)
    return createEmptyPropertyTaxIssue({
      ...current,
      byKind: { ...current.byKind, assessment_vab: { ...branch, availableDocumentIds: ids } },
    })
  }
  if (kind === 'ownership_change_tax_risk') {
    const branch = current.byKind.ownership_change_tax_risk ?? createEmptyOwnershipChangeTaxRiskIssue()
    const ids = selected
      ? normalizeStringIdList([...branch.availableDocumentIds, documentId])
      : branch.availableDocumentIds.filter((id) => id !== documentId)
    return createEmptyPropertyTaxIssue({
      ...current,
      byKind: {
        ...current.byKind,
        ownership_change_tax_risk: { ...branch, availableDocumentIds: ids },
      },
    })
  }
  const branch = current.byKind.delinquent_tax_deed_surplus ?? createEmptyDelinquentTaxDeedSurplusIssue()
  const ids = selected
    ? normalizeStringIdList([...branch.availableDocumentIds, documentId])
    : branch.availableDocumentIds.filter((id) => id !== documentId)
  return createEmptyPropertyTaxIssue({
    ...current,
    byKind: {
      ...current.byKind,
      delinquent_tax_deed_surplus: { ...branch, availableDocumentIds: ids },
    },
  })
}

export function patchPropertyTaxSharedFields(
  issue: DemoPropertyTaxIssue | null | undefined,
  patch: Partial<
    Pick<
      DemoPropertyTaxIssue,
      'floridaCounty' | 'parcelOrFolio' | 'clientIssueDescription' | 'opposingPartyOrAgency' | 'internalNotes'
    >
  >,
): DemoPropertyTaxIssue {
  const current = normalizePropertyTaxIssue(issue)
  return createEmptyPropertyTaxIssue({ ...current, ...patch })
}

export function patchPropertyTaxAssessmentBranch(
  issue: DemoPropertyTaxIssue | null | undefined,
  patch: Partial<Omit<DemoPropertyTaxAssessmentVabIssue, 'kind'>>,
): DemoPropertyTaxIssue {
  const current = normalizePropertyTaxIssue(issue)
  const branch = current.byKind.assessment_vab ?? createEmptyAssessmentVabIssue()
  return createEmptyPropertyTaxIssue({
    ...current,
    kinds: current.kinds.includes('assessment_vab')
      ? current.kinds
      : [...current.kinds, 'assessment_vab'],
    byKind: {
      ...current.byKind,
      assessment_vab: createEmptyAssessmentVabIssue({ ...branch, ...patch }),
    },
  })
}

export function patchPropertyTaxOwnershipBranch(
  issue: DemoPropertyTaxIssue | null | undefined,
  patch: Partial<Omit<DemoPropertyTaxOwnershipChangeTaxRiskIssue, 'kind'>>,
): DemoPropertyTaxIssue {
  const current = normalizePropertyTaxIssue(issue)
  const branch = current.byKind.ownership_change_tax_risk ?? createEmptyOwnershipChangeTaxRiskIssue()
  return createEmptyPropertyTaxIssue({
    ...current,
    kinds: current.kinds.includes('ownership_change_tax_risk')
      ? current.kinds
      : [...current.kinds, 'ownership_change_tax_risk'],
    byKind: {
      ...current.byKind,
      ownership_change_tax_risk: createEmptyOwnershipChangeTaxRiskIssue({ ...branch, ...patch }),
    },
  })
}

export function patchPropertyTaxDelinquentBranch(
  issue: DemoPropertyTaxIssue | null | undefined,
  patch: Partial<Omit<DemoPropertyTaxDelinquentTaxDeedSurplusIssue, 'kind'>>,
): DemoPropertyTaxIssue {
  const current = normalizePropertyTaxIssue(issue)
  const branch = current.byKind.delinquent_tax_deed_surplus ?? createEmptyDelinquentTaxDeedSurplusIssue()
  return createEmptyPropertyTaxIssue({
    ...current,
    kinds: current.kinds.includes('delinquent_tax_deed_surplus')
      ? current.kinds
      : [...current.kinds, 'delinquent_tax_deed_surplus'],
    byKind: {
      ...current.byKind,
      delinquent_tax_deed_surplus: createEmptyDelinquentTaxDeedSurplusIssue({ ...branch, ...patch }),
    },
  })
}

export function patchPropertyTaxDatedField(
  issue: DemoPropertyTaxIssue | null | undefined,
  kind: DemoPropertyTaxIssueKind,
  fieldKey: string,
  dated: DemoPropertyTaxDatedValue,
): DemoPropertyTaxIssue {
  const next = createDefaultPropertyTaxDatedValue(dated)
  if (kind === 'assessment_vab') {
    return patchPropertyTaxAssessmentBranch(issue, { [fieldKey]: next } as Partial<
      Omit<DemoPropertyTaxAssessmentVabIssue, 'kind'>
    >)
  }
  if (kind === 'ownership_change_tax_risk') {
    return patchPropertyTaxOwnershipBranch(issue, { [fieldKey]: next } as Partial<
      Omit<DemoPropertyTaxOwnershipChangeTaxRiskIssue, 'kind'>
    >)
  }
  return patchPropertyTaxDelinquentBranch(issue, { [fieldKey]: next } as Partial<
    Omit<DemoPropertyTaxDelinquentTaxDeedSurplusIssue, 'kind'>
  >)
}

export function getPropertyTaxDateFieldsForKind(kind: DemoPropertyTaxIssueKind): DemoPropertyTaxDateFieldDef[] {
  switch (kind) {
    case 'assessment_vab':
      return [
        { key: 'trimNoticeDate', label: 'TRIM notice date' },
        { key: 'vabFilingDate', label: 'VAB petition filed date' },
        { key: 'vabHearingDate', label: 'VAB hearing date' },
      ]
    case 'ownership_change_tax_risk':
      return [
        { key: 'closingOrTransferDate', label: 'Known closing date' },
      ]
    case 'delinquent_tax_deed_surplus':
      return [
        { key: 'taxCertificateDate', label: 'Tax certificate date' },
        { key: 'taxDeedApplicationDate', label: 'Tax-deed application date' },
        { key: 'taxDeedSaleDate', label: 'Tax-deed sale date' },
        { key: 'surplusNoticeDate', label: 'Clerk surplus-notice date' },
        { key: 'surplusNoticeDeadlineDate', label: 'Deadline exactly as stated in the relevant notice' },
      ]
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

/** Suggested document checklist titles for selected kinds (deduped by id). */
export function getPropertyTaxDocumentChecklist(
  kinds: readonly DemoPropertyTaxIssueKind[],
): DemoPropertyTaxDocumentChecklistItem[] {
  const normalized = normalizePropertyTaxIssueKinds(kinds)
  const items: DemoPropertyTaxDocumentChecklistItem[] = []
  for (const kind of normalized) {
    items.push(...checklistForKind(kind))
  }
  return items
}

function checklistForKind(kind: DemoPropertyTaxIssueKind): DemoPropertyTaxDocumentChecklistItem[] {
  switch (kind) {
    case 'assessment_vab':
      return [
        {
          id: 'ptx-trim-notice',
          kind,
          title: 'Tax bill / TRIM notice',
          category: 'Compliance',
        },
        {
          id: 'ptx-property-appraiser-correspondence',
          kind,
          title: 'Property Appraiser correspondence',
          category: 'Compliance',
        },
        {
          id: 'ptx-vab-petition',
          kind,
          title: 'VAB petition / hearing notice',
          category: 'Compliance',
        },
        {
          id: 'ptx-appraisal-comparables',
          kind,
          title: 'Appraisal / comparables',
          category: 'Compliance',
        },
        {
          id: 'ptx-assessment-exemption-docs',
          kind,
          title: 'Exemption / classification / portability records',
          category: 'Compliance',
        },
        {
          id: 'ptx-assessment-other',
          kind,
          title: 'Other',
          category: 'Compliance',
        },
      ]
    case 'ownership_change_tax_risk':
      return [
        {
          id: 'ptx-seller-tax-bill',
          kind,
          title: 'Seller’s current property-tax bill / estimate (if relied upon)',
          category: 'Closing',
        },
        {
          id: 'ptx-closing-disclosure-tax-proration',
          kind,
          title: 'Closing disclosure / tax proration worksheet (if any)',
          category: 'Closing',
        },
        {
          id: 'ptx-prior-year-tax-history',
          kind,
          title: 'Prior-year property-tax history printout (if any)',
          category: 'Compliance',
        },
      ]
    case 'delinquent_tax_deed_surplus':
      return [
        {
          id: 'ptx-tax-collector-delinquent',
          kind,
          title: 'Tax Collector delinquent-tax / certificate notice (if any)',
          category: 'Compliance',
        },
        {
          id: 'ptx-tax-certificate-docs',
          kind,
          title: 'Tax certificate information (if any)',
          category: 'Compliance',
        },
        {
          id: 'ptx-tax-deed-application-sale',
          kind,
          title: 'Tax-deed application or sale notice (if any)',
          category: 'Compliance',
        },
        {
          id: 'ptx-surplus-notice',
          kind,
          title: 'Clerk surplus-proceeds notice (if any)',
          category: 'Compliance',
        },
        {
          id: 'ptx-deed-title-lien',
          kind,
          title: 'Deed, title, or lien documents (if any)',
          category: 'Title',
        },
        {
          id: 'ptx-probate-authority',
          kind,
          title: 'Probate, trust, authority, or heirship documents (if any)',
          category: 'Compliance',
        },
        {
          id: 'ptx-delinquent-other',
          kind,
          title: 'Other delinquent-tax / tax-deed documents (if any)',
          category: 'Compliance',
        },
      ]
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

export function isIsoDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_ONLY.test(value)) return false
  const [y, m, d] = value.split('-').map((p) => Number(p))
  const dt = new Date(Date.UTC(y, m - 1, d))
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  )
}

/** Accepts `YYYY-MM-DD` only; rejects datetimes and invalid calendars. */
export function parseOrNullIsoDateOnly(value: unknown): string | null {
  if (value == null || value === '') return null
  if (!isIsoDateOnly(value)) return null
  return value
}

/**
 * True when staff should treat the date as unverified for deadline purposes.
 * `client_reported` and `unknown` always need verification; missing date also does.
 * `documented` still needs firm verification before treating as firm-recorded.
 */
export function propertyTaxDateNeedsVerification(dated: DemoPropertyTaxDatedValue): boolean {
  if (!dated.date) return true
  return dated.source === 'client_reported' || dated.source === 'unknown' || dated.source === 'documented'
}

/**
 * UI copy for date verification — never "Deadline confirmed".
 * Does not assert legal control of any date.
 */
export function getPropertyTaxDateVerificationLabel(dated: DemoPropertyTaxDatedValue): string {
  if (dated.source === 'firm_verified' && dated.date) {
    return 'Firm-recorded date (not a legal determination)'
  }
  return 'Verify deadline'
}

/**
 * Stated-deadline banner when the entry is not firm-verified.
 * Neutral operational copy — not a legal determination.
 */
export function getPropertyTaxStatedDeadlineBanner(dated: DemoPropertyTaxDatedValue): string | null {
  if (!dated.date) return null
  if (dated.source === 'firm_verified') return null
  return 'Deadline reported or documented — firm verification required.'
}

/**
 * Soft calendar hint only: whether an entered date falls within N local days.
 * Not a Florida statutory calculator and not a filing deadline engine.
 */
export function isPropertyTaxDateWithinSoftUrgencyWindow(
  dated: DemoPropertyTaxDatedValue,
  todayIsoDateOnly: string,
  windowDays: number = PROPERTY_TAX_SOFT_URGENCY_DAYS,
): boolean {
  const target = parseOrNullIsoDateOnly(dated.date)
  const today = parseOrNullIsoDateOnly(todayIsoDateOnly)
  if (!target || !today) return false
  if (!Number.isFinite(windowDays) || windowDays < 0) return false
  const t = Date.parse(`${target}T00:00:00.000Z`)
  const n = Date.parse(`${today}T00:00:00.000Z`)
  if (!Number.isFinite(t) || !Number.isFinite(n)) return false
  const diffDays = Math.round((t - n) / (24 * 60 * 60 * 1000))
  return diffDays >= 0 && diffDays <= windowDays
}

/** Snapshot helper: omit inactive non-Florida / No answers so legacy leads stay clean. */
export function propertyTaxIssueForIntakeSnapshot(
  issue: DemoPropertyTaxIssue | null | undefined,
  propertyAddress: string,
): DemoPropertyTaxIssue | undefined {
  if (!shouldShowPropertyTaxIntakeSection(propertyAddress)) return undefined
  const n = normalizePropertyTaxIssue(issue)
  if (n.involvement === 'no') return undefined
  if (!isPropertyTaxBranchActive(n)) return undefined
  return n
}

export const PROPERTY_TAX_ISSUE_BOUNDARY_DISCLAIMER =
  'This section helps the firm organize facts, documents, and internal review. It does not provide tax or legal advice, determine appeal rights, establish a filing deadline, determine redemption rights, rank liens, or determine entitlement to proceeds.'

export const PROPERTY_TAX_INTAKE_SECTION_TITLE = 'Florida Property-Tax & Tax-Deed Issues'

export const PROPERTY_TAX_INVOLVEMENT_QUESTION =
  'May this matter involve a Florida property-tax, assessment, delinquent-tax, tax certificate, tax-deed, redemption, or surplus-proceeds issue?'
