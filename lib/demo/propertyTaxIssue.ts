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
  DemoPropertyTaxAssessmentVabIssue,
  DemoPropertyTaxDateSource,
  DemoPropertyTaxDatedValue,
  DemoPropertyTaxDelinquentTaxDeedSurplusIssue,
  DemoPropertyTaxIssue,
  DemoPropertyTaxIssueByKind,
  DemoPropertyTaxIssueKind,
  DemoPropertyTaxIssueStatus,
  DemoPropertyTaxOwnershipChangeTaxRiskIssue,
} from '@/lib/demo/types'

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
    noticeReceived:
      overrides.noticeReceived === true || overrides.noticeReceived === false || overrides.noticeReceived === null
        ? overrides.noticeReceived
        : null,
    trimNoticeDate: emptyDated(overrides.trimNoticeDate),
    vabFilingDate: emptyDated(overrides.vabFilingDate),
    vabHearingDate: emptyDated(overrides.vabHearingDate),
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
    relyingOnSellerCurrentBill:
      overrides.relyingOnSellerCurrentBill === true ||
      overrides.relyingOnSellerCurrentBill === false ||
      overrides.relyingOnSellerCurrentBill === null
        ? overrides.relyingOnSellerCurrentBill
        : null,
    closingOrTransferDate: emptyDated(overrides.closingOrTransferDate),
    estimatedTaxBillDate: emptyDated(overrides.estimatedTaxBillDate),
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
    taxDeedApplicationDate: emptyDated(overrides.taxDeedApplicationDate),
    taxDeedSaleDate: emptyDated(overrides.taxDeedSaleDate),
    surplusNoticeDate: emptyDated(overrides.surplusNoticeDate),
    surplusNoticeDeadlineDate: emptyDated(overrides.surplusNoticeDeadlineDate),
  }
}

/** Persistence-safe disabled default (additive branch off). */
export function createEmptyPropertyTaxIssue(
  overrides: Partial<DemoPropertyTaxIssue> = {},
): DemoPropertyTaxIssue {
  const enabled = overrides.enabled === true
  const kinds = normalizePropertyTaxIssueKinds(overrides.kinds)
  const byKind = normalizePropertyTaxIssueByKind(overrides.byKind, kinds)
  return {
    enabled,
    kinds: enabled ? kinds : [],
    byKind: enabled ? byKind : {},
    internalNotes: typeof overrides.internalNotes === 'string' ? overrides.internalNotes : '',
  }
}

/**
 * Normalize unknown/partial persisted JSON into a safe `DemoPropertyTaxIssue`.
 * Missing/invalid input → disabled empty issue (does not invent enabled=true).
 */
