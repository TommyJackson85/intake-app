'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import type {
  DemoCondoAssociationFinancialReview,
  DemoCondoAssociationLoanStatus,
  DemoCondoAssociationRecordsGovernanceReview,
  DemoCondoAssociationSpecialAssessmentStatus,
  DemoCondoBuyerApprovalStatus,
  DemoCondoDelinquencyConcern,
  DemoCondoDiligenceDocStatus,
  DemoCondoDiligenceMatterStatus,
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
  DemoMatter,
  DemoMatterStatus,
} from '@/lib/demo/types'
import DemoTaskChecklist from '@/components/demo/DemoTaskChecklist'
import DemoTimelineNotes from '@/components/demo/DemoTimelineNotes'
import { displayOrFallback, parseOtherPartyInfo } from '@/lib/demo/matterPartyDisplay'
import DemoFinCENTab from '@/components/demo/DemoFinCENTab'
import { isFincenEligibleMatter } from '@/lib/demo/fincenEligibility'
import UploadDemoDocumentModal from '@/app/demo/_components/UploadDemoDocumentModal'
import {
  buildCondoDiligenceInternalReport,
  buildCondoDiligenceOperationalSummary,
  buildCondoDiligenceSummaryDraftDocumentInput,
  condoDiligenceMatterStatusPresentation,
  condoEstoppelDueDateWarning,
  condoEstoppelReviewStatusPresentation,
  condoFinancialDocReviewStatusPresentation,
  condoFinancialRiskLevelPresentation,
  condoGovernanceConcernLevelPresentation,
  condoRequiredDocMatchesLinkageHaystack,
  condoRequiredDocDerivedStatusPresentation,
  condoSirsApplicabilityPresentation,
  condoSirsDocumentStatusPresentation,
  condoSirsResultPresentation,
  condoSirsRiskLevelPresentation,
  deriveCondoRequiredDocumentStatus,
  isCondoDiligenceUntouched,
  isCondoDiligenceEligible,
  isCondoDiligenceInternalSummaryDocument,
  listCondoDiligenceInternalSummaryDocuments,
  normalizeCondoAssociationFinancialReview,
  normalizeCondoAssociationRecordsGovernanceReview,
  normalizeCondoEstoppelReview,
  normalizeCondoSirsMilestoneReview,
  syncRequiredDocumentsFromDerivedLinkage,
} from '@/lib/demo/condoDiligence'
import DocumentPreviewModal from '@/app/demo/_components/DocumentPreviewModal'

type MatterDetailModalProps = {
  matter: DemoMatter | null
  open: boolean
  onClose: () => void
  onArchive: (matterId: string) => void
  initialTab?: MatterDetailTab
}

function statusColor(status: DemoMatterStatus) {
  if (status === 'Closed/Post-Closing') return '#2f855a'
  if (status === 'Scheduled for Closing') return '#805ad5'
  if (status === 'Cleared to Close') return '#208096'
  if (status === 'Title Search') return '#975a16'
  return '#627c71'
}

function formatMoneyUSD(amount: number) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `$${amount.toLocaleString('en-US')}`
  }
}

function parseYmd(dateStr: string) {
  if (!dateStr) return null
  const dt = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(dt.getTime())) return null
  return dt
}

