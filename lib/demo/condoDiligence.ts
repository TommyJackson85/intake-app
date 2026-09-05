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
  DemoCondoDisclosurePackageDeliveryMethod,
  DemoCondoDisclosurePackageRequestStatus,
  DemoCondoDisclosurePackageReview,
  DemoCondoDisclosurePackageType,
  DemoCondoDuesFrequency,
  DemoCondoEstoppelReview,
  DemoCondoEstoppelReviewStatus,
  DemoCondoEstoppelSpecialAssessmentStatus,
  DemoCondoEstoppelViolationOrLienStatus,
  DemoCondoFinancialDocReviewStatus,
  DemoCondoFinancialRiskLevel,
  DemoCondoGovernanceConcernLevel,
  DemoCondoLitigationOrDbprStatus,
  DemoCondoQuestionnaireApplicability,
  DemoCondoQuestionnaireLenderIssueStatus,
  DemoCondoQuestionnaireLenderReview,
  DemoCondoQuestionnaireStatus,
  DemoCondoRecordsAccessStatus,
  DemoCondoRentalRestrictionStatus,
  DemoCondoReserveFundingStatus,
  DemoCondoSirsApplicability,
  DemoCondoSirsDocumentStatus,
  DemoCondoSirsMilestoneReview,
  DemoCondoSirsResult,
  DemoCondoSirsRiskLevel,
  DemoCondoClosingDependencyStatus,
  DemoCondoLegalDescriptionStatus,
  DemoCondoLimitedCommonElementStatus,
  DemoCondoMunicipalLienStatus,
  DemoCondoParkingStorageStatus,
  DemoCondoPermitsCodeStatus,
  DemoCondoSellerRepairDisclosureStatus,
  DemoCondoTitleReviewStatus,
  DemoCondoUnitClosingDependenciesReview,
  DemoCondoUnitInspectionStatus,
  DemoCondoLawyerReviewCheckpoint,
  DemoCondoLawyerReviewCheckpointStatus,
  DemoDocument,
  DemoDocumentRequest,
  DemoMatter,
  DemoMatterReviewTask,
} from '@/lib/demo/types'
import type { AddDemoDocumentInput } from '@/lib/demo/demoDocument'
import {
  listActiveCondoDiligenceSummaryReviewTasks,
  listCondoDiligenceSummaryReviewTasks,
} from '@/lib/demo/demoMatterReviewTask'

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
    questionnaireLenderReview?: DemoCondoQuestionnaireLenderReview | null
    unitClosingDependenciesReview?: DemoCondoUnitClosingDependenciesReview | null
    lawyerReviewCheckpoint?: DemoCondoLawyerReviewCheckpoint | null
  },
): boolean {
  const notesEmpty = input.notes.trim() === ''
  const noFindings =
    input.findings.length === 0 ||
    input.findings.every(
      (f) => f.text.trim() === '' && !(f.linkedReviewTaskIds && f.linkedReviewTaskIds.length > 0),
    )
  const allOutstanding = input.requiredDocuments.length > 0 && input.requiredDocuments.every((d) => d.status === 'outstanding')
  const estoppelUntouched = isCondoEstoppelReviewUntouched(input.estoppelReview)
  const sirsUntouched = isCondoSirsMilestoneReviewUntouched(input.sirsMilestoneReview)
  const financialUntouched = isCondoAssociationFinancialReviewUntouched(input.associationFinancialReview)
  const governanceUntouched = isCondoAssociationRecordsGovernanceReviewUntouched(
    input.associationRecordsGovernanceReview,
  )
  const disclosureUntouched = isCondoDisclosurePackageReviewUntouched(input.disclosurePackageReview)
  const questionnaireUntouched = isCondoQuestionnaireLenderReviewUntouched(input.questionnaireLenderReview)
  const unitClosingUntouched = isCondoUnitClosingDependenciesReviewUntouched(input.unitClosingDependenciesReview)
  const lawyerCheckpointUntouched = isCondoLawyerReviewCheckpointUntouched(input.lawyerReviewCheckpoint)
  return (
    input.status === 'not_started' &&
    notesEmpty &&
    noFindings &&
    allOutstanding &&
    estoppelUntouched &&
    sirsUntouched &&
    financialUntouched &&
    governanceUntouched &&
    disclosureUntouched &&
    questionnaireUntouched &&
    unitClosingUntouched &&
    lawyerCheckpointUntouched
  )
}

/**
 * Parse optional `linkedReviewTaskIds` on a finding.
 * Missing/invalid → undefined (older findings). Dedupes trimmed string ids.
 */
export function parseCondoDiligenceFindingLinkedReviewTaskIds(raw: unknown): string[] | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!Array.isArray(raw)) return undefined
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const id = item.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

/** Append a review-task id to a finding without duplicates (immutable). */
export function withCondoDiligenceFindingLinkedReviewTaskId(
  finding: DemoCondoDiligenceFinding,
  taskId: string,
): DemoCondoDiligenceFinding {
  const id = taskId.trim()
  if (!id) return finding
  const existing = finding.linkedReviewTaskIds ?? []
  if (existing.includes(id)) return finding
  return { ...finding, linkedReviewTaskIds: [...existing, id] }
}

/**
 * Matter Condo Diligence summary review tasks that can still be linked to this finding
 * (same matter, internal summary-review type, not already linked).
 */
export function listLinkableCondoDiligenceReviewTasksForFinding(input: {
  tasks: readonly DemoMatterReviewTask[]
  matterId: string
  finding: Pick<DemoCondoDiligenceFinding, 'linkedReviewTaskIds'>
}): DemoMatterReviewTask[] {
  const linked = new Set(input.finding.linkedReviewTaskIds ?? [])
  return listCondoDiligenceSummaryReviewTasks([...input.tasks], input.matterId).filter((t) => !linked.has(t.id))
}