export function normalizePropertyTaxIssue(
  input: unknown,
): DemoPropertyTaxIssue {
  if (!input || typeof input !== 'object') {
    return createEmptyPropertyTaxIssue()
  }
  const raw = input as Partial<DemoPropertyTaxIssue>
  return createEmptyPropertyTaxIssue({
    enabled: raw.enabled === true,
    kinds: Array.isArray(raw.kinds) ? raw.kinds : [],
    byKind: raw.byKind && typeof raw.byKind === 'object' ? raw.byKind : {},
    internalNotes: typeof raw.internalNotes === 'string' ? raw.internalNotes : '',
  })
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

/** Branch is active when enabled and at least one kind is selected. */
export function isPropertyTaxBranchActive(issue: DemoPropertyTaxIssue | null | undefined): boolean {
  const n = normalizePropertyTaxIssue(issue)
  return n.enabled && n.kinds.length > 0
}

export function hasPropertyTaxIssueKind(
  issue: DemoPropertyTaxIssue | null | undefined,
  kind: DemoPropertyTaxIssueKind,
): boolean {
  return normalizePropertyTaxIssue(issue).kinds.includes(kind)
}

/**
 * Add or remove a kind. Selecting a kind creates empty nested data; deselecting drops that nest.
 * When any kind is selected, `enabled` becomes true. Clearing all kinds leaves `enabled` as-is
 * unless callers also use `setPropertyTaxIssueEnabled(false)`.
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
  return createEmptyPropertyTaxIssue({
    enabled: kinds.length > 0 ? true : current.enabled,
    kinds: kinds.length > 0 ? kinds : current.enabled ? [] : [],
    byKind: current.byKind,
    internalNotes: current.internalNotes,
  })
}

/** Explicitly enable/disable the additive branch without clearing kind templates when re-enabled empty. */
export function setPropertyTaxIssueEnabled(
  issue: DemoPropertyTaxIssue | null | undefined,
  enabled: boolean,
): DemoPropertyTaxIssue {
  const current = normalizePropertyTaxIssue(issue)
  if (!enabled) {
    return createEmptyPropertyTaxIssue({
      enabled: false,
      kinds: [],
      byKind: {},
      internalNotes: current.internalNotes,
    })
  }
  return createEmptyPropertyTaxIssue({
    enabled: true,
    kinds: current.kinds,
    byKind: current.byKind,
    internalNotes: current.internalNotes,
  })
}

export function getPropertyTaxIssueKindLabel(kind: DemoPropertyTaxIssueKind): string {
  switch (kind) {
    case 'assessment_vab':
      return 'Assessment / exemption / classification / portability / VAB'
    case 'ownership_change_tax_risk':
      return 'Ownership-change / post-purchase tax-estimate risk'
    case 'delinquent_tax_deed_surplus':
      return 'Delinquent tax / tax certificate / tax deed / surplus'
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

export function getPropertyTaxDateFieldsForKind(kind: DemoPropertyTaxIssueKind): DemoPropertyTaxDateFieldDef[] {
  switch (kind) {
    case 'assessment_vab':
      return [
        { key: 'trimNoticeDate', label: 'TRIM / assessment notice date' },
        { key: 'vabFilingDate', label: 'VAB filing date (as entered)' },
        { key: 'vabHearingDate', label: 'VAB hearing date (as entered)' },
      ]
    case 'ownership_change_tax_risk':
      return [
        { key: 'closingOrTransferDate', label: 'Closing / transfer date' },
        { key: 'estimatedTaxBillDate', label: 'Estimated or referenced tax bill date' },
      ]
    case 'delinquent_tax_deed_surplus':
      return [
        { key: 'taxDeedApplicationDate', label: 'Tax-deed application date (as entered)' },
        { key: 'taxDeedSaleDate', label: 'Tax-deed sale date (as entered)' },
        { key: 'surplusNoticeDate', label: 'Clerk surplus-notice date (as entered)' },
        { key: 'surplusNoticeDeadlineDate', label: 'Deadline stated on surplus notice (as entered)' },
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
          title: 'TRIM / Notice of Proposed Property Taxes (if any)',
          category: 'Compliance',
        },
        {
          id: 'ptx-vab-petition',
          kind,
          title: 'VAB petition or filing papers (if any)',
          category: 'Compliance',
        },
        {
          id: 'ptx-assessment-exemption-docs',
          kind,
          title: 'Assessment, exemption, or classification documents (if any)',
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
          id: 'ptx-tax-certificate-docs',
          kind,
          title: 'Tax certificate / delinquency notices (if any)',
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
          title: 'Clerk surplus notice and stated deadline (if any)',
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
  if (!dated.date || dated.source === 'client_reported' || dated.source === 'unknown') {
    return 'Verify deadline'
  }
  if (dated.source === 'documented') {
    return 'Verify deadline'
  }
  // firm_verified — still not a legal determination
  return 'Firm-recorded date (not a legal determination)'
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

export const PROPERTY_TAX_ISSUE_BOUNDARY_DISCLAIMER =
  'Organizes Florida property-tax and tax-deed facts for the firm only. Not tax advice, not an eligibility or entitlement determination, not lien-priority analysis, and not a VAB, tax-deed, or surplus filing service.'