function formatYmd(dateStr: string) {
  const dt = parseYmd(dateStr)
  if (!dt) return dateStr
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function dateBadgeAndColors(dateStr: string) {
  const dt = parseYmd(dateStr)
  if (!dt) return { leftBorder: '#627c71', text: '#627c71', pill: null as null | string }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((dt.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

  if (diffDays < 0) {
    return { leftBorder: '#cbd5e0', text: '#6b7280', pill: '✓ Passed' }
  }
  if (diffDays <= 3) {
    return { leftBorder: '#f0b429', text: '#b45309', pill: '⚠ Soon' }
  }
  return { leftBorder: '#208096', text: '#134252', pill: null as null | string }
}

function fincenStatusPresentation(input: {
  required: boolean
  completedFields: number
  pendingClient: boolean
}): { label: string; helper: string; bg: string; color: string; border: string } | null {
  if (!input.required) return null
  if (input.completedFields >= 111) {
    return {
      label: 'Completed',
      helper: 'All required AML / FinCEN fields are complete.',
      bg: '#e8f5f0',
      color: '#166534',
      border: 'rgba(47,133,90,0.35)',
    }
  }
  if (input.pendingClient) {
    return {
      label: 'Pending client',
      helper: 'Waiting on client certification details.',
      bg: '#fff4d6',
      color: '#b45309',
      border: 'rgba(240,180,41,0.35)',
    }
  }
  if (input.completedFields > 0) {
    return {
      label: 'In progress',
      helper: 'AML / FinCEN intake has started.',
      bg: '#dbeafe',
      color: '#1e40af',
      border: 'rgba(30,64,175,0.25)',
    }
  }
  return {
    label: 'Not started',
    helper: 'No AML / FinCEN data entered yet.',
    bg: '#f5f5f5',
    color: '#627c71',
    border: 'rgba(94,82,64,0.2)',
  }
}

function fincenNextStepSummary(input: {
  required: boolean
  completedFields: number
  pendingClient: boolean
}): string | null {
  if (!input.required) return null
  if (input.completedFields >= 111) return 'Ready for final review.'
  if (input.pendingClient) return 'Client details still needed.'
  if (input.completedFields > 0) return 'Complete remaining AML / FinCEN fields.'
  return 'Start AML / FinCEN intake details.'
}

function condoNextStepSummary(condoDiligence: ReturnType<typeof useDemoStore>['getCondoDiligence'] extends (id: string) => infer T ? T : never): string {
  if (!condoDiligence) return 'Review required association records.'
  const outstanding = condoDiligence.requiredDocuments.filter((d) => d.status === 'outstanding').length
  const requested = condoDiligence.requiredDocuments.filter((d) => d.status === 'requested').length
  if (outstanding > 0) return `${outstanding} required document${outstanding === 1 ? '' : 's'} still outstanding.`
  if (requested > 0) return `${requested} document request${requested === 1 ? '' : 's'} pending receipt.`
  return 'All required documents received; review findings.'
}

type KeyDateItem = { label: string; dateStr: string }

type MatterDetailTab =
  | 'Overview'
  | 'Parties & Contacts'
  | 'Key Dates'
  | 'Tasks'
  | 'Documents'
  | 'Condo Diligence'
  | 'Notes'
  | 'FinCEN / AML'

const CONDO_FINDING_TEMPLATES: { id: string; label: string; text: string }[] = [
  {
    id: 'reserve-budget',
    label: 'Reserve / budget',
    text: 'Reserve and budget review indicates potential underfunding for projected repairs; confirm adequacy and update buyer risk notes.',
  },
  {
    id: 'milestone-structural',
    label: 'Milestone / structural',
    text: 'Milestone/structural inspection materials suggest follow-up is needed on identified building items before closing clearance.',
  },
  {
    id: 'insurance-coverage',
    label: 'Insurance coverage',
    text: 'Insurance summary appears to show a potential coverage or deductible gap; verify policy limits and carrier terms.',
  },
  {
    id: 'board-minutes-governance',
    label: 'Board minutes / governance',
    text: 'Board minutes reference pending governance or maintenance issues that should be reviewed with client before closing.',
  },
  {
    id: 'special-assessment',
    label: 'Special assessment',
    text: 'Potential or active special assessment noted; confirm amount, timing, and allocation responsibility in closing documents.',
  },
]

export default function MatterDetailModal({ matter, open, onClose, onArchive, initialTab }: MatterDetailModalProps) {
  const {
    documents,
    documentRequests,
    staff,
    matters,
    addDemoDocument,
    addDemoDocumentRequest,
    getMatterById,
    getArchivedMatterById,
    ensureCondoDiligence,
    getCondoDiligence,
    patchCondoDiligence,
  } = useDemoStore()
  const [activeTab, setActiveTab] = useState<MatterDetailTab>('Overview')
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false)
  const [condoReportCopyStatus, setCondoReportCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [condoReportSaveStatus, setCondoReportSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'failed'
  >('idle')
  const [condoReportSavedDocId, setCondoReportSavedDocId] = useState<string | null>(null)
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null)
  const condoReportSaveLockRef = React.useRef(false)

  const matterId = matter?.id ?? ''
  const effectiveMatter: DemoMatter | null =
    matterId !== '' ? (getMatterById(matterId) ?? getArchivedMatterById(matterId) ?? matter) : null

  const condoEligible = Boolean(effectiveMatter && isCondoDiligenceEligible(effectiveMatter))
  const condoDiligence = matterId ? getCondoDiligence(matterId) : undefined
  const showCondoDiligenceTab = Boolean(condoDiligence) || condoEligible
  const fincenRequired = Boolean(effectiveMatter && isFincenEligibleMatter(effectiveMatter))
  const fincenCompletedFields = effectiveMatter?.fincen?.completedFields ?? 0
  const fincenPendingClient = effectiveMatter?.fincen?.certRequest?.status === 'pending_client'
  const fincenSummary = fincenStatusPresentation({
    required: fincenRequired,
    completedFields: fincenCompletedFields,
    pendingClient: fincenPendingClient,
  })
  const fincenNextStep = fincenNextStepSummary({
    required: fincenRequired,
    completedFields: fincenCompletedFields,
    pendingClient: fincenPendingClient,
  })

  const matterDocuments = useMemo(() => {
    if (!effectiveMatter) return []
    return documents.filter((d) => d.matter_id === effectiveMatter.id)
  }, [documents, effectiveMatter])

  const condoSummaryHistory = useMemo(
    () => listCondoDiligenceInternalSummaryDocuments(matterDocuments),
    [matterDocuments],
  )

  const matterDocumentRequests = useMemo(() => {
    if (!effectiveMatter) return []
    return documentRequests.filter((r) => r.matter_id === effectiveMatter.id)
  }, [documentRequests, effectiveMatter])

  const condoLinkedSyncPreview = useMemo(() => {
    if (!condoDiligence || !effectiveMatter) return null
    return syncRequiredDocumentsFromDerivedLinkage(condoDiligence.requiredDocuments, {
      matterId: effectiveMatter.id,
      documents: matterDocuments,
      documentRequests: matterDocumentRequests,
    })
  }, [condoDiligence, effectiveMatter, matterDocuments, matterDocumentRequests])

  const canSyncCondoChecklistFromLinks = Boolean(
    condoLinkedSyncPreview &&
      condoDiligence &&
      condoLinkedSyncPreview.some((d, i) => d.status !== condoDiligence.requiredDocuments[i]?.status),
  )
  const requestedByStaffId = staff[0]?.id ?? ''
  const hasOpenMatchingCondoRequest = (docId: string) =>
    matterDocumentRequests.some((r) => {
      if (r.status !== 'open') return false
      const haystack = [r.title, r.description ?? '', r.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return condoRequiredDocMatchesLinkageHaystack(haystack, docId)
    })
  const hasReceivedMatchingCondoDoc = (docId: string) =>
    matterDocuments.some((d) => {
      if (d.deletedAt) return false
      const haystack = [d.name, d.document_subtype ?? '', d.description ?? '', d.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return condoRequiredDocMatchesLinkageHaystack(haystack, docId)
    })
  const createCondoDocRequest = (doc: { id: string; label: string }) => {
    if (!requestedByStaffId || !effectiveMatter) return
    addDemoDocumentRequest({
      matter_id: effectiveMatter.id,
      title: `Condo diligence: ${doc.label}`,
      description: `Requested from Condo Diligence checklist (${doc.id.replace(/_/g, ' ')}).`,
      category: 'Compliance',
      requested_by_staff_id: requestedByStaffId,
      requested_at: new Date().toISOString(),
    })
  }
  const requestableCondoDocs = condoDiligence
    ? condoDiligence.requiredDocuments.filter((doc) => {
        const derived = deriveCondoRequiredDocumentStatus({
          matterId: effectiveMatter?.id ?? '',
          condoDocId: doc.id,
          storedStatus: doc.status,
          documents: matterDocuments,
          documentRequests: matterDocumentRequests,
        })
        return (
          derived === 'outstanding' &&
          !hasOpenMatchingCondoRequest(doc.id) &&
          !hasReceivedMatchingCondoDoc(doc.id) &&
          Boolean(requestedByStaffId)
        )
      })
    : []
  const condoOperationalSummary = useMemo(() => {
    if (!condoDiligence || !effectiveMatter) return null
    return buildCondoDiligenceOperationalSummary({
      matterId: effectiveMatter.id,
      condo: condoDiligence,
      documents: matterDocuments,
      documentRequests: matterDocumentRequests,
    })
  }, [condoDiligence, effectiveMatter, matterDocuments, matterDocumentRequests])

  const condoInternalReport = useMemo(() => {
    if (!condoDiligence || !effectiveMatter) return null
    const matterLabel = [effectiveMatter.file_id, effectiveMatter.property?.address]
      .filter((v) => typeof v === 'string' && v.trim())
      .join(' · ')
    return buildCondoDiligenceInternalReport({
      matterId: effectiveMatter.id,
      condo: condoDiligence,
      documents: matterDocuments,
      documentRequests: matterDocumentRequests,
      matterLabel,
    })
  }, [condoDiligence, effectiveMatter, matterDocuments, matterDocumentRequests])

  useEffect(() => {
    if (!open) return
    setActiveTab(initialTab ?? 'Overview')
    setIsAddDocumentOpen(false)
  }, [open, matterId, initialTab])

  useEffect(() => {
    if (!open || activeTab !== 'Condo Diligence' || !matterId) return
    ensureCondoDiligence(matterId)
  }, [activeTab, ensureCondoDiligence, matterId, open])

  useEffect(() => {
    if (activeTab === 'Condo Diligence' && !showCondoDiligenceTab) {
      setActiveTab('Overview')
    }
  }, [activeTab, showCondoDiligenceTab])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  const tabList: MatterDetailTab[] = [
    'Overview',
    'Parties & Contacts',
    'Key Dates',
    'Tasks',
    'Documents',
    ...(showCondoDiligenceTab ? (['Condo Diligence'] as const) : []),
    'Notes',
    'FinCEN / AML',
  ]

  if (!open) return null

  if (!effectiveMatter) return null

  const status = effectiveMatter.status
  const statusHex = statusColor(status)
  const otherParty = parseOtherPartyInfo(effectiveMatter.specialNotes)

  const keyDateItems: KeyDateItem[] = [
    { label: 'File opened', dateStr: effectiveMatter.fileOpenedDate },
    { label: 'Contract executed', dateStr: effectiveMatter.contractDate },
    { label: 'Inspection deadline', dateStr: effectiveMatter.inspectionDeadline },
    {
      label: 'Financing deadline',
      dateStr: effectiveMatter.financingType === 'Cash' ? '' : effectiveMatter.financingDeadline,
    },
    { label: 'Title commitment', dateStr: effectiveMatter.titleCommitmentDeadline },
    { label: 'Closing date', dateStr: effectiveMatter.key_dates.closing_date },
    { label: 'Possession date', dateStr: effectiveMatter.possessionDate },
  ].filter((i) => Boolean(i.dateStr))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Matter details"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 60,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        padding: '18px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1024px',
          background: '#fcfcf9',
          borderRadius: '10px',
          border: '1px solid rgba(94,82,64,0.25)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid rgba(94,82,64,0.15)',
            background: '#fcfcf9',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#134252', lineHeight: 1 }}>{effectiveMatter.file_id}</div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                width: 'fit-content',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 900,
                border: `1px solid ${statusHex}33`,
                background: `${statusHex}14`,
                color: statusHex,
              }}
            >
              {effectiveMatter.status}
            </span>
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#627c71',
                fontSize: '20px',
                fontWeight: 900,
                lineHeight: 1,
                padding: 6,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid rgba(94,82,64,0.12)',
            background: '#fcfcf9',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tabList.map((tab) => {
              const active = tab === activeTab
              const isFinCENRequired = isFincenEligibleMatter(effectiveMatter)
              const isFinCENReady = (effectiveMatter.fincen?.completedFields ?? 0) >= 111
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: active ? '#208096' : 'white',
                    color: active ? 'white' : '#134252',
                    border: active ? 'none' : '1px solid rgba(94,82,64,0.2)',
                    borderRadius: '999px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontWeight: 900,
                    fontSize: '13px',
                  }}
                >
                  {tab}
                  {tab === 'FinCEN / AML' && isFinCENRequired && !isFinCENReady && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#c0152f',
                        marginLeft: '5px',
                        verticalAlign: 'middle',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'Overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Matter type</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.matter_type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Transaction type</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.transactionType}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Property type</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.property.property_type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>County</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.property.county}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Property address</div>
                <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.property.address}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Purchase price</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{formatMoneyUSD(effectiveMatter.purchasePrice)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Financing type</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.financingType}</div>
                </div>
              </div>

              {effectiveMatter.financingType !== 'Cash' && (
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Loan number</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.loanNumber}</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>HOA</div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 10px',
                      borderRadius: '999px',
                      fontWeight: 900,
                      fontSize: '13px',
                      border: effectiveMatter.hoaFlag ? '1px solid rgba(47,133,90,0.35)' : '1px solid rgba(98,124,113,0.25)',
                      background: effectiveMatter.hoaFlag ? '#e8f5f0' : '#f5f5f5',
                      color: effectiveMatter.hoaFlag ? '#2f855a' : '#627c71',
                    }}
                  >
                    {effectiveMatter.hoaFlag ? 'HOA ✓' : 'No HOA'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Referral source</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.referralSource}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>Assigned staff</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 900, color: '#134252' }}>Attorney</div>
                    <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.assignedAttorney}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, color: '#134252' }}>Paralegal</div>
                    <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.assignedParalegal}</div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 800, marginBottom: '4px' }}>File opened</div>
                <div style={{ color: '#134252', fontWeight: 900 }}>{formatYmd(effectiveMatter.fileOpenedDate)}</div>
              </div>

              {(showCondoDiligenceTab || fincenSummary) && (
                <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: 8, padding: 12, background: 'white' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#134252', marginBottom: 8 }}>Compliance Summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {showCondoDiligenceTab && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#134252' }}>Condo Diligence</div>
                          <div style={{ fontSize: 11, color: '#627c71' }}>
                            {condoNextStepSummary(condoDiligence)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '5px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 900,
                              background: condoDiligenceMatterStatusPresentation(condoDiligence?.status ?? 'not_started').bg,
                              color: condoDiligenceMatterStatusPresentation(condoDiligence?.status ?? 'not_started').color,
                              border: `1px solid ${condoDiligenceMatterStatusPresentation(condoDiligence?.status ?? 'not_started').border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {condoDiligenceMatterStatusPresentation(condoDiligence?.status ?? 'not_started').label}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('Condo Diligence')}
                            aria-label="Review Condo Diligence workflow"
                            style={{
                              background: 'white',
                              border: '1px solid rgba(94,82,64,0.25)',
                              borderRadius: 6,
                              padding: '4px 8px',
                              fontSize: 11,
                              fontWeight: 800,
                              color: '#134252',
                              cursor: 'pointer',
                            }}
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    )}

                    {fincenSummary && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#134252' }}>AML / FinCEN</div>
                          <div style={{ fontSize: 11, color: '#627c71' }}>{fincenNextStep ?? fincenSummary.helper}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '5px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 900,
                              background: fincenSummary.bg,
                              color: fincenSummary.color,
                              border: `1px solid ${fincenSummary.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {fincenSummary.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('FinCEN / AML')}
                            aria-label="Review AML and FinCEN workflow"
                            style={{
                              background: 'white',
                              border: '1px solid rgba(94,82,64,0.25)',
                              borderRadius: 6,
                              padding: '4px 8px',
                              fontSize: 11,
                              fontWeight: 800,
                              color: '#134252',
                              cursor: 'pointer',
                            }}
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {effectiveMatter.specialNotes.trim() !== '' && (
                <div
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #f0b429',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#7c2d12',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>⚠</span>
                  <div>{effectiveMatter.specialNotes}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Parties & Contacts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                  <div style={{ fontSize: '14px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>Buyer</div>
                  <div style={{ fontWeight: 900, fontSize: '18px', color: '#134252', marginBottom: '6px' }}>
                    {displayOrFallback(effectiveMatter.buyer.name, 'No name provided')}
                  </div>
                  <div style={{ color: '#134252', marginBottom: '4px' }}>
                    {effectiveMatter.buyerEmail.trim() ? (
                      <a href={`mailto:${effectiveMatter.buyerEmail}`} style={{ color: '#208096', textDecoration: 'none', fontWeight: 800 }}>
                        {effectiveMatter.buyerEmail}
                      </a>
                    ) : (
                      'No email provided'
                    )}
                  </div>
                  <div style={{ color: '#134252' }}>{displayOrFallback(effectiveMatter.buyerPhone, 'No phone provided')}</div>
                </div>
                <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                  <div style={{ fontSize: '14px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>Seller</div>
                  <div style={{ fontWeight: 900, fontSize: '18px', color: '#134252', marginBottom: '6px' }}>
                    {displayOrFallback(effectiveMatter.seller.name, 'No name provided')}
                  </div>
                  <div style={{ color: '#134252', marginBottom: '4px' }}>
                    {effectiveMatter.sellerEmail.trim() ? (
                      <a href={`mailto:${effectiveMatter.sellerEmail}`} style={{ color: '#208096', textDecoration: 'none', fontWeight: 800 }}>
                        {effectiveMatter.sellerEmail}
                      </a>
                    ) : (
                      'No email provided'
                    )}
                  </div>
                  <div style={{ color: '#134252' }}>{displayOrFallback(effectiveMatter.sellerPhone, 'No phone provided')}</div>
                </div>
              </div>

              {(otherParty.name || otherParty.title) && (
                <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                  <div style={{ fontSize: '14px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>
                    {otherParty.title ? `Other: ${otherParty.title}` : 'Other'}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '18px', color: '#134252', marginBottom: '6px' }}>
                    {displayOrFallback(otherParty.name, 'No name provided')}
                  </div>
                  <div style={{ color: '#134252' }}>Stored from intake/matter setup.</div>
                </div>
              )}

              {effectiveMatter.financingType !== 'Cash' && (
                <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                  <div style={{ fontSize: '14px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>Lender</div>
                  <div style={{ fontWeight: 900, fontSize: '18px', color: '#134252', marginBottom: '6px' }}>
                    {displayOrFallback(effectiveMatter.lenderName, 'No lender provided')}
                  </div>
                  <div style={{ color: '#134252', marginBottom: '4px' }}>
                    {effectiveMatter.lenderEmail.trim() ? (
                      <a href={`mailto:${effectiveMatter.lenderEmail}`} style={{ color: '#208096', textDecoration: 'none', fontWeight: 800 }}>
                        {effectiveMatter.lenderEmail}
                      </a>
                    ) : (
                      'No email provided'
                    )}
                  </div>
                  <div style={{ color: '#134252', fontWeight: 800 }}>
                    Loan: {displayOrFallback(effectiveMatter.loanNumber, 'No loan number provided')}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>Buyer&apos;s agent</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.buyerAgent}</div>
                </div>
                <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                  <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>Listing agent</div>
                  <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.listingAgent}</div>
                </div>
              </div>

              <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: '8px', padding: '14px', background: 'white' }}>
                <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 900, marginBottom: '6px' }}>Assigned staff</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 900, marginBottom: '4px' }}>Attorney</div>
                    <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.assignedAttorney}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#627c71', fontWeight: 900, marginBottom: '4px' }}>Paralegal</div>
                    <div style={{ color: '#134252', fontWeight: 900 }}>{effectiveMatter.assignedParalegal}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Key Dates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {keyDateItems.map((item) => {
                const badge = dateBadgeAndColors(item.dateStr)
                return (
                  <div
                    key={item.label}
                    style={{
                      border: '1px solid rgba(94,82,64,0.12)',
                      borderRadius: '8px',
                      padding: '12px',
                      background: 'white',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ width: '4px', borderRadius: '999px', background: badge.leftBorder, flexShrink: 0, height: '100%' }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: badge.text, marginBottom: '6px' }}>{item.label}</div>
                      <div style={{ color: badge.text, fontWeight: 900 }}>{formatYmd(item.dateStr)}</div>
                      {badge.pill && (
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '8px',
                            fontSize: '12px',
                            fontWeight: 900,
                            padding: '4px 10px',
                            borderRadius: '999px',
                            border: `1px solid ${badge.leftBorder}55`,
                            background: `${badge.leftBorder}14`,
                            color: badge.text,
                          }}
                        >
                          {badge.pill}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'Tasks' && (
            <div>
              <h3 style={{ marginBottom: '8px', fontSize: '15px' }}>Task checklist</h3>
              <DemoTaskChecklist matterId={effectiveMatter.id} />
            </div>
          )}

          {activeTab === 'Documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ color: '#627c71', fontSize: 13 }}>
                  Demo only - metadata only. No real file is stored.
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddDocumentOpen(true)}
                  style={{
                    background: '#134252',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Add document
                </button>
              </div>

              {(showCondoDiligenceTab || condoSummaryHistory.length > 0) && (
                <div
                  style={{
                    border: '1px solid rgba(94,82,64,0.12)',
                    borderRadius: 8,
                    padding: 14,
                    background: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#134252', marginBottom: 4 }}>
                      Condo Diligence Summary History
                    </div>
                    <div style={{ fontSize: 12, color: '#627c71', lineHeight: 1.45 }}>
                      Saved internal snapshots for this matter. Lawyer review required — not shared to the client
                      portal.
                    </div>
                  </div>
                  {condoSummaryHistory.length === 0 ? (
                    <div style={{ color: '#627c71', fontSize: 13 }}>
                      No saved internal summaries yet. Save one from the Condo Diligence tab.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {condoSummaryHistory.map((doc) => {
                        const savedAt =
                          doc.generatedInternalSummary?.generatedAt?.trim() || doc.uploaded_at
                        return (
                          <div
                            key={doc.id}
                            style={{
                              display: 'flex',
                              gap: 12,
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              borderTop: '1px solid rgba(94,82,64,0.1)',
                              paddingTop: 10,
                            }}
                          >
                            <div style={{ minWidth: 0, flex: '1 1 180px' }}>
                              <div
                                style={{
                                  fontWeight: 800,
                                  color: '#134252',
                                  fontSize: 13,
                                  marginBottom: 2,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {doc.name}
                              </div>
                              <div style={{ color: '#627c71', fontSize: 12, fontWeight: 700 }}>
                                Saved: {new Date(savedAt).toLocaleString()}
                                {' · '}
                                Internal only
                                {' · '}
                                {doc.status}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPreviewDocumentId(doc.id)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(94,82,64,0.25)',
                                background: '#fff',
                                fontWeight: 800,
                                fontSize: 11,
                                color: '#134252',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              View internal summary
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {matterDocuments.length === 0 ? (
                <div style={{ color: '#627c71' }}>No documents on file for this matter.</div>
              ) : (
                matterDocuments
                  .slice()
                  .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
                  .map((doc) => {
                    const statusStyle =
                      doc.status === 'final'
                        ? { bg: '#e8f5f0', color: '#2f855a', border: 'rgba(47,133,90,0.35)' }
                        : doc.status === 'reviewed'
                          ? { bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
                          : { bg: '#f5f5f5', color: '#627c71', border: 'rgba(94,82,64,0.2)' }

                    const uploadedBy = staff.find((s) => s.id === doc.uploaded_by_staff_id)?.full_name ?? 'Staff'
                    const isInternalSummary = isCondoDiligenceInternalSummaryDocument(doc)
                    return (
                      <div
                        key={doc.id}
                        style={{
                          border: '1px solid rgba(94,82,64,0.12)',
                          borderRadius: '8px',
                          padding: '12px',
                          background: 'white',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 900, color: '#134252', marginBottom: '4px' }}>{doc.name}</div>
                            <div style={{ color: '#627c71', fontWeight: 800, fontSize: '12px', marginBottom: '8px' }}>
                              {doc.category}
                              {isInternalSummary ? ' · Internal summary' : ''}
                            </div>
                          </div>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '6px 10px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              fontWeight: 900,
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              border: `1px solid ${statusStyle.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {doc.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: '#627c71', fontSize: '12px', fontWeight: 800 }}>
                          <div>Uploaded: {new Date(doc.uploaded_at).toLocaleString()}</div>
                          <div>By: {uploadedBy}</div>
                          {doc.generatedInternalSummary?.visibility === 'internal' ? (
                            <div>Internal only</div>
                          ) : null}
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <button
                            type="button"
                            onClick={() => setPreviewDocumentId(doc.id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              border: '1px solid rgba(94,82,64,0.25)',
                              background: '#fff',
                              fontWeight: 800,
                              fontSize: 11,
                              color: '#134252',
                              cursor: 'pointer',
                            }}
                          >
                            {isInternalSummary ? 'View internal summary' : 'View'}
                          </button>
                        </div>
                      </div>
                    )
                  })
              )}
              <UploadDemoDocumentModal
                isOpen={isAddDocumentOpen}
                onClose={() => setIsAddDocumentOpen(false)}
                preferredMatterId={effectiveMatter.id}
              />
              <DocumentPreviewModal
                previewDocument={
                  previewDocumentId ? matterDocuments.find((d) => d.id === previewDocumentId) ?? null : null
                }
                matters={matters}
                staff={staff}
                fulfilledRequest={
                  previewDocumentId
                    ? documentRequests.find((r) => r.fulfilled_document_id === previewDocumentId) ?? null
                    : null
                }
                onClose={() => setPreviewDocumentId(null)}
              />
            </div>
          )}

          {activeTab === 'Condo Diligence' && showCondoDiligenceTab && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, color: '#627c71' }}>
                Demo only — checklist and notes are metadata in this session (persisted locally for demo).
              </div>
              {!condoDiligence ? (
                <div style={{ color: '#627c71' }}>Loading condo diligence…</div>
              ) : (
                <>
                  {isCondoDiligenceUntouched(condoDiligence) && (
                    <div
                      style={{
                        border: '1px solid rgba(30,64,175,0.25)',
                        borderRadius: 8,
                        padding: 12,
                        background: '#dbeafe',
                        color: '#1e3a8a',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 4 }}>
                        Condo diligence is ready for this matter.
                      </div>
                      <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                        Review required association records, track requested and received items, and capture findings here.
                        Work the checklist below (estoppel, inspections/reserves, financials, governing docs, insurance,
                        minutes, assessments, litigation disclosures, leasing restrictions, and contacts).
                        Linked documents and open requests can help update the checklist.
                      </div>
                    </div>
                  )}
                  <div
                    style={{
                      border: '1px solid rgba(94,82,64,0.12)',
                      borderRadius: 8,
                      padding: 14,
                      background: 'white',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 12,
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#134252', marginBottom: 4 }}>
                        Florida condo diligence
                      </div>
                      <div style={{ fontSize: 12, color: '#627c71' }}>
                        Required association and closing-support items for this matter (demo).
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 900,
                        background: condoDiligenceMatterStatusPresentation(condoDiligence.status).bg,
                        color: condoDiligenceMatterStatusPresentation(condoDiligence.status).color,
                        border: `1px solid ${condoDiligenceMatterStatusPresentation(condoDiligence.status).border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {condoDiligenceMatterStatusPresentation(condoDiligence.status).label}
                    </span>
                  </div>
                  {condoOperationalSummary && (
                    <div
                      style={{
                        border: '1px solid rgba(94,82,64,0.12)',
                        borderRadius: 8,
                        padding: 14,
                        background: 'white',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#134252' }}>
                          Condo Diligence Summary
                        </div>
                        <div style={{ fontSize: 11, color: '#627c71' }}>
                          Operational summary only — lawyer review required.
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#134252' }}>
                        <div>
                          <span style={{ fontWeight: 800, color: '#627c71', marginRight: 6 }}>Documents</span>
                          <span>
                            {condoOperationalSummary.documentCounts.received} received ·{' '}
                            {condoOperationalSummary.documentCounts.requested} requested ·{' '}
                            {condoOperationalSummary.documentCounts.outstanding} outstanding ·{' '}
                            {condoOperationalSummary.documentCounts.total} total
                          </span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 800, color: '#627c71', marginRight: 6 }}>Findings</span>
                          <span>{condoOperationalSummary.findingsLine}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#627c71' }}>Estoppel</span>
                          <span>{condoOperationalSummary.estoppelStatusLabel}</span>
                          {condoOperationalSummary.estoppelAttention && (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 800,
                                background: '#fff4d6',
                                color: '#b45309',
                                border: '1px solid rgba(240,180,41,0.35)',
                              }}
                            >
                              {condoOperationalSummary.estoppelAttention}
                            </span>
                          )}
                        </div>
                        <div>
                          <span style={{ fontWeight: 800, color: '#627c71', marginRight: 6 }}>Next</span>
                          <span>{condoOperationalSummary.nextAction}</span>
                        </div>
                      </div>
                      {(condoOperationalSummary.nextActionKind === 'request_outstanding' ||
                        condoOperationalSummary.nextActionKind === 'chase_estoppel' ||
                        condoOperationalSummary.nextActionKind === 'request_estoppel') && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                          {(condoOperationalSummary.nextActionKind === 'request_outstanding' ||
                            condoOperationalSummary.nextActionKind === 'request_estoppel') && (
                            <button
                              type="button"
                              onClick={() => {
                                document.getElementById('condo-request-missing-docs')?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'center',
                                })
                              }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(94,82,64,0.25)',
                                background: '#fff',
                                fontWeight: 800,
                                fontSize: 11,
                                color: '#134252',
                                cursor: 'pointer',
                              }}
                            >
                              Request missing docs
                            </button>
                          )}
                          {(condoOperationalSummary.nextActionKind === 'chase_estoppel' ||
                            condoOperationalSummary.nextActionKind === 'request_estoppel') && (
                            <button
                              type="button"
                              onClick={() => {
                                document.getElementById('condo-estoppel-review')?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'start',
                                })
                              }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(94,82,64,0.25)',
                                background: '#fff',
                                fontWeight: 800,
                                fontSize: 11,
                                color: '#134252',
                                cursor: 'pointer',
                              }}
                            >
                              Review Estoppel
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {condoInternalReport && (
                    <div
                      id="condo-internal-diligence-report"
                      style={{
                        border: '1px solid rgba(94,82,64,0.12)',
                        borderRadius: 8,
                        padding: 14,
                        background: 'white',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: '#134252' }}>
                            {condoInternalReport.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#627c71', marginTop: 4, lineHeight: 1.45, maxWidth: '40rem' }}>
                            {condoInternalReport.disclaimer}
                          </div>
                          <div style={{ fontSize: 11, color: '#627c71', marginTop: 4 }}>
                            {condoInternalReport.matterLabel} · Generated {condoInternalReport.generatedAtLabel} · Status:{' '}
                            {condoInternalReport.matterStatusLabel}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <button
                            type="button"
                            disabled={condoReportSaveStatus === 'saving'}
                            onClick={() => {
                              if (!condoInternalReport || !effectiveMatter) return
                              if (condoReportSaveLockRef.current || condoReportSaveStatus === 'saving') return
                              condoReportSaveLockRef.current = true
                              setCondoReportSaveStatus('saving')
                              const staffId = staff[0]?.id ?? ''
                              const draftInput = buildCondoDiligenceSummaryDraftDocumentInput({
                                matterId: effectiveMatter.id,
                                uploadedByStaffId: staffId,
                                report: condoInternalReport,
                              })
                              if (!draftInput) {
                                setCondoReportSaveStatus('failed')
                                condoReportSaveLockRef.current = false
                                window.setTimeout(() => setCondoReportSaveStatus('idle'), 2500)
                                return
                              }
                              const draftId = `doc-condo-summary-${Date.now()}`
                              addDemoDocument({ ...draftInput, id: draftId })
                              setCondoReportSavedDocId(draftId)
                              setCondoReportSaveStatus('saved')
                              window.setTimeout(() => {
                                setCondoReportSaveStatus('idle')
                                condoReportSaveLockRef.current = false
                              }, 2500)
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              border: '1px solid rgba(94,82,64,0.25)',
                              background: condoReportSaveStatus === 'saving' ? '#f0f0f0' : '#134252',
                              fontWeight: 800,
                              fontSize: 11,
                              color: condoReportSaveStatus === 'saving' ? '#627c71' : '#fff',
                              cursor: condoReportSaveStatus === 'saving' ? 'not-allowed' : 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {condoReportSaveStatus === 'saving'
                              ? 'Saving…'
                              : condoReportSaveStatus === 'saved'
                                ? 'Saved'
                                : condoReportSaveStatus === 'failed'
                                  ? 'Save failed'
                                  : 'Save as internal draft'}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(condoInternalReport.plainText)
                                setCondoReportCopyStatus('copied')
                                window.setTimeout(() => setCondoReportCopyStatus('idle'), 2000)
                              } catch {
                                setCondoReportCopyStatus('failed')
                                window.setTimeout(() => setCondoReportCopyStatus('idle'), 2500)
                              }
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              border: '1px solid rgba(94,82,64,0.25)',
                              background: '#fff',
                              fontWeight: 800,
                              fontSize: 11,
                              color: '#134252',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {condoReportCopyStatus === 'copied'
                              ? 'Copied'
                              : condoReportCopyStatus === 'failed'
                                ? 'Copy failed'
                                : 'Copy report'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
                              if (!printWindow) return
                              const escaped = condoInternalReport.plainText
                                .replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                              printWindow.document.write(
                                `<!doctype html><html><head><title>${condoInternalReport.title}</title><style>body{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;white-space:pre-wrap;padding:24px;color:#134252;line-height:1.45} h1{font-size:16px}</style></head><body><pre>${escaped}</pre></body></html>`,
                              )
                              printWindow.document.close()
                              printWindow.focus()
                              printWindow.print()
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              border: '1px solid rgba(94,82,64,0.25)',
                              background: '#fff',
                              fontWeight: 800,
                              fontSize: 11,
                              color: '#134252',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Print
                          </button>
                        </div>
                      </div>
                      {condoReportSaveStatus === 'saved' && (
                        <div
                          role="status"
                          style={{
                            marginBottom: 10,
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: '1px solid rgba(47,133,90,0.35)',
                            background: '#e8f5f0',
                            color: '#166534',
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          Internal draft saved to this matter’s Documents (not shared to the client portal).
                          {condoReportSavedDocId ? (
                            <>
                              {' '}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('Documents')
                                  setPreviewDocumentId(condoReportSavedDocId)
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  color: '#134252',
                                  fontWeight: 900,
                                  textDecoration: 'underline',
                                  cursor: 'pointer',
                                }}
                              >
                                View saved draft
                              </button>
                            </>
                          ) : null}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {condoInternalReport.sections.map((section) => (
                          <div key={section.title}>
                            <div style={{ fontSize: 12, fontWeight: 900, color: '#134252', marginBottom: 4 }}>
                              {section.title}
                            </div>
                            <ul
                              style={{
                                margin: 0,
                                paddingLeft: 18,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                              }}
                            >
                              {section.lines.map((line) => (
                                <li key={`${section.title}-${line}`} style={{ fontSize: 12, color: '#134252' }}>
                                  {line}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    id="condo-required-documents"
                    style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: 8, padding: 14, background: 'white' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#134252' }}>Required documents</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          id="condo-request-missing-docs"
                          type="button"
                          disabled={requestableCondoDocs.length === 0}
                          onClick={() => {
                            requestableCondoDocs.forEach((doc) => createCondoDocRequest(doc))
                          }}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            border: '1px solid rgba(94,82,64,0.25)',
                            background: requestableCondoDocs.length > 0 ? '#fff' : '#f0f0f0',
                            fontWeight: 800,
                            fontSize: 11,
                            color: '#134252',
                            cursor: requestableCondoDocs.length > 0 ? 'pointer' : 'not-allowed',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Request missing docs
                        </button>
                        <button
                          type="button"
                          disabled={!canSyncCondoChecklistFromLinks}
                          onClick={() => {
                            if (!condoLinkedSyncPreview) return
                            patchCondoDiligence(matterId, { requiredDocuments: condoLinkedSyncPreview })
                          }}
                          style={{
                            padding: '5px 10px',
                            borderRadius: 6,
                            border: '1px solid rgba(94,82,64,0.25)',
                            background: canSyncCondoChecklistFromLinks ? '#fff' : '#f0f0f0',
                            fontWeight: 800,
                            fontSize: 11,
                            color: '#134252',
                            cursor: canSyncCondoChecklistFromLinks ? 'pointer' : 'not-allowed',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Sync checklist from links
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#627c71', marginBottom: 10, lineHeight: 1.4 }}>
                      {
                        "Row badge reflects this matter's demo documents and open requests when titles match (read-only). Use the button to copy linked Received/Requested into the saved checklist; rows with no link stay as saved."
                      }
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {condoDiligence.requiredDocuments.map((doc) => {
                        const derived = deriveCondoRequiredDocumentStatus({
                          matterId: effectiveMatter.id,
                          condoDocId: doc.id,
                          storedStatus: doc.status,
                          documents: matterDocuments,
                          documentRequests: matterDocumentRequests,
                        })
                        const derivedPresent = condoRequiredDocDerivedStatusPresentation(derived)
                        const hasOpenMatchingRequest = hasOpenMatchingCondoRequest(doc.id)
                        const hasReceivedMatchingDoc = hasReceivedMatchingCondoDoc(doc.id)
                        const canRequestDoc =
                          derived === 'outstanding' &&
                          Boolean(requestedByStaffId) &&
                          !hasOpenMatchingRequest &&
                          !hasReceivedMatchingDoc
                        return (
                          <label
                            key={doc.id}
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: 10,
                              fontSize: 13,
                              color: '#134252',
                            }}
                          >
                            <span style={{ flex: '1 1 160px', fontWeight: 700 }}>{doc.label}</span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: derivedPresent.bg,
                                color: derivedPresent.color,
                                border: `1px solid ${derivedPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {derivedPresent.label}
                            </span>
                            <button
                              type="button"
                              disabled={!canRequestDoc}
                              onClick={() => {
                                createCondoDocRequest(doc)
                              }}
                              style={{
                                padding: '5px 8px',
                                borderRadius: 6,
                                border: '1px solid rgba(94,82,64,0.25)',
                                background: canRequestDoc ? '#fff' : '#f0f0f0',
                                color: '#134252',
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: canRequestDoc ? 'pointer' : 'not-allowed',
                              }}
                            >
                              Request
                            </button>
                            <select
                              title="Saved checklist value (demo); effective badge prefers documents and open requests."
                              aria-label={`Saved status for ${doc.label}`}
                              value={doc.status}
                              onChange={(e) => {
                                const status = e.target.value as DemoCondoDiligenceDocStatus
                                const requiredDocuments = condoDiligence.requiredDocuments.map((d) =>
                                  d.id === doc.id ? { ...d, status } : d,
                                )
                                patchCondoDiligence(matterId, { requiredDocuments })
                              }}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(94,82,64,0.25)',
                                fontWeight: 700,
                                color: '#134252',
                              }}
                            >
                              <option value="outstanding">Outstanding</option>
                              <option value="requested">Requested</option>
                              <option value="received">Received</option>
                            </select>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {(() => {
                    const estoppelReview = normalizeCondoEstoppelReview(condoDiligence.estoppelReview)
                    const estoppelStatusPresent = condoEstoppelReviewStatusPresentation(estoppelReview.reviewStatus)
                    const estoppelDueWarning = condoEstoppelDueDateWarning(estoppelReview.dueDate)
                    const estoppelLinkedDocuments = matterDocuments.filter((d) => {
                      if (d.deletedAt) return false
                      const haystack = [d.name, d.document_subtype ?? '', d.description ?? '', d.category]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase()
                      return condoRequiredDocMatchesLinkageHaystack(haystack, 'estoppel')
                    })
                    const estoppelLinkedRequests = matterDocumentRequests.filter((r) => {
                      const haystack = [r.title, r.description ?? '', r.category].filter(Boolean).join(' ').toLowerCase()
                      return condoRequiredDocMatchesLinkageHaystack(haystack, 'estoppel')
                    })
                    const patchEstoppel = (patch: Partial<DemoCondoEstoppelReview>) => {
                      patchCondoDiligence(matterId, {
                        estoppelReview: { ...estoppelReview, ...patch },
                      })
                    }
                    const fieldLabel: React.CSSProperties = {
                      display: 'block',
                      fontSize: 12,
                      color: '#627c71',
                      fontWeight: 800,
                      marginBottom: 4,
                    }
                    const fieldInput: React.CSSProperties = {
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid rgba(94,82,64,0.22)',
                      fontSize: 13,
                      color: '#134252',
                      boxSizing: 'border-box',
                    }
                    return (
                      <div
                        id="condo-estoppel-review"
                        style={{
                          border: '1px solid rgba(94,82,64,0.12)',
                          borderRadius: 8,
                          padding: 14,
                          background: 'white',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#134252' }}>Estoppel Review</div>
                            <div style={{ fontSize: 11, color: '#627c71', marginTop: 4, lineHeight: 1.45, maxWidth: '36rem' }}>
                              Structured practice notes for the Estoppel checklist item. Does not replace document requests,
                              linkage badges, or saved checklist status.
                            </div>
                          </div>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '5px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 900,
                              background: estoppelStatusPresent.bg,
                              color: estoppelStatusPresent.color,
                              border: `1px solid ${estoppelStatusPresent.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {estoppelStatusPresent.label}
                          </span>
                        </div>

                        {estoppelDueWarning && (
                          <div
                            role="status"
                            style={{
                              padding: '8px 10px',
                              borderRadius: 8,
                              border:
                                estoppelDueWarning.kind === 'overdue'
                                  ? '1px solid rgba(185,28,28,0.35)'
                                  : '1px solid rgba(240,180,41,0.45)',
                              background: estoppelDueWarning.kind === 'overdue' ? '#fee2e2' : '#fff8e6',
                              color: estoppelDueWarning.kind === 'overdue' ? '#7f1d1d' : '#b45309',
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            Due-date attention: {estoppelDueWarning.label}
                            {estoppelReview.dueDate ? ` (${estoppelReview.dueDate})` : ''}. Demo reminder only — not a legal
                            deadline determination.
                          </div>
                        )}

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: 10,
                          }}
                        >
                          <label>
                            <span style={fieldLabel}>Request date</span>
                            <input
                              type="date"
                              value={estoppelReview.requestDate}
                              onChange={(e) => patchEstoppel({ requestDate: e.target.value })}
                              style={fieldInput}
                            />
                          </label>
                          <label>
                            <span style={fieldLabel}>Due date</span>
                            <input
                              type="date"
                              value={estoppelReview.dueDate}
                              onChange={(e) => patchEstoppel({ dueDate: e.target.value })}
                              style={fieldInput}
                            />
                          </label>
                          <label>
                            <span style={fieldLabel}>Received date</span>
                            <input
                              type="date"
                              value={estoppelReview.receivedDate}
                              onChange={(e) => patchEstoppel({ receivedDate: e.target.value })}
                              style={fieldInput}
                            />
                          </label>
                          <label>
                            <span style={fieldLabel}>Amount due</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step="0.01"
                              value={estoppelReview.amountDue ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value.trim()
                                if (!raw) {
                                  patchEstoppel({ amountDue: null })
                                  return
                                }
                                const n = Number(raw)
                                if (Number.isFinite(n)) patchEstoppel({ amountDue: n })
                              }}
                              placeholder="Optional"
                              style={fieldInput}
                            />
                          </label>
                          <label>
                            <span style={fieldLabel}>Regular assessment amount</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step="0.01"
                              value={estoppelReview.regularAssessmentAmount ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value.trim()
                                if (!raw) {
                                  patchEstoppel({ regularAssessmentAmount: null })
                                  return
                                }
                                const n = Number(raw)
                                if (Number.isFinite(n)) patchEstoppel({ regularAssessmentAmount: n })
                              }}
                              placeholder="Optional"
                              style={fieldInput}
                            />
                          </label>
                          <label>
                            <span style={fieldLabel}>Special assessment</span>
                            <select
                              value={estoppelReview.specialAssessmentStatus}
                              onChange={(e) =>
                                patchEstoppel({
                                  specialAssessmentStatus: e.target.value as DemoCondoEstoppelSpecialAssessmentStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="none">None disclosed</option>
                              <option value="disclosed">Disclosed</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Violations / liens</span>
                            <select
                              value={estoppelReview.violationOrLienStatus}
                              onChange={(e) =>
                                patchEstoppel({
                                  violationOrLienStatus: e.target.value as DemoCondoEstoppelViolationOrLienStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="none">None disclosed</option>
                              <option value="disclosed">Disclosed</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Review status</span>
                            <select
                              value={estoppelReview.reviewStatus}
                              onChange={(e) =>
                                patchEstoppel({
                                  reviewStatus: e.target.value as DemoCondoEstoppelReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="not_started">Not started</option>
                              <option value="requested">Requested</option>
                              <option value="received">Received</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="issue_found">Issue found</option>
                            </select>
                          </label>
                        </div>

                        <label style={{ display: 'block' }}>
                          <span style={fieldLabel}>Estoppel notes</span>
                          <textarea
                            value={estoppelReview.notes}
                            onChange={(e) => patchEstoppel({ notes: e.target.value })}
                            rows={3}
                            placeholder="Internal estoppel review notes (demo)"
                            style={{ ...fieldInput, resize: 'vertical' }}
                          />
                        </label>

                        <div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#134252', marginBottom: 6 }}>
                            Linked Estoppel documents &amp; requests
                          </div>
                          <div style={{ fontSize: 11, color: '#627c71', marginBottom: 8, lineHeight: 1.4 }}>
                            Read-only matches from this matter using the same Estoppel checklist linkage rules.
                          </div>
                          {estoppelLinkedDocuments.length === 0 && estoppelLinkedRequests.length === 0 ? (
                            <div style={{ fontSize: 13, color: '#627c71' }}>
                              No matching Estoppel documents or requests linked yet.
                            </div>
                          ) : (
                            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {estoppelLinkedDocuments.map((d) => (
                                <li key={d.id} style={{ fontSize: 13, color: '#134252' }}>
                                  <strong>Document:</strong> {d.name}
                                  {d.document_subtype ? ` · ${d.document_subtype}` : ''}
                                </li>
                              ))}
                              {estoppelLinkedRequests.map((r) => (
                                <li key={r.id} style={{ fontSize: 13, color: '#134252' }}>
                                  <strong>Request ({r.status}):</strong> {r.title}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {(() => {
                    const sirsReview = normalizeCondoSirsMilestoneReview(condoDiligence.sirsMilestoneReview)
                    const applicabilityPresent = condoSirsApplicabilityPresentation(sirsReview.applicability)
                    const documentStatusPresent = condoSirsDocumentStatusPresentation(sirsReview.documentStatus)
                    const resultPresent = condoSirsResultPresentation(sirsReview.result)
                    const reserveRiskPresent = condoSirsRiskLevelPresentation(sirsReview.reserveRiskLevel)
                    const structuralRiskPresent = condoSirsRiskLevelPresentation(sirsReview.structuralRiskLevel)
                    const sirsLinkedDocuments = matterDocuments.filter((d) => {
                      if (d.deletedAt) return false
                      const haystack = [d.name, d.document_subtype ?? '', d.description ?? '', d.category]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase()
                      return (
                        condoRequiredDocMatchesLinkageHaystack(haystack, 'milestone_inspection_summary') ||
                        condoRequiredDocMatchesLinkageHaystack(haystack, 'sirs_reserve_study')
                      )
                    })
                    const sirsLinkedRequests = matterDocumentRequests.filter((r) => {
                      const haystack = [r.title, r.description ?? '', r.category].filter(Boolean).join(' ').toLowerCase()
                      return (
                        condoRequiredDocMatchesLinkageHaystack(haystack, 'milestone_inspection_summary') ||
                        condoRequiredDocMatchesLinkageHaystack(haystack, 'sirs_reserve_study')
                      )
                    })
                    const patchSirs = (patch: Partial<DemoCondoSirsMilestoneReview>) => {
                      patchCondoDiligence(matterId, {
                        sirsMilestoneReview: { ...sirsReview, ...patch },
                      })
                    }
                    const fieldLabel: React.CSSProperties = {
                      display: 'block',
                      fontSize: 12,
                      color: '#627c71',
                      fontWeight: 800,
                      marginBottom: 4,
                    }
                    const fieldInput: React.CSSProperties = {
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid rgba(94,82,64,0.22)',
                      fontSize: 13,
                      color: '#134252',
                      boxSizing: 'border-box',
                    }
                    return (
                      <div
                        id="condo-sirs-milestone-review"
                        style={{
                          border: '1px solid rgba(94,82,64,0.12)',
                          borderRadius: 8,
                          padding: 14,
                          background: 'white',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#134252' }}>
                              SIRS / Milestone Review
                            </div>
                            <div style={{ fontSize: 11, color: '#627c71', marginTop: 4, lineHeight: 1.45, maxWidth: '36rem' }}>
                              Structured practice notes for Milestone inspection and SIRS / reserve study checklist items.
                              Lawyer operational review only — not a structural-engineering or statutory compliance
                              determination.
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: applicabilityPresent.bg,
                                color: applicabilityPresent.color,
                                border: `1px solid ${applicabilityPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {applicabilityPresent.label}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: documentStatusPresent.bg,
                                color: documentStatusPresent.color,
                                border: `1px solid ${documentStatusPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {documentStatusPresent.label}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: resultPresent.bg,
                                color: resultPresent.color,
                                border: `1px solid ${resultPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {resultPresent.label}
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: 10,
                          }}
                        >
                          <label>
                            <span style={fieldLabel}>Applicability</span>
                            <select
                              value={sirsReview.applicability}
                              onChange={(e) =>
                                patchSirs({ applicability: e.target.value as DemoCondoSirsApplicability })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="applicable">Applicable</option>
                              <option value="not_applicable">Not applicable</option>
                              <option value="needs_confirmation">Needs confirmation</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Document status</span>
                            <select
                              value={sirsReview.documentStatus}
                              onChange={(e) =>
                                patchSirs({ documentStatus: e.target.value as DemoCondoSirsDocumentStatus })
                              }
                              style={fieldInput}
                            >
                              <option value="not_started">Not started</option>
                              <option value="outstanding">Outstanding</option>
                              <option value="requested">Requested</option>
                              <option value="received">Received</option>
                              <option value="reviewed">Reviewed</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Completion date</span>
                            <input
                              type="date"
                              value={sirsReview.completionDate}
                              onChange={(e) => patchSirs({ completionDate: e.target.value })}
                              style={fieldInput}
                            />
                          </label>
                          <label>
                            <span style={fieldLabel}>Result</span>
                            <select
                              value={sirsReview.result}
                              onChange={(e) => patchSirs({ result: e.target.value as DemoCondoSirsResult })}
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="pass">Pass</option>
                              <option value="pass_with_findings">Pass with findings</option>
                              <option value="fail">Fail</option>
                              <option value="incomplete">Incomplete</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Reserve-risk level</span>
                            <select
                              value={sirsReview.reserveRiskLevel}
                              onChange={(e) =>
                                patchSirs({ reserveRiskLevel: e.target.value as DemoCondoSirsRiskLevel })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="low">Low</option>
                              <option value="moderate">Moderate</option>
                              <option value="elevated">Elevated</option>
                              <option value="high">High</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Structural-risk level</span>
                            <select
                              value={sirsReview.structuralRiskLevel}
                              onChange={(e) =>
                                patchSirs({ structuralRiskLevel: e.target.value as DemoCondoSirsRiskLevel })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="low">Low</option>
                              <option value="moderate">Moderate</option>
                              <option value="elevated">Elevated</option>
                              <option value="high">High</option>
                            </select>
                          </label>
                        </div>

                        {(sirsReview.reserveRiskLevel === 'elevated' ||
                          sirsReview.reserveRiskLevel === 'high' ||
                          sirsReview.structuralRiskLevel === 'elevated' ||
                          sirsReview.structuralRiskLevel === 'high' ||
                          sirsReview.result === 'fail' ||
                          sirsReview.result === 'pass_with_findings') && (
                          <div
                            role="status"
                            style={{
                              padding: '8px 10px',
                              borderRadius: 8,
                              border: '1px solid rgba(240,180,41,0.45)',
                              background: '#fff8e6',
                              color: '#b45309',
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            Attention: elevated SIRS / Milestone signals recorded. Confirm lawyer findings and linked
                            documents before treating this as cleared. Demo reminder only — not an engineering opinion.
                            <span style={{ marginLeft: 8 }}>
                              Reserve: {reserveRiskPresent.label} · Structural: {structuralRiskPresent.label}
                            </span>
                          </div>
                        )}

                        <label style={{ display: 'block' }}>
                          <span style={fieldLabel}>Lawyer notes</span>
                          <textarea
                            value={sirsReview.notes}
                            onChange={(e) => patchSirs({ notes: e.target.value })}
                            rows={3}
                            placeholder="Internal SIRS / Milestone review notes (demo)"
                            style={{ ...fieldInput, resize: 'vertical' }}
                          />
                        </label>

                        <div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#134252', marginBottom: 6 }}>
                            Linked Milestone / SIRS documents &amp; requests
                          </div>
                          <div style={{ fontSize: 11, color: '#627c71', marginBottom: 8, lineHeight: 1.4 }}>
                            Read-only matches from this matter using the Milestone inspection and SIRS / reserve study
                            checklist linkage rules.
                          </div>
                          {sirsLinkedDocuments.length === 0 && sirsLinkedRequests.length === 0 ? (
                            <div style={{ fontSize: 13, color: '#627c71' }}>
                              No matching Milestone or SIRS documents or requests linked yet.
                            </div>
                          ) : (
                            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {sirsLinkedDocuments.map((d) => (
                                <li key={d.id} style={{ fontSize: 13, color: '#134252' }}>
                                  <strong>Document:</strong> {d.name}
                                  {d.document_subtype ? ` · ${d.document_subtype}` : ''}
                                </li>
                              ))}
                              {sirsLinkedRequests.map((r) => (
                                <li key={r.id} style={{ fontSize: 13, color: '#134252' }}>
                                  <strong>Request ({r.status}):</strong> {r.title}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {(() => {
                    const financialReview = normalizeCondoAssociationFinancialReview(
                      condoDiligence.associationFinancialReview,
                    )
                    const budgetStatusPresent = condoFinancialDocReviewStatusPresentation(
                      financialReview.budgetReviewStatus,
                    )
                    const statementsStatusPresent = condoFinancialDocReviewStatusPresentation(
                      financialReview.financialStatementsReviewStatus,
                    )
                    const reserveScheduleStatusPresent = condoFinancialDocReviewStatusPresentation(
                      financialReview.reserveScheduleReviewStatus,
                    )
                    const riskPresent = condoFinancialRiskLevelPresentation(financialReview.financialRiskLevel)
                    const financialDocIds = [
                      'current_budget',
                      'association_financial_statements',
                      'reserve_schedule_funding_detail',
                      'special_assessment_notice_schedule',
                    ] as const
                    const financialLinkedDocuments = matterDocuments.filter((d) => {
                      if (d.deletedAt) return false
                      const haystack = [d.name, d.document_subtype ?? '', d.description ?? '', d.category]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase()
                      return financialDocIds.some((id) => condoRequiredDocMatchesLinkageHaystack(haystack, id))
                    })
                    const financialLinkedRequests = matterDocumentRequests.filter((r) => {
                      const haystack = [r.title, r.description ?? '', r.category].filter(Boolean).join(' ').toLowerCase()
                      return financialDocIds.some((id) => condoRequiredDocMatchesLinkageHaystack(haystack, id))
                    })
                    const patchFinancial = (patch: Partial<DemoCondoAssociationFinancialReview>) => {
                      patchCondoDiligence(matterId, {
                        associationFinancialReview: { ...financialReview, ...patch },
                      })
                    }
                    const parseOptionalAmount = (raw: string): number | null | undefined => {
                      const trimmed = raw.trim()
                      if (!trimmed) return null
                      const n = Number(trimmed)
                      return Number.isFinite(n) ? n : undefined
                    }
                    const fieldLabel: React.CSSProperties = {
                      display: 'block',
                      fontSize: 12,
                      color: '#627c71',
                      fontWeight: 800,
                      marginBottom: 4,
                    }
                    const fieldInput: React.CSSProperties = {
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid rgba(94,82,64,0.22)',
                      fontSize: 13,
                      color: '#134252',
                      boxSizing: 'border-box',
                    }
                    const docReviewOptions = (
                      <>
                        <option value="not_started">Not started</option>
                        <option value="requested">Requested</option>
                        <option value="received">Received</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="issue_found">Issue found</option>
                      </>
                    )
                    const showFinancialAttention =
                      financialReview.financialRiskLevel === 'medium' ||
                      financialReview.financialRiskLevel === 'high' ||
                      financialReview.delinquencyConcern === 'material' ||
                      financialReview.reserveFundingStatus === 'material_shortfall' ||
                      financialReview.budgetReviewStatus === 'issue_found' ||
                      financialReview.financialStatementsReviewStatus === 'issue_found' ||
                      financialReview.reserveScheduleReviewStatus === 'issue_found' ||
                      financialReview.specialAssessmentStatus === 'active' ||
                      financialReview.specialAssessmentStatus === 'proposed_or_pending'

                    return (
                      <div
                        id="condo-association-financial-review"
                        style={{
                          border: '1px solid rgba(94,82,64,0.12)',
                          borderRadius: 8,
                          padding: 14,
                          background: 'white',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#134252' }}>
                              Association Financial Review
                            </div>
                            <div style={{ fontSize: 11, color: '#627c71', marginTop: 4, lineHeight: 1.45, maxWidth: '36rem' }}>
                              Structured practice notes for association budget, financial statements, reserves, and
                              assessments. Complements checklist rows — does not replace document requests, linkage, or
                              sync. Not an affordability, solvency, or closing-readiness determination.
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: budgetStatusPresent.bg,
                                color: budgetStatusPresent.color,
                                border: `1px solid ${budgetStatusPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Budget: {budgetStatusPresent.label}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: statementsStatusPresent.bg,
                                color: statementsStatusPresent.color,
                                border: `1px solid ${statementsStatusPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Statements: {statementsStatusPresent.label}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: riskPresent.bg,
                                color: riskPresent.color,
                                border: `1px solid ${riskPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Risk: {riskPresent.label}
                            </span>
                          </div>
                        </div>

                        {showFinancialAttention && (
                          <div
                            role="status"
                            style={{
                              padding: '8px 10px',
                              borderRadius: 8,
                              border: '1px solid rgba(240,180,41,0.45)',
                              background: '#fff8e6',
                              color: '#b45309',
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            Attention: material association financial signals recorded. Confirm linked documents and
                            lawyer notes before treating finances as cleared. Demo reminder only — not a solvency or
                            closing opinion. Reserve schedule review: {reserveScheduleStatusPresent.label}.
                          </div>
                        )}

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: 10,
                          }}
                        >
                          <label>
                            <span style={fieldLabel}>Budget review</span>
                            <select
                              value={financialReview.budgetReviewStatus}
                              onChange={(e) =>
                                patchFinancial({
                                  budgetReviewStatus: e.target.value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Financial statements review</span>
                            <select
                              value={financialReview.financialStatementsReviewStatus}
                              onChange={(e) =>
                                patchFinancial({
                                  financialStatementsReviewStatus: e.target
                                    .value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Reserve schedule review</span>
                            <select
                              value={financialReview.reserveScheduleReviewStatus}
                              onChange={(e) =>
                                patchFinancial({
                                  reserveScheduleReviewStatus: e.target.value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Dues amount</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step="0.01"
                              value={financialReview.duesAmount ?? ''}
                              onChange={(e) => {
                                const parsed = parseOptionalAmount(e.target.value)
                                if (parsed !== undefined) patchFinancial({ duesAmount: parsed })
                              }}
                              placeholder="Optional"
                              style={fieldInput}
                            />
                          </label>
                          <label>
                            <span style={fieldLabel}>Dues frequency</span>
                            <select
                              value={financialReview.duesFrequency}
                              onChange={(e) =>
                                patchFinancial({ duesFrequency: e.target.value as DemoCondoDuesFrequency })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                              <option value="annual">Annual</option>
                              <option value="other">Other</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Special assessment status</span>
                            <select
                              value={financialReview.specialAssessmentStatus}
                              onChange={(e) =>
                                patchFinancial({
                                  specialAssessmentStatus: e.target
                                    .value as DemoCondoAssociationSpecialAssessmentStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="none_disclosed">None disclosed</option>
                              <option value="proposed_or_pending">Proposed or pending</option>
                              <option value="active">Active</option>
                              <option value="paid_or_resolved">Paid or resolved</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Special assessment amount</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step="0.01"
                              value={financialReview.specialAssessmentAmount ?? ''}
                              onChange={(e) => {
                                const parsed = parseOptionalAmount(e.target.value)
                                if (parsed !== undefined) patchFinancial({ specialAssessmentAmount: parsed })
                              }}
                              placeholder="Optional"
                              style={fieldInput}
                            />
                          </label>
                          <label>
                            <span style={fieldLabel}>Association loan / LOC</span>
                            <select
                              value={financialReview.associationLoanOrLineOfCreditStatus}
                              onChange={(e) =>
                                patchFinancial({
                                  associationLoanOrLineOfCreditStatus: e.target
                                    .value as DemoCondoAssociationLoanStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="none_disclosed">None disclosed</option>
                              <option value="disclosed">Disclosed</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Delinquency concern</span>
                            <select
                              value={financialReview.delinquencyConcern}
                              onChange={(e) =>
                                patchFinancial({
                                  delinquencyConcern: e.target.value as DemoCondoDelinquencyConcern,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="none_noted">None noted</option>
                              <option value="possible">Possible</option>
                              <option value="material">Material</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Reserve funding status</span>
                            <select
                              value={financialReview.reserveFundingStatus}
                              onChange={(e) =>
                                patchFinancial({
                                  reserveFundingStatus: e.target.value as DemoCondoReserveFundingStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="appears_adequate">Appears adequate</option>
                              <option value="possible_shortfall">Possible shortfall</option>
                              <option value="material_shortfall">Material shortfall</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Financial risk level</span>
                            <select
                              value={financialReview.financialRiskLevel}
                              onChange={(e) =>
                                patchFinancial({
                                  financialRiskLevel: e.target.value as DemoCondoFinancialRiskLevel,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="none">None noted</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </label>
                        </div>

                        <label style={{ display: 'block' }}>
                          <span style={fieldLabel}>Lawyer notes</span>
                          <textarea
                            value={financialReview.notes}
                            onChange={(e) => patchFinancial({ notes: e.target.value })}
                            rows={3}
                            placeholder="Internal association financial review notes (demo)"
                            style={{ ...fieldInput, resize: 'vertical' }}
                          />
                        </label>

                        <div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#134252', marginBottom: 6 }}>
                            Linked association financial documents &amp; requests
                          </div>
                          <div style={{ fontSize: 11, color: '#627c71', marginBottom: 8, lineHeight: 1.4 }}>
                            Read-only matches for current budget, association financial statements, reserve schedule /
                            funding detail, and special assessment notice / schedule.
                          </div>
                          {financialLinkedDocuments.length === 0 && financialLinkedRequests.length === 0 ? (
                            <div style={{ fontSize: 13, color: '#627c71' }}>
                              No matching association financial documents or requests linked yet.
                            </div>
                          ) : (
                            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {financialLinkedDocuments.map((d) => (
                                <li key={d.id} style={{ fontSize: 13, color: '#134252' }}>
                                  <strong>Document:</strong> {d.name}
                                  {d.document_subtype ? ` · ${d.document_subtype}` : ''}
                                </li>
                              ))}
                              {financialLinkedRequests.map((r) => (
                                <li key={r.id} style={{ fontSize: 13, color: '#134252' }}>
                                  <strong>Request ({r.status}):</strong> {r.title}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {(() => {
                    const governanceReview = normalizeCondoAssociationRecordsGovernanceReview(
                      condoDiligence.associationRecordsGovernanceReview,
                    )
                    const governingPresent = condoFinancialDocReviewStatusPresentation(
                      governanceReview.governingDocumentsReviewStatus,
                    )
                    const insuranceConcernPresent = condoGovernanceConcernLevelPresentation(
                      governanceReview.insuranceConcernLevel,
                    )
                    const governanceConcernPresent = condoGovernanceConcernLevelPresentation(
                      governanceReview.governanceConcernLevel,
                    )
                    const governanceDocIds = [
                      'declaration_bylaws_rules_amendments',
                      'insurance_summary',
                      'recent_board_minutes',
                      'association_approval_leasing_restrictions',
                      'litigation_claims_arbitration_dbpr',
                      'management_association_contacts',
                    ] as const
                    const governanceLinkedDocuments = matterDocuments.filter((d) => {
                      if (d.deletedAt) return false
                      const haystack = [d.name, d.document_subtype ?? '', d.description ?? '', d.category]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase()
                      return governanceDocIds.some((id) => condoRequiredDocMatchesLinkageHaystack(haystack, id))
                    })
                    const governanceLinkedRequests = matterDocumentRequests.filter((r) => {
                      const haystack = [r.title, r.description ?? '', r.category].filter(Boolean).join(' ').toLowerCase()
                      return governanceDocIds.some((id) => condoRequiredDocMatchesLinkageHaystack(haystack, id))
                    })
                    const patchGovernance = (patch: Partial<DemoCondoAssociationRecordsGovernanceReview>) => {
                      patchCondoDiligence(matterId, {
                        associationRecordsGovernanceReview: { ...governanceReview, ...patch },
                      })
                    }
                    const fieldLabel: React.CSSProperties = {
                      display: 'block',
                      fontSize: 12,
                      color: '#627c71',
                      fontWeight: 800,
                      marginBottom: 4,
                    }
                    const fieldInput: React.CSSProperties = {
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid rgba(94,82,64,0.22)',
                      fontSize: 13,
                      color: '#134252',
                      boxSizing: 'border-box',
                    }
                    const docReviewOptions = (
                      <>
                        <option value="not_started">Not started</option>
                        <option value="requested">Requested</option>
                        <option value="received">Received</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="issue_found">Issue found</option>
                      </>
                    )
                    const concernOptions = (
                      <>
                        <option value="unknown">Unknown</option>
                        <option value="none">None noted</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </>
                    )
                    const showGovernanceAttention =
                      governanceReview.governanceConcernLevel === 'medium' ||
                      governanceReview.governanceConcernLevel === 'high' ||
                      governanceReview.insuranceConcernLevel === 'medium' ||
                      governanceReview.insuranceConcernLevel === 'high' ||
                      governanceReview.governingDocumentsReviewStatus === 'issue_found' ||
                      governanceReview.restrictionsReviewStatus === 'issue_found' ||
                      governanceReview.insuranceReviewStatus === 'issue_found' ||
                      governanceReview.boardMinutesReviewStatus === 'issue_found' ||
                      governanceReview.rentalRestrictionStatus === 'lawyer_review_required' ||
                      governanceReview.buyerApprovalStatus === 'lawyer_review_required' ||
                      governanceReview.litigationOrDbprStatus === 'lawyer_review_required' ||
                      governanceReview.recordsAccessStatus === 'lawyer_review_required' ||
                      governanceReview.recordsAccessStatus === 'not_provided'

                    return (
                      <div
                        id="condo-association-records-governance-review"
                        style={{
                          border: '1px solid rgba(94,82,64,0.12)',
                          borderRadius: 8,
                          padding: 14,
                          background: 'white',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#134252' }}>
                              Association Records &amp; Governance Review
                            </div>
                            <div style={{ fontSize: 11, color: '#627c71', marginTop: 4, lineHeight: 1.45, maxWidth: '36rem' }}>
                              Structured practice notes for governing documents, restrictions, insurance, minutes,
                              litigation/DBPR, records access, and management contacts. Complements checklist rows —
                              does not replace requests, linkage, or sync. Not a statutory-compliance or closing
                              determination.
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: governingPresent.bg,
                                color: governingPresent.color,
                                border: `1px solid ${governingPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Docs: {governingPresent.label}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: insuranceConcernPresent.bg,
                                color: insuranceConcernPresent.color,
                                border: `1px solid ${insuranceConcernPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Insurance: {insuranceConcernPresent.label}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: governanceConcernPresent.bg,
                                color: governanceConcernPresent.color,
                                border: `1px solid ${governanceConcernPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Governance: {governanceConcernPresent.label}
                            </span>
                          </div>
                        </div>

                        {showGovernanceAttention && (
                          <div
                            role="status"
                            style={{
                              padding: '8px 10px',
                              borderRadius: 8,
                              border: '1px solid rgba(240,180,41,0.45)',
                              background: '#fff8e6',
                              color: '#b45309',
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            Attention: governance, insurance, restrictions, litigation/DBPR, or records-access signals
                            need lawyer follow-up. Confirm linked documents and notes before treating records as
                            cleared. Demo reminder only — not a legal compliance opinion.
                          </div>
                        )}

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: 10,
                          }}
                        >
                          <label>
                            <span style={fieldLabel}>Governing documents review</span>
                            <select
                              value={governanceReview.governingDocumentsReviewStatus}
                              onChange={(e) =>
                                patchGovernance({
                                  governingDocumentsReviewStatus: e.target.value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Restrictions review</span>
                            <select
                              value={governanceReview.restrictionsReviewStatus}
                              onChange={(e) =>
                                patchGovernance({
                                  restrictionsReviewStatus: e.target.value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Insurance review</span>
                            <select
                              value={governanceReview.insuranceReviewStatus}
                              onChange={(e) =>
                                patchGovernance({
                                  insuranceReviewStatus: e.target.value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Board minutes review</span>
                            <select
                              value={governanceReview.boardMinutesReviewStatus}
                              onChange={(e) =>
                                patchGovernance({
                                  boardMinutesReviewStatus: e.target.value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Rental restriction status</span>
                            <select
                              value={governanceReview.rentalRestrictionStatus}
                              onChange={(e) =>
                                patchGovernance({
                                  rentalRestrictionStatus: e.target.value as DemoCondoRentalRestrictionStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="no_material_restriction_noted">No material restriction noted</option>
                              <option value="restriction_noted">Restriction noted</option>
                              <option value="lawyer_review_required">Lawyer review required</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Buyer approval status</span>
                            <select
                              value={governanceReview.buyerApprovalStatus}
                              onChange={(e) =>
                                patchGovernance({
                                  buyerApprovalStatus: e.target.value as DemoCondoBuyerApprovalStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="not_required_noted">Not required noted</option>
                              <option value="required">Required</option>
                              <option value="lawyer_review_required">Lawyer review required</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Insurance concern level</span>
                            <select
                              value={governanceReview.insuranceConcernLevel}
                              onChange={(e) =>
                                patchGovernance({
                                  insuranceConcernLevel: e.target.value as DemoCondoGovernanceConcernLevel,
                                })
                              }
                              style={fieldInput}
                            >
                              {concernOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Litigation / DBPR status</span>
                            <select
                              value={governanceReview.litigationOrDbprStatus}
                              onChange={(e) =>
                                patchGovernance({
                                  litigationOrDbprStatus: e.target.value as DemoCondoLitigationOrDbprStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="none_disclosed">None disclosed</option>
                              <option value="disclosed">Disclosed</option>
                              <option value="lawyer_review_required">Lawyer review required</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Records access status</span>
                            <select
                              value={governanceReview.recordsAccessStatus}
                              onChange={(e) =>
                                patchGovernance({
                                  recordsAccessStatus: e.target.value as DemoCondoRecordsAccessStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="available">Available</option>
                              <option value="partial_or_incomplete">Partial or incomplete</option>
                              <option value="not_provided">Not provided</option>
                              <option value="lawyer_review_required">Lawyer review required</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Governance concern level</span>
                            <select
                              value={governanceReview.governanceConcernLevel}
                              onChange={(e) =>
                                patchGovernance({
                                  governanceConcernLevel: e.target.value as DemoCondoGovernanceConcernLevel,
                                })
                              }
                              style={fieldInput}
                            >
                              {concernOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Management contact name</span>
                            <input
                              type="text"
                              value={governanceReview.managementContactName}
                              onChange={(e) => patchGovernance({ managementContactName: e.target.value })}
                              placeholder="Optional"
                              style={fieldInput}
                            />
                          </label>
                          <label>
                            <span style={fieldLabel}>Management contact email</span>
                            <input
                              type="email"
                              value={governanceReview.managementContactEmail}
                              onChange={(e) => patchGovernance({ managementContactEmail: e.target.value })}
                              placeholder="Optional"
                              style={fieldInput}
                            />
                          </label>
                          <label>
                            <span style={fieldLabel}>Management contact phone</span>
                            <input
                              type="tel"
                              value={governanceReview.managementContactPhone}
                              onChange={(e) => patchGovernance({ managementContactPhone: e.target.value })}
                              placeholder="Optional"
                              style={fieldInput}
                            />
                          </label>
                        </div>

                        <label style={{ display: 'block' }}>
                          <span style={fieldLabel}>Lawyer notes</span>
                          <textarea
                            value={governanceReview.notes}
                            onChange={(e) => patchGovernance({ notes: e.target.value })}
                            rows={3}
                            placeholder="Internal association records & governance review notes (demo)"
                            style={{ ...fieldInput, resize: 'vertical' }}
                          />
                        </label>

                        <div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#134252', marginBottom: 6 }}>
                            Linked association records &amp; governance documents &amp; requests
                          </div>
                          <div style={{ fontSize: 11, color: '#627c71', marginBottom: 8, lineHeight: 1.4 }}>
                            Read-only matches for declaration/bylaws, insurance, board minutes, approval/leasing
                            restrictions, litigation/DBPR, and management contacts.
                          </div>
                          {governanceLinkedDocuments.length === 0 && governanceLinkedRequests.length === 0 ? (
                            <div style={{ fontSize: 13, color: '#627c71' }}>
                              No matching association records or governance documents or requests linked yet.
                            </div>
                          ) : (
                            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {governanceLinkedDocuments.map((d) => (
                                <li key={d.id} style={{ fontSize: 13, color: '#134252' }}>
                                  <strong>Document:</strong> {d.name}
                                  {d.document_subtype ? ` · ${d.document_subtype}` : ''}
                                </li>
                              ))}
                              {governanceLinkedRequests.map((r) => (
                                <li key={r.id} style={{ fontSize: 13, color: '#134252' }}>
                                  <strong>Request ({r.status}):</strong> {r.title}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: 8, padding: 14, background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#134252' }}>Findings</div>
                      <button
                        type="button"
                        onClick={() => {
                          const id = `finding-${Date.now()}`
                          patchCondoDiligence(matterId, {
                            findings: [...condoDiligence.findings, { id, text: '' }],
                          })
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid rgba(94,82,64,0.25)',
                          background: '#fff',
                          fontWeight: 800,
                          fontSize: 12,
                          color: '#134252',
                          cursor: 'pointer',
                        }}
                      >
                        Add finding
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                      {CONDO_FINDING_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => {
                            const id = `finding-${Date.now()}-${template.id}`
                            patchCondoDiligence(matterId, {
                              findings: [...condoDiligence.findings, { id, text: template.text }],
                            })
                          }}
                          style={{
                            padding: '5px 8px',
                            borderRadius: 6,
                            border: '1px solid rgba(94,82,64,0.25)',
                            background: '#fff',
                            fontWeight: 800,
                            fontSize: 11,
                            color: '#134252',
                            cursor: 'pointer',
                          }}
                        >
                          + {template.label}
                        </button>
                      ))}
                    </div>
                    {condoDiligence.findings.length === 0 ? (
                      <div style={{ fontSize: 13, color: '#627c71' }}>No findings yet. Add a line when something material shows up in diligence.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {condoDiligence.findings.map((f) => (
                          <textarea
                            key={f.id}
                            value={f.text}
                            onChange={(e) => {
                              const text = e.target.value
                              const findings = condoDiligence.findings.map((x) => (x.id === f.id ? { ...x, text } : x))
                              patchCondoDiligence(matterId, { findings })
                            }}
                            rows={2}
                            placeholder="Finding (demo)"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 6,
                              border: '1px solid rgba(94,82,64,0.22)',
                              fontSize: 13,
                              resize: 'vertical',
                              boxSizing: 'border-box',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <label style={{ display: 'block', fontSize: 13, fontWeight: 900, color: '#134252' }}>
                    Notes
                    <textarea
                      value={condoDiligence.notes}
                      onChange={(e) => patchCondoDiligence(matterId, { notes: e.target.value })}
                      rows={4}
                      placeholder="Internal notes (demo)"
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 6,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(94,82,64,0.22)',
                        fontSize: 13,
                        resize: 'vertical',
                        boxSizing: 'border-box',
                      }}
                    />
                  </label>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#627c71', fontWeight: 700 }}>Matter status (diligence)</span>
                    <select
                      value={condoDiligence.status}
                      onChange={(e) =>
                        patchCondoDiligence(matterId, {
                          status: e.target.value as DemoCondoDiligenceMatterStatus,
                        })
                      }
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(94,82,64,0.25)',
                        fontWeight: 700,
                        color: '#134252',
                      }}
                    >
                      <option value="not_started">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="under_review">Under review</option>
                      <option value="cleared">Cleared</option>
                      <option value="flagged">Flagged</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'Notes' && (
            <div>
              <h3 style={{ marginBottom: '8px', fontSize: '15px' }}>Timeline notes</h3>
              <DemoTimelineNotes matterId={effectiveMatter.id} />
            </div>
          )}

          {activeTab === 'FinCEN / AML' && <DemoFinCENTab matter={effectiveMatter} />}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 18px',
            borderTop: '1px solid rgba(94,82,64,0.15)',
            background: '#fcfcf9',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              onArchive(effectiveMatter.id)
              onClose()
            }}
            style={{
              background: 'white',
              color: '#134252',
              border: '1px solid rgba(94,82,64,0.25)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            Archive
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#208096',
              color: 'white',
              border: 'none',
              padding: '10px 14px',
              borderRadius: '8px',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

