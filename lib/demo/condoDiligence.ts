/**
 * Florida condo diligence helpers (eligibility, checklist, linkage to demo documents/requests).
 * Maps to `systemContract.domains.compliance` (condo slice) — implementation detail, not the contract file itself.
 */
import type {
  DemoCondoAssociationFinancialReview,
  DemoCondoAssociationLoanStatus,
  DemoCondoAssociationRecordsGovernanceReview,
  DemoCondoAssociationSpecialAssessmentStatus,
  DemoCondoBuyerApprovalStatus,
  DemoCondoDelinquencyConcern,
  DemoCondoDiligence,
  DemoCondoDiligenceDocStatus,
  DemoCondoDiligenceFinding,
  DemoCondoDiligenceMatterStatus,
  DemoCondoDiligenceRequiredDocument,
  DemoCondoDisclosurePackageCompleteness,
  DemoCondoDisclosurePackageReview,
  DemoCondoDuesFrequency,
  DemoCondoEstoppelReview,
  DemoCondoEstoppelReviewStatus,
  DemoCondoEstoppelSpecialAssessmentStatus,
  DemoCondoEstoppelViolationOrLienStatus,
  DemoCondoFinancialDocReviewStatus,
  DemoCondoFinancialRiskLevel,
  DemoCondoGovernanceConcernLevel,
  DemoCondoLitigationOrDbprStatus,
  DemoCondoRecordsAccessStatus,
  DemoCondoRentalRestrictionStatus,
  DemoCondoReserveFundingStatus,
  DemoCondoSirsApplicability,
  DemoCondoSirsDocumentStatus,
  DemoCondoSirsMilestoneReview,
  DemoCondoSirsResult,
  DemoCondoSirsRiskLevel,
  DemoDocument,
  DemoDocumentRequest,
  DemoMatter,
} from '@/lib/demo/types'
import type { AddDemoDocumentInput } from '@/lib/demo/demoDocument'

