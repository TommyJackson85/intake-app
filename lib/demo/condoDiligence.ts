/**
 * Florida condo diligence helpers (eligibility, checklist, linkage to demo documents/requests).
 * Maps to `systemContract.domains.compliance` (condo slice) — implementation detail, not the contract file itself.
 */
import type {
  DemoCondoDiligence,
  DemoCondoDiligenceDocStatus,
  DemoCondoDiligenceFinding,
  DemoCondoDiligenceMatterStatus,
  DemoCondoDiligenceRequiredDocument,
  DemoDocument,
  DemoDocumentRequest,
  DemoMatter,
} from '@/lib/demo/types'

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
export function isCondoDiligenceUntouched(input: Pick<DemoCondoDiligence, 'status' | 'requiredDocuments' | 'findings' | 'notes'>): boolean {
  const notesEmpty = input.notes.trim() === ''
  const noFindings = input.findings.length === 0 || input.findings.every((f) => f.text.trim() === '')
  const allOutstanding = input.requiredDocuments.length > 0 && input.requiredDocuments.every((d) => d.status === 'outstanding')
  return input.status === 'not_started' && notesEmpty && noFindings && allOutstanding
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
  }
}
