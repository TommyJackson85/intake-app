'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import type {
  DemoCondoDiligenceDocStatus,
  DemoCondoDiligenceMatterStatus,
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
  condoDiligenceMatterStatusPresentation,
  condoRequiredDocMatchesLinkageHaystack,
  condoRequiredDocDerivedStatusPresentation,
  deriveCondoRequiredDocumentStatus,
  isCondoDiligenceUntouched,
  isCondoDiligenceEligible,
  syncRequiredDocumentsFromDerivedLinkage,
} from '@/lib/demo/condoDiligence'

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
    addDemoDocumentRequest,
    getMatterById,
    getArchivedMatterById,
    ensureCondoDiligence,
    getCondoDiligence,
    patchCondoDiligence,
  } = useDemoStore()
  const [activeTab, setActiveTab] = useState<MatterDetailTab>('Overview')
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false)

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
  const condoDocPackSummary = useMemo(() => {
    if (!condoDiligence || !effectiveMatter) return null
    let received = 0
    let requested = 0
    let outstanding = 0
    for (const doc of condoDiligence.requiredDocuments) {
      const derived = deriveCondoRequiredDocumentStatus({
        matterId: effectiveMatter.id,
        condoDocId: doc.id,
        storedStatus: doc.status,
        documents: matterDocuments,
        documentRequests: matterDocumentRequests,
      })
      if (derived === 'received') received += 1
      else if (derived === 'requested') requested += 1
      else outstanding += 1
    }
    return { received, requested, outstanding, total: condoDiligence.requiredDocuments.length }
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
                            <div style={{ color: '#627c71', fontWeight: 800, fontSize: '12px', marginBottom: '8px' }}>{doc.category}</div>
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
                  {condoDocPackSummary && (
                    <div
                      style={{
                        border: '1px solid rgba(94,82,64,0.12)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        background: 'white',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 900, color: '#134252' }}>
                        Condo doc pack
                      </span>
                      <span style={{ fontSize: 11, color: '#2f855a', fontWeight: 800 }}>
                        Received: {condoDocPackSummary.received}
                      </span>
                      <span style={{ fontSize: 11, color: '#1e40af', fontWeight: 800 }}>
                        Requested: {condoDocPackSummary.requested}
                      </span>
                      <span style={{ fontSize: 11, color: '#b45309', fontWeight: 800 }}>
                        Outstanding: {condoDocPackSummary.outstanding}
                      </span>
                      <span style={{ fontSize: 11, color: '#627c71', marginLeft: 'auto' }}>
                        {condoDocPackSummary.total} total
                      </span>
                    </div>
                  )}

                  <div style={{ border: '1px solid rgba(94,82,64,0.12)', borderRadius: 8, padding: 14, background: 'white' }}>
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

