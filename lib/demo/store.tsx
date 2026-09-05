'use client'

/**
 * Demo operational layer: React context, mutations, and localStorage persistence for demo data.
 * Conceptual domain map and drift notes: `lib/domain/system-contract.ts`.
 * Persistence keys and serialized shapes are stable API for existing user sessions — change only with migration.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { demoSeedData } from '@/lib/demo/demoData'
import type {
  DemoFinCEN,
  DemoFinCENCertRequest,
  DemoCalendarEvent,
  DemoClient,
  DemoDocument,
  DemoDocumentRequest,
  FinCENBeneficialOwner,
  FinCENPropertyInfo,
  FinCENReportStatus,
  FinCENReportingParty,
  DemoIntakeDemoDelivery,
  DemoIntakeLead,
  DemoIntakeSnapshot,
  DemoMatter,
  DemoPartyType,
  DemoSeedData,
  DemoTaskStatus,
  DemoCondoDiligence,
  DemoCondoDiligenceDocStatus,
  DemoCondoDiligenceFinding,
  DemoCondoDiligenceMatterStatus,
  DemoCondoDiligenceRequiredDocument,
  DemoMatterReviewTask,
  DemoMatterReviewTaskStatus,
  DemoCondoDiligenceActivity,
} from '@/lib/demo/types'
import { deriveMatterStatus } from '@/lib/demo-utils'
import { findExistingDemoClient } from '@/lib/demo/demoIntakeFlow'
import {
  appendDemoDocumentIfValid,
  mergeStoredDocumentsWithSeed,
  type AddDemoDocumentInput,
} from '@/lib/demo/demoDocument'
import {
  appendDemoDocumentRequestIfValid,
  mergeStoredDocumentRequestsWithSeed,
  withCoercedDocumentRequestStatus,
  acknowledgeClientUploadReceipt,
  type AddDemoDocumentRequestInput,
} from '@/lib/demo/demoDocumentRequest'
import { attemptClientDocumentRequestUpload } from '@/lib/demo/clientDocumentRequestUpload'
import {
  buildDefaultCondoDiligence,
  deriveCondoDiligenceMatterStatusFromChecklist,
  isCondoDiligenceEligible,
  normalizeCondoAssociationFinancialReview,
  normalizeCondoAssociationRecordsGovernanceReview,
  normalizeCondoDisclosurePackageReview,
  normalizeCondoEstoppelReview,
  normalizeCondoQuestionnaireLenderReview,
  normalizeCondoSirsMilestoneReview,
  normalizeCondoUnitClosingDependenciesReview,
  parseCondoDiligenceFindingLinkedReviewTaskIds,
  parseDemoCondoAssociationFinancialReview,
  parseDemoCondoAssociationRecordsGovernanceReview,
  parseDemoCondoDisclosurePackageReview,
  parseDemoCondoEstoppelReview,
  parseDemoCondoQuestionnaireLenderReview,
  parseDemoCondoSirsMilestoneReview,
  parseDemoCondoUnitClosingDependenciesReview,
  parseDemoCondoLawyerReviewCheckpoint,
  normalizeCondoLawyerReviewCheckpoint,
} from '@/lib/demo/condoDiligence'
import {
  appendDemoMatterReviewTaskIfValid,
  listCondoDiligenceSummaryReviewTasks,
  parseStoredDemoMatterReviewTasks,
  patchDemoMatterReviewTaskStatus,
  patchDemoMatterReviewTasksStatus,
  type AddDemoMatterReviewTaskInput,
} from '@/lib/demo/demoMatterReviewTask'
import {
  appendCondoDiligenceActivitiesForBulkStatusTransition,
  appendCondoDiligenceActivityIfValid,
  buildCondoDiligenceActivityForStatusTransition,
  buildCondoDiligenceActivityForTaskCreated,
  parseStoredDemoCondoDiligenceActivities,
} from '@/lib/demo/demoCondoDiligenceActivity'

type DemoContextType = {
  demoFirm: DemoSeedData['demoFirm']
  staff: DemoSeedData['staff']
  matters: DemoMatter[]
  clients: DemoClient[]
  calendarEvents: DemoCalendarEvent[]
  documents: DemoDocument[]
  documentRequests: DemoDocumentRequest[]
  matterReviewTasks: DemoMatterReviewTask[]
  condoDiligenceActivities: DemoCondoDiligenceActivity[]
  intakeLeads: DemoIntakeLead[]
  archivedMatters: DemoMatter[]
  archivedClients: DemoClient[]
  recentlyDeletedMatters: DemoMatter[]
  recentlyDeletedClients: DemoClient[]
  getMatterById: (matterId: string) => DemoMatter | undefined
  getArchivedMatterById: (matterId: string) => DemoMatter | undefined
  updateMatterStatus: (matterId: string, status: DemoMatter['status']) => void
  toggleTaskComplete: (matterId: string, taskId: string) => void
  updateTaskStatus: (matterId: string, taskId: string, status: DemoTaskStatus) => void
  addTimelineNote: (matterId: string, note: string) => void
  archiveMatter: (matterId: string) => void
  archiveClient: (clientId: string) => void
  restoreMatter: (matterId: string) => void
  restoreClient: (clientId: string) => void
  permanentlyDeleteMatter: (matterId: string) => void
  permanentlyDeleteClient: (clientId: string) => void
  createDemoMatter: (input: CreateDemoMatterInput) => void
  addDemoDocument: (input: AddDemoDocumentInput) => void
  addDemoDocumentRequest: (input: AddDemoDocumentRequestInput) => void
  /** Appends one `DemoDocument` (same helper as `addDemoDocument`) and marks the request fulfilled — one `setState`. */
  /** Client portal upload: appends one `DemoDocument` and marks the request fulfilled — one `setState`. Returns whether fulfillment succeeded. */
  fulfillDemoDocumentRequest: (input: { portal_token: string; request_id: string; file_name: string }) => boolean
  /** Staff acknowledgment that a client-portal upload was received for review. */
  acknowledgeClientUploadReceipt: (requestId: string) => boolean
  addMatterReviewTask: (input: AddDemoMatterReviewTaskInput) => void
  updateMatterReviewTaskStatus: (taskId: string, status: DemoMatterReviewTaskStatus) => void
  /** Atomically updates multiple review-task statuses (e.g. bulk mark in review). */
  updateMatterReviewTasksStatus: (taskIds: string[], status: DemoMatterReviewTaskStatus) => number
  listMatterReviewTasksForMatter: (matterId: string) => DemoMatterReviewTask[]
  getCondoDiligence: (matterId: string) => DemoCondoDiligence | undefined
  ensureCondoDiligence: (matterId: string) => void
  patchCondoDiligence: (matterId: string, patch: Partial<DemoCondoDiligence>) => void
  registerIntakeLead: (input: {
    token: string
    fileReference: string
    emailRecipientName: string
    emailRecipientEmail: string
    emailSubject: string
    emailBody: string
    intakeUrl: string
    demoDelivery: DemoIntakeDemoDelivery
    intake: DemoIntakeSnapshot
  }) => void
  submitDemoIntakeLead: (token: string, intake: DemoIntakeSnapshot) => void
  getIntakeLeadByToken: (token: string) => DemoIntakeLead | undefined
  patchIntakeLead: (
    leadId: string,
    patch: Partial<Pick<DemoIntakeLead, 'linkedMatterFileId' | 'linkedClientId' | 'conflict_check_status' | 'conflict_check_completed_at' | 'conflict_check_note'>>
  ) => void
  createDemoClientIfNotExists: (input: {
    full_name: string
    email: string
    phone: string
    linkMatterFileId?: string | null
  }) => { created: boolean; client: DemoClient }
  linkDemoClientToMatterByFileId: (clientId: string, fileId: string) => void
  fincenCertRequests: DemoFinCENCertRequest[]
  initFinCENReport: (matterId: string) => void
  updateFinCENReportingParty: (matterId: string, patch: Partial<FinCENReportingParty>) => void
  updateFinCENPropertyInfo: (matterId: string, patch: Partial<FinCENPropertyInfo>) => void
  updateFinCENData: (matterId: string, patch: Partial<DemoFinCEN>) => void
  addFinCENBeneficialOwner: (matterId: string) => void
  updateFinCENBeneficialOwner: (
    matterId: string,
    ownerId: string,
    patch: Partial<FinCENBeneficialOwner>
  ) => void
  removeFinCENBeneficialOwner: (matterId: string, ownerId: string) => void
  registerFinCENCertRequest: (input: {
    matterId: string
    recipientName: string
    recipientEmail: string
  }) => { token: string; certUrl: string }
  submitFinCENCert: (token: string, owners: FinCENBeneficialOwner[]) => void
  getFinCENCertByToken: (token: string) => DemoFinCENCertRequest | undefined
  cancelPendingFinCENCert: (matterId: string) => void
}