/** Label + pill colors for matter-level condo diligence status (lists + modal). */
export function condoDiligenceMatterStatusPresentation(status: DemoCondoDiligenceMatterStatus): {
  label: string
  bg: string
  color: string
  border: string
} {
  switch (status) {
    case 'cleared':
      return { label: 'Cleared', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'flagged':
      return { label: 'Flagged', bg: '#fee2e2', color: '#991b1b', border: 'rgba(185,28,28,0.35)' }
    case 'under_review':
      return { label: 'Under review', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
    case 'in_progress':
      return { label: 'In progress', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    default:
      return { label: 'Not started', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

/** Pill styles for derived per-row checklist status (Documents / requests linkage). */
export function condoRequiredDocDerivedStatusPresentation(status: DemoCondoDiligenceDocStatus): {
  label: string
  bg: string
  color: string
  border: string
} {
  switch (status) {
    case 'received':
      return { label: 'Received', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'requested':
      return { label: 'Requested', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
    default:
      return { label: 'No request', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

export type DeriveCondoRequiredDocumentStatusInput = {
  matterId: string
  condoDocId: string
  storedStatus: DemoCondoDiligenceDocStatus
  documents: Array<
    Pick<DemoDocument, 'matter_id' | 'name' | 'category' | 'document_subtype' | 'description' | 'deletedAt'>
  >
  documentRequests: Array<Pick<DemoDocumentRequest, 'matter_id' | 'title' | 'description' | 'category' | 'status'>>
}

function normalizeCondoLinkageHaystack(parts: string[]): string {
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function demoDocLinkageHaystack(d: DeriveCondoRequiredDocumentStatusInput['documents'][number]): string {
  return normalizeCondoLinkageHaystack([
    d.name,
    d.document_subtype ?? '',
    d.description ?? '',
    d.category,
  ])
}

function demoRequestLinkageHaystack(r: DeriveCondoRequiredDocumentStatusInput['documentRequests'][number]): string {
  return normalizeCondoLinkageHaystack([r.title, r.description ?? '', r.category])
}

/**
 * Keyword / phrase match between demo document or request text and a condo required-doc id.
 * Uses stable checklist ids from {@link buildDefaultCondoDiligence} (estoppel, milestone_inspection_summary, …).
 */
export function condoRequiredDocMatchesLinkageHaystack(haystack: string, condoDocId: string): boolean {
  const t = haystack.toLowerCase().replace(/\s+/g, ' ').trim()
  if (!t) return false

  switch (condoDocId) {
    case 'estoppel':
      return (
        /\bestoppel\b/.test(t) ||
        /\bestoppel\s+certificate\b/.test(t) ||
        /\bcondo\s+estoppel\b/.test(t) ||
        (/\bcondo\b/.test(t) && /\bcertificate\b/.test(t) && /\b(association|hoa|unit)\b/.test(t))
      )
    case 'milestone_inspection_summary':
      if (/\bsirs\b/.test(t) && /\breserve\b/.test(t)) return false
      return (
        (t.includes('milestone') && t.includes('inspection')) ||
        t.includes('milestone inspection') ||
        (t.includes('structural integrity') && t.includes('inspection') && !t.includes('reserve')) ||
        (t.includes('milestone') && t.includes('report') && t.includes('structural'))
      )
    case 'sirs_reserve_study':
      return (
        /\bsirs\b/.test(t) ||
        t.includes('reserve study') ||
        t.includes('structural integrity reserve') ||
        (t.includes('structural') && t.includes('reserve') && !t.includes('milestone inspection'))
      )
    case 'current_budget':
      return (
        /\boperating\s+budget\b/.test(t) ||
        /\bannual\s+budget\b/.test(t) ||
        (t.includes('budget') &&
          /\b(association|hoa|condo|operating|annual|capital|current|financial|reserve)\b/.test(t))
      )
    case 'insurance_summary':
      return (
        t.includes('insurance') ||
        t.includes('master policy') ||
        t.includes('certificate of insurance') ||
        t.includes('hazard insurance')
      )
    case 'recent_board_minutes':
      return (
        t.includes('board minutes') ||
        t.includes('minutes of the board') ||
        t.includes('minutes of board') ||
        t.includes('hoa minutes') ||
        t.includes('association minutes') ||
        (t.includes('board') && t.includes('minute'))
      )
    case 'association_financial_statements':
      return (
        t.includes('financial statement') ||
        t.includes('financial statements') ||
        t.includes('audited financial') ||
        t.includes('association financials') ||
        (t.includes('financial') && t.includes('statement') && /\b(association|hoa|condo)\b/.test(t))
      )
    case 'declaration_bylaws_rules_amendments':
      return (
        t.includes('declaration') ||
        t.includes('bylaws') ||
        t.includes('by-laws') ||
        t.includes('rules and regulations') ||
        t.includes('rules & regulations') ||
        (t.includes('amendment') && /\b(declaration|bylaw|by-law|covenant|condo)\b/.test(t))
      )
    case 'reserve_schedule_funding_detail':
      if (/\bsirs\b/.test(t) || t.includes('reserve study') || t.includes('structural integrity reserve')) {
        return false
      }
      return (
        t.includes('reserve schedule') ||
        t.includes('reserve funding') ||
        t.includes('funding schedule') ||
        (t.includes('reserve') && t.includes('funding') && t.includes('detail')) ||
        (t.includes('reserve') && t.includes('schedule'))
      )
    case 'special_assessment_notice_schedule':
      return (
        t.includes('special assessment') ||
        t.includes('special assessments') ||
        (t.includes('assessment') && t.includes('notice') && /\b(special|hoa|association|condo)\b/.test(t))
      )
    case 'litigation_claims_arbitration_dbpr':
      return (
        /\bdbpr\b/.test(t) ||
        t.includes('litigation') ||
        t.includes('arbitration') ||
        t.includes('pending claim') ||
        t.includes('claims disclosure') ||
        (t.includes('claim') && /\b(litigation|arbitration|association|hoa|condo|disclosure)\b/.test(t))
      )
    case 'association_approval_leasing_restrictions':
      return (
        t.includes('leasing restriction') ||
        t.includes('leasing restrictions') ||
        t.includes('rental restriction') ||
        t.includes('rental restrictions') ||
        t.includes('association approval') ||
        t.includes('lease approval') ||
        (t.includes('leasing') && /\b(restriction|approval|package)\b/.test(t))
      )
    case 'management_association_contacts':
      return (
        t.includes('management company') ||
        t.includes('management contact') ||
        t.includes('association contact') ||
        t.includes('association contacts') ||
        t.includes('property manager contact') ||
        (t.includes('management') && t.includes('contact')) ||
        (t.includes('association') && t.includes('contact') && /\b(manager|management|hoa|condo)\b/.test(t))
      )
    default:
      return false
  }
}

/**
 * Read-only effective checklist status: prefers a matching matter document, then an open document request,
 * otherwise the stored condo diligence row value.
 */
export function deriveCondoRequiredDocumentStatus(input: DeriveCondoRequiredDocumentStatusInput): DemoCondoDiligenceDocStatus {
  const { matterId, condoDocId, storedStatus, documents, documentRequests } = input

  const matterDocs = documents.filter((d) => d.matter_id === matterId && !d.deletedAt)
  for (const d of matterDocs) {
    if (condoRequiredDocMatchesLinkageHaystack(demoDocLinkageHaystack(d), condoDocId)) return 'received'
  }

  const openReqs = documentRequests.filter((r) => r.matter_id === matterId && r.status === 'open')
  for (const r of openReqs) {
    if (condoRequiredDocMatchesLinkageHaystack(demoRequestLinkageHaystack(r), condoDocId)) return 'requested'
  }

  return storedStatus
}

/**
 * When the user explicitly syncs linkage into the saved checklist: copy `received` / `requested`
 * from derived linkage; if linkage shows no document or open request (`outstanding`), keep the saved row as-is.
 */
export function condoRequiredDocSavedStatusAfterLinkedSync(
  derived: DemoCondoDiligenceDocStatus,
  saved: DemoCondoDiligenceDocStatus,
): DemoCondoDiligenceDocStatus {
  if (derived === 'received' || derived === 'requested') return derived
  return saved
}

export type SyncRequiredDocumentsFromLinkageContext = Pick<
  DeriveCondoRequiredDocumentStatusInput,
  'matterId' | 'documents' | 'documentRequests'
>

/** Next `requiredDocuments` after applying {@link condoRequiredDocSavedStatusAfterLinkedSync} per row (pure). */
export function syncRequiredDocumentsFromDerivedLinkage(
  requiredDocuments: readonly DemoCondoDiligenceRequiredDocument[],
  ctx: SyncRequiredDocumentsFromLinkageContext,
): DemoCondoDiligenceRequiredDocument[] {
  return requiredDocuments.map((doc) => {
    const derived = deriveCondoRequiredDocumentStatus({
      matterId: ctx.matterId,
      condoDocId: doc.id,
      storedStatus: doc.status,
      documents: ctx.documents,
      documentRequests: ctx.documentRequests,
    })
    const nextStatus = condoRequiredDocSavedStatusAfterLinkedSync(derived, doc.status)
    return nextStatus === doc.status ? doc : { ...doc, status: nextStatus }
  })
}

/**
 * Derives matter-level condo diligence status from saved checklist rows and optional finding text.
 * Findings: conservative demo signal — non-empty text containing whole word `flagged`, prefix `!!!`, or `[critical]`.
 *
 * Checklist: `cleared` when every required doc is `received`; `not_started` when all `outstanding`;
 * `under_review` when nothing is still `outstanding` but at least one `requested` remains and not all `received`;
 * otherwise `in_progress`. `flagged` wins when findings match the signal above.
 */
export function deriveCondoDiligenceMatterStatusFromChecklist(input: {
  requiredDocuments: readonly Pick<DemoCondoDiligenceRequiredDocument, 'status'>[]
  findings: readonly Pick<DemoCondoDiligenceFinding, 'text'>[]
}): DemoCondoDiligenceMatterStatus {
  const { requiredDocuments, findings } = input

  const findingIndicatesFlag = findings.some((f) => {
    const t = f.text.trim()
    if (!t) return false
    return /\bflagged\b/i.test(t) || /^\s*!!!/.test(t) || /\[critical\]/i.test(t)
  })
  if (findingIndicatesFlag) return 'flagged'

  if (requiredDocuments.length === 0) return 'not_started'

  const allReceived = requiredDocuments.every((d) => d.status === 'received')
  if (allReceived) return 'cleared'

  const allOutstanding = requiredDocuments.every((d) => d.status === 'outstanding')
  if (allOutstanding) return 'not_started'

  const anyOutstanding = requiredDocuments.some((d) => d.status === 'outstanding')
  const anyRequested = requiredDocuments.some((d) => d.status === 'requested')

  if (!anyOutstanding && anyRequested && !allReceived) return 'under_review'

  return 'in_progress'
}

/** True when a condo diligence row is still in first-run/default state for guidance UI. */
export function isCondoDiligenceUntouched(
  input: Pick<DemoCondoDiligence, 'status' | 'requiredDocuments' | 'findings' | 'notes'> & {
    estoppelReview?: DemoCondoEstoppelReview | null
    sirsMilestoneReview?: DemoCondoSirsMilestoneReview | null
    associationFinancialReview?: DemoCondoAssociationFinancialReview | null
    associationRecordsGovernanceReview?: DemoCondoAssociationRecordsGovernanceReview | null
    disclosurePackageReview?: DemoCondoDisclosurePackageReview | null
  },
): boolean {
  const notesEmpty = input.notes.trim() === ''
  const noFindings = input.findings.length === 0 || input.findings.every((f) => f.text.trim() === '')
  const allOutstanding = input.requiredDocuments.length > 0 && input.requiredDocuments.every((d) => d.status === 'outstanding')
  const estoppelUntouched = isCondoEstoppelReviewUntouched(input.estoppelReview)
  const sirsUntouched = isCondoSirsMilestoneReviewUntouched(input.sirsMilestoneReview)
  const financialUntouched = isCondoAssociationFinancialReviewUntouched(input.associationFinancialReview)
  const governanceUntouched = isCondoAssociationRecordsGovernanceReviewUntouched(
    input.associationRecordsGovernanceReview,
  )
  const disclosureUntouched = isCondoDisclosurePackageReviewUntouched(input.disclosurePackageReview)
  return (
    input.status === 'not_started' &&
    notesEmpty &&
    noFindings &&
    allOutstanding &&
    estoppelUntouched &&
    sirsUntouched &&
    financialUntouched &&
    governanceUntouched &&
    disclosureUntouched
  )
}

/** Default empty structured estoppel review for newly seeded diligence rows. */
export function buildDefaultCondoEstoppelReview(): DemoCondoEstoppelReview {
  return {
    requestDate: '',
    dueDate: '',
    receivedDate: '',
    amountDue: null,
    regularAssessmentAmount: null,
    specialAssessmentStatus: 'unknown',
    violationOrLienStatus: 'unknown',
    reviewStatus: 'not_started',
    notes: '',
  }
}

export function normalizeCondoEstoppelReview(
  input?: Partial<DemoCondoEstoppelReview> | null,
): DemoCondoEstoppelReview {
  return {
    ...buildDefaultCondoEstoppelReview(),
    ...(input ?? {}),
  }
}

function isYmdDateString(value: unknown): value is string {
  return typeof value === 'string' && (/^\d{4}-\d{2}-\d{2}$/.test(value.trim()) || value.trim() === '')
}

function parseOptionalMoney(value: unknown): number | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return value
}

function isSpecialAssessmentStatus(value: unknown): value is DemoCondoEstoppelSpecialAssessmentStatus {
  return value === 'unknown' || value === 'none' || value === 'disclosed'
}

function isViolationOrLienStatus(value: unknown): value is DemoCondoEstoppelViolationOrLienStatus {
  return value === 'unknown' || value === 'none' || value === 'disclosed'
}

function isEstoppelReviewStatus(value: unknown): value is DemoCondoEstoppelReviewStatus {
  return (
    value === 'not_started' ||
    value === 'requested' ||
    value === 'received' ||
    value === 'reviewed' ||
    value === 'issue_found'
  )
}

/**
 * Parse optional persisted `estoppelReview`. Missing/invalid object → undefined (older rows).
 * Partial valid objects are filled with defaults for missing fields.
 */
export function parseDemoCondoEstoppelReview(raw: unknown): DemoCondoEstoppelReview | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const base = buildDefaultCondoEstoppelReview()

  const requestDate = isYmdDateString(o.requestDate) ? o.requestDate.trim() : base.requestDate
  const dueDate = isYmdDateString(o.dueDate) ? o.dueDate.trim() : base.dueDate
  const receivedDate = isYmdDateString(o.receivedDate) ? o.receivedDate.trim() : base.receivedDate
  const amountDueParsed = parseOptionalMoney(o.amountDue)
  const regularParsed = parseOptionalMoney(o.regularAssessmentAmount)

  return {
    requestDate,
    dueDate,
    receivedDate,
    amountDue: amountDueParsed === undefined ? base.amountDue : amountDueParsed,
    regularAssessmentAmount: regularParsed === undefined ? base.regularAssessmentAmount : regularParsed,
    specialAssessmentStatus: isSpecialAssessmentStatus(o.specialAssessmentStatus)
      ? o.specialAssessmentStatus
      : base.specialAssessmentStatus,
    violationOrLienStatus: isViolationOrLienStatus(o.violationOrLienStatus)
      ? o.violationOrLienStatus
      : base.violationOrLienStatus,
    reviewStatus: isEstoppelReviewStatus(o.reviewStatus) ? o.reviewStatus : base.reviewStatus,
    notes: typeof o.notes === 'string' ? o.notes : base.notes,
  }
}

export function isCondoEstoppelReviewUntouched(input?: DemoCondoEstoppelReview | null): boolean {
  if (!input) return true
  const d = normalizeCondoEstoppelReview(input)
  return (
    d.requestDate === '' &&
    d.dueDate === '' &&
    d.receivedDate === '' &&
    d.amountDue === null &&
    d.regularAssessmentAmount === null &&
    d.specialAssessmentStatus === 'unknown' &&
    d.violationOrLienStatus === 'unknown' &&
    d.reviewStatus === 'not_started' &&
    d.notes.trim() === ''
  )
}

export function condoEstoppelReviewStatusPresentation(status: DemoCondoEstoppelReviewStatus): {
  label: string
  bg: string
  color: string
  border: string
} {
  switch (status) {
    case 'issue_found':
      return { label: 'Issue found', bg: '#fee2e2', color: '#991b1b', border: 'rgba(185,28,28,0.35)' }
    case 'reviewed':
      return { label: 'Reviewed', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'received':
      return { label: 'Received', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
    case 'requested':
      return { label: 'Requested', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    default:
      return { label: 'Not started', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

/**
 * Read-only due-date warning for lawyer attention (demo). Not a statutory compliance determination.
 * `due_soon` when due within `soonDays` (default 3), including today.
 */
export function condoEstoppelDueDateWarning(
  dueDate: string,
  options?: { now?: Date; soonDays?: number },
): { kind: 'overdue' | 'due_soon'; label: string; diffDays: number } | null {
  const trimmed = dueDate.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null
  const due = new Date(`${trimmed}T00:00:00`)
  if (Number.isNaN(due.getTime())) return null

  const now = options?.now ?? new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
  const soonDays = options?.soonDays ?? 3

  if (diffDays < 0) {
    return { kind: 'overdue', label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`, diffDays }
  }
  if (diffDays <= soonDays) {
    if (diffDays === 0) return { kind: 'due_soon', label: 'Due today', diffDays }
    return { kind: 'due_soon', label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`, diffDays }
  }
  return null
}

/** Default empty structured SIRS / Milestone review for newly seeded diligence rows. */
export function buildDefaultCondoSirsMilestoneReview(): DemoCondoSirsMilestoneReview {
  return {
    applicability: 'unknown',
    documentStatus: 'not_started',
    completionDate: '',
    result: 'unknown',
    reserveRiskLevel: 'unknown',
    structuralRiskLevel: 'unknown',
    notes: '',
  }
}

export function normalizeCondoSirsMilestoneReview(
  input?: Partial<DemoCondoSirsMilestoneReview> | null,
): DemoCondoSirsMilestoneReview {
  return {
    ...buildDefaultCondoSirsMilestoneReview(),
    ...(input ?? {}),
  }
}

function isSirsApplicability(value: unknown): value is DemoCondoSirsApplicability {
  return (
    value === 'unknown' ||
    value === 'applicable' ||
    value === 'not_applicable' ||
    value === 'needs_confirmation'
  )
}

function isSirsDocumentStatus(value: unknown): value is DemoCondoSirsDocumentStatus {
  return (
    value === 'not_started' ||
    value === 'outstanding' ||
    value === 'requested' ||
    value === 'received' ||
    value === 'reviewed'
  )
}

function isSirsResult(value: unknown): value is DemoCondoSirsResult {
  return (
    value === 'unknown' ||
    value === 'pass' ||
    value === 'pass_with_findings' ||
    value === 'fail' ||
    value === 'incomplete'
  )
}

function isSirsRiskLevel(value: unknown): value is DemoCondoSirsRiskLevel {
  return (
    value === 'unknown' ||
    value === 'low' ||
    value === 'moderate' ||
    value === 'elevated' ||
    value === 'high'
  )
}

/**
 * Parse optional persisted `sirsMilestoneReview`. Missing/invalid object → undefined (older rows).
 * Partial valid objects are filled with defaults for missing fields.
 */
export function parseDemoCondoSirsMilestoneReview(raw: unknown): DemoCondoSirsMilestoneReview | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const base = buildDefaultCondoSirsMilestoneReview()

  return {
    applicability: isSirsApplicability(o.applicability) ? o.applicability : base.applicability,
    documentStatus: isSirsDocumentStatus(o.documentStatus) ? o.documentStatus : base.documentStatus,
    completionDate: isYmdDateString(o.completionDate) ? o.completionDate.trim() : base.completionDate,
    result: isSirsResult(o.result) ? o.result : base.result,
    reserveRiskLevel: isSirsRiskLevel(o.reserveRiskLevel) ? o.reserveRiskLevel : base.reserveRiskLevel,
    structuralRiskLevel: isSirsRiskLevel(o.structuralRiskLevel)
      ? o.structuralRiskLevel
      : base.structuralRiskLevel,
    notes: typeof o.notes === 'string' ? o.notes : base.notes,
  }
}

export function isCondoSirsMilestoneReviewUntouched(input?: DemoCondoSirsMilestoneReview | null): boolean {
  if (!input) return true
  const d = normalizeCondoSirsMilestoneReview(input)
  return (
    d.applicability === 'unknown' &&
    d.documentStatus === 'not_started' &&
    d.completionDate === '' &&
    d.result === 'unknown' &&
    d.reserveRiskLevel === 'unknown' &&
    d.structuralRiskLevel === 'unknown' &&
    d.notes.trim() === ''
  )
}

export function condoSirsApplicabilityPresentation(status: DemoCondoSirsApplicability): {
  label: string
  bg: string
  color: string
  border: string
} {
  switch (status) {
    case 'applicable':
      return { label: 'Applicable', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
    case 'not_applicable':
      return { label: 'Not applicable', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
    case 'needs_confirmation':
      return { label: 'Needs confirmation', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    default:
      return { label: 'Unknown', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

export function condoSirsDocumentStatusPresentation(status: DemoCondoSirsDocumentStatus): {
  label: string
  bg: string
  color: string
  border: string
} {
  switch (status) {
    case 'reviewed':
      return { label: 'Reviewed', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'received':
      return { label: 'Received', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
    case 'requested':
      return { label: 'Requested', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    case 'outstanding':
      return { label: 'Outstanding', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    default:
      return { label: 'Not started', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

export function condoSirsResultPresentation(result: DemoCondoSirsResult): {
  label: string
  bg: string
  color: string
  border: string
} {
  switch (result) {
    case 'pass':
      return { label: 'Pass', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'pass_with_findings':
      return { label: 'Pass with findings', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    case 'fail':
      return { label: 'Fail', bg: '#fee2e2', color: '#991b1b', border: 'rgba(185,28,28,0.35)' }
    case 'incomplete':
      return { label: 'Incomplete', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    default:
      return { label: 'Unknown', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

export function condoSirsRiskLevelPresentation(level: DemoCondoSirsRiskLevel): {
  label: string
  bg: string
  color: string
  border: string
} {
  switch (level) {
    case 'low':
      return { label: 'Low', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'moderate':
      return { label: 'Moderate', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    case 'elevated':
      return { label: 'Elevated', bg: '#ffedd5', color: '#c2410c', border: 'rgba(194,65,12,0.35)' }
    case 'high':
      return { label: 'High', bg: '#fee2e2', color: '#991b1b', border: 'rgba(185,28,28,0.35)' }
    default:
      return { label: 'Unknown', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

/** Default empty structured association financial review for newly seeded diligence rows. */
export function buildDefaultCondoAssociationFinancialReview(): DemoCondoAssociationFinancialReview {
  return {
    budgetReviewStatus: 'not_started',
    financialStatementsReviewStatus: 'not_started',
    reserveScheduleReviewStatus: 'not_started',
    duesAmount: null,
    duesFrequency: 'unknown',
    specialAssessmentStatus: 'unknown',
    specialAssessmentAmount: null,
    associationLoanOrLineOfCreditStatus: 'unknown',
    delinquencyConcern: 'unknown',
    reserveFundingStatus: 'unknown',
    financialRiskLevel: 'unknown',
    notes: '',
  }
}

export function normalizeCondoAssociationFinancialReview(
  input?: Partial<DemoCondoAssociationFinancialReview> | null,
): DemoCondoAssociationFinancialReview {
  return {
    ...buildDefaultCondoAssociationFinancialReview(),
    ...(input ?? {}),
  }
}

function isFinancialDocReviewStatus(value: unknown): value is DemoCondoFinancialDocReviewStatus {
  return (
    value === 'not_started' ||
    value === 'requested' ||
    value === 'received' ||
    value === 'reviewed' ||
    value === 'issue_found'
  )
}

function isDuesFrequency(value: unknown): value is DemoCondoDuesFrequency {
  return (
    value === 'unknown' ||
    value === 'monthly' ||
    value === 'quarterly' ||
    value === 'annual' ||
    value === 'other'
  )
}

function isAssociationSpecialAssessmentStatus(
  value: unknown,
): value is DemoCondoAssociationSpecialAssessmentStatus {
  return (
    value === 'unknown' ||
    value === 'none_disclosed' ||
    value === 'proposed_or_pending' ||
    value === 'active' ||
    value === 'paid_or_resolved'
  )
}

function isAssociationLoanStatus(value: unknown): value is DemoCondoAssociationLoanStatus {
  return value === 'unknown' || value === 'none_disclosed' || value === 'disclosed'
}

function isDelinquencyConcern(value: unknown): value is DemoCondoDelinquencyConcern {
  return value === 'unknown' || value === 'none_noted' || value === 'possible' || value === 'material'
}

function isReserveFundingStatus(value: unknown): value is DemoCondoReserveFundingStatus {
  return (
    value === 'unknown' ||
    value === 'appears_adequate' ||
    value === 'possible_shortfall' ||
    value === 'material_shortfall'
  )
}

function isFinancialRiskLevel(value: unknown): value is DemoCondoFinancialRiskLevel {
  return (
    value === 'unknown' ||
    value === 'none' ||
    value === 'low' ||
    value === 'medium' ||
    value === 'high'
  )
}

/**
 * Parse optional persisted `associationFinancialReview`. Missing/invalid object → undefined (older rows).
 * Partial valid objects are filled with defaults for missing fields.
 */
export function parseDemoCondoAssociationFinancialReview(
  raw: unknown,
): DemoCondoAssociationFinancialReview | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const base = buildDefaultCondoAssociationFinancialReview()
  const duesParsed = parseOptionalMoney(o.duesAmount)
  const specialAmtParsed = parseOptionalMoney(o.specialAssessmentAmount)

  return {
    budgetReviewStatus: isFinancialDocReviewStatus(o.budgetReviewStatus)
      ? o.budgetReviewStatus
      : base.budgetReviewStatus,
    financialStatementsReviewStatus: isFinancialDocReviewStatus(o.financialStatementsReviewStatus)
      ? o.financialStatementsReviewStatus
      : base.financialStatementsReviewStatus,
    reserveScheduleReviewStatus: isFinancialDocReviewStatus(o.reserveScheduleReviewStatus)
      ? o.reserveScheduleReviewStatus
      : base.reserveScheduleReviewStatus,
    duesAmount: duesParsed === undefined ? base.duesAmount : duesParsed,
    duesFrequency: isDuesFrequency(o.duesFrequency) ? o.duesFrequency : base.duesFrequency,
    specialAssessmentStatus: isAssociationSpecialAssessmentStatus(o.specialAssessmentStatus)
      ? o.specialAssessmentStatus
      : base.specialAssessmentStatus,
    specialAssessmentAmount: specialAmtParsed === undefined ? base.specialAssessmentAmount : specialAmtParsed,
    associationLoanOrLineOfCreditStatus: isAssociationLoanStatus(o.associationLoanOrLineOfCreditStatus)
      ? o.associationLoanOrLineOfCreditStatus
      : base.associationLoanOrLineOfCreditStatus,
    delinquencyConcern: isDelinquencyConcern(o.delinquencyConcern)
      ? o.delinquencyConcern
      : base.delinquencyConcern,
    reserveFundingStatus: isReserveFundingStatus(o.reserveFundingStatus)
      ? o.reserveFundingStatus
      : base.reserveFundingStatus,
    financialRiskLevel: isFinancialRiskLevel(o.financialRiskLevel)
      ? o.financialRiskLevel
      : base.financialRiskLevel,
    notes: typeof o.notes === 'string' ? o.notes : base.notes,
  }
}

export function isCondoAssociationFinancialReviewUntouched(
  input?: DemoCondoAssociationFinancialReview | null,
): boolean {
  if (!input) return true
  const d = normalizeCondoAssociationFinancialReview(input)
  return (
    d.budgetReviewStatus === 'not_started' &&
    d.financialStatementsReviewStatus === 'not_started' &&
    d.reserveScheduleReviewStatus === 'not_started' &&
    d.duesAmount === null &&
    d.duesFrequency === 'unknown' &&
    d.specialAssessmentStatus === 'unknown' &&
    d.specialAssessmentAmount === null &&
    d.associationLoanOrLineOfCreditStatus === 'unknown' &&
    d.delinquencyConcern === 'unknown' &&
    d.reserveFundingStatus === 'unknown' &&
    d.financialRiskLevel === 'unknown' &&
    d.notes.trim() === ''
  )
}

export function condoFinancialDocReviewStatusPresentation(status: DemoCondoFinancialDocReviewStatus): {
  label: string
  bg: string
  color: string
  border: string
} {
  switch (status) {
    case 'issue_found':
      return { label: 'Issue found', bg: '#fee2e2', color: '#991b1b', border: 'rgba(185,28,28,0.35)' }
    case 'reviewed':
      return { label: 'Reviewed', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'received':
      return { label: 'Received', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
    case 'requested':
      return { label: 'Requested', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    default:
      return { label: 'Not started', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

export function condoFinancialRiskLevelPresentation(level: DemoCondoFinancialRiskLevel): {
  label: string
  bg: string
  color: string
  border: string
} {
  switch (level) {
    case 'none':
      return { label: 'None noted', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'low':
      return { label: 'Low', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'medium':
      return { label: 'Medium', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    case 'high':
      return { label: 'High', bg: '#fee2e2', color: '#991b1b', border: 'rgba(185,28,28,0.35)' }
    default:
      return { label: 'Unknown', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

/** Default empty structured association records/governance review for newly seeded rows. */
export function buildDefaultCondoAssociationRecordsGovernanceReview(): DemoCondoAssociationRecordsGovernanceReview {
  return {
    governingDocumentsReviewStatus: 'not_started',
    restrictionsReviewStatus: 'not_started',
    insuranceReviewStatus: 'not_started',
    boardMinutesReviewStatus: 'not_started',
    rentalRestrictionStatus: 'unknown',
    buyerApprovalStatus: 'unknown',
    insuranceConcernLevel: 'unknown',
    litigationOrDbprStatus: 'unknown',
    recordsAccessStatus: 'unknown',
    governanceConcernLevel: 'unknown',
    managementContactName: '',
    managementContactEmail: '',
    managementContactPhone: '',
    notes: '',
  }
}

export function normalizeCondoAssociationRecordsGovernanceReview(
  input?: Partial<DemoCondoAssociationRecordsGovernanceReview> | null,
): DemoCondoAssociationRecordsGovernanceReview {
  return {
    ...buildDefaultCondoAssociationRecordsGovernanceReview(),
    ...(input ?? {}),
  }
}

function isRentalRestrictionStatus(value: unknown): value is DemoCondoRentalRestrictionStatus {
  return (
    value === 'unknown' ||
    value === 'no_material_restriction_noted' ||
    value === 'restriction_noted' ||
    value === 'lawyer_review_required'
  )
}

function isBuyerApprovalStatus(value: unknown): value is DemoCondoBuyerApprovalStatus {
  return (
    value === 'unknown' ||
    value === 'not_required_noted' ||
    value === 'required' ||
    value === 'lawyer_review_required'
  )
}

function isLitigationOrDbprStatus(value: unknown): value is DemoCondoLitigationOrDbprStatus {
  return (
    value === 'unknown' ||
    value === 'none_disclosed' ||
    value === 'disclosed' ||
    value === 'lawyer_review_required'
  )
}

function isRecordsAccessStatus(value: unknown): value is DemoCondoRecordsAccessStatus {
  return (
    value === 'unknown' ||
    value === 'available' ||
    value === 'partial_or_incomplete' ||
    value === 'not_provided' ||
    value === 'lawyer_review_required'
  )
}

/**
 * Parse optional persisted `associationRecordsGovernanceReview`.
 * Missing/invalid object → undefined (older rows). Partial objects get defaults.
 */
export function parseDemoCondoAssociationRecordsGovernanceReview(
  raw: unknown,
): DemoCondoAssociationRecordsGovernanceReview | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const base = buildDefaultCondoAssociationRecordsGovernanceReview()

  return {
    governingDocumentsReviewStatus: isFinancialDocReviewStatus(o.governingDocumentsReviewStatus)
      ? o.governingDocumentsReviewStatus
      : base.governingDocumentsReviewStatus,
    restrictionsReviewStatus: isFinancialDocReviewStatus(o.restrictionsReviewStatus)
      ? o.restrictionsReviewStatus
      : base.restrictionsReviewStatus,
    insuranceReviewStatus: isFinancialDocReviewStatus(o.insuranceReviewStatus)
      ? o.insuranceReviewStatus
      : base.insuranceReviewStatus,
    boardMinutesReviewStatus: isFinancialDocReviewStatus(o.boardMinutesReviewStatus)
      ? o.boardMinutesReviewStatus
      : base.boardMinutesReviewStatus,
    rentalRestrictionStatus: isRentalRestrictionStatus(o.rentalRestrictionStatus)
      ? o.rentalRestrictionStatus
      : base.rentalRestrictionStatus,
    buyerApprovalStatus: isBuyerApprovalStatus(o.buyerApprovalStatus)
      ? o.buyerApprovalStatus
      : base.buyerApprovalStatus,
    insuranceConcernLevel: isFinancialRiskLevel(o.insuranceConcernLevel)
      ? (o.insuranceConcernLevel as DemoCondoGovernanceConcernLevel)
      : base.insuranceConcernLevel,
    litigationOrDbprStatus: isLitigationOrDbprStatus(o.litigationOrDbprStatus)
      ? o.litigationOrDbprStatus
      : base.litigationOrDbprStatus,
    recordsAccessStatus: isRecordsAccessStatus(o.recordsAccessStatus)
      ? o.recordsAccessStatus
      : base.recordsAccessStatus,
    governanceConcernLevel: isFinancialRiskLevel(o.governanceConcernLevel)
      ? (o.governanceConcernLevel as DemoCondoGovernanceConcernLevel)
      : base.governanceConcernLevel,
    managementContactName:
      typeof o.managementContactName === 'string' ? o.managementContactName : base.managementContactName,
    managementContactEmail:
      typeof o.managementContactEmail === 'string' ? o.managementContactEmail : base.managementContactEmail,
    managementContactPhone:
      typeof o.managementContactPhone === 'string' ? o.managementContactPhone : base.managementContactPhone,
    notes: typeof o.notes === 'string' ? o.notes : base.notes,
  }
}

export function isCondoAssociationRecordsGovernanceReviewUntouched(
  input?: DemoCondoAssociationRecordsGovernanceReview | null,
): boolean {
  if (!input) return true
  const d = normalizeCondoAssociationRecordsGovernanceReview(input)
  return (
    d.governingDocumentsReviewStatus === 'not_started' &&
    d.restrictionsReviewStatus === 'not_started' &&
    d.insuranceReviewStatus === 'not_started' &&
    d.boardMinutesReviewStatus === 'not_started' &&
    d.rentalRestrictionStatus === 'unknown' &&
    d.buyerApprovalStatus === 'unknown' &&
    d.insuranceConcernLevel === 'unknown' &&
    d.litigationOrDbprStatus === 'unknown' &&
    d.recordsAccessStatus === 'unknown' &&
    d.governanceConcernLevel === 'unknown' &&
    d.managementContactName.trim() === '' &&
    d.managementContactEmail.trim() === '' &&
    d.managementContactPhone.trim() === '' &&
    d.notes.trim() === ''
  )
}

/** Alias presentation for governance/insurance concern levels (same tokens as financial risk). */
export function condoGovernanceConcernLevelPresentation(level: DemoCondoGovernanceConcernLevel): {
  label: string
  bg: string
  color: string
  border: string
} {
  return condoFinancialRiskLevelPresentation(level)
}

/** Default empty structured disclosure package review for newly seeded rows. */
export function buildDefaultCondoDisclosurePackageReview(): DemoCondoDisclosurePackageReview {
  return {
    reviewStatus: 'not_started',
    packageReceivedDate: '',
    packageCompletenessStatus: 'unknown',
    faqOrStatutoryQuestionsReviewStatus: 'not_started',
    governingDocsIncludedReviewStatus: 'not_started',
    financialsIncludedReviewStatus: 'not_started',
    insuranceIncludedReviewStatus: 'not_started',
    litigationOrClaimsDisclosureStatus: 'unknown',
    structuralOrSirsMaterialsStatus: 'not_started',
    estoppelIncludedStatus: 'not_started',
    followUpNeeded: false,
    packageConcernLevel: 'unknown',
    notes: '',
  }
}

export function normalizeCondoDisclosurePackageReview(
  input?: Partial<DemoCondoDisclosurePackageReview> | null,
): DemoCondoDisclosurePackageReview {
  return {
    ...buildDefaultCondoDisclosurePackageReview(),
    ...(input ?? {}),
  }
}

function isDisclosurePackageCompleteness(
  value: unknown,
): value is DemoCondoDisclosurePackageCompleteness {
  return (
    value === 'unknown' ||
    value === 'not_received' ||
    value === 'partial_or_incomplete' ||
    value === 'appears_complete' ||
    value === 'lawyer_review_required'
  )
}

/**
 * Parse optional persisted `disclosurePackageReview`.
 * Missing/invalid object → undefined (older rows). Partial objects get defaults.
 */
export function parseDemoCondoDisclosurePackageReview(
  raw: unknown,
): DemoCondoDisclosurePackageReview | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const base = buildDefaultCondoDisclosurePackageReview()

  return {
    reviewStatus: isFinancialDocReviewStatus(o.reviewStatus) ? o.reviewStatus : base.reviewStatus,
    packageReceivedDate: isYmdDateString(o.packageReceivedDate)
      ? o.packageReceivedDate.trim()
      : base.packageReceivedDate,
    packageCompletenessStatus: isDisclosurePackageCompleteness(o.packageCompletenessStatus)
      ? o.packageCompletenessStatus
      : base.packageCompletenessStatus,
    faqOrStatutoryQuestionsReviewStatus: isFinancialDocReviewStatus(o.faqOrStatutoryQuestionsReviewStatus)
      ? o.faqOrStatutoryQuestionsReviewStatus
      : base.faqOrStatutoryQuestionsReviewStatus,
    governingDocsIncludedReviewStatus: isFinancialDocReviewStatus(o.governingDocsIncludedReviewStatus)
      ? o.governingDocsIncludedReviewStatus
      : base.governingDocsIncludedReviewStatus,
    financialsIncludedReviewStatus: isFinancialDocReviewStatus(o.financialsIncludedReviewStatus)
      ? o.financialsIncludedReviewStatus
      : base.financialsIncludedReviewStatus,
    insuranceIncludedReviewStatus: isFinancialDocReviewStatus(o.insuranceIncludedReviewStatus)
      ? o.insuranceIncludedReviewStatus
      : base.insuranceIncludedReviewStatus,
    litigationOrClaimsDisclosureStatus: isLitigationOrDbprStatus(o.litigationOrClaimsDisclosureStatus)
      ? o.litigationOrClaimsDisclosureStatus
      : base.litigationOrClaimsDisclosureStatus,
    structuralOrSirsMaterialsStatus: isFinancialDocReviewStatus(o.structuralOrSirsMaterialsStatus)
      ? o.structuralOrSirsMaterialsStatus
      : base.structuralOrSirsMaterialsStatus,
    estoppelIncludedStatus: isFinancialDocReviewStatus(o.estoppelIncludedStatus)
      ? o.estoppelIncludedStatus
      : base.estoppelIncludedStatus,
    followUpNeeded: typeof o.followUpNeeded === 'boolean' ? o.followUpNeeded : base.followUpNeeded,
    packageConcernLevel: isFinancialRiskLevel(o.packageConcernLevel)
      ? (o.packageConcernLevel as DemoCondoGovernanceConcernLevel)
      : base.packageConcernLevel,
    notes: typeof o.notes === 'string' ? o.notes : base.notes,
  }
}

export function isCondoDisclosurePackageReviewUntouched(
  input?: DemoCondoDisclosurePackageReview | null,
): boolean {
  if (!input) return true
  const d = normalizeCondoDisclosurePackageReview(input)
  return (
    d.reviewStatus === 'not_started' &&
    d.packageReceivedDate.trim() === '' &&
    d.packageCompletenessStatus === 'unknown' &&
    d.faqOrStatutoryQuestionsReviewStatus === 'not_started' &&
    d.governingDocsIncludedReviewStatus === 'not_started' &&
    d.financialsIncludedReviewStatus === 'not_started' &&
    d.insuranceIncludedReviewStatus === 'not_started' &&
    d.litigationOrClaimsDisclosureStatus === 'unknown' &&
    d.structuralOrSirsMaterialsStatus === 'not_started' &&
    d.estoppelIncludedStatus === 'not_started' &&
    d.followUpNeeded === false &&
    d.packageConcernLevel === 'unknown' &&
    d.notes.trim() === ''
  )
}

export function condoDisclosurePackageCompletenessPresentation(
  status: DemoCondoDisclosurePackageCompleteness,
): { label: string; bg: string; color: string; border: string } {
  switch (status) {
    case 'appears_complete':
      return { label: 'Appears complete', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'partial_or_incomplete':
      return { label: 'Partial or incomplete', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    case 'not_received':
      return { label: 'Not received', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
    case 'lawyer_review_required':
      return { label: 'Lawyer review required', bg: '#fee2e2', color: '#991b1b', border: 'rgba(185,28,28,0.35)' }
    case 'unknown':
    default:
      return { label: 'Unknown', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

const CONDO_SUMMARY_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/** Short month-day label for operational summary copy (e.g. `Sep 12`). */
export function formatCondoDiligenceSummaryTargetDate(isoDate: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!m) return null
  const month = Number(m[2])
  const day = Number(m[3])
  if (!Number.isFinite(month) || !Number.isFinite(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }
  return `${CONDO_SUMMARY_MONTHS[month - 1]} ${day}`
}

export type CondoDiligenceSummaryDocumentCounts = {
  received: number
  requested: number
  outstanding: number
  total: number
}

export type CondoDiligenceEstoppelSummaryKind =
  | 'not_requested'
  | 'requested'
  | 'received_review_pending'
  | 'reviewed'
  | 'issue_flagged'

export type CondoDiligenceNextActionKind =
  | 'chase_estoppel'
  | 'request_estoppel'
  | 'request_outstanding'
  | 'follow_up_requested'
  | 'review_findings'
  | 'review_pack'

export type CondoDiligenceOperationalSummary = {
  documentCounts: CondoDiligenceSummaryDocumentCounts
  documentsLine: string
  openFindingsCount: number
  findingsLine: string
  estoppelKind: CondoDiligenceEstoppelSummaryKind
  estoppelStatusLabel: string
  /** Neutral attention copy when target date has passed and review is not received/reviewed. */
  estoppelAttention: string | null
  nextAction: string
  nextActionKind: CondoDiligenceNextActionKind
}

function countCondoDiligenceDocumentsForSummary(input: {
  matterId: string
  requiredDocuments: readonly DemoCondoDiligenceRequiredDocument[]
  documents: DeriveCondoRequiredDocumentStatusInput['documents']
  documentRequests: DeriveCondoRequiredDocumentStatusInput['documentRequests']
}): CondoDiligenceSummaryDocumentCounts {
  let received = 0
  let requested = 0
  let outstanding = 0
  for (const doc of input.requiredDocuments) {
    const derived = deriveCondoRequiredDocumentStatus({
      matterId: input.matterId,
      condoDocId: doc.id,
      storedStatus: doc.status,
      documents: input.documents,
      documentRequests: input.documentRequests,
    })
    if (derived === 'received') received += 1
    else if (derived === 'requested') requested += 1
    else outstanding += 1
  }
  return {
    received,
    requested,
    outstanding,
    total: input.requiredDocuments.length,
  }
}

function deriveCondoEstoppelSummaryDisplay(input: {
  condo: DemoCondoDiligence | null | undefined
  matterId: string
  documents: DeriveCondoRequiredDocumentStatusInput['documents']
  documentRequests: DeriveCondoRequiredDocumentStatusInput['documentRequests']
  now: Date
}): Pick<
  CondoDiligenceOperationalSummary,
  'estoppelKind' | 'estoppelStatusLabel' | 'estoppelAttention'
> {
  const hasStructuredReview = Boolean(input.condo?.estoppelReview)
  const review = hasStructuredReview
    ? normalizeCondoEstoppelReview(input.condo?.estoppelReview)
    : null

  const estoppelRow = input.condo?.requiredDocuments.find((d) => d.id === 'estoppel')
  const checklistStatus: DemoCondoDiligenceDocStatus = estoppelRow
    ? deriveCondoRequiredDocumentStatus({
        matterId: input.matterId,
        condoDocId: estoppelRow.id,
        storedStatus: estoppelRow.status,
        documents: input.documents,
        documentRequests: input.documentRequests,
      })
    : 'outstanding'

  let estoppelKind: CondoDiligenceEstoppelSummaryKind
  let estoppelStatusLabel: string
  let dueDate = ''

  if (review) {
    dueDate = review.dueDate.trim()
    const targetLabel = formatCondoDiligenceSummaryTargetDate(dueDate)
    switch (review.reviewStatus) {
      case 'issue_found':
        estoppelKind = 'issue_flagged'
        estoppelStatusLabel = 'Issue flagged'
        break
      case 'reviewed':
        estoppelKind = 'reviewed'
        estoppelStatusLabel = 'Reviewed'
        break
      case 'received':
        estoppelKind = 'received_review_pending'
        estoppelStatusLabel = 'Received — review pending'
        break
      case 'requested':
        estoppelKind = 'requested'
        estoppelStatusLabel = targetLabel
          ? `Requested — target response date ${targetLabel}`
          : 'Requested'
        break
      default:
        estoppelKind = 'not_requested'
        estoppelStatusLabel = 'Not requested'
        break
    }
  } else {
    switch (checklistStatus) {
      case 'received':
        estoppelKind = 'received_review_pending'
        estoppelStatusLabel = 'Received — review pending'
        break
      case 'requested':
        estoppelKind = 'requested'
        estoppelStatusLabel = 'Requested'
        break
      default:
        estoppelKind = 'not_requested'
        estoppelStatusLabel = 'Not requested'
        break
    }
  }

  const reviewDone =
    estoppelKind === 'received_review_pending' ||
    estoppelKind === 'reviewed' ||
    estoppelKind === 'issue_flagged'
  const dueWarning =
    dueDate && !reviewDone ? condoEstoppelDueDateWarning(dueDate, { now: input.now }) : null
  const estoppelAttention =
    dueWarning?.kind === 'overdue' ? 'Target date passed — review needed' : null

  return { estoppelKind, estoppelStatusLabel, estoppelAttention }
}

function deriveCondoDiligenceNextAction(input: {
  review: DemoCondoEstoppelReview | null
  checklistEstoppelStatus: DemoCondoDiligenceDocStatus
  documentCounts: CondoDiligenceSummaryDocumentCounts
  openFindingsCount: number
}): Pick<CondoDiligenceOperationalSummary, 'nextAction' | 'nextActionKind'> {
  const { review, checklistEstoppelStatus, documentCounts, openFindingsCount } = input

  const estoppelRequestedNotDone = review
    ? review.reviewStatus === 'requested'
    : checklistEstoppelStatus === 'requested'
  const estoppelNotRequested = review
    ? review.reviewStatus === 'not_started'
    : checklistEstoppelStatus === 'outstanding'

  if (estoppelRequestedNotDone) {
    return {
      nextActionKind: 'chase_estoppel',
      nextAction: 'Review or chase the Estoppel request.',
    }
  }
  if (estoppelNotRequested) {
    return {
      nextActionKind: 'request_estoppel',
      nextAction: 'Request the Estoppel certificate.',
    }
  }
  if (documentCounts.outstanding > 0) {
    return {
      nextActionKind: 'request_outstanding',
      nextAction: 'Request outstanding association documents.',
    }
  }
  if (documentCounts.requested > 0) {
    return {
      nextActionKind: 'follow_up_requested',
      nextAction: 'Follow up on requested association documents.',
    }
  }
  if (openFindingsCount > 0) {
    return {
      nextActionKind: 'review_findings',
      nextAction: 'Review and resolve open diligence findings.',
    }
  }
  return {
    nextActionKind: 'review_pack',
    nextAction: 'Review the document pack and record lawyer findings.',
  }
}

/**
 * Read-only lawyer-facing operational summary for the Condo Diligence tab.
 * Derives from existing saved checklist, linkage, findings, and optional estoppelReview — does not persist.
 */
export function buildCondoDiligenceOperationalSummary(input: {
  matterId: string
  condo: DemoCondoDiligence | null | undefined
  documents?: DeriveCondoRequiredDocumentStatusInput['documents']
  documentRequests?: DeriveCondoRequiredDocumentStatusInput['documentRequests']
  /** Explicit “now” for date-sensitive attention copy (tests must pass this). */
  now?: Date
}): CondoDiligenceOperationalSummary {
  const documents = input.documents ?? []
  const documentRequests = input.documentRequests ?? []
  const now = input.now ?? new Date()
  const requiredDocuments = input.condo?.requiredDocuments ?? []
  const findings = input.condo?.findings ?? []

  const documentCounts = countCondoDiligenceDocumentsForSummary({
    matterId: input.matterId,
    requiredDocuments,
    documents,
    documentRequests,
  })
  const documentsLine = `Documents: ${documentCounts.received} received · ${documentCounts.requested} requested · ${documentCounts.outstanding} outstanding · ${documentCounts.total} total`

  const openFindingsCount = findings.length
  const findingsLine =
    openFindingsCount === 0
      ? 'No findings recorded'
      : `${openFindingsCount} open finding${openFindingsCount === 1 ? '' : 's'}`

  const estoppelDisplay = deriveCondoEstoppelSummaryDisplay({
    condo: input.condo,
    matterId: input.matterId,
    documents,
    documentRequests,
    now,
  })

  const hasStructuredReview = Boolean(input.condo?.estoppelReview)
  const review = hasStructuredReview
    ? normalizeCondoEstoppelReview(input.condo?.estoppelReview)
    : null
  const estoppelRow = input.condo?.requiredDocuments.find((d) => d.id === 'estoppel')
  const checklistEstoppelStatus: DemoCondoDiligenceDocStatus = estoppelRow
    ? deriveCondoRequiredDocumentStatus({
        matterId: input.matterId,
        condoDocId: estoppelRow.id,
        storedStatus: estoppelRow.status,
        documents,
        documentRequests,
      })
    : 'outstanding'

  const next = deriveCondoDiligenceNextAction({
    review,
    checklistEstoppelStatus,
    documentCounts,
    openFindingsCount,
  })

  return {
    documentCounts,
    documentsLine,
    openFindingsCount,
    findingsLine,
    ...estoppelDisplay,
    ...next,
  }
}

export type CondoDiligenceInternalReportSection = {
  title: string
  lines: string[]
}

export type CondoDiligenceInternalReport = {
  title: string
  disclaimer: string
  generatedAtLabel: string
  matterLabel: string
  matterStatusLabel: string
  sections: CondoDiligenceInternalReportSection[]
  /** Full plain-text body for clipboard / print (includes title + disclaimer). */
  plainText: string
}

function moneyOrDash(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

function nonEmptyOrDash(value: string): string {
  const t = value.trim()
  return t ? t : '—'
}

function formatReportGeneratedAt(now: Date): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

function collectCondoEvidenceLinks(input: {
  matterId: string
  requiredDocuments: readonly DemoCondoDiligenceRequiredDocument[]
  documents: DeriveCondoRequiredDocumentStatusInput['documents']
  documentRequests: Array<
    Pick<DemoDocumentRequest, 'matter_id' | 'title' | 'description' | 'category' | 'status'>
  >
}): { evidenceLines: string[]; openRequestLines: string[] } {
  const evidenceLines: string[] = []
  const openRequestLines: string[] = []
  const seenDocKeys = new Set<string>()
  const seenReqKeys = new Set<string>()

  const matterDocs = input.documents.filter((d) => d.matter_id === input.matterId && !d.deletedAt)
  const matterReqs = input.documentRequests.filter((r) => r.matter_id === input.matterId)

  for (const row of input.requiredDocuments) {
    for (const d of matterDocs) {
      if (!condoRequiredDocMatchesLinkageHaystack(demoDocLinkageHaystack(d), row.id)) continue
      const key = `${d.name}|${d.document_subtype ?? ''}|${row.id}`
      if (seenDocKeys.has(key)) continue
      seenDocKeys.add(key)
      evidenceLines.push(`${row.label}: ${d.name}${d.document_subtype ? ` (${d.document_subtype})` : ''}`)
    }
    for (const r of matterReqs) {
      if (r.status !== 'open') continue
      if (!condoRequiredDocMatchesLinkageHaystack(demoRequestLinkageHaystack(r), row.id)) continue
      const reqKey = `${r.title}|${row.id}`
      if (seenReqKeys.has(reqKey)) continue
      seenReqKeys.add(reqKey)
      openRequestLines.push(`${row.label}: ${r.title} (open)`)
    }
  }

  for (const r of matterReqs) {
    if (r.status !== 'open') continue
    if (openRequestLines.some((line) => line.includes(`: ${r.title} (`))) continue
    openRequestLines.push(`General: ${r.title} (open)`)
  }

  return { evidenceLines, openRequestLines }
}

/**
 * Read-only internal diligence report for lawyer copy/print.
 * Derives from existing condo diligence + linkage — does not persist and is not a compliance certificate.
 */
export function buildCondoDiligenceInternalReport(input: {
  matterId: string
  condo: DemoCondoDiligence | null | undefined
  documents?: DeriveCondoRequiredDocumentStatusInput['documents']
  documentRequests?: Array<
    Pick<DemoDocumentRequest, 'matter_id' | 'title' | 'description' | 'category' | 'status'>
  >
  /** Optional matter label (file id / address) for the report header. */
  matterLabel?: string
  now?: Date
}): CondoDiligenceInternalReport {
  const now = input.now ?? new Date()
  const documents = input.documents ?? []
  const documentRequests = input.documentRequests ?? []
  const condo = input.condo
  const requiredDocuments = condo?.requiredDocuments ?? []
  const findings = condo?.findings ?? []

  const operational = buildCondoDiligenceOperationalSummary({
    matterId: input.matterId,
    condo,
    documents,
    documentRequests,
    now,
  })

  const matterStatusLabel = condo
    ? condoDiligenceMatterStatusPresentation(condo.status).label
    : 'Not available'
  const matterLabel = (input.matterLabel ?? '').trim() || `Matter ${input.matterId}`

  const documentRows = requiredDocuments.map((doc) => {
    const derived = deriveCondoRequiredDocumentStatus({
      matterId: input.matterId,
      condoDocId: doc.id,
      storedStatus: doc.status,
      documents,
      documentRequests,
    })
    return `${doc.label}: ${derived}`
  })

  const estoppel = condo?.estoppelReview
    ? normalizeCondoEstoppelReview(condo.estoppelReview)
    : normalizeCondoEstoppelReview(undefined)
  const sirs = condo?.sirsMilestoneReview
    ? normalizeCondoSirsMilestoneReview(condo.sirsMilestoneReview)
    : normalizeCondoSirsMilestoneReview(undefined)
  const financial = condo?.associationFinancialReview
    ? normalizeCondoAssociationFinancialReview(condo.associationFinancialReview)
    : normalizeCondoAssociationFinancialReview(undefined)
  const governance = condo?.associationRecordsGovernanceReview
    ? normalizeCondoAssociationRecordsGovernanceReview(condo.associationRecordsGovernanceReview)
    : normalizeCondoAssociationRecordsGovernanceReview(undefined)
  const disclosure = condo?.disclosurePackageReview
    ? normalizeCondoDisclosurePackageReview(condo.disclosurePackageReview)
    : normalizeCondoDisclosurePackageReview(undefined)

  const estoppelLines = [
    `Review status: ${condoEstoppelReviewStatusPresentation(estoppel.reviewStatus).label}`,
    `Operational label: ${operational.estoppelStatusLabel}`,
    ...(operational.estoppelAttention ? [`Attention: ${operational.estoppelAttention}`] : []),
    `Request date: ${nonEmptyOrDash(estoppel.requestDate)}`,
    `Due date: ${nonEmptyOrDash(estoppel.dueDate)}`,
    `Received date: ${nonEmptyOrDash(estoppel.receivedDate)}`,
    `Amount due: ${moneyOrDash(estoppel.amountDue)}`,
    `Regular assessment: ${moneyOrDash(estoppel.regularAssessmentAmount)}`,
    `Special assessment: ${estoppel.specialAssessmentStatus}`,
    `Violations / liens: ${estoppel.violationOrLienStatus}`,
    `Notes: ${nonEmptyOrDash(estoppel.notes)}`,
  ]

  const sirsLines = [
    `Applicability: ${condoSirsApplicabilityPresentation(sirs.applicability).label}`,
    `Document status: ${condoSirsDocumentStatusPresentation(sirs.documentStatus).label}`,
    `Completion date: ${nonEmptyOrDash(sirs.completionDate)}`,
    `Result: ${condoSirsResultPresentation(sirs.result).label}`,
    `Reserve risk: ${condoSirsRiskLevelPresentation(sirs.reserveRiskLevel).label}`,
    `Structural risk: ${condoSirsRiskLevelPresentation(sirs.structuralRiskLevel).label}`,
    `Notes: ${nonEmptyOrDash(sirs.notes)}`,
  ]

  const financialLines = [
    `Budget review: ${condoFinancialDocReviewStatusPresentation(financial.budgetReviewStatus).label}`,
    `Financial statements review: ${condoFinancialDocReviewStatusPresentation(financial.financialStatementsReviewStatus).label}`,
    `Reserve schedule review: ${condoFinancialDocReviewStatusPresentation(financial.reserveScheduleReviewStatus).label}`,
    `Dues: ${moneyOrDash(financial.duesAmount)} (${financial.duesFrequency})`,
    `Special assessment: ${financial.specialAssessmentStatus} · ${moneyOrDash(financial.specialAssessmentAmount)}`,
    `Loan / LOC: ${financial.associationLoanOrLineOfCreditStatus}`,
    `Delinquency: ${financial.delinquencyConcern}`,
    `Reserve funding: ${financial.reserveFundingStatus}`,
    `Financial risk: ${condoFinancialRiskLevelPresentation(financial.financialRiskLevel).label}`,
    `Notes: ${nonEmptyOrDash(financial.notes)}`,
  ]

  const governanceLines = [
    `Governing documents: ${condoFinancialDocReviewStatusPresentation(governance.governingDocumentsReviewStatus).label}`,
    `Restrictions review: ${condoFinancialDocReviewStatusPresentation(governance.restrictionsReviewStatus).label}`,
    `Insurance review: ${condoFinancialDocReviewStatusPresentation(governance.insuranceReviewStatus).label}`,
    `Board minutes review: ${condoFinancialDocReviewStatusPresentation(governance.boardMinutesReviewStatus).label}`,
    `Rental restrictions: ${governance.rentalRestrictionStatus}`,
    `Buyer approval: ${governance.buyerApprovalStatus}`,
    `Insurance concern: ${condoGovernanceConcernLevelPresentation(governance.insuranceConcernLevel).label}`,
    `Litigation / DBPR: ${governance.litigationOrDbprStatus}`,
    `Records access: ${governance.recordsAccessStatus}`,
    `Governance concern: ${condoGovernanceConcernLevelPresentation(governance.governanceConcernLevel).label}`,
    `Management contact: ${nonEmptyOrDash(governance.managementContactName)} · ${nonEmptyOrDash(governance.managementContactEmail)} · ${nonEmptyOrDash(governance.managementContactPhone)}`,
    `Notes: ${nonEmptyOrDash(governance.notes)}`,
  ]

  const disclosureLines = [
    `Review status: ${condoFinancialDocReviewStatusPresentation(disclosure.reviewStatus).label}`,
    `Package received date: ${nonEmptyOrDash(disclosure.packageReceivedDate)}`,
    `Completeness: ${condoDisclosurePackageCompletenessPresentation(disclosure.packageCompletenessStatus).label}`,
    `FAQ / statutory questions: ${condoFinancialDocReviewStatusPresentation(disclosure.faqOrStatutoryQuestionsReviewStatus).label}`,
    `Governing docs included: ${condoFinancialDocReviewStatusPresentation(disclosure.governingDocsIncludedReviewStatus).label}`,
    `Financials included: ${condoFinancialDocReviewStatusPresentation(disclosure.financialsIncludedReviewStatus).label}`,
    `Insurance included: ${condoFinancialDocReviewStatusPresentation(disclosure.insuranceIncludedReviewStatus).label}`,
    `Litigation / claims disclosure: ${disclosure.litigationOrClaimsDisclosureStatus}`,
    `Structural / SIRS materials: ${condoFinancialDocReviewStatusPresentation(disclosure.structuralOrSirsMaterialsStatus).label}`,
    `Estoppel included: ${condoFinancialDocReviewStatusPresentation(disclosure.estoppelIncludedStatus).label}`,
    `Follow-up needed: ${disclosure.followUpNeeded ? 'Yes' : 'No'}`,
    `Package concern: ${condoGovernanceConcernLevelPresentation(disclosure.packageConcernLevel).label}`,
    `Notes: ${nonEmptyOrDash(disclosure.notes)}`,
  ]

  const findingLines =
    findings.length === 0
      ? ['No findings recorded']
      : findings.map((f, i) => `${i + 1}. ${nonEmptyOrDash(f.text)}`)

  const { evidenceLines, openRequestLines } = collectCondoEvidenceLinks({
    matterId: input.matterId,
    requiredDocuments,
    documents,
    documentRequests,
  })

  const title = 'Internal Diligence Summary — Lawyer Review Required'
  const disclaimer =
    'Internal lawyer work product only. Not a client-facing compliance certificate, solvency opinion, or closing-readiness determination.'

  const sections: CondoDiligenceInternalReportSection[] = [
    {
      title: 'Document pack status',
      lines: [
        operational.documentsLine,
        `Matter diligence status: ${matterStatusLabel}`,
        `Next operational action: ${operational.nextAction}`,
        ...(documentRows.length > 0 ? documentRows : ['No required-document rows']),
      ],
    },
    { title: 'Estoppel review', lines: estoppelLines },
    { title: 'Structural / SIRS review', lines: sirsLines },
    { title: 'Financial review', lines: financialLines },
    { title: 'Records / governance review', lines: governanceLines },
    { title: 'Disclosure package review', lines: disclosureLines },
    { title: 'Open findings', lines: findingLines },
    {
      title: 'Open requests',
      lines: openRequestLines.length > 0 ? openRequestLines : ['No open document requests'],
    },
    {
      title: 'Evidence links',
      lines: evidenceLines.length > 0 ? evidenceLines : ['No matching linked documents'],
    },
    {
      title: 'Lawyer notes',
      lines: [
        `Matter notes: ${nonEmptyOrDash(condo?.notes ?? '')}`,
        `Estoppel notes: ${nonEmptyOrDash(estoppel.notes)}`,
        `SIRS / Milestone notes: ${nonEmptyOrDash(sirs.notes)}`,
        `Financial notes: ${nonEmptyOrDash(financial.notes)}`,
        `Records / governance notes: ${nonEmptyOrDash(governance.notes)}`,
        `Disclosure package notes: ${nonEmptyOrDash(disclosure.notes)}`,
      ],
    },
  ]

  const plainText = [
    title,
    disclaimer,
    `Matter: ${matterLabel}`,
    `Generated: ${formatReportGeneratedAt(now)}`,
    '',
    ...sections.flatMap((section) => [`## ${section.title}`, ...section.lines.map((l) => `- ${l}`), '']),
  ]
    .join('\n')
    .trimEnd()

  return {
    title,
    disclaimer,
    generatedAtLabel: formatReportGeneratedAt(now),
    matterLabel,
    matterStatusLabel,
    sections,
    plainText,
  }
}

export const CONDO_DILIGENCE_INTERNAL_SUMMARY_SUBTYPE = 'Condo diligence internal summary'

export function isCondoDiligenceInternalSummaryDocument(
  document: Pick<DemoDocument, 'document_subtype' | 'generatedInternalSummary' | 'name'>,
): boolean {
  if (document.generatedInternalSummary?.generatedType === 'condo_diligence_internal_summary') return true
  const subtype = (document.document_subtype ?? '').toLowerCase()
  if (subtype.includes('condo diligence internal summary')) return true
  return document.name.toLowerCase().includes('internal condo diligence summary')
}

/** Sort key for saved internal summary snapshots (prefer generatedAt, fall back to uploaded_at). */
export function condoDiligenceInternalSummarySortTime(
  document: Pick<DemoDocument, 'uploaded_at' | 'generatedInternalSummary'>,
): number {
  const iso = document.generatedInternalSummary?.generatedAt?.trim() || document.uploaded_at
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : 0
}

/**
 * Matter-document rows that are Internal Condo Diligence Summary snapshots, newest first.
 * Does not create a separate store — filters the existing document list.
 */
export function listCondoDiligenceInternalSummaryDocuments<T extends DemoDocument>(documents: T[]): T[] {
  return documents
    .filter((d) => !d.deletedAt && isCondoDiligenceInternalSummaryDocument(d))
    .slice()
    .sort((a, b) => condoDiligenceInternalSummarySortTime(b) - condoDiligenceInternalSummarySortTime(a))
}

export type CondoDiligenceParsedSummarySection = {
  title: string
  lines: string[]
}

export type CondoDiligenceParsedSummaryPlainText = {
  preambleLines: string[]
  sections: CondoDiligenceParsedSummarySection[]
}

export type CondoDiligenceSummaryChangeKind = 'added' | 'removed' | 'changed'

export type CondoDiligenceSummaryLineChange = {
  kind: CondoDiligenceSummaryChangeKind
  label: string
  earlierValue?: string
  newerValue?: string
}

export type CondoDiligenceSummarySectionChanges = {
  sectionTitle: string
  changes: CondoDiligenceSummaryLineChange[]
}

export type CondoDiligenceSummaryComparison = {
  earlierSnapshotId: string
  newerSnapshotId: string
  compactSummary: {
    sectionsChanged: number
    linesAdded: number
    linesRemoved: number
    linesChanged: number
    unchanged: boolean
  }
  sectionChanges: CondoDiligenceSummarySectionChanges[]
  disclaimer: string
}

const SUMMARY_COMPARE_DISCLAIMER =
  'Internal lawyer comparison of two saved snapshots only. Factual text differences — not a compliance determination, risk-resolution finding, or closing recommendation. Neither snapshot is regenerated from current matter state.'

function normalizeSummaryContentLine(raw: string): string {
  return raw.replace(/^\s*-\s*/, '').trim()
}

/**
 * Parses immutable saved Internal Condo Diligence Summary plain text into preamble + `##` sections.
 * Does not regenerate from live matter state.
 */
export function parseCondoDiligenceInternalSummaryPlainText(
  content: string,
): CondoDiligenceParsedSummaryPlainText {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const preambleLines: string[] = []
  const sections: CondoDiligenceParsedSummarySection[] = []
  let current: CondoDiligenceParsedSummarySection | null = null

  for (const raw of lines) {
    const heading = raw.match(/^##\s+(.+?)\s*$/)
    if (heading) {
      current = { title: heading[1].trim(), lines: [] }
      sections.push(current)
      continue
    }
    const normalized = normalizeSummaryContentLine(raw)
    if (!normalized) continue
    if (current) current.lines.push(normalized)
    else preambleLines.push(normalized)
  }

  return { preambleLines, sections }
}

function parseLabeledSummaryLine(line: string): { label: string; value: string } | null {
  const idx = line.indexOf(':')
  if (idx <= 0) return null
  const label = line.slice(0, idx).trim()
  const value = line.slice(idx + 1).trim()
  if (!label) return null
  return { label, value }
}

function compareSummarySectionLines(
  earlierLines: string[],
  newerLines: string[],
): CondoDiligenceSummaryLineChange[] {
  const earlierLabeled = new Map<string, string>()
  const newerLabeled = new Map<string, string>()
  const earlierUnlabeled: string[] = []
  const newerUnlabeled: string[] = []

  for (const line of earlierLines) {
    const parsed = parseLabeledSummaryLine(line)
    if (parsed && !earlierLabeled.has(parsed.label)) earlierLabeled.set(parsed.label, parsed.value)
    else if (parsed) earlierUnlabeled.push(line)
    else earlierUnlabeled.push(line)
  }
  for (const line of newerLines) {
    const parsed = parseLabeledSummaryLine(line)
    if (parsed && !newerLabeled.has(parsed.label)) newerLabeled.set(parsed.label, parsed.value)
    else if (parsed) newerUnlabeled.push(line)
    else newerUnlabeled.push(line)
  }

  const changes: CondoDiligenceSummaryLineChange[] = []
  const labels = new Set([...earlierLabeled.keys(), ...newerLabeled.keys()])
  const sortedLabels = [...labels].sort((a, b) => a.localeCompare(b))

  for (const label of sortedLabels) {
    const earlierValue = earlierLabeled.get(label)
    const newerValue = newerLabeled.get(label)
    if (earlierValue === undefined && newerValue !== undefined) {
      changes.push({ kind: 'added', label, newerValue })
    } else if (earlierValue !== undefined && newerValue === undefined) {
      changes.push({ kind: 'removed', label, earlierValue })
    } else if (earlierValue !== undefined && newerValue !== undefined && earlierValue !== newerValue) {
      changes.push({ kind: 'changed', label, earlierValue, newerValue })
    }
  }

  const earlierBag = new Map<string, number>()
  for (const line of earlierUnlabeled) {
    earlierBag.set(line, (earlierBag.get(line) ?? 0) + 1)
  }
  for (const line of newerUnlabeled) {
    const count = earlierBag.get(line) ?? 0
    if (count > 0) earlierBag.set(line, count - 1)
    else changes.push({ kind: 'added', label: line, newerValue: line })
  }
  for (const [line, count] of earlierBag) {
    for (let i = 0; i < count; i += 1) {
      changes.push({ kind: 'removed', label: line, earlierValue: line })
    }
  }

  return changes
}

/**
 * Factual text comparison of two immutable saved summary snapshots.
 * Does not regenerate reports or infer legal conclusions.
 */
export function compareCondoDiligenceInternalSummaryPlainText(input: {
  earlierContent: string
  newerContent: string
  earlierSnapshotId?: string
  newerSnapshotId?: string
}): CondoDiligenceSummaryComparison {
  const earlier = parseCondoDiligenceInternalSummaryPlainText(input.earlierContent)
  const newer = parseCondoDiligenceInternalSummaryPlainText(input.newerContent)

  const earlierByTitle = new Map(earlier.sections.map((s) => [s.title, s.lines]))
  const newerByTitle = new Map(newer.sections.map((s) => [s.title, s.lines]))

  const titleOrder: string[] = []
  const seen = new Set<string>()
  for (const s of newer.sections) {
    if (!seen.has(s.title)) {
      seen.add(s.title)
      titleOrder.push(s.title)
    }
  }
  for (const s of earlier.sections) {
    if (!seen.has(s.title)) {
      seen.add(s.title)
      titleOrder.push(s.title)
    }
  }

  const sectionChanges: CondoDiligenceSummarySectionChanges[] = []

  const preambleChanges = compareSummarySectionLines(earlier.preambleLines, newer.preambleLines)
  if (preambleChanges.length > 0) {
    sectionChanges.push({ sectionTitle: 'Header', changes: preambleChanges })
  }

  for (const title of titleOrder) {
    const changes = compareSummarySectionLines(earlierByTitle.get(title) ?? [], newerByTitle.get(title) ?? [])
    if (changes.length > 0) sectionChanges.push({ sectionTitle: title, changes })
  }

  let linesAdded = 0
  let linesRemoved = 0
  let linesChanged = 0
  for (const section of sectionChanges) {
    for (const change of section.changes) {
      if (change.kind === 'added') linesAdded += 1
      else if (change.kind === 'removed') linesRemoved += 1
      else linesChanged += 1
    }
  }

  return {
    earlierSnapshotId: input.earlierSnapshotId ?? '',
    newerSnapshotId: input.newerSnapshotId ?? '',
    compactSummary: {
      sectionsChanged: sectionChanges.length,
      linesAdded,
      linesRemoved,
      linesChanged,
      unchanged: sectionChanges.length === 0,
    },
    sectionChanges,
    disclaimer: SUMMARY_COMPARE_DISCLAIMER,
  }
}

/**
 * Builds an `AddDemoDocumentInput` snapshot of the current Internal Diligence Summary.
 * Immutable content lives in `generatedInternalSummary.content` (and a short description).
 */
export function buildCondoDiligenceSummaryDraftDocumentInput(input: {
  matterId: string
  uploadedByStaffId: string
  report: Pick<CondoDiligenceInternalReport, 'title' | 'plainText' | 'generatedAtLabel' | 'matterLabel'>
  /** ISO timestamp for metadata + uploaded_at when provided. */
  generatedAtIso?: string
  id?: string
}): AddDemoDocumentInput | null {
  const matter_id = input.matterId.trim()
  const uploaded_by_staff_id = input.uploadedByStaffId.trim()
  if (!matter_id || !uploaded_by_staff_id) return null
  const content = input.report.plainText.trim()
  if (!content) return null

  const generatedAt = input.generatedAtIso?.trim() || new Date().toISOString()
  const stamp = input.report.generatedAtLabel.trim() || formatReportGeneratedAt(new Date(generatedAt))
  const name = `Internal Condo Diligence Summary — ${stamp}`

  return {
    matter_id,
    name,
    category: 'Compliance',
    document_subtype: CONDO_DILIGENCE_INTERNAL_SUMMARY_SUBTYPE,
    description:
      'Internal lawyer work product snapshot — not shared to the client portal. Lawyer review required. Not a compliance certificate.',
    document_date: stamp.slice(0, 10),
    source: 'Condo Diligence (demo) — internal',
    status: 'draft',
    uploaded_by_staff_id,
    uploaded_at: generatedAt,
    ...(input.id ? { id: input.id } : {}),
    generatedInternalSummary: {
      generatedType: 'condo_diligence_internal_summary',
      generatedAt,
      sourceMatterId: matter_id,
      content,
      visibility: 'internal',
    },
  }
}

type MatterEligibilityInput = {
  matter_type: DemoMatter['matter_type']
  property: Pick<DemoMatter['property'], 'address' | 'property_type'> & { county?: DemoMatter['property']['county'] }
}

/** True when the property address looks like Florida (demo heuristic). */
export function isFloridaPropertyAddress(address: string): boolean {
  const a = address.trim()
  if (!a) return false
  return /\bFL\b/.test(a) || /,\s*FL(?:\s|,|$)/i.test(a)
}

/** Condo unit or co-op style matter (co-op inferred from matter type until a dedicated field exists). */
export function isCondoOrCoopMatter(input: MatterEligibilityInput): boolean {
  if (input.property.property_type === 'Condo') return true
  return /co-?op/i.test(input.matter_type)
}

/**
 * Florida-first condo diligence: eligible when (condo or co-op) and Florida address.
 * Pure — safe for tests and store use later.
 */
export function isCondoDiligenceEligible(matter: MatterEligibilityInput): boolean {
  return isCondoOrCoopMatter(matter) && isFloridaPropertyAddress(matter.property.address)
}

const DEFAULT_REQUIRED_DOCS: DemoCondoDiligenceRequiredDocument[] = [
  { id: 'estoppel', label: 'Estoppel', status: 'outstanding', detail: null },
  { id: 'milestone_inspection_summary', label: 'Milestone inspection summary', status: 'outstanding', detail: null },
  { id: 'sirs_reserve_study', label: 'SIRS / reserve study', status: 'outstanding', detail: null },
  { id: 'current_budget', label: 'Current budget', status: 'outstanding', detail: null },
  { id: 'insurance_summary', label: 'Insurance summary', status: 'outstanding', detail: null },
  { id: 'recent_board_minutes', label: 'Recent board minutes', status: 'outstanding', detail: null },
  { id: 'association_financial_statements', label: 'Association financial statements', status: 'outstanding', detail: null },
  {
    id: 'declaration_bylaws_rules_amendments',
    label: 'Declaration, bylaws, rules & amendments',
    status: 'outstanding',
    detail: null,
  },
  { id: 'reserve_schedule_funding_detail', label: 'Reserve schedule / funding detail', status: 'outstanding', detail: null },
  {
    id: 'special_assessment_notice_schedule',
    label: 'Special assessment notice / schedule',
    status: 'outstanding',
    detail: null,
  },
  {
    id: 'litigation_claims_arbitration_dbpr',
    label: 'Litigation, claims, arbitration or DBPR disclosure',
    status: 'outstanding',
    detail: null,
  },
  {
    id: 'association_approval_leasing_restrictions',
    label: 'Association approval & leasing restrictions',
    status: 'outstanding',
    detail: null,
  },
  { id: 'management_association_contacts', label: 'Management & association contacts', status: 'outstanding', detail: null },
]

/** Stable ids for the original six condo diligence checklist rows (back-compat assertions). */
export const ORIGINAL_CONDO_DILIGENCE_REQUIRED_DOC_IDS = [
  'estoppel',
  'milestone_inspection_summary',
  'sirs_reserve_study',
  'current_budget',
  'insurance_summary',
  'recent_board_minutes',
] as const

/** Stable ids added in the core document-pack expansion (demo defaults for newly eligible matters). */
export const CORE_CONDO_DILIGENCE_DOC_PACK_IDS = [
  'association_financial_statements',
  'declaration_bylaws_rules_amendments',
  'reserve_schedule_funding_detail',
  'special_assessment_notice_schedule',
  'litigation_claims_arbitration_dbpr',
  'association_approval_leasing_restrictions',
  'management_association_contacts',
] as const

export type BuildDefaultCondoDiligenceOptions = {
  nowIso?: () => string
}

/** Default diligence row for an eligible matter (metadata-only demo). */
export function buildDefaultCondoDiligence(options?: BuildDefaultCondoDiligenceOptions): DemoCondoDiligence {
  const updated_at = options?.nowIso?.() ?? new Date().toISOString()
  const requiredDocuments = DEFAULT_REQUIRED_DOCS.map((d) => ({ ...d }))
  const findings: DemoCondoDiligenceFinding[] = []
  return {
    applicable: true,
    requiredDocuments,
    findings,
    notes: '',
    updated_at,
    status: deriveCondoDiligenceMatterStatusFromChecklist({ requiredDocuments, findings }),
    estoppelReview: buildDefaultCondoEstoppelReview(),
    sirsMilestoneReview: buildDefaultCondoSirsMilestoneReview(),
    associationFinancialReview: buildDefaultCondoAssociationFinancialReview(),
    associationRecordsGovernanceReview: buildDefaultCondoAssociationRecordsGovernanceReview(),
    disclosurePackageReview: buildDefaultCondoDisclosurePackageReview(),
  }
}