/** Prefill helpers for creating a follow-up review task from a finding (lawyer-controlled). */
export function buildCondoDiligenceFindingFollowUpTaskPrefill(finding: Pick<DemoCondoDiligenceFinding, 'text'>): {
  title: string
  internalNote: string
} {
  const text = finding.text.trim()
  const excerpt = text.length > 80 ? `${text.slice(0, 77)}…` : text
  return {
    title: excerpt ? `Follow up: ${excerpt}` : 'Follow up: Condo diligence finding',
    internalNote: text
      ? `From Condo Diligence finding:\n${text}`
      : 'From Condo Diligence finding (empty text at create time).',
  }
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
    packageRequestStatus: 'unknown',
    packageRequestedDate: '',
    packageReceivedDate: '',
    packageType: 'unknown',
    deliveryMethod: 'unknown',
    packageCompletenessStatus: 'unknown',
    faqOrStatutoryQuestionsReviewStatus: 'not_started',
    governingDocsIncludedReviewStatus: 'not_started',
    financialsIncludedReviewStatus: 'not_started',
    insuranceIncludedReviewStatus: 'not_started',
    litigationOrClaimsDisclosureStatus: 'unknown',
    structuralOrSirsMaterialsStatus: 'not_started',
    estoppelIncludedStatus: 'not_started',
    followUpNeeded: false,
    missingItemsNotes: '',
    optionalPackageNotes: '',
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

function isDisclosurePackageRequestStatus(
  value: unknown,
): value is DemoCondoDisclosurePackageRequestStatus {
  return (
    value === 'unknown' ||
    value === 'not_requested' ||
    value === 'requested' ||
    value === 'received'
  )
}

function isDisclosurePackageType(value: unknown): value is DemoCondoDisclosurePackageType {
  return value === 'unknown' || value === 'resale' || value === 'new_construction' || value === 'other'
}

function isDisclosurePackageDeliveryMethod(
  value: unknown,
): value is DemoCondoDisclosurePackageDeliveryMethod {
  return (
    value === 'unknown' ||
    value === 'email' ||
    value === 'portal' ||
    value === 'mail' ||
    value === 'hand_delivery' ||
    value === 'other'
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
    packageRequestStatus: isDisclosurePackageRequestStatus(o.packageRequestStatus)
      ? o.packageRequestStatus
      : base.packageRequestStatus,
    packageRequestedDate: isYmdDateString(o.packageRequestedDate)
      ? o.packageRequestedDate.trim()
      : base.packageRequestedDate,
    packageReceivedDate: isYmdDateString(o.packageReceivedDate)
      ? o.packageReceivedDate.trim()
      : base.packageReceivedDate,
    packageType: isDisclosurePackageType(o.packageType) ? o.packageType : base.packageType,
    deliveryMethod: isDisclosurePackageDeliveryMethod(o.deliveryMethod)
      ? o.deliveryMethod
      : base.deliveryMethod,
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
    missingItemsNotes: typeof o.missingItemsNotes === 'string' ? o.missingItemsNotes : base.missingItemsNotes,
    optionalPackageNotes:
      typeof o.optionalPackageNotes === 'string' ? o.optionalPackageNotes : base.optionalPackageNotes,
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
    d.packageRequestStatus === 'unknown' &&
    d.packageRequestedDate.trim() === '' &&
    d.packageReceivedDate.trim() === '' &&
    d.packageType === 'unknown' &&
    d.deliveryMethod === 'unknown' &&
    d.packageCompletenessStatus === 'unknown' &&
    d.faqOrStatutoryQuestionsReviewStatus === 'not_started' &&
    d.governingDocsIncludedReviewStatus === 'not_started' &&
    d.financialsIncludedReviewStatus === 'not_started' &&
    d.insuranceIncludedReviewStatus === 'not_started' &&
    d.litigationOrClaimsDisclosureStatus === 'unknown' &&
    d.structuralOrSirsMaterialsStatus === 'not_started' &&
    d.estoppelIncludedStatus === 'not_started' &&
    d.followUpNeeded === false &&
    d.missingItemsNotes.trim() === '' &&
    d.optionalPackageNotes.trim() === '' &&
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

export function condoDisclosurePackageRequestStatusPresentation(
  status: DemoCondoDisclosurePackageRequestStatus,
): { label: string; bg: string; color: string; border: string } {
  switch (status) {
    case 'received':
      return { label: 'Received', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'requested':
      return { label: 'Requested', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
    case 'not_requested':
      return { label: 'Not requested', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
    case 'unknown':
    default:
      return { label: 'Unknown', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

export function condoDisclosurePackageTypeLabel(type: DemoCondoDisclosurePackageType): string {
  switch (type) {
    case 'resale':
      return 'Resale'
    case 'new_construction':
      return 'New construction'
    case 'other':
      return 'Other'
    case 'unknown':
    default:
      return 'Unknown'
  }
}

export function condoDisclosurePackageDeliveryMethodLabel(
  method: DemoCondoDisclosurePackageDeliveryMethod,
): string {
  switch (method) {
    case 'email':
      return 'Email'
    case 'portal':
      return 'Portal'
    case 'mail':
      return 'Mail'
    case 'hand_delivery':
      return 'Hand delivery'
    case 'other':
      return 'Other'
    case 'unknown':
    default:
      return 'Unknown'
  }
}

/** Matter financing → questionnaire UI eligibility (does not mutate matter financing). */
export type CondoQuestionnaireFinancingEligibility =
  | 'potentially_financed'
  | 'not_applicable_cash'
  | 'lawyer_review_required'

/**
 * Smallest consistent financing eligibility for Questionnaire / Lender Review.
 * Uses existing `financingType` only — Cash → N/A; blank/missing → lawyer confirmation; else potentially financed.
 */
export function resolveCondoQuestionnaireFinancingEligibility(
  matter: Pick<DemoMatter, 'financingType'>,
): CondoQuestionnaireFinancingEligibility {
  const raw = (matter.financingType ?? '').trim()
  if (!raw) return 'lawyer_review_required'
  if (/^cash$/i.test(raw)) return 'not_applicable_cash'
  return 'potentially_financed'
}

export function condoQuestionnaireFinancingEligibilityPresentation(
  eligibility: CondoQuestionnaireFinancingEligibility,
): { label: string; detail: string; bg: string; color: string; border: string } {
  switch (eligibility) {
    case 'potentially_financed':
      return {
        label: 'Potentially financed matter',
        detail: 'Questionnaire review may apply',
        bg: '#dbeafe',
        color: '#1e40af',
        border: 'rgba(30,64,175,0.25)',
      }
    case 'not_applicable_cash':
      return {
        label: 'Not applicable',
        detail: 'Matter financing is recorded as cash / non-financed.',
        bg: '#f5f5f5',
        color: '#627c71',
        border: 'rgba(94,82,64,0.2)',
      }
    case 'lawyer_review_required':
    default:
      return {
        label: 'Lawyer review required',
        detail: 'Financing status requires lawyer confirmation',
        bg: '#fff4d6',
        color: '#b45309',
        border: 'rgba(240,180,41,0.35)',
      }
  }
}

/** Default empty structured questionnaire / lender review for newly seeded rows. */
export function buildDefaultCondoQuestionnaireLenderReview(): DemoCondoQuestionnaireLenderReview {
  return {
    applicability: 'unknown',
    questionnaireStatus: 'not_started',
    lenderName: '',
    lenderContactName: '',
    lenderContactEmail: '',
    lenderContactPhone: '',
    questionnaireEvidenceDocumentId: null,
    requestDate: '',
    requestedResponseDate: '',
    receivedDate: '',
    lenderIssueStatus: 'unknown',
    issueNote: '',
    notes: '',
  }
}

export function normalizeCondoQuestionnaireLenderReview(
  input?: Partial<DemoCondoQuestionnaireLenderReview> | null,
): DemoCondoQuestionnaireLenderReview {
  return {
    ...buildDefaultCondoQuestionnaireLenderReview(),
    ...(input ?? {}),
  }
}

function isQuestionnaireApplicability(value: unknown): value is DemoCondoQuestionnaireApplicability {
  return (
    value === 'unknown' ||
    value === 'not_applicable' ||
    value === 'appears_applicable' ||
    value === 'lawyer_review_required'
  )
}

function isQuestionnaireStatus(value: unknown): value is DemoCondoQuestionnaireStatus {
  return (
    value === 'not_started' ||
    value === 'requested' ||
    value === 'received' ||
    value === 'reviewed' ||
    value === 'issue_found' ||
    value === 'not_applicable'
  )
}

function isQuestionnaireLenderIssueStatus(value: unknown): value is DemoCondoQuestionnaireLenderIssueStatus {
  return (
    value === 'unknown' ||
    value === 'none_disclosed' ||
    value === 'issue_disclosed' ||
    value === 'lawyer_review_required'
  )
}

function parseOptionalDocumentId(value: unknown): string | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Parse optional persisted `questionnaireLenderReview`.
 * Missing/invalid object → undefined (older rows). Partial objects get defaults.
 */
export function parseDemoCondoQuestionnaireLenderReview(
  raw: unknown,
): DemoCondoQuestionnaireLenderReview | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const base = buildDefaultCondoQuestionnaireLenderReview()
  const evidenceId = parseOptionalDocumentId(o.questionnaireEvidenceDocumentId)

  return {
    applicability: isQuestionnaireApplicability(o.applicability) ? o.applicability : base.applicability,
    questionnaireStatus: isQuestionnaireStatus(o.questionnaireStatus)
      ? o.questionnaireStatus
      : base.questionnaireStatus,
    lenderName: typeof o.lenderName === 'string' ? o.lenderName : base.lenderName,
    lenderContactName: typeof o.lenderContactName === 'string' ? o.lenderContactName : base.lenderContactName,
    lenderContactEmail: typeof o.lenderContactEmail === 'string' ? o.lenderContactEmail : base.lenderContactEmail,
    lenderContactPhone: typeof o.lenderContactPhone === 'string' ? o.lenderContactPhone : base.lenderContactPhone,
    questionnaireEvidenceDocumentId:
      evidenceId !== undefined ? evidenceId : base.questionnaireEvidenceDocumentId,
    requestDate: isYmdDateString(o.requestDate) ? o.requestDate.trim() : base.requestDate,
    requestedResponseDate: isYmdDateString(o.requestedResponseDate)
      ? o.requestedResponseDate.trim()
      : base.requestedResponseDate,
    receivedDate: isYmdDateString(o.receivedDate) ? o.receivedDate.trim() : base.receivedDate,
    lenderIssueStatus: isQuestionnaireLenderIssueStatus(o.lenderIssueStatus)
      ? o.lenderIssueStatus
      : base.lenderIssueStatus,
    issueNote: typeof o.issueNote === 'string' ? o.issueNote : base.issueNote,
    notes: typeof o.notes === 'string' ? o.notes : base.notes,
  }
}

export function isCondoQuestionnaireLenderReviewUntouched(
  input?: DemoCondoQuestionnaireLenderReview | null,
): boolean {
  if (!input) return true
  const d = normalizeCondoQuestionnaireLenderReview(input)
  return (
    d.applicability === 'unknown' &&
    d.questionnaireStatus === 'not_started' &&
    d.lenderName.trim() === '' &&
    d.lenderContactName.trim() === '' &&
    d.lenderContactEmail.trim() === '' &&
    d.lenderContactPhone.trim() === '' &&
    d.questionnaireEvidenceDocumentId === null &&
    d.requestDate.trim() === '' &&
    d.requestedResponseDate.trim() === '' &&
    d.receivedDate.trim() === '' &&
    d.lenderIssueStatus === 'unknown' &&
    d.issueNote.trim() === '' &&
    d.notes.trim() === ''
  )
}

export function condoQuestionnaireApplicabilityPresentation(
  applicability: DemoCondoQuestionnaireApplicability,
): { label: string; bg: string; color: string; border: string } {
  switch (applicability) {
    case 'appears_applicable':
      return {
        label: 'Questionnaire review may apply',
        bg: '#dbeafe',
        color: '#1e40af',
        border: 'rgba(30,64,175,0.25)',
      }
    case 'not_applicable':
      return {
        label: 'Not applicable',
        bg: '#f5f5f5',
        color: '#627c71',
        border: 'rgba(94,82,64,0.2)',
      }
    case 'lawyer_review_required':
      return {
        label: 'Lawyer review required',
        bg: '#fff4d6',
        color: '#b45309',
        border: 'rgba(240,180,41,0.35)',
      }
    case 'unknown':
    default:
      return {
        label: 'Unknown',
        bg: '#f5f5f5',
        color: '#627c71',
        border: 'rgba(94,82,64,0.2)',
      }
  }
}

export function condoQuestionnaireStatusPresentation(
  status: DemoCondoQuestionnaireStatus,
): { label: string; bg: string; color: string; border: string } {
  switch (status) {
    case 'reviewed':
      return { label: 'Reviewed', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'issue_found':
      return { label: 'Issue found', bg: '#fee2e2', color: '#991b1b', border: 'rgba(185,28,28,0.35)' }
    case 'received':
      return { label: 'Received', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'requested':
      return { label: 'Requested', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
    case 'not_applicable':
      return { label: 'Not applicable', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
    case 'not_started':
    default:
      return { label: 'Not started', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

export function condoQuestionnaireLenderIssueStatusPresentation(
  status: DemoCondoQuestionnaireLenderIssueStatus,
): { label: string; bg: string; color: string; border: string } {
  switch (status) {
    case 'none_disclosed':
      return { label: 'None disclosed', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'issue_disclosed':
      return { label: 'Issue disclosed', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    case 'lawyer_review_required':
      return {
        label: 'Lawyer review required',
        bg: '#fee2e2',
        color: '#991b1b',
        border: 'rgba(185,28,28,0.35)',
      }
    case 'unknown':
    default:
      return { label: 'Unknown', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

/**
 * Whether the full questionnaire / lender form should render.
 * Lawyer applicability override is local to this review object — does not change matter financing.
 */
export function shouldShowCondoQuestionnaireLenderReviewForm(input: {
  financingEligibility: CondoQuestionnaireFinancingEligibility
  applicability: DemoCondoQuestionnaireApplicability
}): boolean {
  if (input.financingEligibility === 'potentially_financed') return true
  if (input.applicability === 'appears_applicable') return true
  if (input.financingEligibility === 'lawyer_review_required' && input.applicability === 'lawyer_review_required') {
    return true
  }
  return false
}

/** Keyword match for questionnaire / lender supporting documents (no new checklist row required). */
export function condoQuestionnaireDocumentMatchesHaystack(haystack: string): boolean {
  const t = haystack.toLowerCase().replace(/\s+/g, ' ').trim()
  if (!t) return false
  return (
    /\b(condo|lender|loan|mortgage)\s+questionnaire\b/.test(t) ||
    /\bquestionnaire\b/.test(t) ||
    /\blender\s+(form|package|cert)\b/.test(t) ||
    /\bfannie\b/.test(t) ||
    /\bfreddie\b/.test(t) ||
    /\bfha\s+condo\b/.test(t)
  )
}

/** Default empty structured unit & closing dependencies review for newly seeded rows. */
export function buildDefaultCondoUnitClosingDependenciesReview(): DemoCondoUnitClosingDependenciesReview {
  return {
    titleReviewStatus: 'not_started',
    legalDescriptionStatus: 'unknown',
    parkingStorageStatus: 'unknown',
    limitedCommonElementStatus: 'unknown',
    permitsCodeStatus: 'unknown',
    municipalLienStatus: 'unknown',
    inspectionStatus: 'unknown',
    sellerRepairDisclosureStatus: 'unknown',
    closingDependencyStatus: 'none_noted',
    titleEvidenceDocumentId: null,
    inspectionEvidenceDocumentId: null,
    sellerDisclosureEvidenceDocumentId: null,
    dependencyNote: '',
    notes: '',
  }
}

export function normalizeCondoUnitClosingDependenciesReview(
  input?: Partial<DemoCondoUnitClosingDependenciesReview> | null,
): DemoCondoUnitClosingDependenciesReview {
  return {
    ...buildDefaultCondoUnitClosingDependenciesReview(),
    ...(input ?? {}),
  }
}

function isTitleReviewStatus(value: unknown): value is DemoCondoTitleReviewStatus {
  return (
    value === 'not_started' ||
    value === 'requested' ||
    value === 'received' ||
    value === 'in_review' ||
    value === 'reviewed' ||
    value === 'issue_found'
  )
}

function isLegalDescriptionStatus(value: unknown): value is DemoCondoLegalDescriptionStatus {
  return (
    value === 'unknown' ||
    value === 'matches_recorded_materials' ||
    value === 'difference_noted' ||
    value === 'lawyer_review_required'
  )
}

function isParkingStorageStatus(value: unknown): value is DemoCondoParkingStorageStatus {
  return (
    value === 'unknown' ||
    value === 'not_applicable' ||
    value === 'reviewed_no_issue_noted' ||
    value === 'right_or_assignment_noted' ||
    value === 'issue_found' ||
    value === 'lawyer_review_required'
  )
}

function isLimitedCommonElementStatus(value: unknown): value is DemoCondoLimitedCommonElementStatus {
  return (
    value === 'unknown' ||
    value === 'not_applicable' ||
    value === 'reviewed_no_issue_noted' ||
    value === 'right_or_assignment_noted' ||
    value === 'issue_found' ||
    value === 'lawyer_review_required'
  )
}

function isPermitsCodeStatus(value: unknown): value is DemoCondoPermitsCodeStatus {
  return (
    value === 'unknown' ||
    value === 'none_disclosed' ||
    value === 'possible_issue_noted' ||
    value === 'issue_disclosed' ||
    value === 'lawyer_review_required'
  )
}

function isMunicipalLienStatus(value: unknown): value is DemoCondoMunicipalLienStatus {
  return (
    value === 'unknown' ||
    value === 'none_disclosed' ||
    value === 'possible_issue_noted' ||
    value === 'issue_disclosed' ||
    value === 'lawyer_review_required'
  )
}

function isUnitInspectionStatus(value: unknown): value is DemoCondoUnitInspectionStatus {
  return (
    value === 'unknown' ||
    value === 'not_applicable' ||
    value === 'requested' ||
    value === 'received' ||
    value === 'reviewed' ||
    value === 'issue_found'
  )
}

function isSellerRepairDisclosureStatus(value: unknown): value is DemoCondoSellerRepairDisclosureStatus {
  return (
    value === 'unknown' ||
    value === 'not_received' ||
    value === 'received' ||
    value === 'reviewed' ||
    value === 'issue_found' ||
    value === 'not_applicable'
  )
}

function isClosingDependencyStatus(value: unknown): value is DemoCondoClosingDependencyStatus {
  return (
    value === 'none_noted' ||
    value === 'open_item' ||
    value === 'issue_flagged' ||
    value === 'lawyer_review_required'
  )
}

/**
 * Parse optional persisted `unitClosingDependenciesReview`.
 * Missing/invalid object → undefined (older rows). Partial objects get defaults.
 */
export function parseDemoCondoUnitClosingDependenciesReview(
  raw: unknown,
): DemoCondoUnitClosingDependenciesReview | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const base = buildDefaultCondoUnitClosingDependenciesReview()
  const titleEvidenceId = parseOptionalDocumentId(o.titleEvidenceDocumentId)
  const inspectionEvidenceId = parseOptionalDocumentId(o.inspectionEvidenceDocumentId)
  const sellerDisclosureEvidenceId = parseOptionalDocumentId(o.sellerDisclosureEvidenceDocumentId)

  return {
    titleReviewStatus: isTitleReviewStatus(o.titleReviewStatus) ? o.titleReviewStatus : base.titleReviewStatus,
    legalDescriptionStatus: isLegalDescriptionStatus(o.legalDescriptionStatus)
      ? o.legalDescriptionStatus
      : base.legalDescriptionStatus,
    parkingStorageStatus: isParkingStorageStatus(o.parkingStorageStatus)
      ? o.parkingStorageStatus
      : base.parkingStorageStatus,
    limitedCommonElementStatus: isLimitedCommonElementStatus(o.limitedCommonElementStatus)
      ? o.limitedCommonElementStatus
      : base.limitedCommonElementStatus,
    permitsCodeStatus: isPermitsCodeStatus(o.permitsCodeStatus) ? o.permitsCodeStatus : base.permitsCodeStatus,
    municipalLienStatus: isMunicipalLienStatus(o.municipalLienStatus)
      ? o.municipalLienStatus
      : base.municipalLienStatus,
    inspectionStatus: isUnitInspectionStatus(o.inspectionStatus) ? o.inspectionStatus : base.inspectionStatus,
    sellerRepairDisclosureStatus: isSellerRepairDisclosureStatus(o.sellerRepairDisclosureStatus)
      ? o.sellerRepairDisclosureStatus
      : base.sellerRepairDisclosureStatus,
    closingDependencyStatus: isClosingDependencyStatus(o.closingDependencyStatus)
      ? o.closingDependencyStatus
      : base.closingDependencyStatus,
    titleEvidenceDocumentId: titleEvidenceId !== undefined ? titleEvidenceId : base.titleEvidenceDocumentId,
    inspectionEvidenceDocumentId:
      inspectionEvidenceId !== undefined ? inspectionEvidenceId : base.inspectionEvidenceDocumentId,
    sellerDisclosureEvidenceDocumentId:
      sellerDisclosureEvidenceId !== undefined
        ? sellerDisclosureEvidenceId
        : base.sellerDisclosureEvidenceDocumentId,
    dependencyNote: typeof o.dependencyNote === 'string' ? o.dependencyNote : base.dependencyNote,
    notes: typeof o.notes === 'string' ? o.notes : base.notes,
  }
}

export function isCondoUnitClosingDependenciesReviewUntouched(
  input?: DemoCondoUnitClosingDependenciesReview | null,
): boolean {
  if (!input) return true
  const d = normalizeCondoUnitClosingDependenciesReview(input)
  return (
    d.titleReviewStatus === 'not_started' &&
    d.legalDescriptionStatus === 'unknown' &&
    d.parkingStorageStatus === 'unknown' &&
    d.limitedCommonElementStatus === 'unknown' &&
    d.permitsCodeStatus === 'unknown' &&
    d.municipalLienStatus === 'unknown' &&
    d.inspectionStatus === 'unknown' &&
    d.sellerRepairDisclosureStatus === 'unknown' &&
    d.closingDependencyStatus === 'none_noted' &&
    d.titleEvidenceDocumentId === null &&
    d.inspectionEvidenceDocumentId === null &&
    d.sellerDisclosureEvidenceDocumentId === null &&
    d.dependencyNote.trim() === '' &&
    d.notes.trim() === ''
  )
}


/** Default empty lawyer review checkpoint for newly seeded diligence rows. */
export function buildDefaultCondoLawyerReviewCheckpoint(): DemoCondoLawyerReviewCheckpoint {
  return {
    status: 'not_recorded',
    reviewerId: null,
    reviewerName: null,
    reviewedAt: null,
    linkedSummaryDocumentId: null,
    openFindingCountAtReview: null,
    activeFollowUpTaskCountAtReview: null,
    conclusionNote: '',
  }
}

export function normalizeCondoLawyerReviewCheckpoint(
  input?: Partial<DemoCondoLawyerReviewCheckpoint> | null,
): DemoCondoLawyerReviewCheckpoint {
  return {
    ...buildDefaultCondoLawyerReviewCheckpoint(),
    ...(input ?? {}),
  }
}

function isLawyerReviewCheckpointStatus(value: unknown): value is DemoCondoLawyerReviewCheckpointStatus {
  return (
    value === 'not_recorded' ||
    value === 'in_progress' ||
    value === 'review_recorded' ||
    value === 'follow_up_required'
  )
}

function parseOptionalNullableString(value: unknown): string | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function parseOptionalNonNegativeInt(value: unknown): number | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isInteger(n) && n >= 0) return n
  }
  return undefined
}

/**
 * Parse optional persisted `lawyerReviewCheckpoint`.
 * Missing/invalid object → undefined (older rows). Partial objects get defaults.
 */
export function parseDemoCondoLawyerReviewCheckpoint(
  raw: unknown,
): DemoCondoLawyerReviewCheckpoint | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const base = buildDefaultCondoLawyerReviewCheckpoint()
  const reviewerId = parseOptionalNullableString(o.reviewerId)
  const reviewerName = parseOptionalNullableString(o.reviewerName)
  const reviewedAt = parseOptionalNullableString(o.reviewedAt)
  const linkedSummaryDocumentId = parseOptionalNullableString(o.linkedSummaryDocumentId)
  const openFindingCountAtReview = parseOptionalNonNegativeInt(o.openFindingCountAtReview)
  const activeFollowUpTaskCountAtReview = parseOptionalNonNegativeInt(o.activeFollowUpTaskCountAtReview)

  return {
    status: isLawyerReviewCheckpointStatus(o.status) ? o.status : base.status,
    reviewerId: reviewerId !== undefined ? reviewerId : base.reviewerId,
    reviewerName: reviewerName !== undefined ? reviewerName : base.reviewerName,
    reviewedAt: reviewedAt !== undefined ? reviewedAt : base.reviewedAt,
    linkedSummaryDocumentId:
      linkedSummaryDocumentId !== undefined ? linkedSummaryDocumentId : base.linkedSummaryDocumentId,
    openFindingCountAtReview:
      openFindingCountAtReview !== undefined ? openFindingCountAtReview : base.openFindingCountAtReview,
    activeFollowUpTaskCountAtReview:
      activeFollowUpTaskCountAtReview !== undefined
        ? activeFollowUpTaskCountAtReview
        : base.activeFollowUpTaskCountAtReview,
    conclusionNote: typeof o.conclusionNote === 'string' ? o.conclusionNote : base.conclusionNote,
  }
}

export function isCondoLawyerReviewCheckpointUntouched(
  input?: DemoCondoLawyerReviewCheckpoint | null,
): boolean {
  if (!input) return true
  const d = normalizeCondoLawyerReviewCheckpoint(input)
  return (
    d.status === 'not_recorded' &&
    d.reviewerId === null &&
    d.reviewerName === null &&
    d.reviewedAt === null &&
    d.linkedSummaryDocumentId === null &&
    d.openFindingCountAtReview === null &&
    d.activeFollowUpTaskCountAtReview === null &&
    d.conclusionNote.trim() === ''
  )
}

export function condoLawyerReviewCheckpointStatusPresentation(
  status: DemoCondoLawyerReviewCheckpointStatus,
): { label: string; bg: string; color: string; border: string } {
  switch (status) {
    case 'review_recorded':
      return { label: 'Review recorded', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'follow_up_required':
      return { label: 'Follow-up required', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    case 'in_progress':
      return { label: 'In progress', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
    case 'not_recorded':
    default:
      return { label: 'Not recorded', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

/** Snapshot open-finding and active follow-up-task counts at record time (demo). */
export function captureCondoLawyerReviewCheckpointCounts(input: {
  findings: readonly { id: string }[]
  tasks: readonly DemoMatterReviewTask[]
  matterId: string
}): { openFindingCountAtReview: number; activeFollowUpTaskCountAtReview: number } {
  return {
    openFindingCountAtReview: input.findings.length,
    activeFollowUpTaskCountAtReview: listActiveCondoDiligenceSummaryReviewTasks(
      [...input.tasks],
      input.matterId,
    ).length,
  }
}

export function condoTitleReviewStatusPresentation(
  status: DemoCondoTitleReviewStatus,
): { label: string; bg: string; color: string; border: string } {
  switch (status) {
    case 'reviewed':
      return { label: 'Reviewed', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'issue_found':
      return { label: 'Issue found', bg: '#fee2e2', color: '#991b1b', border: 'rgba(185,28,28,0.35)' }
    case 'in_review':
      return { label: 'In review', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
    case 'received':
      return { label: 'Received', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'requested':
      return { label: 'Requested', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
    case 'not_started':
    default:
      return { label: 'Not started', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

export function condoLegalDescriptionStatusPresentation(
  status: DemoCondoLegalDescriptionStatus,
): { label: string; bg: string; color: string; border: string } {
  switch (status) {
    case 'matches_recorded_materials':
      return {
        label: 'Matches recorded materials',
        bg: '#e8f5f0',
        color: '#166534',
        border: 'rgba(47,133,90,0.35)',
      }
    case 'difference_noted':
      return { label: 'Difference noted', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    case 'lawyer_review_required':
      return {
        label: 'Lawyer review required',
        bg: '#fee2e2',
        color: '#991b1b',
        border: 'rgba(185,28,28,0.35)',
      }
    case 'unknown':
    default:
      return { label: 'Unknown', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

export function condoParkingStorageStatusPresentation(
  status: DemoCondoParkingStorageStatus,
): { label: string; bg: string; color: string; border: string } {
  switch (status) {
    case 'reviewed_no_issue_noted':
      return {
        label: 'Reviewed — no issue noted',
        bg: '#e8f5f0',
        color: '#166534',
        border: 'rgba(47,133,90,0.35)',
      }
    case 'right_or_assignment_noted':
      return {
        label: 'Right or assignment noted',
        bg: '#dbeafe',
        color: '#1e40af',
        border: 'rgba(30,64,175,0.25)',
      }
    case 'issue_found':
      return { label: 'Issue found', bg: '#fee2e2', color: '#991b1b', border: 'rgba(185,28,28,0.35)' }
    case 'lawyer_review_required':
      return {
        label: 'Lawyer review required',
        bg: '#fff4d6',
        color: '#b45309',
        border: 'rgba(240,180,41,0.35)',
      }
    case 'not_applicable':
      return { label: 'Not applicable', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
    case 'unknown':
    default:
      return { label: 'Unknown', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

export function condoLimitedCommonElementStatusPresentation(
  status: DemoCondoLimitedCommonElementStatus,
): { label: string; bg: string; color: string; border: string } {
  return condoParkingStorageStatusPresentation(status)
}

export function condoPermitsCodeStatusPresentation(
  status: DemoCondoPermitsCodeStatus,
): { label: string; bg: string; color: string; border: string } {
  switch (status) {
    case 'none_disclosed':
      return { label: 'None disclosed', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'possible_issue_noted':
      return {
        label: 'Possible issue noted',
        bg: '#fff4d6',
        color: '#b45309',
        border: 'rgba(240,180,41,0.35)',
      }
    case 'issue_disclosed':
      return { label: 'Issue disclosed', bg: '#fee2e2', color: '#991b1b', border: 'rgba(185,28,28,0.35)' }
    case 'lawyer_review_required':
      return {
        label: 'Lawyer review required',
        bg: '#fff4d6',
        color: '#b45309',
        border: 'rgba(240,180,41,0.35)',
      }
    case 'unknown':
    default:
      return { label: 'Unknown', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

export function condoMunicipalLienStatusPresentation(
  status: DemoCondoMunicipalLienStatus,
): { label: string; bg: string; color: string; border: string } {
  return condoPermitsCodeStatusPresentation(status)
}

export function condoUnitInspectionStatusPresentation(
  status: DemoCondoUnitInspectionStatus,
): { label: string; bg: string; color: string; border: string } {
  switch (status) {
    case 'reviewed':
      return { label: 'Reviewed', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'issue_found':
      return { label: 'Issue found', bg: '#fee2e2', color: '#991b1b', border: 'rgba(185,28,28,0.35)' }
    case 'received':
      return { label: 'Received', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'requested':
      return { label: 'Requested', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
    case 'not_applicable':
      return { label: 'Not applicable', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
    case 'unknown':
    default:
      return { label: 'Unknown', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

export function condoSellerRepairDisclosureStatusPresentation(
  status: DemoCondoSellerRepairDisclosureStatus,
): { label: string; bg: string; color: string; border: string } {
  switch (status) {
    case 'reviewed':
      return { label: 'Reviewed', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'issue_found':
      return { label: 'Issue found', bg: '#fee2e2', color: '#991b1b', border: 'rgba(185,28,28,0.35)' }
    case 'received':
      return { label: 'Received', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'not_received':
      return { label: 'Not received', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    case 'not_applicable':
      return { label: 'Not applicable', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
    case 'unknown':
    default:
      return { label: 'Unknown', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

export function condoClosingDependencyStatusPresentation(
  status: DemoCondoClosingDependencyStatus,
): { label: string; bg: string; color: string; border: string } {
  switch (status) {
    case 'none_noted':
      return { label: 'None noted', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
    case 'open_item':
      return { label: 'Open item', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
    case 'issue_flagged':
      return { label: 'Issue flagged', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
    case 'lawyer_review_required':
      return {
        label: 'Lawyer review required',
        bg: '#fee2e2',
        color: '#991b1b',
        border: 'rgba(185,28,28,0.35)',
      }
    default:
      return { label: 'None noted', bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }
  }
}

/** Keyword match for unit/title/inspection/closing dependency supporting documents. */
export function condoUnitClosingDependenciesDocumentMatchesHaystack(haystack: string): boolean {
  const t = haystack.toLowerCase().replace(/\s+/g, ' ').trim()
  if (!t) return false
  return (
    /\btitle\b/.test(t) ||
    /\blegal\s+description\b/.test(t) ||
    /\bcommitment\b/.test(t) ||
    /\bparking\b/.test(t) ||
    /\bstorage\b/.test(t) ||
    /\blimited\s+common\b/.test(t) ||
    /\bpermit\b/.test(t) ||
    /\bcode\s+(violation|enforcement)\b/.test(t) ||
    /\bmunicipal\s+lien\b/.test(t) ||
    /\binspection\b/.test(t) ||
    /\bseller\s+disclosure\b/.test(t) ||
    /\bproperty\s+condition\b/.test(t) ||
    /\brepair\s+(addendum|disclosure)\b/.test(t)
  )
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



export type CondoDiligenceReviewDashboardBadge = {
  label: string
  bg: string
  color: string
  border: string
}

export type CondoDiligenceReviewDashboardRowId =
  | 'estoppel'
  | 'sirs'
  | 'financial'
  | 'governance'
  | 'insurance'
  | 'disclosure'
  | 'questionnaire'
  | 'unit_closing'
  | 'lawyer_checkpoint'

export type CondoDiligenceReviewDashboardRow = {
  id: CondoDiligenceReviewDashboardRowId
  title: string
  /** Existing Condo Diligence tab section element id for deep-link scroll. */
  sectionId: string
  badge: CondoDiligenceReviewDashboardBadge
  attention: boolean
  detail: string | null
}

export type CondoDiligenceReviewDashboard = {
  matterStatus: CondoDiligenceReviewDashboardBadge
  documentCounts: CondoDiligenceSummaryDocumentCounts
  documentsLine: string
  openFindingsCount: number
  findingsLine: string
  estoppelAttention: string | null
  nextAction: string
  nextActionKind: CondoDiligenceNextActionKind
  activeReviewTaskCount: number
  concernRowCount: number
  latestInternalSummaryDocumentId: string | null
  lawyerCheckpoint: {
    badge: CondoDiligenceReviewDashboardBadge
    reviewedAt: string | null
    reviewerName: string | null
    linkedSummaryDocumentId: string | null
    openFindingCountAtReview: number | null
    activeFollowUpTaskCountAtReview: number | null
  }
  rows: CondoDiligenceReviewDashboardRow[]
  disclaimer: string
}

function condoReviewDashboardFinancialNeedsAttention(
  review: DemoCondoAssociationFinancialReview,
): boolean {
  return (
    review.financialRiskLevel === 'medium' ||
    review.financialRiskLevel === 'high' ||
    review.delinquencyConcern === 'material' ||
    review.reserveFundingStatus === 'material_shortfall' ||
    review.budgetReviewStatus === 'issue_found' ||
    review.financialStatementsReviewStatus === 'issue_found' ||
    review.reserveScheduleReviewStatus === 'issue_found' ||
    review.specialAssessmentStatus === 'active' ||
    review.specialAssessmentStatus === 'proposed_or_pending'
  )
}

function condoReviewDashboardGovernanceNeedsAttention(
  review: DemoCondoAssociationRecordsGovernanceReview,
): boolean {
  return (
    review.governanceConcernLevel === 'medium' ||
    review.governanceConcernLevel === 'high' ||
    review.insuranceConcernLevel === 'medium' ||
    review.insuranceConcernLevel === 'high' ||
    review.governingDocumentsReviewStatus === 'issue_found' ||
    review.restrictionsReviewStatus === 'issue_found' ||
    review.insuranceReviewStatus === 'issue_found' ||
    review.boardMinutesReviewStatus === 'issue_found' ||
    review.rentalRestrictionStatus === 'lawyer_review_required' ||
    review.buyerApprovalStatus === 'lawyer_review_required' ||
    review.litigationOrDbprStatus === 'lawyer_review_required' ||
    review.recordsAccessStatus === 'lawyer_review_required' ||
    review.recordsAccessStatus === 'not_provided'
  )
}

function condoReviewDashboardInsuranceNeedsAttention(
  review: DemoCondoAssociationRecordsGovernanceReview,
): boolean {
  return (
    review.insuranceConcernLevel === 'medium' ||
    review.insuranceConcernLevel === 'high' ||
    review.insuranceReviewStatus === 'issue_found'
  )
}

function condoReviewDashboardDisclosureNeedsAttention(
  review: DemoCondoDisclosurePackageReview,
): boolean {
  return (
    review.followUpNeeded ||
    review.missingItemsNotes.trim() !== '' ||
    review.reviewStatus === 'issue_found' ||
    review.packageRequestStatus === 'requested' ||
    review.packageRequestStatus === 'not_requested' ||
    review.packageCompletenessStatus === 'lawyer_review_required' ||
    review.packageCompletenessStatus === 'partial_or_incomplete' ||
    review.packageCompletenessStatus === 'not_received' ||
    review.packageConcernLevel === 'medium' ||
    review.packageConcernLevel === 'high' ||
    review.litigationOrClaimsDisclosureStatus === 'disclosed' ||
    review.litigationOrClaimsDisclosureStatus === 'lawyer_review_required'
  )
}

function condoReviewDashboardQuestionnaireNeedsAttention(
  review: DemoCondoQuestionnaireLenderReview,
): boolean {
  return (
    review.questionnaireStatus === 'issue_found' ||
    review.questionnaireStatus === 'requested' ||
    review.lenderIssueStatus === 'issue_disclosed' ||
    review.lenderIssueStatus === 'lawyer_review_required' ||
    review.applicability === 'lawyer_review_required' ||
    (review.requestedResponseDate.trim() !== '' &&
      review.questionnaireStatus !== 'received' &&
      review.questionnaireStatus !== 'reviewed' &&
      review.questionnaireStatus !== 'not_applicable')
  )
}

function condoReviewDashboardSirsNeedsAttention(review: DemoCondoSirsMilestoneReview): boolean {
  return (
    review.reserveRiskLevel === 'elevated' ||
    review.reserveRiskLevel === 'high' ||
    review.structuralRiskLevel === 'elevated' ||
    review.structuralRiskLevel === 'high' ||
    review.result === 'fail' ||
    review.result === 'pass_with_findings'
  )
}

function condoReviewDashboardUnitClosingNeedsAttention(
  review: DemoCondoUnitClosingDependenciesReview,
): boolean {
  return (
    review.titleReviewStatus === 'issue_found' ||
    review.legalDescriptionStatus === 'difference_noted' ||
    review.legalDescriptionStatus === 'lawyer_review_required' ||
    review.parkingStorageStatus === 'issue_found' ||
    review.parkingStorageStatus === 'lawyer_review_required' ||
    review.limitedCommonElementStatus === 'issue_found' ||
    review.limitedCommonElementStatus === 'lawyer_review_required' ||
    review.permitsCodeStatus === 'possible_issue_noted' ||
    review.permitsCodeStatus === 'issue_disclosed' ||
    review.permitsCodeStatus === 'lawyer_review_required' ||
    review.municipalLienStatus === 'possible_issue_noted' ||
    review.municipalLienStatus === 'issue_disclosed' ||
    review.municipalLienStatus === 'lawyer_review_required' ||
    review.inspectionStatus === 'issue_found' ||
    review.sellerRepairDisclosureStatus === 'issue_found' ||
    review.closingDependencyStatus === 'open_item' ||
    review.closingDependencyStatus === 'issue_flagged' ||
    review.closingDependencyStatus === 'lawyer_review_required'
  )
}

/**
 * Read-only Condo Diligence Review Dashboard projection for Matter Overview.
 * Composes existing operational summary + nested review presentation helpers.
 * Does not persist, score readiness, or invent a second source of truth.
 */
export function buildCondoDiligenceReviewDashboard(input: {
  matterId: string
  condo: DemoCondoDiligence | null | undefined
  documents?: Array<
    DeriveCondoRequiredDocumentStatusInput['documents'][number] &
      Pick<DemoDocument, 'id' | 'uploaded_at' | 'generatedInternalSummary'>
  >
  documentRequests?: DeriveCondoRequiredDocumentStatusInput['documentRequests']
  /** Precomputed active (non-completed) summary review task count. */
  activeReviewTaskCount?: number
  now?: Date
}): CondoDiligenceReviewDashboard {
  const documents = input.documents ?? []
  const documentRequests = input.documentRequests ?? []
  const now = input.now ?? new Date()
  const ops = buildCondoDiligenceOperationalSummary({
    matterId: input.matterId,
    condo: input.condo,
    documents,
    documentRequests,
    now,
  })

  const estoppel = normalizeCondoEstoppelReview(input.condo?.estoppelReview)
  const sirs = normalizeCondoSirsMilestoneReview(input.condo?.sirsMilestoneReview)
  const financial = normalizeCondoAssociationFinancialReview(input.condo?.associationFinancialReview)
  const governance = normalizeCondoAssociationRecordsGovernanceReview(
    input.condo?.associationRecordsGovernanceReview,
  )
  const disclosure = normalizeCondoDisclosurePackageReview(input.condo?.disclosurePackageReview)
  const questionnaire = normalizeCondoQuestionnaireLenderReview(input.condo?.questionnaireLenderReview)
  const unitClosing = normalizeCondoUnitClosingDependenciesReview(
    input.condo?.unitClosingDependenciesReview,
  )
  const lawyerCheckpoint = normalizeCondoLawyerReviewCheckpoint(input.condo?.lawyerReviewCheckpoint)

  const estoppelBadge = condoEstoppelReviewStatusPresentation(estoppel.reviewStatus)
  const sirsBadge =
    sirs.result !== 'unknown'
      ? condoSirsResultPresentation(sirs.result)
      : condoSirsApplicabilityPresentation(sirs.applicability)
  const financialBadge = condoFinancialRiskLevelPresentation(financial.financialRiskLevel)
  const governanceBadge = condoGovernanceConcernLevelPresentation(governance.governanceConcernLevel)
  const insuranceBadge =
    governance.insuranceConcernLevel !== 'unknown'
      ? condoGovernanceConcernLevelPresentation(governance.insuranceConcernLevel)
      : condoFinancialDocReviewStatusPresentation(governance.insuranceReviewStatus)
  const disclosureBadge = condoDisclosurePackageCompletenessPresentation(
    disclosure.packageCompletenessStatus,
  )
  const questionnaireBadge = condoQuestionnaireStatusPresentation(questionnaire.questionnaireStatus)
  const unitClosingBadge =
    unitClosing.closingDependencyStatus !== 'none_noted'
      ? condoClosingDependencyStatusPresentation(unitClosing.closingDependencyStatus)
      : condoTitleReviewStatusPresentation(unitClosing.titleReviewStatus)
  const lawyerBadge = condoLawyerReviewCheckpointStatusPresentation(lawyerCheckpoint.status)

  const rows: CondoDiligenceReviewDashboardRow[] = [
    {
      id: 'estoppel',
      title: 'Estoppel',
      sectionId: 'condo-estoppel-review',
      badge: estoppelBadge,
      attention: Boolean(ops.estoppelAttention) || estoppel.reviewStatus === 'issue_found',
      detail: ops.estoppelAttention,
    },
    {
      id: 'sirs',
      title: 'SIRS / Milestone',
      sectionId: 'condo-sirs-milestone-review',
      badge: sirsBadge,
      attention: condoReviewDashboardSirsNeedsAttention(sirs),
      detail:
        sirs.reserveRiskLevel === 'elevated' || sirs.reserveRiskLevel === 'high'
          ? `Reserve risk: ${condoSirsRiskLevelPresentation(sirs.reserveRiskLevel).label}`
          : sirs.structuralRiskLevel === 'elevated' || sirs.structuralRiskLevel === 'high'
            ? `Structural risk: ${condoSirsRiskLevelPresentation(sirs.structuralRiskLevel).label}`
            : null,
    },
    {
      id: 'financial',
      title: 'Association financial',
      sectionId: 'condo-association-financial-review',
      badge: financialBadge,
      attention: condoReviewDashboardFinancialNeedsAttention(financial),
      detail: null,
    },
    {
      id: 'governance',
      title: 'Records / governance',
      sectionId: 'condo-association-records-governance-review',
      badge: governanceBadge,
      attention: condoReviewDashboardGovernanceNeedsAttention(governance),
      detail: null,
    },
    {
      id: 'insurance',
      title: 'Association insurance',
      sectionId: 'condo-association-records-governance-review',
      badge: insuranceBadge,
      attention: condoReviewDashboardInsuranceNeedsAttention(governance),
      detail: null,
    },
    {
      id: 'disclosure',
      title: 'Disclosure package',
      sectionId: 'condo-disclosure-package-review',
      badge: disclosureBadge,
      attention: condoReviewDashboardDisclosureNeedsAttention(disclosure),
      detail: disclosure.followUpNeeded ? 'Follow-up noted' : null,
    },
    {
      id: 'questionnaire',
      title: 'Questionnaire / lender',
      sectionId: 'condo-questionnaire-lender-review',
      badge: questionnaireBadge,
      attention: condoReviewDashboardQuestionnaireNeedsAttention(questionnaire),
      detail:
        questionnaire.lenderIssueStatus === 'issue_disclosed' ||
        questionnaire.lenderIssueStatus === 'lawyer_review_required'
          ? condoQuestionnaireLenderIssueStatusPresentation(questionnaire.lenderIssueStatus).label
          : null,
    },
    {
      id: 'unit_closing',
      title: 'Unit / closing dependencies',
      sectionId: 'condo-unit-closing-dependencies',
      badge: unitClosingBadge,
      attention: condoReviewDashboardUnitClosingNeedsAttention(unitClosing),
      detail: null,
    },
    {
      id: 'lawyer_checkpoint',
      title: 'Lawyer review checkpoint',
      sectionId: 'condo-lawyer-review-checkpoint',
      badge: lawyerBadge,
      attention: lawyerCheckpoint.status === 'follow_up_required',
      detail: lawyerCheckpoint.reviewedAt ? `Recorded ${lawyerCheckpoint.reviewedAt}` : null,
    },
  ]

  const summaries = listCondoDiligenceInternalSummaryDocuments(documents)
  const activeReviewTaskCount =
    typeof input.activeReviewTaskCount === 'number' && input.activeReviewTaskCount >= 0
      ? Math.floor(input.activeReviewTaskCount)
      : 0

  return {
    matterStatus: condoDiligenceMatterStatusPresentation(input.condo?.status ?? 'not_started'),
    documentCounts: ops.documentCounts,
    documentsLine: ops.documentsLine,
    openFindingsCount: ops.openFindingsCount,
    findingsLine: ops.findingsLine,
    estoppelAttention: ops.estoppelAttention,
    nextAction: ops.nextAction,
    nextActionKind: ops.nextActionKind,
    activeReviewTaskCount,
    concernRowCount: rows.filter((row) => row.attention).length,
    latestInternalSummaryDocumentId: summaries[0]?.id ?? null,
    lawyerCheckpoint: {
      badge: lawyerBadge,
      reviewedAt: lawyerCheckpoint.reviewedAt,
      reviewerName: lawyerCheckpoint.reviewerName,
      linkedSummaryDocumentId: lawyerCheckpoint.linkedSummaryDocumentId,
      openFindingCountAtReview: lawyerCheckpoint.openFindingCountAtReview,
      activeFollowUpTaskCountAtReview: lawyerCheckpoint.activeFollowUpTaskCountAtReview,
    },
    rows,
    disclaimer:
      'Operational snapshot only — not a compliance determination, safety finding, insurance conclusion, lender eligibility decision, or closing-readiness certification.',
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
  const questionnaire = condo?.questionnaireLenderReview
    ? normalizeCondoQuestionnaireLenderReview(condo.questionnaireLenderReview)
    : normalizeCondoQuestionnaireLenderReview(undefined)
  const unitClosing = condo?.unitClosingDependenciesReview
    ? normalizeCondoUnitClosingDependenciesReview(condo.unitClosingDependenciesReview)
    : normalizeCondoUnitClosingDependenciesReview(undefined)
  const lawyerCheckpoint = condo?.lawyerReviewCheckpoint
    ? normalizeCondoLawyerReviewCheckpoint(condo.lawyerReviewCheckpoint)
    : normalizeCondoLawyerReviewCheckpoint(undefined)

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
    `Package request status: ${condoDisclosurePackageRequestStatusPresentation(disclosure.packageRequestStatus).label}`,
    `Package requested date: ${nonEmptyOrDash(disclosure.packageRequestedDate)}`,
    `Package received date: ${nonEmptyOrDash(disclosure.packageReceivedDate)}`,
    `Package type: ${condoDisclosurePackageTypeLabel(disclosure.packageType)}`,
    `Delivery method: ${condoDisclosurePackageDeliveryMethodLabel(disclosure.deliveryMethod)}`,
    `Completeness: ${condoDisclosurePackageCompletenessPresentation(disclosure.packageCompletenessStatus).label}`,
    `FAQ / statutory questions: ${condoFinancialDocReviewStatusPresentation(disclosure.faqOrStatutoryQuestionsReviewStatus).label}`,
    `Governing docs included: ${condoFinancialDocReviewStatusPresentation(disclosure.governingDocsIncludedReviewStatus).label}`,
    `Financials included: ${condoFinancialDocReviewStatusPresentation(disclosure.financialsIncludedReviewStatus).label}`,
    `Insurance included: ${condoFinancialDocReviewStatusPresentation(disclosure.insuranceIncludedReviewStatus).label}`,
    `Litigation / claims disclosure: ${disclosure.litigationOrClaimsDisclosureStatus}`,
    `Structural / SIRS materials: ${condoFinancialDocReviewStatusPresentation(disclosure.structuralOrSirsMaterialsStatus).label}`,
    `Estoppel included: ${condoFinancialDocReviewStatusPresentation(disclosure.estoppelIncludedStatus).label}`,
    `Follow-up needed: ${disclosure.followUpNeeded ? 'Yes' : 'No'}`,
    `Missing items: ${nonEmptyOrDash(disclosure.missingItemsNotes)}`,
    `Optional package notes: ${nonEmptyOrDash(disclosure.optionalPackageNotes)}`,
    `Package concern: ${condoGovernanceConcernLevelPresentation(disclosure.packageConcernLevel).label}`,
    `Notes: ${nonEmptyOrDash(disclosure.notes)}`,
  ]

  const questionnaireLines = [
    `Applicability: ${condoQuestionnaireApplicabilityPresentation(questionnaire.applicability).label}`,
    `Questionnaire status: ${condoQuestionnaireStatusPresentation(questionnaire.questionnaireStatus).label}`,
    `Lender name: ${nonEmptyOrDash(questionnaire.lenderName)}`,
    `Lender contact: ${nonEmptyOrDash(questionnaire.lenderContactName)} · ${nonEmptyOrDash(questionnaire.lenderContactEmail)} · ${nonEmptyOrDash(questionnaire.lenderContactPhone)}`,
    `Evidence document id: ${questionnaire.questionnaireEvidenceDocumentId ?? '—'}`,
    `Request date: ${nonEmptyOrDash(questionnaire.requestDate)}`,
    `Requested response date: ${nonEmptyOrDash(questionnaire.requestedResponseDate)}`,
    `Received date: ${nonEmptyOrDash(questionnaire.receivedDate)}`,
    `Lender / project issues: ${condoQuestionnaireLenderIssueStatusPresentation(questionnaire.lenderIssueStatus).label}`,
    `Issue note: ${nonEmptyOrDash(questionnaire.issueNote)}`,
    `Notes: ${nonEmptyOrDash(questionnaire.notes)}`,
  ]

  const unitClosingLines = [
    `Title review: ${condoTitleReviewStatusPresentation(unitClosing.titleReviewStatus).label}`,
    `Legal description: ${condoLegalDescriptionStatusPresentation(unitClosing.legalDescriptionStatus).label}`,
    `Parking / storage: ${condoParkingStorageStatusPresentation(unitClosing.parkingStorageStatus).label}`,
    `Limited common elements: ${condoLimitedCommonElementStatusPresentation(unitClosing.limitedCommonElementStatus).label}`,
    `Permits / code: ${condoPermitsCodeStatusPresentation(unitClosing.permitsCodeStatus).label}`,
    `Municipal liens: ${condoMunicipalLienStatusPresentation(unitClosing.municipalLienStatus).label}`,
    `Inspection: ${condoUnitInspectionStatusPresentation(unitClosing.inspectionStatus).label}`,
    `Seller repair disclosure: ${condoSellerRepairDisclosureStatusPresentation(unitClosing.sellerRepairDisclosureStatus).label}`,
    `Closing dependencies: ${condoClosingDependencyStatusPresentation(unitClosing.closingDependencyStatus).label}`,
    `Title evidence document id: ${unitClosing.titleEvidenceDocumentId ?? '—'}`,
    `Inspection evidence document id: ${unitClosing.inspectionEvidenceDocumentId ?? '—'}`,
    `Seller disclosure evidence document id: ${unitClosing.sellerDisclosureEvidenceDocumentId ?? '—'}`,
    `Dependency note: ${nonEmptyOrDash(unitClosing.dependencyNote)}`,
    `Notes: ${nonEmptyOrDash(unitClosing.notes)}`,
  ]

  const lawyerCheckpointLines = [
    `Status: ${condoLawyerReviewCheckpointStatusPresentation(lawyerCheckpoint.status).label}`,
    `Reviewer: ${nonEmptyOrDash(lawyerCheckpoint.reviewerName ?? '') !== '—' ? nonEmptyOrDash(lawyerCheckpoint.reviewerName ?? '') : nonEmptyOrDash(lawyerCheckpoint.reviewerId ?? '')}`,
    `Reviewed at: ${nonEmptyOrDash(lawyerCheckpoint.reviewedAt ?? '')}`,
    `Linked summary document id: ${lawyerCheckpoint.linkedSummaryDocumentId ?? '—'}`,
    `Open findings at review: ${lawyerCheckpoint.openFindingCountAtReview ?? '—'}`,
    `Active follow-up tasks at review: ${lawyerCheckpoint.activeFollowUpTaskCountAtReview ?? '—'}`,
    `Conclusion note: ${nonEmptyOrDash(lawyerCheckpoint.conclusionNote)}`,
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
    { title: 'Questionnaire / lender review', lines: questionnaireLines },
    { title: 'Unit & closing dependencies', lines: unitClosingLines },
    { title: 'Lawyer review checkpoint', lines: lawyerCheckpointLines },
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
        `Questionnaire / lender notes: ${nonEmptyOrDash(questionnaire.notes)}`,
        `Unit & closing dependency notes: ${nonEmptyOrDash(unitClosing.notes)}`,
        `Lawyer review conclusion: ${nonEmptyOrDash(lawyerCheckpoint.conclusionNote)}`,
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

export const CONDO_DILIGENCE_REVIEW_MEMO_SUBTYPE = 'Condo diligence review memo'

export function isCondoDiligenceInternalSummaryDocument(
  document: Pick<DemoDocument, 'document_subtype' | 'generatedInternalSummary' | 'name'>,
): boolean {
  if (document.generatedInternalSummary?.generatedType === 'condo_diligence_review_memo') return false
  if (document.generatedInternalSummary?.generatedType === 'condo_diligence_internal_summary') return true
  const subtype = (document.document_subtype ?? '').toLowerCase()
  if (subtype.includes('condo diligence review memo')) return false
  if (subtype.includes('condo diligence internal summary')) return true
  return document.name.toLowerCase().includes('internal condo diligence summary')
}

/** True when the document is a saved Internal Condo Diligence Review Memo snapshot. */
export function isCondoDiligenceReviewMemoDocument(
  document: Pick<DemoDocument, 'document_subtype' | 'generatedInternalSummary' | 'name'>,
): boolean {
  if (document.generatedInternalSummary?.generatedType === 'condo_diligence_review_memo') return true
  const subtype = (document.document_subtype ?? '').toLowerCase()
  if (subtype.includes('condo diligence review memo')) return true
  const name = document.name.toLowerCase()
  return (
    name.includes('internal condo diligence review memo') ||
    name.includes('condo diligence review memo')
  )
}

/** Sort key for saved internal summary snapshots (prefer generatedAt, fall back to uploaded_at). */
export function condoDiligenceInternalSummarySortTime(
  document: Pick<DemoDocument, 'uploaded_at' | 'generatedInternalSummary'>,
): number {
  const iso = document.generatedInternalSummary?.generatedAt?.trim() || document.uploaded_at
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : 0
}

/** Sort key for saved review memo snapshots (prefer generatedAt, fall back to uploaded_at). */
export function condoDiligenceReviewMemoSortTime(
  document: Pick<DemoDocument, 'uploaded_at' | 'generatedInternalSummary'>,
): number {
  return condoDiligenceInternalSummarySortTime(document)
}

/**
 * Matter-document rows that are Internal Condo Diligence Summary snapshots, newest first.
 * Does not create a separate store — filters the existing document list.
 */
export function listCondoDiligenceInternalSummaryDocuments<
  T extends Pick<
    DemoDocument,
    | 'id'
    | 'name'
    | 'deletedAt'
    | 'uploaded_at'
    | 'document_subtype'
    | 'generatedInternalSummary'
  >,
>(documents: readonly T[]): T[] {
  return documents
    .filter((d) => !d.deletedAt && isCondoDiligenceInternalSummaryDocument(d))
    .slice()
    .sort((a, b) => condoDiligenceInternalSummarySortTime(b) - condoDiligenceInternalSummarySortTime(a))
}

/**
 * Matter-document rows that are Internal Condo Diligence Review Memo snapshots, newest first.
 * Visibility/navigation only — does not create, edit, or compare memos.
 */
export function listCondoDiligenceReviewMemoDocuments<
  T extends Pick<
    DemoDocument,
    | 'id'
    | 'name'
    | 'deletedAt'
    | 'uploaded_at'
    | 'document_subtype'
    | 'generatedInternalSummary'
  >,
>(documents: readonly T[]): T[] {
  return documents
    .filter((d) => !d.deletedAt && isCondoDiligenceReviewMemoDocument(d))
    .slice()
    .sort((a, b) => condoDiligenceReviewMemoSortTime(b) - condoDiligenceReviewMemoSortTime(a))
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


export type CondoDiligenceReviewMemoSection = {
  title: string
  lines: string[]
}

export type CondoDiligenceReviewMemo = {
  title: string
  disclaimer: string
  generatedAtLabel: string
  matterLabel: string
  matterStatusLabel: string
  sections: CondoDiligenceReviewMemoSection[]
  /** Full plain-text body for clipboard / print / immutable saved draft content. */
  plainText: string
}

/**
 * Concise Internal Condo Diligence Review Memo from the current Review Dashboard snapshot.
 * Dated work product only — does not certify compliance, clearance, or closing readiness.
 */
export function buildCondoDiligenceReviewMemo(input: {
  dashboard: CondoDiligenceReviewDashboard
  matterLabel?: string
  now?: Date
}): CondoDiligenceReviewMemo {
  const now = input.now ?? new Date()
  const generatedAtLabel = formatReportGeneratedAt(now)
  const matterLabel = (input.matterLabel ?? '').trim() || 'Matter'
  const title = 'Internal Condo Diligence Review Memo'
  const disclaimer =
    'Internal lawyer work product only. Dated operational snapshot of recorded Condo Diligence Review Dashboard data at generation time. Not a legal opinion, buyer recommendation, closing authorization, clearance determination, compliance certification, or client-ready report.'

  const snapshotLines = [
    `Matter status: ${input.dashboard.matterStatus.label}`,
    input.dashboard.documentsLine,
    input.dashboard.findingsLine,
    `Active review tasks: ${input.dashboard.activeReviewTaskCount}`,
    `Attention rows: ${input.dashboard.concernRowCount}`,
    `Next action: ${input.dashboard.nextAction}`,
  ]
  if (input.dashboard.estoppelAttention) {
    snapshotLines.push(`Estoppel attention: ${input.dashboard.estoppelAttention}`)
  }

  const reviewAreaLines = input.dashboard.rows.map((row) => {
    const detail = row.detail?.trim()
    const attention = row.attention ? ' (attention)' : ''
    return detail
      ? `${row.title}: ${row.badge.label}${attention} — ${detail}`
      : `${row.title}: ${row.badge.label}${attention}`
  })

  const checkpoint = input.dashboard.lawyerCheckpoint
  const checkpointLines = [
    `Status: ${checkpoint.badge.label}`,
    `Reviewed: ${checkpoint.reviewedAt?.trim() || '—'}`,
    `Reviewer: ${checkpoint.reviewerName?.trim() || '—'}`,
    `Open findings at review: ${
      checkpoint.openFindingCountAtReview === null || checkpoint.openFindingCountAtReview === undefined
        ? '—'
        : String(checkpoint.openFindingCountAtReview)
    }`,
    `Active follow-up tasks at review: ${
      checkpoint.activeFollowUpTaskCountAtReview === null ||
      checkpoint.activeFollowUpTaskCountAtReview === undefined
        ? '—'
        : String(checkpoint.activeFollowUpTaskCountAtReview)
    }`,
  ]

  const sections: CondoDiligenceReviewMemoSection[] = [
    { title: 'Snapshot', lines: snapshotLines },
    { title: 'Review areas', lines: reviewAreaLines },
    { title: 'Lawyer review checkpoint', lines: checkpointLines },
    { title: 'Disclaimer', lines: [disclaimer, input.dashboard.disclaimer] },
  ]

  const plainText = [
    title,
    '',
    disclaimer,
    '',
    `Matter: ${matterLabel}`,
    `Generated: ${generatedAtLabel}`,
    `Matter status: ${input.dashboard.matterStatus.label}`,
    '',
    ...sections.flatMap((section) => [`## ${section.title}`, ...section.lines.map((l) => `- ${l}`), '']),
  ]
    .join('\n')
    .trim()

  return {
    title,
    disclaimer,
    generatedAtLabel,
    matterLabel,
    matterStatusLabel: input.dashboard.matterStatus.label,
    sections,
    plainText,
  }
}

/**
 * Builds an `AddDemoDocumentInput` snapshot of the Internal Condo Diligence Review Memo.
 * Immutable content lives in `generatedInternalSummary.content` for Memo History / View memo.
 */
export function buildCondoDiligenceReviewMemoDraftDocumentInput(input: {
  matterId: string
  uploadedByStaffId: string
  memo: Pick<CondoDiligenceReviewMemo, 'title' | 'plainText' | 'generatedAtLabel' | 'matterLabel'>
  generatedAtIso?: string
  id?: string
}): AddDemoDocumentInput | null {
  const matter_id = input.matterId.trim()
  const uploaded_by_staff_id = input.uploadedByStaffId.trim()
  if (!matter_id || !uploaded_by_staff_id) return null
  const content = input.memo.plainText.trim()
  if (!content) return null

  const generatedAt = input.generatedAtIso?.trim() || new Date().toISOString()
  const stamp = input.memo.generatedAtLabel.trim() || formatReportGeneratedAt(new Date(generatedAt))
  const name = `Internal Condo Diligence Review Memo — ${stamp}`

  return {
    matter_id,
    name,
    category: 'Compliance',
    document_subtype: CONDO_DILIGENCE_REVIEW_MEMO_SUBTYPE,
    description:
      'Internal lawyer review memo snapshot — not shared to the client portal. Lawyer work product only. Not a compliance certificate or closing-readiness determination.',
    document_date: stamp.slice(0, 10),
    source: 'Condo Diligence (demo) — internal memo',
    status: 'draft',
    uploaded_by_staff_id,
    uploaded_at: generatedAt,
    ...(input.id ? { id: input.id } : {}),
    generatedInternalSummary: {
      generatedType: 'condo_diligence_review_memo',
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
    questionnaireLenderReview: buildDefaultCondoQuestionnaireLenderReview(),
    unitClosingDependenciesReview: buildDefaultCondoUnitClosingDependenciesReview(),
    lawyerReviewCheckpoint: buildDefaultCondoLawyerReviewCheckpoint(),
  }
}
