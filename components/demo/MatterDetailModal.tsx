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
  DemoCondoRecordsAccessStatus,
  DemoCondoRentalRestrictionStatus,
  DemoCondoReserveFundingStatus,
  DemoCondoSirsApplicability,
  DemoCondoSirsDocumentStatus,
  DemoCondoSirsMilestoneReview,
  DemoCondoSirsResult,
  DemoCondoSirsRiskLevel,
  DemoMatter,
  DemoMatterReviewTaskStatus,
  DemoMatterStatus,
} from '@/lib/demo/types'
import DemoTaskChecklist from '@/components/demo/DemoTaskChecklist'
import DemoTimelineNotes from '@/components/demo/DemoTimelineNotes'
import { displayOrFallback, parseOtherPartyInfo } from '@/lib/demo/matterPartyDisplay'
import DemoFinCENTab from '@/components/demo/DemoFinCENTab'
import { isFincenEligibleMatter } from '@/lib/demo/fincenEligibility'
import UploadDemoDocumentModal from '@/app/demo/_components/UploadDemoDocumentModal'
import CondoDiligenceSummaryCompareModal from '@/app/demo/_components/CondoDiligenceSummaryCompareModal'
import CreateCondoDiligenceSummaryReviewTaskModal from '@/app/demo/_components/CreateCondoDiligenceSummaryReviewTaskModal'
import {
  buildCondoDiligenceInternalReport,
  buildCondoDiligenceOperationalSummary,
  buildCondoDiligenceReviewDashboard,
  buildCondoDiligenceSummaryDraftDocumentInput,
  condoDiligenceMatterStatusPresentation,
  condoDisclosurePackageCompletenessPresentation,
  condoDisclosurePackageDeliveryMethodLabel,
  condoDisclosurePackageRequestStatusPresentation,
  condoDisclosurePackageTypeLabel,
  condoEstoppelDueDateWarning,
  condoEstoppelReviewStatusPresentation,
  condoFinancialDocReviewStatusPresentation,
  condoFinancialRiskLevelPresentation,
  condoGovernanceConcernLevelPresentation,
  condoQuestionnaireApplicabilityPresentation,
  condoQuestionnaireDocumentMatchesHaystack,
  condoQuestionnaireFinancingEligibilityPresentation,
  condoQuestionnaireLenderIssueStatusPresentation,
  condoQuestionnaireStatusPresentation,
  condoClosingDependencyStatusPresentation,
  condoLegalDescriptionStatusPresentation,
  condoLimitedCommonElementStatusPresentation,
  condoMunicipalLienStatusPresentation,
  condoParkingStorageStatusPresentation,
  condoPermitsCodeStatusPresentation,
  condoSellerRepairDisclosureStatusPresentation,
  condoTitleReviewStatusPresentation,
  condoUnitClosingDependenciesDocumentMatchesHaystack,
  condoUnitInspectionStatusPresentation,
  condoRequiredDocMatchesLinkageHaystack,
  condoRequiredDocDerivedStatusPresentation,
  condoSirsApplicabilityPresentation,
  condoSirsDocumentStatusPresentation,
  condoSirsResultPresentation,
  condoSirsRiskLevelPresentation,
  deriveCondoRequiredDocumentStatus,
  buildCondoDiligenceFindingFollowUpTaskPrefill,
  isCondoDiligenceUntouched,
  isCondoDiligenceEligible,
  isCondoDiligenceInternalSummaryDocument,
  isCondoDiligenceReviewMemoDocument,
  listCondoDiligenceInternalSummaryDocuments,
  listCondoDiligenceReviewMemoDocuments,
  listLinkableCondoDiligenceReviewTasksForFinding,
  normalizeCondoAssociationFinancialReview,
  normalizeCondoAssociationRecordsGovernanceReview,
  normalizeCondoDisclosurePackageReview,
  normalizeCondoEstoppelReview,
  normalizeCondoQuestionnaireLenderReview,
  normalizeCondoSirsMilestoneReview,
  normalizeCondoUnitClosingDependenciesReview,
  normalizeCondoLawyerReviewCheckpoint,
  condoLawyerReviewCheckpointStatusPresentation,
  captureCondoLawyerReviewCheckpointCounts,
  resolveCondoQuestionnaireFinancingEligibility,
  shouldShowCondoQuestionnaireLenderReviewForm,
  syncRequiredDocumentsFromDerivedLinkage,
  withCondoDiligenceFindingLinkedReviewTaskId,
} from '@/lib/demo/condoDiligence'
import DocumentPreviewModal from '@/app/demo/_components/DocumentPreviewModal'
import {
  demoMatterReviewTaskStatusPresentation,
  formatCondoDiligenceActiveReviewTaskCountLabel,
  formatCondoDiligenceReviewTaskCompletedAt,
  formatCondoDiligenceReviewTaskNoteExcerpt,
  listActiveCondoDiligenceSummaryReviewTasks,
  listCompletedCondoDiligenceSummaryReviewTasks,
  listCondoDiligenceSummaryReviewTasks,
} from '@/lib/demo/demoMatterReviewTask'
import {
  CONDO_DILIGENCE_ACTIVITY_VIEW_FILTERS,
  condoDiligenceActivityActionLabel,
  filterCondoDiligenceActivitiesByView,
  formatCondoDiligenceActivityTimestamp,
  listCondoDiligenceActivitiesForMatter,
  type CondoDiligenceActivityViewFilter,
} from '@/lib/demo/demoCondoDiligenceActivity'

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
    matterReviewTasks,
    condoDiligenceActivities,
    staff,
    matters,
    addDemoDocument,
    addDemoDocumentRequest,
    addMatterReviewTask,
    updateMatterReviewTaskStatus,
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
  const [compareSummariesOpen, setCompareSummariesOpen] = useState(false)
  const [reviewTaskDocumentId, setReviewTaskDocumentId] = useState<string | null>(null)
  const [reviewTaskLinkFindingId, setReviewTaskLinkFindingId] = useState<string | null>(null)
  const [reviewTaskPrefill, setReviewTaskPrefill] = useState<{ title: string; internalNote: string } | null>(
    null,
  )
  const [findingLinkSelectById, setFindingLinkSelectById] = useState<Record<string, string>>({})
  const [findingCreateDocSelectById, setFindingCreateDocSelectById] = useState<Record<string, string>>({})
  const [condoActivityExpanded, setCondoActivityExpanded] = useState(false)
  const [condoActivityFilter, setCondoActivityFilter] =
    useState<CondoDiligenceActivityViewFilter>('all')
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

  const condoMemoHistory = useMemo(
    () => listCondoDiligenceReviewMemoDocuments(matterDocuments),
    [matterDocuments],
  )

  const condoReviewTasks = useMemo(() => {
    if (!effectiveMatter) return []
    return listCondoDiligenceSummaryReviewTasks(matterReviewTasks, effectiveMatter.id)
  }, [effectiveMatter, matterReviewTasks])

  const activeCondoReviewTasks = useMemo(() => {
    if (!effectiveMatter) return []
    return listActiveCondoDiligenceSummaryReviewTasks(matterReviewTasks, effectiveMatter.id)
  }, [effectiveMatter, matterReviewTasks])

  const completedCondoReviewTasks = useMemo(() => {
    if (!effectiveMatter) return []
    return listCompletedCondoDiligenceSummaryReviewTasks(matterReviewTasks, effectiveMatter.id)
  }, [effectiveMatter, matterReviewTasks])

  const condoDiligenceActivityRows = useMemo(() => {
    if (!effectiveMatter) return []
    return listCondoDiligenceActivitiesForMatter(condoDiligenceActivities, effectiveMatter.id)
  }, [effectiveMatter, condoDiligenceActivities])

  const filteredCondoDiligenceActivityRows = useMemo(
    () => filterCondoDiligenceActivitiesByView(condoDiligenceActivityRows, condoActivityFilter),
    [condoDiligenceActivityRows, condoActivityFilter],
  )

  const visibleCondoDiligenceActivityRows = useMemo(() => {
    if (condoActivityExpanded) return filteredCondoDiligenceActivityRows
    return filteredCondoDiligenceActivityRows.slice(0, 5)
  }, [filteredCondoDiligenceActivityRows, condoActivityExpanded])

  const activeCondoReviewTaskCountLabel = formatCondoDiligenceActiveReviewTaskCountLabel(
    activeCondoReviewTasks.length,
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

  const condoReviewDashboard = useMemo(() => {
    if (!showCondoDiligenceTab || !effectiveMatter) return null
    return buildCondoDiligenceReviewDashboard({
      matterId: effectiveMatter.id,
      condo: condoDiligence,
      documents: matterDocuments,
      documentRequests: matterDocumentRequests,
      activeReviewTaskCount: activeCondoReviewTasks.length,
    })
  }, [
    showCondoDiligenceTab,
    effectiveMatter,
    condoDiligence,
    matterDocuments,
    matterDocumentRequests,
    activeCondoReviewTasks.length,
  ])

  const goToCondoDiligenceSection = (sectionId: string) => {
    setActiveTab('Condo Diligence')
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 80)
  }

  useEffect(() => {
    if (!open) return
    setActiveTab(initialTab ?? 'Overview')
    setIsAddDocumentOpen(false)
    setCondoActivityExpanded(false)
    setCondoActivityFilter('all')
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

              {(showCondoDiligenceTab || fincenSummary || activeCondoReviewTasks.length > 0) && (
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
                          {activeCondoReviewTaskCountLabel ? (
                            <div style={{ marginTop: 6 }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  background: '#f5f5f5',
                                  color: '#627c71',
                                  border: '1px solid rgba(94,82,64,0.2)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {activeCondoReviewTaskCountLabel}
                              </span>
                            </div>
                          ) : null}
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

                    {!showCondoDiligenceTab && activeCondoReviewTaskCountLabel ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#134252' }}>Condo Diligence review tasks</div>
                          <div style={{ fontSize: 11, color: '#627c71' }}>Internal coordination only — not a compliance determination.</div>
                          <div style={{ marginTop: 6 }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 800,
                                background: '#f5f5f5',
                                color: '#627c71',
                                border: '1px solid rgba(94,82,64,0.2)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {activeCondoReviewTaskCountLabel}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('Tasks')}
                          aria-label="Go to Condo Diligence review tasks"
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
                          Go to Tasks
                        </button>
                      </div>
                    ) : null}

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

              {condoReviewDashboard && (
                <div
                  style={{
                    border: '1px solid rgba(94,82,64,0.12)',
                    borderRadius: 8,
                    padding: 12,
                    background: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
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
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#134252' }}>
                        Condo Diligence Review Dashboard
                      </div>
                      <div style={{ fontSize: 11, color: '#627c71', marginTop: 4, lineHeight: 1.45, maxWidth: '40rem' }}>
                        {condoReviewDashboard.disclaimer}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '5px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 900,
                          background: condoReviewDashboard.matterStatus.bg,
                          color: condoReviewDashboard.matterStatus.color,
                          border: `1px solid ${condoReviewDashboard.matterStatus.border}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {condoReviewDashboard.matterStatus.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('Condo Diligence')}
                        aria-label="Open Condo Diligence workflow from review dashboard"
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
                        Open Condo Diligence
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 8,
                    }}
                  >
                    <div style={{ border: '1px solid rgba(94,82,64,0.1)', borderRadius: 8, padding: '8px 10px', background: '#fcfcf9' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#627c71' }}>Documents</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#134252', marginTop: 4, lineHeight: 1.4 }}>
                        {condoReviewDashboard.documentCounts.received} received ·{' '}
                        {condoReviewDashboard.documentCounts.requested} requested ·{' '}
                        {condoReviewDashboard.documentCounts.outstanding} outstanding
                      </div>
                    </div>
                    <div style={{ border: '1px solid rgba(94,82,64,0.1)', borderRadius: 8, padding: '8px 10px', background: '#fcfcf9' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#627c71' }}>Open findings</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#134252', marginTop: 4 }}>
                        {condoReviewDashboard.findingsLine}
                      </div>
                    </div>
                    <div style={{ border: '1px solid rgba(94,82,64,0.1)', borderRadius: 8, padding: '8px 10px', background: '#fcfcf9' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#627c71' }}>Active review tasks</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#134252', marginTop: 4 }}>
                        {condoReviewDashboard.activeReviewTaskCount}
                      </div>
                    </div>
                    <div style={{ border: '1px solid rgba(94,82,64,0.1)', borderRadius: 8, padding: '8px 10px', background: '#fcfcf9' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#627c71' }}>Attention rows</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#134252', marginTop: 4 }}>
                        {condoReviewDashboard.concernRowCount}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: '#134252', lineHeight: 1.45 }}>
                    <span style={{ fontWeight: 800 }}>Next action:</span> {condoReviewDashboard.nextAction}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {condoReviewDashboard.rows.map((row) => (
                      <div
                        key={row.id}
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: row.attention
                            ? '1px solid rgba(240,180,41,0.45)'
                            : '1px solid rgba(94,82,64,0.1)',
                          background: row.attention ? '#fffaf0' : '#fcfcf9',
                        }}
                      >
                        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#134252' }}>{row.title}</div>
                          {row.detail ? (
                            <div style={{ fontSize: 11, color: '#627c71', lineHeight: 1.4 }}>{row.detail}</div>
                          ) : null}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 900,
                              background: row.badge.bg,
                              color: row.badge.color,
                              border: `1px solid ${row.badge.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {row.badge.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => goToCondoDiligenceSection(row.sectionId)}
                            aria-label={`Open ${row.title} in Condo Diligence`}
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
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {condoReviewDashboard.latestInternalSummaryDocumentId ? (
                      <button
                        type="button"
                        onClick={() => {
                          const id = condoReviewDashboard.latestInternalSummaryDocumentId
                          if (id) setPreviewDocumentId(id)
                        }}
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
                        View latest internal summary
                      </button>
                    ) : null}
                    {condoReviewDashboard.lawyerCheckpoint.linkedSummaryDocumentId ? (
                      <button
                        type="button"
                        onClick={() => {
                          const id = condoReviewDashboard.lawyerCheckpoint.linkedSummaryDocumentId
                          if (id) setPreviewDocumentId(id)
                        }}
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
                        View checkpoint summary
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => goToCondoDiligenceSection('condo-lawyer-review-checkpoint')}
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
                      Lawyer checkpoint
                    </button>
                  </div>
                </div>
              )}

              {activeCondoReviewTasks.length > 0 && (
                <div
                  style={{
                    border: '1px solid rgba(94,82,64,0.12)',
                    borderRadius: 8,
                    padding: 12,
                    background: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#134252', marginBottom: 4 }}>
                        Condo Diligence Review Tasks
                      </div>
                      <div style={{ fontSize: 12, color: '#627c71', lineHeight: 1.45 }}>
                        Open and in-review internal tasks only. Not a compliance or closing-readiness determination.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('Tasks')}
                      aria-label="Go to Tasks tab for Condo Diligence review tasks"
                      style={{
                        background: 'white',
                        border: '1px solid rgba(94,82,64,0.25)',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#134252',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Go to Tasks
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeCondoReviewTasks.map((task) => {
                      const statusPresent = demoMatterReviewTaskStatusPresentation(task.status)
                      const assignee =
                        staff.find((s) => s.id === task.assignee_id)?.full_name ??
                        (task.assignee_id ? task.assignee_id : 'Unassigned')
                      const linkedDoc = matterDocuments.find((d) => d.id === task.linked_document_id)
                      return (
                        <div
                          key={task.id}
                          style={{
                            borderTop: '1px solid rgba(94,82,64,0.1)',
                            paddingTop: 8,
                            display: 'flex',
                            gap: 10,
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: '1 1 180px' }}>
                            <div style={{ fontWeight: 800, color: '#134252', fontSize: 13, marginBottom: 2 }}>
                              {task.title}
                            </div>
                            <div style={{ fontSize: 12, color: '#627c71', fontWeight: 700 }}>
                              {statusPresent.label}
                              {' · '}
                              {assignee}
                              {' · '}
                              Due: {task.due_date || 'None'}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!linkedDoc}
                            onClick={() => {
                              if (!linkedDoc) return
                              setPreviewDocumentId(linkedDoc.id)
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid rgba(94,82,64,0.25)',
                              background: linkedDoc ? '#fff' : '#f5f5f5',
                              fontWeight: 800,
                              fontSize: 11,
                              color: linkedDoc ? '#134252' : '#9aa8a1',
                              cursor: linkedDoc ? 'pointer' : 'not-allowed',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            View summary
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {completedCondoReviewTasks.length > 0 && (
                <div
                  style={{
                    border: '1px solid rgba(94,82,64,0.1)',
                    borderRadius: 8,
                    padding: 12,
                    background: '#fcfcf9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#627c71', marginBottom: 3 }}>
                      Completed Condo Diligence Review Tasks
                    </div>
                    <div style={{ fontSize: 11, color: '#9aa8a1', lineHeight: 1.45 }}>
                      Read-only internal history for this matter. Not a compliance determination or closing
                      recommendation.
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {completedCondoReviewTasks.map((task) => {
                      const linkedDoc = matterDocuments.find((d) => d.id === task.linked_document_id)
                      const completedAt =
                        formatCondoDiligenceReviewTaskCompletedAt(task.updated_at) ?? 'Unknown'
                      const noteExcerpt = formatCondoDiligenceReviewTaskNoteExcerpt(task.internal_note)
                      return (
                        <div
                          key={task.id}
                          style={{
                            borderTop: '1px solid rgba(94,82,64,0.08)',
                            paddingTop: 7,
                            display: 'flex',
                            gap: 10,
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                            <div style={{ fontWeight: 700, color: '#627c71', fontSize: 12, marginBottom: 2 }}>
                              {task.title}
                            </div>
                            <div style={{ fontSize: 11, color: '#9aa8a1', fontWeight: 600 }}>
                              Completed: {completedAt}
                            </div>
                            <div style={{ fontSize: 11, color: '#9aa8a1', marginTop: 3, lineHeight: 1.4 }}>
                              {noteExcerpt ? `Note: ${noteExcerpt}` : 'No note'}
                            </div>
                            <div style={{ fontSize: 11, color: '#9aa8a1', marginTop: 3 }}>
                              Summary: {linkedDoc?.name ?? 'Saved summary unavailable'}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!linkedDoc}
                            onClick={() => {
                              if (!linkedDoc) return
                              setPreviewDocumentId(linkedDoc.id)
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              border: '1px solid rgba(94,82,64,0.18)',
                              background: linkedDoc ? '#fff' : '#f5f5f5',
                              fontWeight: 700,
                              fontSize: 11,
                              color: linkedDoc ? '#627c71' : '#9aa8a1',
                              cursor: linkedDoc ? 'pointer' : 'not-allowed',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            View summary
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {condoDiligenceActivityRows.length > 0 && (
                <div
                  style={{
                    border: '1px solid rgba(94,82,64,0.1)',
                    borderRadius: 8,
                    padding: 12,
                    background: '#fcfcf9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#627c71', marginBottom: 3 }}>
                      Condo Diligence Activity
                    </div>
                    <div style={{ fontSize: 11, color: '#9aa8a1', lineHeight: 1.45 }}>
                      Internal activity for Condo Diligence summary review tasks on this matter. Not a
                      compliance determination or closing recommendation.
                    </div>
                  </div>
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}
                    role="group"
                    aria-label="Condo Diligence Activity filters"
                  >
                    {CONDO_DILIGENCE_ACTIVITY_VIEW_FILTERS.map((opt) => {
                      const active = condoActivityFilter === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setCondoActivityFilter(opt.id)
                            setCondoActivityExpanded(false)
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 999,
                            border: active ? '1px solid #208096' : '1px solid rgba(94,82,64,0.2)',
                            background: active ? '#e8f4f7' : '#fff',
                            color: active ? '#134252' : '#627c71',
                            fontWeight: 800,
                            fontSize: 11,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  {filteredCondoDiligenceActivityRows.length === 0 ? (
                    <div style={{ fontSize: 11, color: '#9aa8a1', fontWeight: 600, paddingTop: 2 }}>
                      No activity in this filter.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {visibleCondoDiligenceActivityRows.map((activity) => {
                        const linkedDoc = activity.linked_document_id
                          ? matterDocuments.find((d) => d.id === activity.linked_document_id)
                          : undefined
                        const stamped =
                          formatCondoDiligenceActivityTimestamp(activity.created_at) ?? 'Unknown'
                        const summaryStamp = linkedDoc
                          ? linkedDoc.generatedInternalSummary?.generatedAt?.trim() || linkedDoc.uploaded_at
                          : null
                        const summaryDate = summaryStamp
                          ? formatCondoDiligenceActivityTimestamp(summaryStamp)
                          : null
                        return (
                          <div
                            key={activity.id}
                            style={{
                              borderTop: '1px solid rgba(94,82,64,0.08)',
                              paddingTop: 7,
                              display: 'flex',
                              gap: 10,
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                              <div style={{ fontWeight: 700, color: '#627c71', fontSize: 12, marginBottom: 2 }}>
                                {condoDiligenceActivityActionLabel(activity.activity_type)}
                              </div>
                              <div style={{ fontSize: 11, color: '#9aa8a1', fontWeight: 600 }}>
                                {activity.task_title}
                              </div>
                              <div style={{ fontSize: 11, color: '#9aa8a1', marginTop: 3 }}>
                                {stamped}
                                {activity.actor_label ? ` · ${activity.actor_label}` : ''}
                              </div>
                              {linkedDoc ? (
                                <div style={{ fontSize: 11, color: '#9aa8a1', marginTop: 3 }}>
                                  Summary: {linkedDoc.name}
                                  {summaryDate ? ` · ${summaryDate}` : ''}
                                </div>
                              ) : null}
                              {activity.activity_type === 'review_task_completed' ? (
                                <div style={{ fontSize: 11, color: '#9aa8a1', marginTop: 3, lineHeight: 1.4 }}>
                                  {activity.note_excerpt
                                    ? `Note: ${activity.note_excerpt}`
                                    : 'No note'}
                                </div>
                              ) : null}
                            </div>
                            {linkedDoc ? (
                              <button
                                type="button"
                                onClick={() => setPreviewDocumentId(linkedDoc.id)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 6,
                                  border: '1px solid rgba(94,82,64,0.18)',
                                  background: '#fff',
                                  fontWeight: 700,
                                  fontSize: 11,
                                  color: '#627c71',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                View summary
                              </button>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {filteredCondoDiligenceActivityRows.length > 5 ? (
                    <button
                      type="button"
                      onClick={() => setCondoActivityExpanded((v) => !v)}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: '1px solid rgba(94,82,64,0.18)',
                        background: '#fff',
                        fontWeight: 700,
                        fontSize: 11,
                        color: '#627c71',
                        cursor: 'pointer',
                      }}
                    >
                      {condoActivityExpanded ? 'Show less' : 'View all activity'}
                    </button>
                  ) : null}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h3 style={{ marginBottom: '8px', fontSize: '15px' }}>Task checklist</h3>
                <DemoTaskChecklist matterId={effectiveMatter.id} />
              </div>

              {(showCondoDiligenceTab || condoReviewTasks.length > 0) && (
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
                      Condo Diligence Review Tasks
                    </div>
                    <div style={{ fontSize: 12, color: '#627c71', lineHeight: 1.45 }}>
                      Internal-only tasks linked to saved Internal Condo Diligence Summary snapshots. Not shared to
                      the client portal.
                    </div>
                  </div>
                  {condoReviewTasks.length === 0 ? (
                    <div style={{ color: '#627c71', fontSize: 13 }}>
                      No review tasks yet. Create one from a saved summary in Documents → Summary History.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {condoReviewTasks.map((task) => {
                        const statusPresent = demoMatterReviewTaskStatusPresentation(task.status)
                        const assignee =
                          staff.find((s) => s.id === task.assignee_id)?.full_name ??
                          (task.assignee_id ? task.assignee_id : 'Unassigned')
                        const linkedDoc = matterDocuments.find((d) => d.id === task.linked_document_id)
                        return (
                          <div
                            key={task.id}
                            style={{
                              border: '1px solid rgba(94,82,64,0.12)',
                              borderRadius: 8,
                              padding: 12,
                              background: '#fcfcf9',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                gap: 10,
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                flexWrap: 'wrap',
                              }}
                            >
                              <div style={{ minWidth: 0, flex: '1 1 180px' }}>
                                <div style={{ fontWeight: 900, color: '#134252', fontSize: 13, marginBottom: 4 }}>
                                  {task.title}
                                </div>
                                <div style={{ fontSize: 12, color: '#627c71', fontWeight: 700, lineHeight: 1.45 }}>
                                  Assignee: {assignee}
                                  {' · '}
                                  Due: {task.due_date || 'None'}
                                  {' · '}
                                  Internal only
                                </div>
                                {task.internal_note ? (
                                  <div style={{ fontSize: 12, color: '#627c71', marginTop: 6, lineHeight: 1.45 }}>
                                    Note: {task.internal_note}
                                  </div>
                                ) : null}
                                <div style={{ fontSize: 11, color: '#9aa8a1', marginTop: 6 }}>
                                  Linked: {linkedDoc?.name ?? 'Saved summary (missing from matter documents)'}
                                </div>
                              </div>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 900,
                                  background: statusPresent.bg,
                                  color: statusPresent.color,
                                  border: `1px solid ${statusPresent.border}`,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {statusPresent.label}
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 8,
                                marginTop: 10,
                                alignItems: 'center',
                              }}
                            >
                              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <span style={{ fontWeight: 800, color: '#627c71' }}>Status</span>
                                <select
                                  value={task.status}
                                  onChange={(e) =>
                                    updateMatterReviewTaskStatus(
                                      task.id,
                                      e.target.value as DemoMatterReviewTaskStatus,
                                    )
                                  }
                                  aria-label={`Status for ${task.title}`}
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: 6,
                                    border: '1px solid rgba(94,82,64,0.25)',
                                    background: '#fff',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    color: '#134252',
                                  }}
                                >
                                  <option value="open">Open</option>
                                  <option value="in_review">In review</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </label>
                              <button
                                type="button"
                                disabled={!linkedDoc}
                                onClick={() => {
                                  if (!linkedDoc) return
                                  setPreviewDocumentId(linkedDoc.id)
                                }}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  border: '1px solid rgba(94,82,64,0.25)',
                                  background: linkedDoc ? '#fff' : '#f5f5f5',
                                  fontWeight: 800,
                                  fontSize: 11,
                                  color: linkedDoc ? '#134252' : '#9aa8a1',
                                  cursor: linkedDoc ? 'pointer' : 'not-allowed',
                                }}
                              >
                                View linked summary
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      disabled={condoSummaryHistory.length < 2}
                      onClick={() => {
                        if (condoSummaryHistory.length < 2) return
                        setCompareSummariesOpen(true)
                      }}
                      title={
                        condoSummaryHistory.length < 2
                          ? 'Save at least two internal summaries to compare snapshots.'
                          : 'Compare two saved internal summaries'
                      }
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(94,82,64,0.25)',
                        background: condoSummaryHistory.length < 2 ? '#f5f5f5' : '#fff',
                        fontWeight: 800,
                        fontSize: 11,
                        color: condoSummaryHistory.length < 2 ? '#9aa8a1' : '#134252',
                        cursor: condoSummaryHistory.length < 2 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Compare summaries
                    </button>
                    {condoSummaryHistory.length < 2 ? (
                      <span style={{ fontSize: 12, color: '#627c71' }}>
                        Save at least two internal summaries to compare snapshots.
                      </span>
                    ) : null}
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
                            <button
                              type="button"
                              onClick={() => setReviewTaskDocumentId(doc.id)}
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
                              Create review task
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {(showCondoDiligenceTab || condoMemoHistory.length > 0) && (
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
                      Condo Diligence Memo History
                    </div>
                    <div style={{ fontSize: 12, color: '#627c71', lineHeight: 1.45 }}>
                      Saved internal review memo snapshots for this matter. Separate from detailed Internal Condo
                      Diligence Summary History. Lawyer work product only — not shared to the client portal.
                    </div>
                  </div>
                  {condoMemoHistory.length === 0 ? (
                    <div style={{ color: '#627c71', fontSize: 13 }}>
                      No saved internal review memos yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {condoMemoHistory.map((doc) => {
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
                              View internal memo
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
                    const isInternalMemo = isCondoDiligenceReviewMemoDocument(doc)
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
                              {isInternalSummary ? ' · Internal summary' : isInternalMemo ? ' · Internal memo' : ''}
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
                            {isInternalSummary
                              ? 'View internal summary'
                              : isInternalMemo
                                ? 'View internal memo'
                                : 'View'}
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
              <CondoDiligenceSummaryCompareModal
                open={compareSummariesOpen}
                snapshots={condoSummaryHistory}
                onClose={() => setCompareSummariesOpen(false)}
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

                  {(() => {
                    const disclosureReview = normalizeCondoDisclosurePackageReview(
                      condoDiligence.disclosurePackageReview,
                    )
                    const reviewPresent = condoFinancialDocReviewStatusPresentation(disclosureReview.reviewStatus)
                    const requestPresent = condoDisclosurePackageRequestStatusPresentation(
                      disclosureReview.packageRequestStatus,
                    )
                    const completenessPresent = condoDisclosurePackageCompletenessPresentation(
                      disclosureReview.packageCompletenessStatus,
                    )
                    const concernPresent = condoGovernanceConcernLevelPresentation(
                      disclosureReview.packageConcernLevel,
                    )
                    const fieldLabel: React.CSSProperties = {
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#627c71',
                      marginBottom: 4,
                    }
                    const fieldInput: React.CSSProperties = {
                      width: '100%',
                      padding: '7px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(94,82,64,0.25)',
                      fontSize: 13,
                      color: '#134252',
                      background: '#fff',
                    }
                    const disclosureDocIds = [
                      'declaration_bylaws_rules_amendments',
                      'association_financial_statements',
                      'current_budget',
                      'reserve_schedule_funding_detail',
                      'insurance_summary',
                      'litigation_claims_arbitration_dbpr',
                      'milestone_inspection_summary',
                      'sirs_reserve_study',
                      'estoppel',
                      'association_approval_leasing_restrictions',
                      'recent_board_minutes',
                      'special_assessment_notice_schedule',
                      'management_association_contacts',
                    ]
                    const disclosureLinkedDocuments = matterDocuments.filter((d) => {
                      const haystack = [d.name, d.document_subtype ?? '', d.category].filter(Boolean).join(' ')
                      return disclosureDocIds.some((id) => condoRequiredDocMatchesLinkageHaystack(haystack, id))
                    })
                    const disclosureLinkedRequests = matterDocumentRequests.filter((r) => {
                      const haystack = [r.title, r.description ?? '', r.category].filter(Boolean).join(' ')
                      return disclosureDocIds.some((id) => condoRequiredDocMatchesLinkageHaystack(haystack, id))
                    })
                    const patchDisclosure = (patch: Partial<DemoCondoDisclosurePackageReview>) => {
                      if (!matterId) return
                      patchCondoDiligence(matterId, {
                        disclosurePackageReview: { ...disclosureReview, ...patch },
                      })
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
                        <option value="none">None</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </>
                    )
                    const showDisclosureAttention =
                      disclosureReview.followUpNeeded ||
                      disclosureReview.missingItemsNotes.trim() !== '' ||
                      disclosureReview.reviewStatus === 'issue_found' ||
                      disclosureReview.packageRequestStatus === 'requested' ||
                      disclosureReview.packageRequestStatus === 'not_requested' ||
                      disclosureReview.packageCompletenessStatus === 'lawyer_review_required' ||
                      disclosureReview.packageCompletenessStatus === 'partial_or_incomplete' ||
                      disclosureReview.packageCompletenessStatus === 'not_received' ||
                      disclosureReview.packageConcernLevel === 'medium' ||
                      disclosureReview.packageConcernLevel === 'high' ||
                      disclosureReview.litigationOrClaimsDisclosureStatus === 'disclosed' ||
                      disclosureReview.litigationOrClaimsDisclosureStatus === 'lawyer_review_required'

                    return (
                      <div
                        id="condo-disclosure-package-review"
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
                              Disclosure Package Review
                            </div>
                            <div style={{ fontSize: 11, color: '#627c71', marginTop: 4, lineHeight: 1.45, maxWidth: '36rem' }}>
                              Structured practice notes for association disclosure package completeness (governing
                              docs, financials, insurance, litigation/claims, structural/SIRS materials, estoppel).
                              Complements checklist rows — does not replace requests, linkage, or sync. Not a
                              statutory-compliance or closing determination.
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
                                background: requestPresent.bg,
                                color: requestPresent.color,
                                border: `1px solid ${requestPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Request: {requestPresent.label}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: reviewPresent.bg,
                                color: reviewPresent.color,
                                border: `1px solid ${reviewPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Review: {reviewPresent.label}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: completenessPresent.bg,
                                color: completenessPresent.color,
                                border: `1px solid ${completenessPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Package: {completenessPresent.label}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: concernPresent.bg,
                                color: concernPresent.color,
                                border: `1px solid ${concernPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Concern: {concernPresent.label}
                            </span>
                          </div>
                        </div>

                        {showDisclosureAttention && (
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
                            Attention: disclosure package completeness, follow-up, or concern signals need lawyer
                            review. Confirm linked materials and notes before treating the package as complete. Demo
                            reminder only — not a legal compliance opinion.
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
                            <span style={fieldLabel}>Package request status</span>
                            <select
                              value={disclosureReview.packageRequestStatus}
                              onChange={(e) =>
                                patchDisclosure({
                                  packageRequestStatus: e.target.value as DemoCondoDisclosurePackageRequestStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="not_requested">Not requested</option>
                              <option value="requested">Requested</option>
                              <option value="received">Received</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Package requested date</span>
                            <input
                              type="date"
                              value={disclosureReview.packageRequestedDate}
                              onChange={(e) => patchDisclosure({ packageRequestedDate: e.target.value })}
                              style={fieldInput}
                            />
                          </label>
                          <label>
                            <span style={fieldLabel}>Package review status</span>
                            <select
                              value={disclosureReview.reviewStatus}
                              onChange={(e) =>
                                patchDisclosure({
                                  reviewStatus: e.target.value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Package received date</span>
                            <input
                              type="date"
                              value={disclosureReview.packageReceivedDate}
                              onChange={(e) => patchDisclosure({ packageReceivedDate: e.target.value })}
                              style={fieldInput}
                            />
                          </label>
                          <label>
                            <span style={fieldLabel}>Package type</span>
                            <select
                              value={disclosureReview.packageType}
                              onChange={(e) =>
                                patchDisclosure({
                                  packageType: e.target.value as DemoCondoDisclosurePackageType,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">{condoDisclosurePackageTypeLabel('unknown')}</option>
                              <option value="resale">{condoDisclosurePackageTypeLabel('resale')}</option>
                              <option value="new_construction">
                                {condoDisclosurePackageTypeLabel('new_construction')}
                              </option>
                              <option value="other">{condoDisclosurePackageTypeLabel('other')}</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Delivery method</span>
                            <select
                              value={disclosureReview.deliveryMethod}
                              onChange={(e) =>
                                patchDisclosure({
                                  deliveryMethod: e.target.value as DemoCondoDisclosurePackageDeliveryMethod,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">{condoDisclosurePackageDeliveryMethodLabel('unknown')}</option>
                              <option value="email">{condoDisclosurePackageDeliveryMethodLabel('email')}</option>
                              <option value="portal">{condoDisclosurePackageDeliveryMethodLabel('portal')}</option>
                              <option value="mail">{condoDisclosurePackageDeliveryMethodLabel('mail')}</option>
                              <option value="hand_delivery">
                                {condoDisclosurePackageDeliveryMethodLabel('hand_delivery')}
                              </option>
                              <option value="other">{condoDisclosurePackageDeliveryMethodLabel('other')}</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Package completeness</span>
                            <select
                              value={disclosureReview.packageCompletenessStatus}
                              onChange={(e) =>
                                patchDisclosure({
                                  packageCompletenessStatus: e.target
                                    .value as DemoCondoDisclosurePackageCompleteness,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="not_received">Not received</option>
                              <option value="partial_or_incomplete">Partial or incomplete</option>
                              <option value="appears_complete">Appears complete</option>
                              <option value="lawyer_review_required">Lawyer review required</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>FAQ / statutory questions</span>
                            <select
                              value={disclosureReview.faqOrStatutoryQuestionsReviewStatus}
                              onChange={(e) =>
                                patchDisclosure({
                                  faqOrStatutoryQuestionsReviewStatus: e.target
                                    .value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Governing docs included</span>
                            <select
                              value={disclosureReview.governingDocsIncludedReviewStatus}
                              onChange={(e) =>
                                patchDisclosure({
                                  governingDocsIncludedReviewStatus: e.target
                                    .value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Financials included</span>
                            <select
                              value={disclosureReview.financialsIncludedReviewStatus}
                              onChange={(e) =>
                                patchDisclosure({
                                  financialsIncludedReviewStatus: e.target
                                    .value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Insurance included</span>
                            <select
                              value={disclosureReview.insuranceIncludedReviewStatus}
                              onChange={(e) =>
                                patchDisclosure({
                                  insuranceIncludedReviewStatus: e.target
                                    .value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Litigation / claims disclosure</span>
                            <select
                              value={disclosureReview.litigationOrClaimsDisclosureStatus}
                              onChange={(e) =>
                                patchDisclosure({
                                  litigationOrClaimsDisclosureStatus: e.target
                                    .value as DemoCondoLitigationOrDbprStatus,
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
                            <span style={fieldLabel}>Structural / SIRS materials</span>
                            <select
                              value={disclosureReview.structuralOrSirsMaterialsStatus}
                              onChange={(e) =>
                                patchDisclosure({
                                  structuralOrSirsMaterialsStatus: e.target
                                    .value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Estoppel included</span>
                            <select
                              value={disclosureReview.estoppelIncludedStatus}
                              onChange={(e) =>
                                patchDisclosure({
                                  estoppelIncludedStatus: e.target.value as DemoCondoFinancialDocReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {docReviewOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Package concern level</span>
                            <select
                              value={disclosureReview.packageConcernLevel}
                              onChange={(e) =>
                                patchDisclosure({
                                  packageConcernLevel: e.target.value as DemoCondoGovernanceConcernLevel,
                                })
                              }
                              style={fieldInput}
                            >
                              {concernOptions}
                            </select>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
                            <input
                              type="checkbox"
                              checked={disclosureReview.followUpNeeded}
                              onChange={(e) => patchDisclosure({ followUpNeeded: e.target.checked })}
                            />
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#627c71' }}>Follow-up needed</span>
                          </label>
                        </div>

                        <label style={{ display: 'block' }}>
                          <span style={fieldLabel}>Missing documents / follow-up items</span>
                          <textarea
                            value={disclosureReview.missingItemsNotes}
                            onChange={(e) => patchDisclosure({ missingItemsNotes: e.target.value })}
                            rows={2}
                            placeholder="List missing package items or follow-ups (demo)"
                            style={{ ...fieldInput, resize: 'vertical' }}
                          />
                        </label>

                        <label style={{ display: 'block' }}>
                          <span style={fieldLabel}>Optional package notes</span>
                          <textarea
                            value={disclosureReview.optionalPackageNotes}
                            onChange={(e) => patchDisclosure({ optionalPackageNotes: e.target.value })}
                            rows={2}
                            placeholder="Optional package reference or context (demo)"
                            style={{ ...fieldInput, resize: 'vertical' }}
                          />
                        </label>

                        <label style={{ display: 'block' }}>
                          <span style={fieldLabel}>Lawyer notes</span>
                          <textarea
                            value={disclosureReview.notes}
                            onChange={(e) => patchDisclosure({ notes: e.target.value })}
                            rows={3}
                            placeholder="Internal disclosure package review notes (demo)"
                            style={{ ...fieldInput, resize: 'vertical' }}
                          />
                        </label>

                        <div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#134252', marginBottom: 6 }}>
                            Linked disclosure package documents &amp; requests
                          </div>
                          <div style={{ fontSize: 11, color: '#627c71', marginBottom: 8, lineHeight: 1.4 }}>
                            Read-only matches across common package materials (governing docs, financials, insurance,
                            litigation, SIRS/milestone, estoppel, approvals, minutes, contacts).
                          </div>
                          {disclosureLinkedDocuments.length === 0 && disclosureLinkedRequests.length === 0 ? (
                            <div style={{ fontSize: 13, color: '#627c71' }}>
                              No matching disclosure package documents or requests linked yet.
                            </div>
                          ) : (
                            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {disclosureLinkedDocuments.map((d) => (
                                <li key={d.id} style={{ fontSize: 13, color: '#134252' }}>
                                  <strong>Document:</strong> {d.name}
                                  {d.document_subtype ? ` · ${d.document_subtype}` : ''}
                                </li>
                              ))}
                              {disclosureLinkedRequests.map((r) => (
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
                    const financingEligibility = resolveCondoQuestionnaireFinancingEligibility(effectiveMatter)
                    const financingPresent = condoQuestionnaireFinancingEligibilityPresentation(financingEligibility)
                    const questionnaireReview = normalizeCondoQuestionnaireLenderReview(
                      condoDiligence.questionnaireLenderReview,
                    )
                    const showFullForm = shouldShowCondoQuestionnaireLenderReviewForm({
                      financingEligibility,
                      applicability: questionnaireReview.applicability,
                    })
                    const applicabilityPresent = condoQuestionnaireApplicabilityPresentation(
                      questionnaireReview.applicability,
                    )
                    const statusPresent = condoQuestionnaireStatusPresentation(
                      questionnaireReview.questionnaireStatus,
                    )
                    const issuePresent = condoQuestionnaireLenderIssueStatusPresentation(
                      questionnaireReview.lenderIssueStatus,
                    )
                    const fieldLabel: React.CSSProperties = {
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#627c71',
                      marginBottom: 4,
                    }
                    const fieldInput: React.CSSProperties = {
                      width: '100%',
                      padding: '7px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(94,82,64,0.25)',
                      fontSize: 13,
                      color: '#134252',
                      background: '#fff',
                    }
                    const questionnaireLinkedDocuments = matterDocuments.filter((d) => {
                      const haystack = [d.name, d.document_subtype ?? '', d.category].filter(Boolean).join(' ')
                      return condoQuestionnaireDocumentMatchesHaystack(haystack)
                    })
                    const questionnaireLinkedRequests = matterDocumentRequests.filter((r) => {
                      const haystack = [r.title, r.description ?? '', r.category].filter(Boolean).join(' ')
                      return condoQuestionnaireDocumentMatchesHaystack(haystack)
                    })
                    const evidenceDoc = questionnaireReview.questionnaireEvidenceDocumentId
                      ? matterDocuments.find((d) => d.id === questionnaireReview.questionnaireEvidenceDocumentId)
                      : undefined
                    const patchQuestionnaire = (patch: Partial<DemoCondoQuestionnaireLenderReview>) => {
                      if (!matterId) return
                      patchCondoDiligence(matterId, {
                        questionnaireLenderReview: { ...questionnaireReview, ...patch },
                      })
                    }
                    const matterFinancingHint = [
                      effectiveMatter.financingType?.trim() || 'Financing type unset',
                      effectiveMatter.lenderName?.trim() ? `Lender on matter: ${effectiveMatter.lenderName.trim()}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                    const showQuestionnaireAttention =
                      questionnaireReview.questionnaireStatus === 'issue_found' ||
                      questionnaireReview.questionnaireStatus === 'requested' ||
                      questionnaireReview.lenderIssueStatus === 'issue_disclosed' ||
                      questionnaireReview.lenderIssueStatus === 'lawyer_review_required' ||
                      questionnaireReview.applicability === 'lawyer_review_required' ||
                      (questionnaireReview.requestedResponseDate.trim() !== '' &&
                        questionnaireReview.questionnaireStatus !== 'received' &&
                        questionnaireReview.questionnaireStatus !== 'reviewed' &&
                        questionnaireReview.questionnaireStatus !== 'not_applicable')
                    const responseDatePassed =
                      questionnaireReview.requestedResponseDate.trim() !== '' &&
                      /^\d{4}-\d{2}-\d{2}$/.test(questionnaireReview.requestedResponseDate.trim()) &&
                      questionnaireReview.requestedResponseDate.trim() <
                        new Date().toISOString().slice(0, 10) &&
                      questionnaireReview.questionnaireStatus !== 'received' &&
                      questionnaireReview.questionnaireStatus !== 'reviewed' &&
                      questionnaireReview.questionnaireStatus !== 'not_applicable'

                    return (
                      <div
                        id="condo-questionnaire-lender-review"
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
                              Condo Questionnaire / Lender Review
                            </div>
                            <div style={{ fontSize: 11, color: '#627c71', marginTop: 4, lineHeight: 1.45, maxWidth: '36rem' }}>
                              Internal tracking for lender/condo questionnaire request, receipt, and issue-spotting.
                              Does not determine lender approval, project eligibility, mortgage eligibility, or closing
                              readiness. Does not change matter financing fields.
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
                                background: financingPresent.bg,
                                color: financingPresent.color,
                                border: `1px solid ${financingPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {financingPresent.label}
                            </span>
                            {showFullForm && (
                              <>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '5px 10px',
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontWeight: 900,
                                    background: statusPresent.bg,
                                    color: statusPresent.color,
                                    border: `1px solid ${statusPresent.border}`,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  Questionnaire: {statusPresent.label}
                                </span>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '5px 10px',
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontWeight: 900,
                                    background: issuePresent.bg,
                                    color: issuePresent.color,
                                    border: `1px solid ${issuePresent.border}`,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  Issues: {issuePresent.label}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ fontSize: 12, color: '#627c71', fontWeight: 700 }}>{matterFinancingHint}</div>

                        {!showFullForm ? (
                          <div
                            style={{
                              padding: '10px 12px',
                              borderRadius: 8,
                              border: '1px solid rgba(94,82,64,0.18)',
                              background: '#fcfcf9',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10,
                            }}
                          >
                            <div style={{ fontSize: 13, color: '#134252', fontWeight: 800 }}>
                              {financingEligibility === 'not_applicable_cash'
                                ? 'Not applicable — matter financing is recorded as cash / non-financed.'
                                : financingPresent.detail}
                            </div>
                            <div style={{ fontSize: 11, color: '#627c71', lineHeight: 1.45 }}>
                              Mark applicability here only when the lawyer confirms questionnaire review should (or
                              should not) proceed. This override stays on Condo Diligence state and does not edit
                              matter financing.
                            </div>
                            <label style={{ maxWidth: 280 }}>
                              <span style={fieldLabel}>Questionnaire applicability (lawyer override)</span>
                              <select
                                value={questionnaireReview.applicability}
                                onChange={(e) =>
                                  patchQuestionnaire({
                                    applicability: e.target.value as DemoCondoQuestionnaireApplicability,
                                  })
                                }
                                style={fieldInput}
                              >
                                <option value="unknown">Unknown</option>
                                <option value="not_applicable">Not applicable</option>
                                <option value="appears_applicable">Questionnaire review may apply</option>
                                <option value="lawyer_review_required">Lawyer review required</option>
                              </select>
                            </label>
                            {questionnaireReview.applicability !== 'unknown' && (
                              <div style={{ fontSize: 12, fontWeight: 800, color: applicabilityPresent.color }}>
                                Local mark: {applicabilityPresent.label}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            {(showQuestionnaireAttention || responseDatePassed) && (
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
                                {responseDatePassed
                                  ? 'Attention: requested response date has passed and the questionnaire is not marked received/reviewed. Demo follow-up prompt only — not a closing or lender determination.'
                                  : 'Attention: questionnaire status, lender/project issues, or follow-up signals need lawyer review. Demo reminder only — not lender approval or project eligibility.'}
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
                                <span style={fieldLabel}>Applicability</span>
                                <select
                                  value={questionnaireReview.applicability}
                                  onChange={(e) =>
                                    patchQuestionnaire({
                                      applicability: e.target.value as DemoCondoQuestionnaireApplicability,
                                    })
                                  }
                                  style={fieldInput}
                                >
                                  <option value="unknown">Unknown</option>
                                  <option value="not_applicable">Not applicable</option>
                                  <option value="appears_applicable">Questionnaire review may apply</option>
                                  <option value="lawyer_review_required">Lawyer review required</option>
                                </select>
                              </label>
                              <label>
                                <span style={fieldLabel}>Questionnaire status</span>
                                <select
                                  value={questionnaireReview.questionnaireStatus}
                                  onChange={(e) =>
                                    patchQuestionnaire({
                                      questionnaireStatus: e.target.value as DemoCondoQuestionnaireStatus,
                                    })
                                  }
                                  style={fieldInput}
                                >
                                  <option value="not_started">Not started</option>
                                  <option value="requested">Requested</option>
                                  <option value="received">Received</option>
                                  <option value="reviewed">Reviewed</option>
                                  <option value="issue_found">Issue found</option>
                                  <option value="not_applicable">Not applicable</option>
                                </select>
                              </label>
                              <label>
                                <span style={fieldLabel}>Request date</span>
                                <input
                                  type="date"
                                  value={questionnaireReview.requestDate}
                                  onChange={(e) => patchQuestionnaire({ requestDate: e.target.value })}
                                  style={fieldInput}
                                />
                              </label>
                              <label>
                                <span style={fieldLabel}>Requested response date</span>
                                <input
                                  type="date"
                                  value={questionnaireReview.requestedResponseDate}
                                  onChange={(e) => patchQuestionnaire({ requestedResponseDate: e.target.value })}
                                  style={fieldInput}
                                />
                              </label>
                              <label>
                                <span style={fieldLabel}>Received date</span>
                                <input
                                  type="date"
                                  value={questionnaireReview.receivedDate}
                                  onChange={(e) => patchQuestionnaire({ receivedDate: e.target.value })}
                                  style={fieldInput}
                                />
                              </label>
                              <label>
                                <span style={fieldLabel}>Lender / project issues</span>
                                <select
                                  value={questionnaireReview.lenderIssueStatus}
                                  onChange={(e) =>
                                    patchQuestionnaire({
                                      lenderIssueStatus: e.target.value as DemoCondoQuestionnaireLenderIssueStatus,
                                    })
                                  }
                                  style={fieldInput}
                                >
                                  <option value="unknown">Unknown</option>
                                  <option value="none_disclosed">None disclosed</option>
                                  <option value="issue_disclosed">Issue disclosed</option>
                                  <option value="lawyer_review_required">Lawyer review required</option>
                                </select>
                              </label>
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: 10,
                              }}
                            >
                              <label>
                                <span style={fieldLabel}>Lender name</span>
                                <input
                                  type="text"
                                  value={questionnaireReview.lenderName}
                                  onChange={(e) => patchQuestionnaire({ lenderName: e.target.value })}
                                  placeholder={effectiveMatter.lenderName?.trim() || 'Lender name (demo)'}
                                  style={fieldInput}
                                />
                              </label>
                              <label>
                                <span style={fieldLabel}>Lender contact name</span>
                                <input
                                  type="text"
                                  value={questionnaireReview.lenderContactName}
                                  onChange={(e) => patchQuestionnaire({ lenderContactName: e.target.value })}
                                  placeholder="Contact name (demo)"
                                  style={fieldInput}
                                />
                              </label>
                              <label>
                                <span style={fieldLabel}>Lender contact email</span>
                                <input
                                  type="email"
                                  value={questionnaireReview.lenderContactEmail}
                                  onChange={(e) => patchQuestionnaire({ lenderContactEmail: e.target.value })}
                                  placeholder={effectiveMatter.lenderEmail?.trim() || 'email@example.com'}
                                  style={fieldInput}
                                />
                              </label>
                              <label>
                                <span style={fieldLabel}>Lender contact phone</span>
                                <input
                                  type="text"
                                  value={questionnaireReview.lenderContactPhone}
                                  onChange={(e) => patchQuestionnaire({ lenderContactPhone: e.target.value })}
                                  placeholder="Phone (demo)"
                                  style={fieldInput}
                                />
                              </label>
                              <label>
                                <span style={fieldLabel}>Questionnaire evidence document</span>
                                <select
                                  value={questionnaireReview.questionnaireEvidenceDocumentId ?? ''}
                                  onChange={(e) =>
                                    patchQuestionnaire({
                                      questionnaireEvidenceDocumentId: e.target.value.trim()
                                        ? e.target.value
                                        : null,
                                    })
                                  }
                                  style={fieldInput}
                                >
                                  <option value="">None linked</option>
                                  {matterDocuments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                      {d.name}
                                    </option>
                                  ))}
                                </select>
                                {evidenceDoc && (
                                  <div style={{ fontSize: 11, color: '#627c71', marginTop: 4 }}>
                                    Linked: {evidenceDoc.name}
                                  </div>
                                )}
                              </label>
                            </div>

                            <label style={{ display: 'block' }}>
                              <span style={fieldLabel}>Issue note</span>
                              <textarea
                                value={questionnaireReview.issueNote}
                                onChange={(e) => patchQuestionnaire({ issueNote: e.target.value })}
                                rows={2}
                                placeholder="Issues disclosed in the questionnaire (internal)"
                                style={{ ...fieldInput, resize: 'vertical' }}
                              />
                            </label>

                            <label style={{ display: 'block' }}>
                              <span style={fieldLabel}>Lawyer notes</span>
                              <textarea
                                value={questionnaireReview.notes}
                                onChange={(e) => patchQuestionnaire({ notes: e.target.value })}
                                rows={3}
                                placeholder="Internal questionnaire / lender review notes (demo)"
                                style={{ ...fieldInput, resize: 'vertical' }}
                              />
                            </label>

                            <div>
                              <div style={{ fontSize: 12, fontWeight: 900, color: '#134252', marginBottom: 6 }}>
                                Linked questionnaire / lender documents &amp; requests
                              </div>
                              <div style={{ fontSize: 11, color: '#627c71', marginBottom: 8, lineHeight: 1.4 }}>
                                Read-only keyword matches (questionnaire, lender form/package, Fannie/Freddie/FHA condo
                                references). Complements the evidence document select — no new required-doc checklist
                                row.
                              </div>
                              {questionnaireLinkedDocuments.length === 0 &&
                              questionnaireLinkedRequests.length === 0 ? (
                                <div style={{ fontSize: 13, color: '#627c71' }}>
                                  No matching questionnaire / lender documents or requests linked yet.
                                </div>
                              ) : (
                                <ul
                                  style={{
                                    margin: 0,
                                    paddingLeft: 18,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                  }}
                                >
                                  {questionnaireLinkedDocuments.map((d) => (
                                    <li key={d.id} style={{ fontSize: 13, color: '#134252' }}>
                                      <strong>Document:</strong> {d.name}
                                      {d.document_subtype ? ` · ${d.document_subtype}` : ''}
                                    </li>
                                  ))}
                                  {questionnaireLinkedRequests.map((r) => (
                                    <li key={r.id} style={{ fontSize: 13, color: '#134252' }}>
                                      <strong>Request ({r.status}):</strong> {r.title}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })()}

                  {(() => {
                    const unitClosingReview = normalizeCondoUnitClosingDependenciesReview(
                      condoDiligence.unitClosingDependenciesReview,
                    )
                    const titlePresent = condoTitleReviewStatusPresentation(unitClosingReview.titleReviewStatus)
                    const closingPresent = condoClosingDependencyStatusPresentation(
                      unitClosingReview.closingDependencyStatus,
                    )
                    const fieldLabel: React.CSSProperties = {
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#627c71',
                      marginBottom: 4,
                    }
                    const fieldInput: React.CSSProperties = {
                      width: '100%',
                      padding: '7px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(94,82,64,0.25)',
                      fontSize: 13,
                      color: '#134252',
                      background: '#fff',
                    }
                    const linkedDocuments = matterDocuments.filter((d) => {
                      const haystack = [d.name, d.document_subtype ?? '', d.category].filter(Boolean).join(' ')
                      return condoUnitClosingDependenciesDocumentMatchesHaystack(haystack)
                    })
                    const linkedRequests = matterDocumentRequests.filter((r) => {
                      const haystack = [r.title, r.description ?? '', r.category].filter(Boolean).join(' ')
                      return condoUnitClosingDependenciesDocumentMatchesHaystack(haystack)
                    })
                    const patchUnitClosing = (patch: Partial<DemoCondoUnitClosingDependenciesReview>) => {
                      if (!matterId) return
                      patchCondoDiligence(matterId, {
                        unitClosingDependenciesReview: { ...unitClosingReview, ...patch },
                      })
                    }
                    const matterContext = [
                      effectiveMatter.property.address,
                      effectiveMatter.property.property_type,
                      effectiveMatter.transactionType,
                      effectiveMatter.financingType,
                      effectiveMatter.key_dates.closing_date
                        ? `Closing ${effectiveMatter.key_dates.closing_date}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                    const showAttention =
                      unitClosingReview.titleReviewStatus === 'issue_found' ||
                      unitClosingReview.legalDescriptionStatus === 'difference_noted' ||
                      unitClosingReview.legalDescriptionStatus === 'lawyer_review_required' ||
                      unitClosingReview.parkingStorageStatus === 'issue_found' ||
                      unitClosingReview.parkingStorageStatus === 'lawyer_review_required' ||
                      unitClosingReview.limitedCommonElementStatus === 'issue_found' ||
                      unitClosingReview.limitedCommonElementStatus === 'lawyer_review_required' ||
                      unitClosingReview.permitsCodeStatus === 'possible_issue_noted' ||
                      unitClosingReview.permitsCodeStatus === 'issue_disclosed' ||
                      unitClosingReview.permitsCodeStatus === 'lawyer_review_required' ||
                      unitClosingReview.municipalLienStatus === 'possible_issue_noted' ||
                      unitClosingReview.municipalLienStatus === 'issue_disclosed' ||
                      unitClosingReview.municipalLienStatus === 'lawyer_review_required' ||
                      unitClosingReview.inspectionStatus === 'issue_found' ||
                      unitClosingReview.sellerRepairDisclosureStatus === 'issue_found' ||
                      unitClosingReview.closingDependencyStatus === 'open_item' ||
                      unitClosingReview.closingDependencyStatus === 'issue_flagged' ||
                      unitClosingReview.closingDependencyStatus === 'lawyer_review_required'

                    const parkingOptions = (
                      <>
                        <option value="unknown">Unknown</option>
                        <option value="not_applicable">Not applicable</option>
                        <option value="reviewed_no_issue_noted">Reviewed — no issue noted</option>
                        <option value="right_or_assignment_noted">Right or assignment noted</option>
                        <option value="issue_found">Issue found</option>
                        <option value="lawyer_review_required">Lawyer review required</option>
                      </>
                    )
                    const disclosedIssueOptions = (
                      <>
                        <option value="unknown">Unknown</option>
                        <option value="none_disclosed">None disclosed</option>
                        <option value="possible_issue_noted">Possible issue noted</option>
                        <option value="issue_disclosed">Issue disclosed</option>
                        <option value="lawyer_review_required">Lawyer review required</option>
                      </>
                    )

                    return (
                      <div
                        id="condo-unit-closing-dependencies"
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
                              Unit &amp; Closing Dependencies
                            </div>
                            <div style={{ fontSize: 11, color: '#627c71', marginTop: 4, lineHeight: 1.45, maxWidth: '36rem' }}>
                              Internal tracking for title/legal description notes, parking/storage and limited common
                              element rights, permits/code and municipal lien disclosures, inspection and seller repair
                              references, and closing follow-ups. Issue-spotting only — not a title insurability, property
                              condition, code-compliance, lien-validity, or closing-readiness determination.
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
                                background: titlePresent.bg,
                                color: titlePresent.color,
                                border: `1px solid ${titlePresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Title: {titlePresent.label}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '5px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 900,
                                background: closingPresent.bg,
                                color: closingPresent.color,
                                border: `1px solid ${closingPresent.border}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Closing deps: {closingPresent.label}
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: 12, color: '#627c71', fontWeight: 700 }}>{matterContext}</div>

                        {showAttention && (
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
                            Attention: unit, title, disclosure, or closing-dependency signals need lawyer review. Demo
                            reminder only — not a legal determination of title, condition, compliance, or closing
                            readiness.
                          </div>
                        )}

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: 10,
                          }}
                        >
                          <label>
                            <span style={fieldLabel}>Title review status</span>
                            <select
                              value={unitClosingReview.titleReviewStatus}
                              onChange={(e) =>
                                patchUnitClosing({
                                  titleReviewStatus: e.target.value as DemoCondoTitleReviewStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="not_started">Not started</option>
                              <option value="requested">Requested</option>
                              <option value="received">Received</option>
                              <option value="in_review">In review</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="issue_found">Issue found</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Legal description status</span>
                            <select
                              value={unitClosingReview.legalDescriptionStatus}
                              onChange={(e) =>
                                patchUnitClosing({
                                  legalDescriptionStatus: e.target.value as DemoCondoLegalDescriptionStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="matches_recorded_materials">Matches recorded materials</option>
                              <option value="difference_noted">Difference noted</option>
                              <option value="lawyer_review_required">Lawyer review required</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Parking / storage</span>
                            <select
                              value={unitClosingReview.parkingStorageStatus}
                              onChange={(e) =>
                                patchUnitClosing({
                                  parkingStorageStatus: e.target.value as DemoCondoParkingStorageStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {parkingOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Limited common elements</span>
                            <select
                              value={unitClosingReview.limitedCommonElementStatus}
                              onChange={(e) =>
                                patchUnitClosing({
                                  limitedCommonElementStatus: e.target.value as DemoCondoLimitedCommonElementStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {parkingOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Permits / code</span>
                            <select
                              value={unitClosingReview.permitsCodeStatus}
                              onChange={(e) =>
                                patchUnitClosing({
                                  permitsCodeStatus: e.target.value as DemoCondoPermitsCodeStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {disclosedIssueOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Municipal liens</span>
                            <select
                              value={unitClosingReview.municipalLienStatus}
                              onChange={(e) =>
                                patchUnitClosing({
                                  municipalLienStatus: e.target.value as DemoCondoMunicipalLienStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              {disclosedIssueOptions}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Inspection status</span>
                            <select
                              value={unitClosingReview.inspectionStatus}
                              onChange={(e) =>
                                patchUnitClosing({
                                  inspectionStatus: e.target.value as DemoCondoUnitInspectionStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="not_applicable">Not applicable</option>
                              <option value="requested">Requested</option>
                              <option value="received">Received</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="issue_found">Issue found</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Seller repair disclosure</span>
                            <select
                              value={unitClosingReview.sellerRepairDisclosureStatus}
                              onChange={(e) =>
                                patchUnitClosing({
                                  sellerRepairDisclosureStatus:
                                    e.target.value as DemoCondoSellerRepairDisclosureStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="unknown">Unknown</option>
                              <option value="not_received">Not received</option>
                              <option value="received">Received</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="issue_found">Issue found</option>
                              <option value="not_applicable">Not applicable</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Closing dependency status</span>
                            <select
                              value={unitClosingReview.closingDependencyStatus}
                              onChange={(e) =>
                                patchUnitClosing({
                                  closingDependencyStatus: e.target.value as DemoCondoClosingDependencyStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="none_noted">None noted</option>
                              <option value="open_item">Open item</option>
                              <option value="issue_flagged">Issue flagged</option>
                              <option value="lawyer_review_required">Lawyer review required</option>
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Title evidence document</span>
                            <select
                              value={unitClosingReview.titleEvidenceDocumentId ?? ''}
                              onChange={(e) =>
                                patchUnitClosing({
                                  titleEvidenceDocumentId: e.target.value.trim() ? e.target.value : null,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="">None linked</option>
                              {matterDocuments.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Inspection evidence document</span>
                            <select
                              value={unitClosingReview.inspectionEvidenceDocumentId ?? ''}
                              onChange={(e) =>
                                patchUnitClosing({
                                  inspectionEvidenceDocumentId: e.target.value.trim() ? e.target.value : null,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="">None linked</option>
                              {matterDocuments.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span style={fieldLabel}>Seller disclosure evidence document</span>
                            <select
                              value={unitClosingReview.sellerDisclosureEvidenceDocumentId ?? ''}
                              onChange={(e) =>
                                patchUnitClosing({
                                  sellerDisclosureEvidenceDocumentId: e.target.value.trim()
                                    ? e.target.value
                                    : null,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="">None linked</option>
                              {matterDocuments.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <label style={{ display: 'block' }}>
                          <span style={fieldLabel}>Dependency note</span>
                          <textarea
                            value={unitClosingReview.dependencyNote}
                            onChange={(e) => patchUnitClosing({ dependencyNote: e.target.value })}
                            rows={2}
                            placeholder="Open closing dependencies / follow-ups (internal)"
                            style={{ ...fieldInput, resize: 'vertical' }}
                          />
                        </label>

                        <label style={{ display: 'block' }}>
                          <span style={fieldLabel}>Lawyer notes</span>
                          <textarea
                            value={unitClosingReview.notes}
                            onChange={(e) => patchUnitClosing({ notes: e.target.value })}
                            rows={3}
                            placeholder="Internal unit & closing dependency notes (demo)"
                            style={{ ...fieldInput, resize: 'vertical' }}
                          />
                        </label>

                        <div>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#134252', marginBottom: 6 }}>
                            Linked unit / title / inspection documents &amp; requests
                          </div>
                          <div style={{ fontSize: 11, color: '#627c71', marginBottom: 8, lineHeight: 1.4 }}>
                            Read-only keyword matches (title, legal description, parking/storage, permits, municipal
                            liens, inspection, seller disclosure). Complements evidence selects — no new required-doc
                            checklist row.
                          </div>
                          {linkedDocuments.length === 0 && linkedRequests.length === 0 ? (
                            <div style={{ fontSize: 13, color: '#627c71' }}>
                              No matching unit / closing dependency documents or requests linked yet.
                            </div>
                          ) : (
                            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {linkedDocuments.map((d) => (
                                <li key={d.id} style={{ fontSize: 13, color: '#134252' }}>
                                  <strong>Document:</strong> {d.name}
                                  {d.document_subtype ? ` · ${d.document_subtype}` : ''}
                                </li>
                              ))}
                              {linkedRequests.map((r) => (
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
                    const lawyerCheckpoint = normalizeCondoLawyerReviewCheckpoint(
                      condoDiligence.lawyerReviewCheckpoint,
                    )
                    const checkpointPresent = condoLawyerReviewCheckpointStatusPresentation(
                      lawyerCheckpoint.status,
                    )
                    const patchLawyerCheckpoint = (patch: Partial<DemoCondoLawyerReviewCheckpoint>) => {
                      patchCondoDiligence(matterId, {
                        lawyerReviewCheckpoint: { ...lawyerCheckpoint, ...patch },
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
                    const todayYmd = new Date().toISOString().slice(0, 10)
                    return (
                      <div
                        id="condo-lawyer-review-checkpoint"
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
                              Lawyer Review Recorded
                            </div>
                            <div style={{ fontSize: 11, color: '#627c71', marginTop: 4, lineHeight: 1.45, maxWidth: '36rem' }}>
                              Internal audit checkpoint that a lawyer reviewed the currently recorded Condo Diligence
                              materials. Optional link to one saved Internal Condo Diligence Summary snapshot. Does not
                              certify legal compliance, building safety, insurance adequacy, statutory compliance,
                              document sufficiency, risk elimination, transaction approval, or closing readiness.
                            </div>
                          </div>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '5px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 900,
                              background: checkpointPresent.bg,
                              color: checkpointPresent.color,
                              border: `1px solid ${checkpointPresent.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {checkpointPresent.label}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: 10,
                          }}
                        >
                          <label style={{ display: 'block' }}>
                            <span style={fieldLabel}>Review status</span>
                            <select
                              value={lawyerCheckpoint.status}
                              onChange={(e) =>
                                patchLawyerCheckpoint({
                                  status: e.target.value as DemoCondoLawyerReviewCheckpointStatus,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="not_recorded">Not recorded</option>
                              <option value="in_progress">In progress</option>
                              <option value="review_recorded">Review recorded</option>
                              <option value="follow_up_required">Follow-up required</option>
                            </select>
                          </label>
                          <label style={{ display: 'block' }}>
                            <span style={fieldLabel}>Reviewer</span>
                            <select
                              value={lawyerCheckpoint.reviewerId ?? ''}
                              onChange={(e) => {
                                const id = e.target.value
                                if (!id) {
                                  patchLawyerCheckpoint({ reviewerId: null, reviewerName: null })
                                  return
                                }
                                const member = staff.find((s) => s.id === id)
                                patchLawyerCheckpoint({
                                  reviewerId: id,
                                  reviewerName: member?.full_name ?? id,
                                })
                              }}
                              style={fieldInput}
                            >
                              <option value="">Select staff (optional)</option>
                              {staff.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.full_name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label style={{ display: 'block' }}>
                            <span style={fieldLabel}>Review date</span>
                            <input
                              type="date"
                              value={lawyerCheckpoint.reviewedAt ?? ''}
                              onChange={(e) =>
                                patchLawyerCheckpoint({
                                  reviewedAt: e.target.value.trim() ? e.target.value : null,
                                })
                              }
                              style={fieldInput}
                            />
                          </label>
                          <label style={{ display: 'block' }}>
                            <span style={fieldLabel}>Linked saved internal summary</span>
                            <select
                              value={lawyerCheckpoint.linkedSummaryDocumentId ?? ''}
                              onChange={(e) =>
                                patchLawyerCheckpoint({
                                  linkedSummaryDocumentId: e.target.value.trim() ? e.target.value : null,
                                })
                              }
                              style={fieldInput}
                            >
                              <option value="">
                                {condoSummaryHistory.length === 0
                                  ? 'Save an internal summary first (optional)'
                                  : 'None linked (optional)'}
                              </option>
                              {condoSummaryHistory.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: '1px solid rgba(94,82,64,0.12)',
                            background: '#fcfcf9',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#627c71' }}>
                              Open findings at review
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#134252', marginTop: 2 }}>
                              {lawyerCheckpoint.openFindingCountAtReview === null
                                ? 'Not captured yet'
                                : lawyerCheckpoint.openFindingCountAtReview}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#627c71' }}>
                              Active follow-up tasks at review
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#134252', marginTop: 2 }}>
                              {lawyerCheckpoint.activeFollowUpTaskCountAtReview === null
                                ? 'Not captured yet'
                                : lawyerCheckpoint.activeFollowUpTaskCountAtReview}
                            </div>
                          </div>
                        </div>

                        <label style={{ display: 'block' }}>
                          <span style={fieldLabel}>Internal conclusion / follow-up note</span>
                          <textarea
                            value={lawyerCheckpoint.conclusionNote}
                            onChange={(e) => patchLawyerCheckpoint({ conclusionNote: e.target.value })}
                            rows={3}
                            placeholder="Internal conclusion or follow-up note (demo)"
                            style={{ ...fieldInput, resize: 'vertical' }}
                          />
                        </label>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const counts = captureCondoLawyerReviewCheckpointCounts({
                                findings: condoDiligence.findings,
                                tasks: matterReviewTasks,
                                matterId,
                              })
                              patchLawyerCheckpoint({
                                ...counts,
                                reviewedAt: lawyerCheckpoint.reviewedAt || todayYmd,
                                status:
                                  lawyerCheckpoint.status === 'not_recorded'
                                    ? 'review_recorded'
                                    : lawyerCheckpoint.status,
                              })
                            }}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 6,
                              border: '1px solid rgba(32,128,150,0.35)',
                              background: '#208096',
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            Record review checkpoint
                          </button>
                          {lawyerCheckpoint.linkedSummaryDocumentId && (
                            <button
                              type="button"
                              onClick={() => setPreviewDocumentId(lawyerCheckpoint.linkedSummaryDocumentId)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 6,
                                border: '1px solid rgba(94,82,64,0.25)',
                                background: '#fff',
                                color: '#134252',
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              View linked summary
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#627c71', lineHeight: 1.4 }}>
                          Recording snapshots the current open-finding count and active Condo Diligence summary review
                          task count. Lawyer-controlled only — not shared to the client portal.
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
                      <div style={{ fontSize: 13, color: '#627c71' }}>
                        No findings yet. Add a line when something material shows up in diligence.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {condoDiligence.findings.map((f) => {
                          const linkedTasks = (f.linkedReviewTaskIds ?? [])
                            .map((taskId) => condoReviewTasks.find((t) => t.id === taskId))
                            .filter((t): t is NonNullable<typeof t> => Boolean(t))
                          const linkableTasks = listLinkableCondoDiligenceReviewTasksForFinding({
                            tasks: matterReviewTasks,
                            matterId,
                            finding: f,
                          })
                          const selectedLinkTaskId = findingLinkSelectById[f.id] ?? ''
                          const selectedCreateDocId = findingCreateDocSelectById[f.id] ?? ''
                          return (
                            <div
                              key={f.id}
                              style={{
                                border: '1px solid rgba(94,82,64,0.14)',
                                borderRadius: 8,
                                padding: 10,
                                background: '#fcfcf9',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                              }}
                            >
                              <textarea
                                value={f.text}
                                onChange={(e) => {
                                  const text = e.target.value
                                  const findings = condoDiligence.findings.map((x) =>
                                    x.id === f.id ? { ...x, text } : x,
                                  )
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
                                  background: '#fff',
                                }}
                              />

                              {linkedTasks.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <div style={{ fontSize: 11, fontWeight: 800, color: '#627c71' }}>
                                    Linked review tasks (internal)
                                  </div>
                                  {linkedTasks.map((task) => {
                                    const statusPresent = demoMatterReviewTaskStatusPresentation(task.status)
                                    const linkedSummary = matterDocuments.find(
                                      (d) => d.id === task.linked_document_id,
                                    )
                                    return (
                                      <div
                                        key={task.id}
                                        style={{
                                          display: 'flex',
                                          flexWrap: 'wrap',
                                          alignItems: 'center',
                                          gap: 8,
                                          fontSize: 12,
                                          color: '#134252',
                                        }}
                                      >
                                        <span
                                          style={{
                                            display: 'inline-block',
                                            padding: '3px 8px',
                                            borderRadius: 999,
                                            fontSize: 11,
                                            fontWeight: 900,
                                            background: statusPresent.bg,
                                            color: statusPresent.color,
                                            border: `1px solid ${statusPresent.border}`,
                                          }}
                                        >
                                          {statusPresent.label}
                                        </span>
                                        <span style={{ fontWeight: 700 }}>{task.title}</span>
                                        <button
                                          type="button"
                                          onClick={() => setActiveTab('Tasks')}
                                          style={{
                                            border: '1px solid rgba(94,82,64,0.25)',
                                            background: '#fff',
                                            borderRadius: 6,
                                            padding: '4px 8px',
                                            fontWeight: 800,
                                            fontSize: 11,
                                            color: '#134252',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          Open tasks
                                        </button>
                                        {linkedSummary && (
                                          <button
                                            type="button"
                                            onClick={() => setPreviewDocumentId(linkedSummary.id)}
                                            style={{
                                              border: '1px solid rgba(94,82,64,0.25)',
                                              background: '#fff',
                                              borderRadius: 6,
                                              padding: '4px 8px',
                                              fontWeight: 800,
                                              fontSize: 11,
                                              color: '#134252',
                                              cursor: 'pointer',
                                            }}
                                          >
                                            View summary
                                          </button>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                  gap: 8,
                                  alignItems: 'end',
                                }}
                              >
                                <label style={{ display: 'block' }}>
                                  <span
                                    style={{
                                      display: 'block',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      color: '#627c71',
                                      marginBottom: 4,
                                    }}
                                  >
                                    Create follow-up from saved summary
                                  </span>
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    <select
                                      value={selectedCreateDocId}
                                      onChange={(e) =>
                                        setFindingCreateDocSelectById((prev) => ({
                                          ...prev,
                                          [f.id]: e.target.value,
                                        }))
                                      }
                                      style={{
                                        flex: 1,
                                        minWidth: 140,
                                        padding: '6px 8px',
                                        borderRadius: 6,
                                        border: '1px solid rgba(94,82,64,0.25)',
                                        fontSize: 12,
                                        color: '#134252',
                                        background: '#fff',
                                      }}
                                    >
                                      <option value="">
                                        {condoSummaryHistory.length === 0
                                          ? 'Save an internal summary first'
                                          : 'Select summary snapshot'}
                                      </option>
                                      {condoSummaryHistory.map((d) => (
                                        <option key={d.id} value={d.id}>
                                          {d.name}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      disabled={!selectedCreateDocId}
                                      onClick={() => {
                                        if (!selectedCreateDocId) return
                                        const prefill = buildCondoDiligenceFindingFollowUpTaskPrefill(f)
                                        setReviewTaskPrefill(prefill)
                                        setReviewTaskLinkFindingId(f.id)
                                        setReviewTaskDocumentId(selectedCreateDocId)
                                      }}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: 6,
                                        border: '1px solid rgba(94,82,64,0.25)',
                                        background: selectedCreateDocId ? '#208096' : '#f5f5f5',
                                        color: selectedCreateDocId ? '#fff' : '#9aa8a1',
                                        fontWeight: 800,
                                        fontSize: 11,
                                        cursor: selectedCreateDocId ? 'pointer' : 'not-allowed',
                                      }}
                                    >
                                      Create task
                                    </button>
                                  </div>
                                </label>

                                <label style={{ display: 'block' }}>
                                  <span
                                    style={{
                                      display: 'block',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      color: '#627c71',
                                      marginBottom: 4,
                                    }}
                                  >
                                    Link existing review task
                                  </span>
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    <select
                                      value={selectedLinkTaskId}
                                      onChange={(e) =>
                                        setFindingLinkSelectById((prev) => ({
                                          ...prev,
                                          [f.id]: e.target.value,
                                        }))
                                      }
                                      style={{
                                        flex: 1,
                                        minWidth: 140,
                                        padding: '6px 8px',
                                        borderRadius: 6,
                                        border: '1px solid rgba(94,82,64,0.25)',
                                        fontSize: 12,
                                        color: '#134252',
                                        background: '#fff',
                                      }}
                                    >
                                      <option value="">
                                        {linkableTasks.length === 0
                                          ? 'No eligible tasks to link'
                                          : 'Select review task'}
                                      </option>
                                      {linkableTasks.map((t) => (
                                        <option key={t.id} value={t.id}>
                                          {t.title} ({demoMatterReviewTaskStatusPresentation(t.status).label})
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      disabled={!selectedLinkTaskId}
                                      onClick={() => {
                                        if (!selectedLinkTaskId) return
                                        const findings = condoDiligence.findings.map((x) =>
                                          x.id === f.id
                                            ? withCondoDiligenceFindingLinkedReviewTaskId(x, selectedLinkTaskId)
                                            : x,
                                        )
                                        patchCondoDiligence(matterId, { findings })
                                        setFindingLinkSelectById((prev) => ({ ...prev, [f.id]: '' }))
                                      }}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: 6,
                                        border: '1px solid rgba(94,82,64,0.25)',
                                        background: selectedLinkTaskId ? '#fff' : '#f5f5f5',
                                        color: selectedLinkTaskId ? '#134252' : '#9aa8a1',
                                        fontWeight: 800,
                                        fontSize: 11,
                                        cursor: selectedLinkTaskId ? 'pointer' : 'not-allowed',
                                      }}
                                    >
                                      Link task
                                    </button>
                                  </div>
                                </label>
                              </div>
                              <div style={{ fontSize: 11, color: '#627c71', lineHeight: 1.4 }}>
                                Lawyer-controlled links only. Does not auto-create tasks, auto-resolve findings, or
                                share to the client portal.
                              </div>
                            </div>
                          )
                        })}
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
          <CreateCondoDiligenceSummaryReviewTaskModal
            open={Boolean(reviewTaskDocumentId)}
            document={
              reviewTaskDocumentId
                ? matterDocuments.find((d) => d.id === reviewTaskDocumentId) ?? null
                : null
            }
            staff={staff}
            initialTitle={reviewTaskPrefill?.title ?? null}
            initialInternalNote={reviewTaskPrefill?.internalNote ?? null}
            onClose={() => {
              setReviewTaskDocumentId(null)
              setReviewTaskLinkFindingId(null)
              setReviewTaskPrefill(null)
            }}
            onCreate={({ title, assignee_id, due_date, internal_note }) => {
              if (!effectiveMatter || !reviewTaskDocumentId) return
              const taskId = `review-task-${Date.now()}`
              addMatterReviewTask({
                id: taskId,
                matter_id: effectiveMatter.id,
                title,
                linked_document_id: reviewTaskDocumentId,
                assignee_id,
                due_date,
                internal_note,
              })
              if (reviewTaskLinkFindingId && condoDiligence) {
                const findings = condoDiligence.findings.map((x) =>
                  x.id === reviewTaskLinkFindingId
                    ? withCondoDiligenceFindingLinkedReviewTaskId(x, taskId)
                    : x,
                )
                patchCondoDiligence(effectiveMatter.id, { findings })
              }
              setReviewTaskDocumentId(null)
              setReviewTaskLinkFindingId(null)
              setReviewTaskPrefill(null)
              setActiveTab('Tasks')
            }}
          />
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