type CreateDemoMatterInput = {
  file_id: string
  matter_type: string
  transactionType: string
  purchasePrice: number
  property_address: string
  property_type: DemoMatter['property']['property_type']
  county: string
  closing_date: string // YYYY-MM-DD
  buyer_name: string
  seller_name: string
  /** Maps to `matter.buyer.type` */
  buyer_type: DemoPartyType
  buyer_email?: string
  buyer_phone?: string
  special_notes?: string
  onCreated?: (r: { matterId: string; fileId: string }) => void
}

const DemoContext = createContext<DemoContextType | null>(null)

/** Persists FinCEN cert requests so /demo/fincen-cert/[token] works across tabs and refreshes */
const DEMO_FINCEN_CERT_STORAGE_KEY = 'lawintake-demo-fincen-cert-requests-v1'

/** Full demo matters snapshot — survives refresh and syncs across tabs (demo-only). */
const DEMO_MATTERS_STORAGE_KEY = 'lawintake-demo-matters-v1'

/** Demo documents snapshot — merged with seed by id on load (demo-only). */
const DEMO_DOCUMENTS_STORAGE_KEY = 'lawintake-demo-documents-v1'

/** Lawyer-side document requests — merged with seed by id on load (demo-only). */
const DEMO_DOCUMENT_REQUESTS_STORAGE_KEY = 'lawintake-demo-document-requests-v1'

/** Matter-scoped condo diligence checklist (demo-only; keyed by matter id). */
const DEMO_CONDO_DILIGENCE_STORAGE_KEY = 'lawintake-demo-condo-diligence-v1'

/** Internal matter review tasks linked to saved summary documents (demo-only; not portal-visible). */
const DEMO_MATTER_REVIEW_TASKS_STORAGE_KEY = 'lawintake-demo-matter-review-tasks-v1'

/** Internal Condo Diligence review-task activity events (demo-only; not portal-visible). */
const DEMO_CONDO_DILIGENCE_ACTIVITIES_STORAGE_KEY = 'lawintake-demo-condo-diligence-activities-v1'

function persistDemoMatters(matters: DemoMatter[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEMO_MATTERS_STORAGE_KEY, JSON.stringify(matters))
    }
  } catch {
    /* ignore quota / private mode */
  }
}

function persistDemoDocuments(documents: DemoDocument[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEMO_DOCUMENTS_STORAGE_KEY, JSON.stringify(documents))
    }
  } catch {
    /* ignore quota / private mode */
  }
}

function persistDemoDocumentRequests(rows: DemoDocumentRequest[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEMO_DOCUMENT_REQUESTS_STORAGE_KEY, JSON.stringify(rows))
    }
  } catch {
    /* ignore quota / private mode */
  }
}

function persistDemoCondoDiligence(map: Record<string, DemoCondoDiligence>) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEMO_CONDO_DILIGENCE_STORAGE_KEY, JSON.stringify(map))
    }
  } catch {
    /* ignore quota / private mode */
  }
}

function persistDemoMatterReviewTasks(tasks: DemoMatterReviewTask[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEMO_MATTER_REVIEW_TASKS_STORAGE_KEY, JSON.stringify(tasks))
    }
  } catch {
    /* ignore quota / private mode */
  }
}

function persistDemoCondoDiligenceActivities(activities: DemoCondoDiligenceActivity[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEMO_CONDO_DILIGENCE_ACTIVITIES_STORAGE_KEY, JSON.stringify(activities))
    }
  } catch {
    /* ignore quota / private mode */
  }
}

function isDemoCondoDiligenceDocStatus(s: unknown): s is DemoCondoDiligenceDocStatus {
  return s === 'outstanding' || s === 'requested' || s === 'received'
}

function isDemoCondoDiligenceMatterStatus(s: unknown): s is DemoCondoDiligenceMatterStatus {
  return s === 'not_started' || s === 'in_progress' || s === 'under_review' || s === 'cleared' || s === 'flagged'
}

function parseDemoCondoDiligenceRow(raw: unknown): DemoCondoDiligence | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.applicable !== 'boolean') return null
  if (!isDemoCondoDiligenceMatterStatus(o.status)) return null
  if (typeof o.updated_at !== 'string' || !o.updated_at.trim()) return null
  if (typeof o.notes !== 'string') return null
  if (!Array.isArray(o.requiredDocuments) || !Array.isArray(o.findings)) return null

  const requiredDocuments: DemoCondoDiligenceRequiredDocument[] = []
  for (const item of o.requiredDocuments) {
    if (!item || typeof item !== 'object') continue
    const d = item as Record<string, unknown>
    const id = typeof d.id === 'string' ? d.id.trim() : ''
    const label = typeof d.label === 'string' ? d.label.trim() : ''
    if (!id || !label) continue
    if (!isDemoCondoDiligenceDocStatus(d.status)) continue
    const detail =
      d.detail === null || d.detail === undefined
        ? null
        : typeof d.detail === 'string'
          ? d.detail
          : null
    requiredDocuments.push({ id, label, status: d.status, detail })
  }
  if (requiredDocuments.length === 0) return null

  const findings: DemoCondoDiligenceFinding[] = []
  for (const item of o.findings) {
    if (!item || typeof item !== 'object') continue
    const f = item as Record<string, unknown>
    const id = typeof f.id === 'string' ? f.id.trim() : ''
    const text = typeof f.text === 'string' ? f.text : ''
    if (!id) continue
    const linkedReviewTaskIds = parseCondoDiligenceFindingLinkedReviewTaskIds(f.linkedReviewTaskIds)
    findings.push({
      id,
      text,
      ...(linkedReviewTaskIds && linkedReviewTaskIds.length > 0 ? { linkedReviewTaskIds } : {}),
    })
  }

  const estoppelReview = parseDemoCondoEstoppelReview(o.estoppelReview)
  const sirsMilestoneReview = parseDemoCondoSirsMilestoneReview(o.sirsMilestoneReview)
  const associationFinancialReview = parseDemoCondoAssociationFinancialReview(o.associationFinancialReview)
  const associationRecordsGovernanceReview = parseDemoCondoAssociationRecordsGovernanceReview(
    o.associationRecordsGovernanceReview,
  )
  const disclosurePackageReview = parseDemoCondoDisclosurePackageReview(o.disclosurePackageReview)
  const questionnaireLenderReview = parseDemoCondoQuestionnaireLenderReview(o.questionnaireLenderReview)
  const unitClosingDependenciesReview = parseDemoCondoUnitClosingDependenciesReview(o.unitClosingDependenciesReview)
  const lawyerReviewCheckpoint = parseDemoCondoLawyerReviewCheckpoint(o.lawyerReviewCheckpoint)

  return {
    applicable: o.applicable,
    status: o.status,
    requiredDocuments,
    findings,
    notes: o.notes,
    updated_at: o.updated_at.trim(),
    ...(estoppelReview ? { estoppelReview } : {}),
    ...(sirsMilestoneReview ? { sirsMilestoneReview } : {}),
    ...(associationFinancialReview ? { associationFinancialReview } : {}),
    ...(associationRecordsGovernanceReview ? { associationRecordsGovernanceReview } : {}),
    ...(disclosurePackageReview ? { disclosurePackageReview } : {}),
    ...(questionnaireLenderReview ? { questionnaireLenderReview } : {}),
    ...(unitClosingDependenciesReview ? { unitClosingDependenciesReview } : {}),
    ...(lawyerReviewCheckpoint ? { lawyerReviewCheckpoint } : {}),
  }
}

function parseCondoDiligenceMapFromStorage(raw: string): Record<string, DemoCondoDiligence> | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const out: Record<string, DemoCondoDiligence> = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const matterId = k.trim()
      if (!matterId) continue
      const row = parseDemoCondoDiligenceRow(v)
      if (row) out[matterId] = row
    }
    return Object.keys(out).length > 0 ? out : null
  } catch {
    return null
  }
}

/** Read matters from localStorage (e.g. cert page before React state hydrates). */
export function readDemoMattersFromStorage(): DemoMatter[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DEMO_MATTERS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as DemoMatter[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((m): m is DemoMatter => m != null && typeof m.id === 'string')
  } catch {
    return []
  }
}

/** Stored rows win on id collision so FinCEN updates persist; seed fills any missing ids. */
function mergeStoredMattersWithSeed(stored: DemoMatter[], seed: DemoMatter[]): DemoMatter[] {
  const map = new Map<string, DemoMatter>()
  for (const m of seed) {
    if (m != null && typeof m.id === 'string') map.set(m.id, m)
  }
  for (const m of stored) {
    if (m != null && typeof m.id === 'string') map.set(m.id, m)
  }
  return Array.from(map.values())
}

export function normalizeFinCenMatterKey(id: unknown): string {
  return String(id ?? '').trim()
}

function fincenRequestMatchesMatter(req: DemoFinCENCertRequest, matterId: string): boolean {
  return normalizeFinCenMatterKey(req.matterId) === normalizeFinCenMatterKey(matterId)
}

function normalizeFinCENCertRequestsMatterIds(requests: DemoFinCENCertRequest[]): DemoFinCENCertRequest[] {
  return requests.map((r) => ({ ...r, matterId: normalizeFinCenMatterKey(r.matterId) }))
}

function persistFinCENCertRequests(requests: DemoFinCENCertRequest[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      const normalized = normalizeFinCENCertRequestsMatterIds(requests)
      localStorage.setItem(DEMO_FINCEN_CERT_STORAGE_KEY, JSON.stringify(normalized))
    }
  } catch {
    /* ignore quota / private mode */
  }
}

/** Synchronous read for client-only routes before DemoProvider hydration runs. */
export function readFinCENCertRequestFromStorage(token: string): DemoFinCENCertRequest | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = localStorage.getItem(DEMO_FINCEN_CERT_STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as DemoFinCENCertRequest[]
    if (!Array.isArray(parsed)) return undefined
    const normalized = normalizeFinCENCertRequestsMatterIds(parsed)
    return normalized.find((r) => r.token === token)
  } catch {
    return undefined
  }
}

/** Persists demo intake leads so /demo/intake/[token] works across tabs and refreshes */
const DEMO_INTAKE_LEADS_STORAGE_KEY = 'lawintake-demo-intake-leads-v1'
const LEGACY_DEMO_INTAKE_LEADS_SESSION_KEY = DEMO_INTAKE_LEADS_STORAGE_KEY

function persistIntakeLeads(leads: DemoIntakeLead[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEMO_INTAKE_LEADS_STORAGE_KEY, JSON.stringify(leads))
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(LEGACY_DEMO_INTAKE_LEADS_SESSION_KEY, JSON.stringify(leads))
    }
  } catch {
    /* ignore quota / private mode */
  }
}

function cloneSeedData(): DemoSeedData {
  if (typeof structuredClone === 'function') {
    return structuredClone(demoSeedData)
  }
  return JSON.parse(JSON.stringify(demoSeedData)) as DemoSeedData
}

function inferTransactionTypeFromIntake(intake: DemoIntakeSnapshot): string {
  const isRefi = intake.matterType.includes('Refinance') || intake.matterType.toLowerCase().includes('refinance')
  if (isRefi) return 'Refinance'
  if (intake.transactionRole === 'seller') return 'Sale'
  if (intake.transactionRole === 'both') return 'Both'
  return 'Purchase'
}

function upsertSpecialNotesLine(notes: string, label: string, value: string): string {
  const pattern = new RegExp(`(?:^|\\n)${label}:.*?(?=\\n|$)`, 'i')
  const trimmed = notes.trim()
  const cleaned = trimmed.replace(pattern, '').replace(/\n{3,}/g, '\n\n').trim()
  if (!value.trim()) return cleaned
  return cleaned ? `${label}: ${value.trim()}.\n\n${cleaned}` : `${label}: ${value.trim()}.`
}

function deriveFinCENReportStatus(completed: number): FinCENReportStatus {
  if (completed >= 111) return 'ready'
  if (completed > 0) return 'in_progress'
  return 'not_started'
}

function computeFinCENCompletedFields(fincen: DemoFinCEN): number {
  let score = 0
  const rp = fincen.reportingParty
  if (rp?.firmName?.trim()) score += 20
  if (rp?.firmAddress?.trim()) score += 20
  if (rp?.firmEin?.trim()) score += 20
  if (rp?.filingAttorney?.trim()) score += 20

  const pi = fincen.propertyInfo
  if (pi?.purchaserEntityName?.trim()) score += 3
  if (pi?.purchaserEntityType?.trim()) score += 3
  if (pi?.purchaserEin?.trim()) score += 3
  if (pi?.stateOfFormation?.trim()) score += 3
  if (pi?.totalCashAmount?.trim()) score += 3

  if ((pi?.paymentMethods?.length ?? 0) > 0) score += 2

  for (const owner of fincen.beneficialOwners ?? []) {
    if (!owner.certifiedAt) continue
    const fields = [
      owner.fullName,
      owner.dob,
      owner.address,
      owner.citizenship,
      owner.tin,
      owner.govIdType,
      owner.govIdNumber,
      owner.govIdIssuer,
    ]
    for (const f of fields) {
      if (String(f ?? '').trim()) score += 1.4
    }
  }

  return Math.min(111, Math.round(score))
}

function recomputeFinCEN(fincen: DemoFinCEN): DemoFinCEN {
  const completedFields = computeFinCENCompletedFields(fincen)
  return {
    ...fincen,
    completedFields,
    reportStatus: deriveFinCENReportStatus(completedFields),
  }
}

/** Merge stored cert requests into matters (pending certRequest + submitted beneficial owners). */
function syncMattersWithCertRequests(matters: DemoMatter[], requests: DemoFinCENCertRequest[]): DemoMatter[] {
  const safeMatters = matters.filter((m): m is DemoMatter => m != null && typeof m.id === 'string')
  const reqs = normalizeFinCENCertRequestsMatterIds(requests)
  return safeMatters.map((m) => {
    try {
      if (!m.fincen) return m
      const pending = reqs.find((r) => r.status === 'pending_client' && fincenRequestMatchesMatter(r, m.id))
      if (pending) {
        return { ...m, fincen: { ...m.fincen, certRequest: pending } }
      }
      const latest = [...reqs]
        .filter(
          (r) =>
            fincenRequestMatchesMatter(r, m.id) &&
            r.status === 'submitted' &&
            r.submittedOwners &&
            r.submittedOwners.length > 0
        )
        .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))[0]
      if (!latest?.submittedOwners) return m
      const submittedIds = new Set(latest.submittedOwners.map((o) => o.id))
      const retained = m.fincen.beneficialOwners.filter((o) => o.certifiedAt && !submittedIds.has(o.id))
      const mergedOwners = [...retained, ...latest.submittedOwners]
      let nextFincen: DemoFinCEN = {
        ...m.fincen,
        beneficialOwners: mergedOwners,
        certRequest: latest,
      }
      nextFincen = recomputeFinCEN(nextFincen)
      return { ...m, fincen: nextFincen }
    } catch {
      return m
    }
  })
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  // Matters + FinCEN cert requests hydrate from localStorage; seed fills missing ids on first load.
  const [state, setState] = useState<
    DemoSeedData & {
      recentlyDeletedMatters: DemoMatter[]
      recentlyDeletedClients: DemoClient[]
      condoDiligenceByMatterId: Record<string, DemoCondoDiligence>
      matterReviewTasks: DemoMatterReviewTask[]
      condoDiligenceActivities: DemoCondoDiligenceActivity[]
    }
  >(() => ({
    ...cloneSeedData(),
    recentlyDeletedMatters: [],
    recentlyDeletedClients: [],
    condoDiligenceByMatterId: {},
    matterReviewTasks: [],
    condoDiligenceActivities: [],
  }))

  useEffect(() => {
    try {
      const rawLocal = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_INTAKE_LEADS_STORAGE_KEY) : null
      const rawSession =
        typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(LEGACY_DEMO_INTAKE_LEADS_SESSION_KEY) : null
      const raw = rawLocal ?? rawSession
      if (!raw) return
      const parsed = JSON.parse(raw) as DemoIntakeLead[]
      if (!Array.isArray(parsed) || parsed.length === 0) return
      if (!rawLocal && rawSession && typeof localStorage !== 'undefined') {
        localStorage.setItem(DEMO_INTAKE_LEADS_STORAGE_KEY, rawSession)
      }
      setState((prev) => ({ ...prev, intakeLeads: parsed }))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DEMO_INTAKE_LEADS_STORAGE_KEY || !e.newValue) return
      try {
        const parsed = JSON.parse(e.newValue) as DemoIntakeLead[]
        if (Array.isArray(parsed)) setState((prev) => ({ ...prev, intakeLeads: parsed }))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /** Hydrate matters + FinCEN cert requests + documents + document requests from localStorage (same session / after refresh / new tab). */
  useEffect(() => {
    try {
      const rawMatters = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_MATTERS_STORAGE_KEY) : null
      const rawFincen = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_FINCEN_CERT_STORAGE_KEY) : null
      const rawDocuments = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_DOCUMENTS_STORAGE_KEY) : null
      const rawDocumentRequests =
        typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_DOCUMENT_REQUESTS_STORAGE_KEY) : null
      const rawCondoDiligence =
        typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_CONDO_DILIGENCE_STORAGE_KEY) : null
      const rawMatterReviewTasks =
        typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_MATTER_REVIEW_TASKS_STORAGE_KEY) : null
      const rawCondoDiligenceActivities =
        typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_CONDO_DILIGENCE_ACTIVITIES_STORAGE_KEY) : null
      if (
        !rawMatters &&
        !rawFincen &&
        !rawDocuments &&
        !rawDocumentRequests &&
        !rawCondoDiligence &&
        !rawMatterReviewTasks &&
        !rawCondoDiligenceActivities
      )
        return
      setState((prev) => {
        let matters = prev.matters
        if (rawMatters) {
          const parsed = JSON.parse(rawMatters) as DemoMatter[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            const stored = parsed.filter((m): m is DemoMatter => m != null && typeof m.id === 'string')
            matters = mergeStoredMattersWithSeed(stored, prev.matters)
          }
        }
        let fincenCertRequests = prev.fincenCertRequests
        if (rawFincen) {
          const parsed = JSON.parse(rawFincen) as DemoFinCENCertRequest[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            fincenCertRequests = normalizeFinCENCertRequestsMatterIds(parsed)
          }
        }
        matters = syncMattersWithCertRequests(matters, fincenCertRequests)
        let documents = prev.documents
        if (rawDocuments) {
          const parsed = JSON.parse(rawDocuments) as DemoDocument[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            const stored = parsed.filter((d): d is DemoDocument => d != null && typeof d.id === 'string')
            documents = mergeStoredDocumentsWithSeed(stored, prev.documents)
          }
        }
        let documentRequests = prev.documentRequests
        if (rawDocumentRequests) {
          const parsed = JSON.parse(rawDocumentRequests) as DemoDocumentRequest[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            const stored = parsed
              .filter((r): r is DemoDocumentRequest => r != null && typeof r.id === 'string')
              .map(withCoercedDocumentRequestStatus)
            documentRequests = mergeStoredDocumentRequestsWithSeed(stored, prev.documentRequests)
          }
        }
        let condoDiligenceByMatterId = prev.condoDiligenceByMatterId
        if (rawCondoDiligence) {
          const storedMap = parseCondoDiligenceMapFromStorage(rawCondoDiligence)
          if (storedMap) {
            condoDiligenceByMatterId = { ...prev.condoDiligenceByMatterId, ...storedMap }
          }
        }
        let matterReviewTasks = prev.matterReviewTasks
        if (rawMatterReviewTasks) {
          try {
            const parsed = JSON.parse(rawMatterReviewTasks) as unknown
            matterReviewTasks = parseStoredDemoMatterReviewTasks(parsed)
          } catch {
            /* keep prev */
          }
        }
        let condoDiligenceActivities = prev.condoDiligenceActivities
        if (rawCondoDiligenceActivities) {
          try {
            const parsed = JSON.parse(rawCondoDiligenceActivities) as unknown
            condoDiligenceActivities = parseStoredDemoCondoDiligenceActivities(parsed)
          } catch {
            /* keep prev */
          }
        }
        return {
          ...prev,
          matters,
          fincenCertRequests,
          documents,
          documentRequests,
          condoDiligenceByMatterId,
          matterReviewTasks,
          condoDiligenceActivities,
        }
      })
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        persistDemoMatters(state.matters)
      } catch {
        /* ignore */
      }
    }, 250)
    return () => window.clearTimeout(t)
  }, [state.matters])

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        persistDemoDocuments(state.documents)
      } catch {
        /* ignore */
      }
    }, 250)
    return () => window.clearTimeout(t)
  }, [state.documents])

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        persistDemoDocumentRequests(state.documentRequests)
      } catch {
        /* ignore */
      }
    }, 250)
    return () => window.clearTimeout(t)
  }, [state.documentRequests])

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        persistDemoCondoDiligence(state.condoDiligenceByMatterId)
      } catch {
        /* ignore */
      }
    }, 250)
    return () => window.clearTimeout(t)
  }, [state.condoDiligenceByMatterId])

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        persistDemoMatterReviewTasks(state.matterReviewTasks)
      } catch {
        /* ignore */
      }
    }, 250)
    return () => window.clearTimeout(t)
  }, [state.matterReviewTasks])

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        persistDemoCondoDiligenceActivities(state.condoDiligenceActivities)
      } catch {
        /* ignore */
      }
    }, 250)
    return () => window.clearTimeout(t)
  }, [state.condoDiligenceActivities])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DEMO_FINCEN_CERT_STORAGE_KEY || !e.newValue) return
      try {
        const parsed = JSON.parse(e.newValue) as DemoFinCENCertRequest[]
        if (!Array.isArray(parsed)) return
        const normalized = normalizeFinCENCertRequestsMatterIds(parsed)
        setState((prev) => ({
          ...prev,
          fincenCertRequests: normalized,
          matters: syncMattersWithCertRequests(prev.matters, normalized),
        }))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DEMO_MATTERS_STORAGE_KEY || !e.newValue) return
      try {
        const parsed = JSON.parse(e.newValue) as DemoMatter[]
        if (!Array.isArray(parsed)) return
        const sanitized = parsed.filter((m): m is DemoMatter => m != null && typeof m.id === 'string')
        setState((prev) => {
          let fincenCertRequests = prev.fincenCertRequests
          try {
            const rawF = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_FINCEN_CERT_STORAGE_KEY) : null
            if (rawF) {
              const fp = JSON.parse(rawF) as DemoFinCENCertRequest[]
              if (Array.isArray(fp) && fp.length > 0) fincenCertRequests = normalizeFinCENCertRequestsMatterIds(fp)
            }
          } catch {
            /* keep prev */
          }
          const matters = syncMattersWithCertRequests(mergeStoredMattersWithSeed(sanitized, prev.matters), fincenCertRequests)
          return { ...prev, matters, fincenCertRequests }
        })
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DEMO_DOCUMENTS_STORAGE_KEY || !e.newValue) return
      try {
        const parsed = JSON.parse(e.newValue) as DemoDocument[]
        if (!Array.isArray(parsed)) return
        const sanitized = parsed.filter((d): d is DemoDocument => d != null && typeof d.id === 'string')
        setState((prev) => ({
          ...prev,
          documents: mergeStoredDocumentsWithSeed(sanitized, prev.documents),
        }))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DEMO_DOCUMENT_REQUESTS_STORAGE_KEY || !e.newValue) return
      try {
        const parsed = JSON.parse(e.newValue) as DemoDocumentRequest[]
        if (!Array.isArray(parsed)) return
        const sanitized = parsed
          .filter((r): r is DemoDocumentRequest => r != null && typeof r.id === 'string')
          .map(withCoercedDocumentRequestStatus)
        setState((prev) => ({
          ...prev,
          documentRequests: mergeStoredDocumentRequestsWithSeed(sanitized, prev.documentRequests),
        }))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DEMO_CONDO_DILIGENCE_STORAGE_KEY || !e.newValue) return
      try {
        const storedMap = parseCondoDiligenceMapFromStorage(e.newValue)
        if (!storedMap) return
        setState((prev) => ({
          ...prev,
          condoDiligenceByMatterId: { ...prev.condoDiligenceByMatterId, ...storedMap },
        }))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DEMO_MATTER_REVIEW_TASKS_STORAGE_KEY || !e.newValue) return
      try {
        const parsed = JSON.parse(e.newValue) as unknown
        const matterReviewTasks = parseStoredDemoMatterReviewTasks(parsed)
        setState((prev) => ({ ...prev, matterReviewTasks }))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DEMO_CONDO_DILIGENCE_ACTIVITIES_STORAGE_KEY || !e.newValue) return
      try {
        const parsed = JSON.parse(e.newValue) as unknown
        const condoDiligenceActivities = parseStoredDemoCondoDiligenceActivities(parsed)
        setState((prev) => ({ ...prev, condoDiligenceActivities }))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo<DemoContextType>(() => {
    return {
      demoFirm: state.demoFirm,
      staff: state.staff,
      matters: state.matters
        .filter((m): m is DemoMatter => m != null && typeof m.id === 'string')
        .filter((m) => !m.deletedAt),
      clients: state.clients.filter((c) => !c.deletedAt),
      calendarEvents: state.calendarEvents.filter((e) => !e.deletedAt),
      documents: state.documents.filter((d) => !d.deletedAt),
      documentRequests: state.documentRequests,
      matterReviewTasks: state.matterReviewTasks,
      condoDiligenceActivities: state.condoDiligenceActivities,
      intakeLeads: state.intakeLeads,
      fincenCertRequests: state.fincenCertRequests,
      archivedMatters: state.matters
        .filter((m): m is DemoMatter => m != null && typeof m.id === 'string')
        .filter((m) => Boolean(m.deletedAt)),
      archivedClients: state.clients.filter((c) => Boolean(c.deletedAt)),
      recentlyDeletedMatters: state.recentlyDeletedMatters,
      recentlyDeletedClients: state.recentlyDeletedClients,
      getMatterById: (matterId) =>
        state.matters
          .filter((m): m is DemoMatter => m != null && typeof m.id === 'string')
          .find((m) => m.id === matterId && !m.deletedAt),
      getArchivedMatterById: (matterId) =>
        state.matters
          .filter((m): m is DemoMatter => m != null && typeof m.id === 'string')
          .find((m) => m.id === matterId && Boolean(m.deletedAt)),
      updateMatterStatus: (matterId, status) => {
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((m) => (m.id === matterId && !m.deletedAt ? { ...m, status } : m)),
        }))
      },
      toggleTaskComplete: (matterId, taskId) => {
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((m) => {
            if (m.id !== matterId) return m
            const tasksNext = m.tasks.map((task) => {
              if (task.id !== taskId) return task
              if (task.deletedAt) return task
              const nextStatus: DemoTaskStatus = task.status === 'completed' ? 'not_started' : 'completed'
              return { ...task, status: nextStatus }
            })
            return {
              ...m,
              tasks: tasksNext,
              status: deriveMatterStatus(tasksNext, m.key_dates.closing_date),
            }
          }),
        }))
      },
      updateTaskStatus: (matterId, taskId, status) => {
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((m) => {
            if (m.id !== matterId) return m
            const tasksNext = m.tasks.map((task) =>
              task.id === taskId && !task.deletedAt ? { ...task, status } : task
            )
            const newStatus = deriveMatterStatus(tasksNext, m.key_dates.closing_date)
            return { ...m, status: newStatus, tasks: tasksNext }
          }),
        }))
      },
      addTimelineNote: (matterId, note) => {
        if (!note.trim()) return
        const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((m) => {
            if (m.id !== matterId) return m
            return {
              ...m,
              timeline: [
                {
                  id: `note-${Date.now()}`,
                  at: timestamp,
                  note: note.trim(),
                  deletedAt: null,
                },
                ...m.timeline,
              ],
            }
          }),
        }))
      },
      archiveMatter: (matterId) => {
        const deletedAt = new Date().toISOString()
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((m) => {
            if (m.id !== matterId || m.deletedAt) return m
            return {
              ...m,
              deletedAt,
              tasks: m.tasks.map((task) => ({ ...task, deletedAt })),
              timeline: m.timeline.map((evt) => ({ ...evt, deletedAt })),
            }
          }),
          calendarEvents: prev.calendarEvents.map((evt) =>
            evt.matter_id === matterId && !evt.deletedAt ? { ...evt, deletedAt } : evt
          ),
          documents: prev.documents.map((doc) =>
            doc.matter_id === matterId && !doc.deletedAt ? { ...doc, deletedAt } : doc
          ),
        }))
      },
      archiveClient: (clientId) => {
        const deletedAt = new Date().toISOString()
        setState((prev) => ({
          ...prev,
          clients: prev.clients.map((client) => {
            if (client.id !== clientId || client.deletedAt) return client
            return { ...client, deletedAt }
          }),
        }))
      },
      restoreMatter: (matterId) => {
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((m) => {
            if (m.id !== matterId || !m.deletedAt) return m
            return {
              ...m,
              deletedAt: null,
              tasks: m.tasks.map((task) => ({ ...task, deletedAt: null })),
              timeline: m.timeline.map((evt) => ({ ...evt, deletedAt: null })),
            }
          }),
          calendarEvents: prev.calendarEvents.map((evt) =>
            evt.matter_id === matterId ? { ...evt, deletedAt: null } : evt
          ),
          documents: prev.documents.map((doc) =>
            doc.matter_id === matterId ? { ...doc, deletedAt: null } : doc
          ),
        }))
      },
      restoreClient: (clientId) => {
        setState((prev) => ({
          ...prev,
          clients: prev.clients.map((client) =>
            client.id === clientId ? { ...client, deletedAt: null } : client
          ),
        }))
      },
      permanentlyDeleteMatter: (matterId) => {
        setState((prev) => ({
          ...(() => {
            const target = prev.matters.find((m) => m.id === matterId)
            if (!target) return prev
            const removedAt = target.deletedAt ?? new Date().toISOString()
            const condoDiligenceByMatterId = Object.fromEntries(
              Object.entries(prev.condoDiligenceByMatterId).filter(([k]) => k !== matterId),
            ) as Record<string, DemoCondoDiligence>
            return {
              ...prev,
              matters: prev.matters.filter((m) => m.id !== matterId),
              calendarEvents: prev.calendarEvents.filter((evt) => evt.matter_id !== matterId),
              documents: prev.documents.filter((doc) => doc.matter_id !== matterId),
              condoDiligenceByMatterId,
              recentlyDeletedMatters: [
                { ...target, deletedAt: removedAt },
                ...prev.recentlyDeletedMatters.filter((m) => m.id !== matterId),
              ],
            }
          })(),
        }))
      },
      permanentlyDeleteClient: (clientId) => {
        setState((prev) => ({
          ...(() => {
            const target = prev.clients.find((client) => client.id === clientId)
            if (!target) return prev
            const removedAt = target.deletedAt ?? new Date().toISOString()
            return {
              ...prev,
              clients: prev.clients.filter((client) => client.id !== clientId),
              recentlyDeletedClients: [
                { ...target, deletedAt: removedAt },
                ...prev.recentlyDeletedClients.filter((c) => c.id !== clientId),
              ],
            }
          })(),
        }))
      },
      getIntakeLeadByToken: (token) => state.intakeLeads.find((l) => l.token === token),
      registerIntakeLead: (input) => {
        const id = `intake-lead-${Date.now()}`
        const lead: DemoIntakeLead = {
          id,
          token: input.token,
          createdAt: new Date().toISOString(),
          fileReference: input.fileReference,
          emailRecipientName: input.emailRecipientName,
          emailRecipientEmail: input.emailRecipientEmail,
          emailSubject: input.emailSubject,
          emailBody: input.emailBody,
          intakeUrl: input.intakeUrl,
          demoDelivery: input.demoDelivery,
          intake: input.intake,
          status: 'pending_client',
          clientSubmittedAt: null,
          submittedIntake: null,
        }
        setState((prev) => {
          const intakeLeads = [lead, ...prev.intakeLeads]
          persistIntakeLeads(intakeLeads)
          return { ...prev, intakeLeads }
        })
      },
      submitDemoIntakeLead: (token, intake) => {
        const at = new Date().toISOString()
        setState((prev) => {
          const lead = prev.intakeLeads.find((l) => l.token === token)
          if (!lead) return prev

          const normalizedIntake: DemoIntakeSnapshot = {
            ...intake,
            transactionRole: intake.transactionRole ?? 'buyer',
            transactionRoleOther: intake.transactionRole === 'other' ? intake.transactionRoleOther ?? '' : '',
          }
          const buyerSide = normalizedIntake.transactionRole === 'buyer' || normalizedIntake.transactionRole === 'both'

          const intakeLeads = prev.intakeLeads.map((l) =>
            l.token === token
              ? { ...l, status: 'submitted' as const, submittedIntake: normalizedIntake, clientSubmittedAt: at }
              : l
          )

          const clients = lead.linkedClientId
            ? prev.clients.map((client) =>
                client.id === lead.linkedClientId && !client.deletedAt
                  ? {
                      ...client,
                      full_name: normalizedIntake.clientName.trim() || client.full_name,
                      email: normalizedIntake.clientEmail.trim() || client.email,
                      phone: normalizedIntake.clientPhone.trim() || client.phone,
                    }
                  : client
              )
            : prev.clients

          const matters = lead.linkedMatterFileId
            ? prev.matters.map((matter) => {
                if (matter.file_id !== lead.linkedMatterFileId || matter.deletedAt) return matter

                const buyerName =
                  normalizedIntake.transactionRole === 'buyer' || normalizedIntake.transactionRole === 'both'
                    ? normalizedIntake.clientName.trim() || matter.buyer.name
                    : matter.buyer.name
                const sellerName =
                  normalizedIntake.transactionRole === 'seller' || normalizedIntake.transactionRole === 'both'
                    ? normalizedIntake.clientName.trim() || matter.seller.name
                    : matter.seller.name
                const buyerEmail =
                  normalizedIntake.transactionRole === 'buyer' || normalizedIntake.transactionRole === 'both'
                    ? normalizedIntake.clientEmail.trim() || matter.buyerEmail
                    : matter.buyerEmail
                const sellerEmail =
                  normalizedIntake.transactionRole === 'seller' || normalizedIntake.transactionRole === 'both'
                    ? normalizedIntake.clientEmail.trim() || matter.sellerEmail
                    : matter.sellerEmail
                const buyerPhone =
                  normalizedIntake.transactionRole === 'buyer' || normalizedIntake.transactionRole === 'both'
                    ? normalizedIntake.clientPhone.trim() || matter.buyerPhone
                    : matter.buyerPhone
                const sellerPhone =
                  normalizedIntake.transactionRole === 'seller' || normalizedIntake.transactionRole === 'both'
                    ? normalizedIntake.clientPhone.trim() || matter.sellerPhone
                    : matter.sellerPhone

                let specialNotes = matter.specialNotes
                specialNotes = upsertSpecialNotesLine(
                  specialNotes,
                  'Other Title',
                  normalizedIntake.transactionRole === 'other' ? normalizedIntake.transactionRoleOther : ''
                )
                specialNotes = upsertSpecialNotesLine(
                  specialNotes,
                  "Title's Name",
                  normalizedIntake.transactionRole === 'other' ? normalizedIntake.clientName : ''
                )

                return {
                  ...matter,
                  matter_type: normalizedIntake.matterType.trim() || matter.matter_type,
                  property: {
                    ...matter.property,
                    address: normalizedIntake.propertyAddress.trim() || matter.property.address,
                    county: normalizedIntake.county.trim() || matter.property.county,
                  },
                  buyer: {
                    ...matter.buyer,
                    name: buyerName,
                    email: buyerEmail,
                    phone: buyerPhone,
                    ...(buyerSide && normalizedIntake.buyerType ? { type: normalizedIntake.buyerType } : {}),
                  },
                  seller: {
                    ...matter.seller,
                    name: sellerName,
                    email: sellerEmail,
                    phone: sellerPhone,
                  },
                  transactionType: inferTransactionTypeFromIntake(normalizedIntake),
                  buyerEmail,
                  buyerPhone,
                  sellerEmail,
                  sellerPhone,
                  possessionDate: normalizedIntake.targetClosingDate.trim() || matter.possessionDate,
                  specialNotes,
                  key_dates: {
                    ...matter.key_dates,
                    closing_date: normalizedIntake.targetClosingDate.trim() || matter.key_dates.closing_date,
                  },
                }
              })
            : prev.matters

          persistIntakeLeads(intakeLeads)
          return { ...prev, intakeLeads, clients, matters }
        })
      },
      patchIntakeLead: (leadId, patch) => {
        setState((prev) => {
          const intakeLeads = prev.intakeLeads.map((l) => (l.id === leadId ? { ...l, ...patch } : l))
          persistIntakeLeads(intakeLeads)
          return { ...prev, intakeLeads }
        })
      },
      createDemoClientIfNotExists: (input) => {
        const linkedMatterId =
          input.linkMatterFileId
            ? state.matters.find((x) => x.file_id === input.linkMatterFileId && !x.deletedAt)?.id ?? null
            : null
        const active = state.clients.filter((c) => !c.deletedAt)
        const existing = findExistingDemoClient(active, {
          email: input.email,
          full_name: input.full_name,
          phone: input.phone,
        })

        if (existing) {
          const client =
            linkedMatterId && !existing.linked_matter_ids.includes(linkedMatterId)
              ? { ...existing, linked_matter_ids: [...existing.linked_matter_ids, linkedMatterId] }
              : existing
          if (client !== existing) {
            setState((prev) => ({
              ...prev,
              clients: prev.clients.map((c) => (c.id === existing.id ? client : c)),
            }))
          }
          return { created: false, client }
        }

        const ts = Date.now()
        const client: DemoClient = {
          id: `client-${ts}`,
          full_name: input.full_name,
          email: input.email.trim() || `client-${ts}@demo.example`,
          phone: input.phone,
          kyc_status: 'pending',
          type: 'individual',
          linked_matter_ids: linkedMatterId ? [linkedMatterId] : [],
          created_at: new Date().toISOString(),
          deletedAt: null,
        }
        setState((prev) => ({ ...prev, clients: [...prev.clients, client] }))
        return { created: true, client }
      },
      linkDemoClientToMatterByFileId: (clientId, fileId) => {
        setState((prev) => {
          const matterId = prev.matters.find((m) => m.file_id === fileId && !m.deletedAt)?.id
          if (!matterId) return prev
          return {
            ...prev,
            clients: prev.clients.map((client) =>
              client.id === clientId && !client.deletedAt && !client.linked_matter_ids.includes(matterId)
                ? { ...client, linked_matter_ids: [...client.linked_matter_ids, matterId] }
                : client
            ),
          }
        })
      },
      initFinCENReport: (matterId) => {
        setState((prev) => {
          const matter = prev.matters.find((m) => m.id === matterId && !m.deletedAt)
          if (!matter || matter.fincen) return prev

          const closing = matter.key_dates?.closing_date ?? ''
          let retentionDeadline: string | null = null
          if (closing) {
            const d = new Date(`${closing}T00:00:00`)
            if (!Number.isNaN(d.getTime())) {
              d.setFullYear(d.getFullYear() + 5)
              retentionDeadline = d.toISOString().slice(0, 10)
            }
          }

          let fincen: DemoFinCEN = {
            reportStatus: 'not_started',
            completedFields: 0,
            reportingParty: {
              firmName: prev.demoFirm.name,
              firmAddress: prev.demoFirm.office_location,
              firmEin: '',
              filingAttorney: matter.assignedAttorney,
            },
            propertyInfo: {
              purchaserEntityName: matter.buyer.name,
              purchaserEntityType: '',
              purchaserEin: '',
              stateOfFormation: '',
              paymentMethods: [],
              totalCashAmount: String(matter.purchasePrice ?? ''),
            },
            beneficialOwners: [],
            certRequest: null,
            retentionDeadline,
          }
          fincen = recomputeFinCEN(fincen)

          return {
            ...prev,
            matters: prev.matters.map((m) => (m.id === matterId ? { ...m, fincen } : m)),
          }
        })
      },
      updateFinCENReportingParty: (matterId, patch) => {
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((matter) => {
            if (matter.id !== matterId || matter.deletedAt || !matter.fincen) return matter
            const nextFincen = recomputeFinCEN({
              ...matter.fincen,
              reportingParty: { ...matter.fincen.reportingParty, ...patch },
            })
            return { ...matter, fincen: nextFincen }
          }),
        }))
      },
      updateFinCENPropertyInfo: (matterId, patch) => {
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((matter) => {
            if (matter.id !== matterId || matter.deletedAt || !matter.fincen) return matter
            const nextFincen = recomputeFinCEN({
              ...matter.fincen,
              propertyInfo: { ...matter.fincen.propertyInfo, ...patch },
            })
            return { ...matter, fincen: nextFincen }
          }),
        }))
      },
      updateFinCENData: (matterId, patch) => {
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((matter) => {
            if (matter.id !== matterId || matter.deletedAt || !matter.fincen) return matter
            const rp = patch.reportingParty
              ? { ...matter.fincen.reportingParty, ...patch.reportingParty }
              : matter.fincen.reportingParty
            const pi = patch.propertyInfo
              ? { ...matter.fincen.propertyInfo, ...patch.propertyInfo }
              : matter.fincen.propertyInfo
            let nextFincen: DemoFinCEN = {
              ...matter.fincen,
              ...patch,
              reportingParty: rp,
              propertyInfo: pi,
              beneficialOwners: patch.beneficialOwners ?? matter.fincen.beneficialOwners,
            }
            nextFincen = recomputeFinCEN(nextFincen)
            return { ...matter, fincen: nextFincen }
          }),
        }))
      },
      addFinCENBeneficialOwner: (matterId) => {
        const owner: FinCENBeneficialOwner = {
          id: `bo-${Date.now()}`,
          fullName: '',
          dob: '',
          address: '',
          citizenship: '',
          tin: '',
          govIdType: '',
          govIdNumber: '',
          govIdIssuer: '',
          certifiedAt: null,
        }
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((matter) => {
            if (matter.id !== matterId || matter.deletedAt || !matter.fincen) return matter
            const nextFincen = recomputeFinCEN({
              ...matter.fincen,
              beneficialOwners: [...matter.fincen.beneficialOwners, owner],
            })
            return { ...matter, fincen: nextFincen }
          }),
        }))
      },
      updateFinCENBeneficialOwner: (matterId, ownerId, patch) => {
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((matter) => {
            if (matter.id !== matterId || matter.deletedAt || !matter.fincen) return matter
            const nextFincen = recomputeFinCEN({
              ...matter.fincen,
              beneficialOwners: matter.fincen.beneficialOwners.map((owner) =>
                owner.id === ownerId ? { ...owner, ...patch } : owner
              ),
            })
            return { ...matter, fincen: nextFincen }
          }),
        }))
      },
      removeFinCENBeneficialOwner: (matterId, ownerId) => {
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((matter) => {
            if (matter.id !== matterId || matter.deletedAt || !matter.fincen) return matter
            const nextFincen = recomputeFinCEN({
              ...matter.fincen,
              beneficialOwners: matter.fincen.beneficialOwners.filter((owner) => owner.id !== ownerId),
            })
            return { ...matter, fincen: nextFincen }
          }),
        }))
      },
      registerFinCENCertRequest: ({ matterId, recipientName, recipientEmail }) => {
        const token = `fincen-cert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const certUrl = `/demo/fincen-cert/${token}`
        const reqId = `fincen-cert-req-${Date.now()}`
        const idKey = normalizeFinCenMatterKey(matterId)
        const req: DemoFinCENCertRequest = {
          id: reqId,
          token,
          matterId: idKey,
          createdAt: new Date().toISOString(),
          recipientName,
          recipientEmail,
          certUrl,
          status: 'pending_client',
          submittedAt: null,
          submittedOwners: null,
        }
        setState((prev) => {
          const nextRequests = [
            ...prev.fincenCertRequests.filter(
              (r) => !(fincenRequestMatchesMatter(r, idKey) && r.status === 'pending_client')
            ),
            req,
          ]
          persistFinCENCertRequests(nextRequests)
          const nextMatters = prev.matters
            .filter((m): m is DemoMatter => m != null && typeof m.id === 'string')
            .map((m) => {
              if (normalizeFinCenMatterKey(m.id) !== idKey || !m.fincen) return m
              return { ...m, fincen: { ...m.fincen, certRequest: req } }
            })
          queueMicrotask(() => persistDemoMatters(nextMatters))
          return {
            ...prev,
            fincenCertRequests: nextRequests,
            matters: nextMatters,
          }
        })
        return { token, certUrl }
      },
      submitFinCENCert: (token, owners) => {
        const submittedAt = new Date().toISOString()
        const ownersWithTimestamp: FinCENBeneficialOwner[] = owners.map((owner) => ({
          ...owner,
          id:
            owner.id?.trim() && owner.id.trim().length > 0
              ? owner.id
              : `bo-cert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          certifiedAt: submittedAt,
        }))
        const submittedIds = new Set(ownersWithTimestamp.map((o) => o.id))

        setState((prev) => {
          let requests = prev.fincenCertRequests
          let certRequest = requests.find((r) => r.token === token)
          if (!certRequest) {
            const fromStorage = readFinCENCertRequestFromStorage(token)
            if (!fromStorage) return prev
            requests = [...requests, fromStorage]
            certRequest = requests.find((r) => r.token === token)
            if (!certRequest) return prev
          }

          const matterIdKey = normalizeFinCenMatterKey(certRequest.matterId)
          const updatedReq: DemoFinCENCertRequest = {
            ...certRequest,
            matterId: matterIdKey,
            status: 'submitted',
            submittedAt,
            submittedOwners: ownersWithTimestamp,
          }
          const nextRequests = normalizeFinCENCertRequestsMatterIds(
            requests.map((req) => (req.token === token ? updatedReq : req))
          )
          persistFinCENCertRequests(nextRequests)

          const nextMatters = prev.matters
            .filter((m): m is DemoMatter => m != null && typeof m.id === 'string')
            .map((matter) => {
              if (normalizeFinCenMatterKey(matter.id) !== matterIdKey || matter.deletedAt || !matter.fincen)
                return matter
              try {
                const existingOwners = matter.fincen.beneficialOwners ?? []
                const retained = existingOwners.filter((o) => o.certifiedAt && !submittedIds.has(o.id))
                const mergedOwners = [...retained, ...ownersWithTimestamp]
                let nextFincen: DemoFinCEN = {
                  ...matter.fincen,
                  beneficialOwners: mergedOwners,
                  certRequest: matter.fincen.certRequest
                    ? { ...matter.fincen.certRequest, ...updatedReq }
                    : updatedReq,
                }
                nextFincen = recomputeFinCEN(nextFincen)
                return { ...matter, fincen: nextFincen }
              } catch {
                return matter
              }
            })
          queueMicrotask(() => persistDemoMatters(nextMatters))
          return {
            ...prev,
            fincenCertRequests: nextRequests,
            matters: nextMatters,
          }
        })
      },
      getFinCENCertByToken: (token) => state.fincenCertRequests.find((r) => r.token === token),
      cancelPendingFinCENCert: (matterId) => {
        setState((prev) => {
          const idKey = normalizeFinCenMatterKey(matterId)
          const matter = prev.matters
            .filter((m): m is DemoMatter => m != null && typeof m.id === 'string')
            .find((m) => normalizeFinCenMatterKey(m.id) === idKey && !m.deletedAt)
          const tok = matter?.fincen?.certRequest?.token
          if (!tok || matter?.fincen?.certRequest?.status !== 'pending_client') return prev
          const nextRequests = prev.fincenCertRequests.filter((r) => r.token !== tok)
          persistFinCENCertRequests(nextRequests)
          const nextMatters = prev.matters
            .filter((m): m is DemoMatter => m != null && typeof m.id === 'string')
            .map((m) => {
              if (normalizeFinCenMatterKey(m.id) !== idKey || !m.fincen || m.fincen.certRequest?.token !== tok)
                return m
              return { ...m, fincen: { ...m.fincen, certRequest: null } }
            })
          queueMicrotask(() => persistDemoMatters(nextMatters))
          return {
            ...prev,
            fincenCertRequests: nextRequests,
            matters: nextMatters,
          }
        })
      },
      createDemoMatter: (input) => {
        const ymd = (dt: Date) => dt.toISOString().slice(0, 10)
        const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
        let createdInfo: { matterId: string; fileId: string } | null = null

        setState((prev) => {
          const ts = Date.now()
          const staff = prev.staff
          const attorney =
            staff.find((s) => s.role.toLowerCase().includes('attorney'))?.full_name ?? staff[0]?.full_name ?? ''
          const paralegal =
            staff.find((s) => s.role.toLowerCase().includes('paralegal'))?.full_name ?? staff[1]?.full_name ?? attorney

          const closingDate = input.closing_date || ymd(new Date())
          const closingDt = new Date(`${closingDate}T00:00:00`)
          const safeClosing = Number.isNaN(closingDt.getTime()) ? ymd(new Date()) : closingDate

          const contractDate = ymd(addDays(new Date(`${safeClosing}T00:00:00`), -24))
          const inspectionDeadline = ymd(addDays(new Date(`${safeClosing}T00:00:00`), -9))
          const financingDeadline = ymd(addDays(new Date(`${safeClosing}T00:00:00`), -7))
          const titleCommitmentDeadline = ymd(addDays(new Date(`${safeClosing}T00:00:00`), -5))
          const possessionDate = safeClosing
          const fileOpenedDate = ymd(addDays(new Date(`${safeClosing}T00:00:00`), -24))

          const financingType =
            input.matter_type === 'Cash Residential Purchase' ? 'Cash' : input.matter_type === 'Residential Purchase - New File' ? 'FHA' : 'Conventional'
          const loanNumber = financingType === 'Cash' ? '' : `LN-${safeClosing.slice(0, 4)}-${Math.floor(10000 + Math.random() * 90000)}`
          const lenderName = financingType === 'Cash' ? '' : 'Demo Lender'
          const lenderEmail = financingType === 'Cash' ? '' : 'lender@demo.example'

          const normalizeEmail = (name: string, fallback: string) => {
            const safe = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+/, '').replace(/\.+$/, '')
            return `${safe || fallback}@demo.example`
          }

          const buyerName = input.buyer_name.trim()
          const sellerName = input.seller_name.trim()
          const buyerEmail = input.buyer_email?.trim() || (buyerName ? normalizeEmail(buyerName, 'buyer') : '')
          const buyerPhone = input.buyer_phone?.trim() || ''
          const sellerEmail = sellerName ? normalizeEmail(sellerName, 'seller') : ''
          const sellerPhone = ''

          const hoaFlag = input.property_type === 'Condo' || input.property_type === 'Townhouse'

          const tasks: DemoMatter['tasks'] = [
            { id: `t-${ts}-1`, title: 'Receive executed contract', status: 'not_started', deletedAt: null },
            { id: `t-${ts}-2`, title: 'Open file & send welcome email', status: 'not_started', deletedAt: null },
            { id: `t-${ts}-3`, title: 'Order title search', status: 'not_started', deletedAt: null },
            { id: `t-${ts}-4`, title: 'Order municipal lien/search', status: 'not_started', deletedAt: null },
            { id: `t-${ts}-5`, title: 'Request payoff from seller lender', status: 'not_started', deletedAt: null },
            { id: `t-${ts}-6`, title: 'Prepare Closing Disclosure/ALTA', status: 'not_started', deletedAt: null },
            { id: `t-${ts}-7`, title: 'Schedule signing', status: 'not_started', deletedAt: null },
          ]

          const status = deriveMatterStatus(tasks, safeClosing)

          const buyerId = `buyer-${ts}-1`
          const sellerId = `seller-${ts}-1`
          const matterId = `matter-${ts}`

          const nextMatter: DemoMatter = {
            id: matterId,
            file_id: input.file_id,
            status,
            deletedAt: null,
            matter_type: input.matter_type,
            portal_token: `demo-portal-${matterId}`,
            property: {
              address: input.property_address,
              county: input.county,
              property_type: input.property_type,
            },
            buyer: {
              id: buyerId,
              name: buyerName,
              type: input.buyer_type ?? 'individual',
              email: buyerEmail,
              phone: buyerPhone,
            },
            seller: {
              id: sellerId,
              name: sellerName,
              type: 'individual',
              email: sellerEmail,
              phone: sellerPhone,
            },
            transactionType: input.transactionType,
            purchasePrice: input.purchasePrice,
            financingType,
            loanNumber,
            lenderName,
            lenderEmail,
            buyerEmail,
            buyerPhone,
            sellerEmail,
            sellerPhone,
            buyerAgent: 'Demo Agent',
            listingAgent: 'Demo Listing Agent',
            assignedAttorney: attorney,
            assignedParalegal: paralegal,
            contractDate,
            inspectionDeadline,
            financingDeadline,
            titleCommitmentDeadline,
            possessionDate,
            fileOpenedDate,
            hoaFlag,
            referralSource: 'Demo mode',
            specialNotes: input.special_notes?.trim() ?? '',
            key_dates: {
              effective_date: contractDate,
              inspection_deadline: inspectionDeadline,
              loan_approval_deadline: financingDeadline,
              closing_date: safeClosing,
            },
            tasks,
            timeline: [
              {
                id: `e-${ts}-1`,
                at: `${fileOpenedDate} 09:00`,
                note: 'File opened in demo mode.',
                deletedAt: null,
              },
            ],
          }

          createdInfo = { matterId: nextMatter.id, fileId: nextMatter.file_id }

          const condoDiligenceByMatterId =
            isCondoDiligenceEligible(nextMatter) && !prev.condoDiligenceByMatterId[nextMatter.id]
              ? { ...prev.condoDiligenceByMatterId, [nextMatter.id]: buildDefaultCondoDiligence() }
              : prev.condoDiligenceByMatterId

          return {
            ...prev,
            matters: [...prev.matters, nextMatter],
            condoDiligenceByMatterId,
          }
        })
        if (createdInfo) input.onCreated?.(createdInfo)
      },
      addDemoDocument: (input) => {
        setState((prev) => {
          const documents = appendDemoDocumentIfValid(prev.documents, input)
          if (documents === prev.documents) return prev
          return { ...prev, documents }
        })
      },
      addDemoDocumentRequest: (input) => {
        setState((prev) => {
          const documentRequests = appendDemoDocumentRequestIfValid(prev.documentRequests, input)
          if (documentRequests === prev.documentRequests) return prev
          return { ...prev, documentRequests }
        })
      },
      fulfillDemoDocumentRequest: (input) => {
        let succeeded = false
        setState((prev) => {
          // Demo-mode fallback uploader for portal-simulated uploads.
          const uploadedByStaffId = prev.staff[0]?.id ?? ''
          if (!uploadedByStaffId.trim()) return prev
          const result = attemptClientDocumentRequestUpload(
            prev.matters,
            prev.documents,
            prev.documentRequests,
            {
              portalToken: input.portal_token,
              requestId: input.request_id,
              fileName: input.file_name,
              uploadedByStaffId,
            },
          )
          if (!result.ok) return prev
          succeeded = true
          return {
            ...prev,
            documents: result.documents,
            documentRequests: result.documentRequests,
          }
        })
        return succeeded
      },
      acknowledgeClientUploadReceipt: (requestId) => {
        let succeeded = false
        setState((prev) => {
          const documentRequests = acknowledgeClientUploadReceipt(prev.documentRequests, requestId)
          if (documentRequests === prev.documentRequests) return prev
          succeeded = true
          return { ...prev, documentRequests }
        })
        return succeeded
      },
      addMatterReviewTask: (input) => {
        setState((prev) => {
          const matterReviewTasks = appendDemoMatterReviewTaskIfValid(prev.matterReviewTasks, input)
          if (matterReviewTasks === prev.matterReviewTasks) return prev
          const created = matterReviewTasks[matterReviewTasks.length - 1]
          const activity = created ? buildCondoDiligenceActivityForTaskCreated(created) : null
          const condoDiligenceActivities = appendCondoDiligenceActivityIfValid(
            prev.condoDiligenceActivities,
            activity,
          )
          return { ...prev, matterReviewTasks, condoDiligenceActivities }
        })
      },
      updateMatterReviewTaskStatus: (taskId, status) => {
        setState((prev) => {
          const before = prev.matterReviewTasks.find((t) => t.id === taskId)
          const matterReviewTasks = patchDemoMatterReviewTaskStatus(prev.matterReviewTasks, taskId, status)
          if (matterReviewTasks === prev.matterReviewTasks) return prev
          const after = matterReviewTasks.find((t) => t.id === taskId)
          const activity = buildCondoDiligenceActivityForStatusTransition(before, after)
          const condoDiligenceActivities = appendCondoDiligenceActivityIfValid(
            prev.condoDiligenceActivities,
            activity,
          )
          return { ...prev, matterReviewTasks, condoDiligenceActivities }
        })
      },
      updateMatterReviewTasksStatus: (taskIds, status) => {
        let updatedCount = 0
        setState((prev) => {
          const result = patchDemoMatterReviewTasksStatus(prev.matterReviewTasks, taskIds, status)
          updatedCount = result.updatedCount
          if (result.tasks === prev.matterReviewTasks) return prev
          const condoDiligenceActivities = appendCondoDiligenceActivitiesForBulkStatusTransition(
            prev.condoDiligenceActivities,
            prev.matterReviewTasks,
            result.tasks,
            result.updatedTaskIds,
          )
          return { ...prev, matterReviewTasks: result.tasks, condoDiligenceActivities }
        })
        return updatedCount
      },
      listMatterReviewTasksForMatter: (matterId) =>
        listCondoDiligenceSummaryReviewTasks(state.matterReviewTasks, matterId),
      getCondoDiligence: (matterId) => {
        const id = matterId.trim()
        if (!id) return undefined
        return state.condoDiligenceByMatterId[id]
      },
      ensureCondoDiligence: (matterId) => {
        const id = matterId.trim()
        if (!id) return
        setState((prev) => {
          if (prev.condoDiligenceByMatterId[id]) return prev
          const matter = prev.matters.find((m) => m.id === id && !m.deletedAt)
          if (!matter || !isCondoDiligenceEligible(matter)) return prev
          return {
            ...prev,
            condoDiligenceByMatterId: {
              ...prev.condoDiligenceByMatterId,
              [id]: buildDefaultCondoDiligence(),
            },
          }
        })
      },
      patchCondoDiligence: (matterId, patch) => {
        const id = matterId.trim()
        if (!id) return
        setState((prev) => {
          const existing = prev.condoDiligenceByMatterId[id]
          if (!existing) return prev
          const definedEntries = Object.fromEntries(
            Object.entries(patch).filter(([, v]) => v !== undefined),
          ) as Partial<DemoCondoDiligence>
          const {
            estoppelReview: estoppelPatch,
            sirsMilestoneReview: sirsPatch,
            associationFinancialReview: financialPatch,
            associationRecordsGovernanceReview: governancePatch,
            disclosurePackageReview: disclosurePatch,
            questionnaireLenderReview: questionnairePatch,
            unitClosingDependenciesReview: unitClosingPatch,
            lawyerReviewCheckpoint: lawyerCheckpointPatch,
            ...restPatch
          } = definedEntries
          const nextBase: DemoCondoDiligence = {
            ...existing,
            ...restPatch,
            updated_at: new Date().toISOString(),
          }
          if ('estoppelReview' in definedEntries) {
            nextBase.estoppelReview = estoppelPatch
              ? {
                  ...normalizeCondoEstoppelReview(existing.estoppelReview),
                  ...estoppelPatch,
                }
              : undefined
          }
          if ('sirsMilestoneReview' in definedEntries) {
            nextBase.sirsMilestoneReview = sirsPatch
              ? {
                  ...normalizeCondoSirsMilestoneReview(existing.sirsMilestoneReview),
                  ...sirsPatch,
                }
              : undefined
          }
          if ('associationFinancialReview' in definedEntries) {
            nextBase.associationFinancialReview = financialPatch
              ? {
                  ...normalizeCondoAssociationFinancialReview(existing.associationFinancialReview),
                  ...financialPatch,
                }
              : undefined
          }
          if ('associationRecordsGovernanceReview' in definedEntries) {
            nextBase.associationRecordsGovernanceReview = governancePatch
              ? {
                  ...normalizeCondoAssociationRecordsGovernanceReview(existing.associationRecordsGovernanceReview),
                  ...governancePatch,
                }
              : undefined
          }
          if ('disclosurePackageReview' in definedEntries) {
            nextBase.disclosurePackageReview = disclosurePatch
              ? {
                  ...normalizeCondoDisclosurePackageReview(existing.disclosurePackageReview),
                  ...disclosurePatch,
                }
              : undefined
          }
          if ('questionnaireLenderReview' in definedEntries) {
            nextBase.questionnaireLenderReview = questionnairePatch
              ? {
                  ...normalizeCondoQuestionnaireLenderReview(existing.questionnaireLenderReview),
                  ...questionnairePatch,
                }
              : undefined
          }
          if ('unitClosingDependenciesReview' in definedEntries) {
            nextBase.unitClosingDependenciesReview = unitClosingPatch
              ? {
                  ...normalizeCondoUnitClosingDependenciesReview(existing.unitClosingDependenciesReview),
                  ...unitClosingPatch,
                }
              : undefined
          }
          if ('lawyerReviewCheckpoint' in definedEntries) {
            nextBase.lawyerReviewCheckpoint = lawyerCheckpointPatch
              ? {
                  ...normalizeCondoLawyerReviewCheckpoint(existing.lawyerReviewCheckpoint),
                  ...lawyerCheckpointPatch,
                }
              : undefined
          }
          const shouldDeriveMatterStatus =
            'requiredDocuments' in definedEntries || 'findings' in definedEntries
          const next: DemoCondoDiligence = shouldDeriveMatterStatus
            ? {
                ...nextBase,
                status: deriveCondoDiligenceMatterStatusFromChecklist({
                  requiredDocuments: nextBase.requiredDocuments,
                  findings: nextBase.findings,
                }),
              }
            : nextBase
          return {
            ...prev,
            condoDiligenceByMatterId: { ...prev.condoDiligenceByMatterId, [id]: next },
          }
        })
      },
    }
  }, [state])

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemoStore() {
  const ctx = useContext(DemoContext)
  if (!ctx) {
    throw new Error('useDemoStore must be used inside DemoProvider')
  }
  return ctx
}
