'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { getDemoMatterById } from '@/lib/demo/demoMatters'
import { getDemoMatterDetailPath } from '@/lib/demo/demoMatterDetailRoutes'
import {
  canCommitMatterListAction,
  nextSelectedMatterIdAfterListChange,
  resolveMatterForListAction,
  resolveOpenMatterById,
} from '@/lib/demo/demoMattersListSelection'
import {
  buildDemoMattersListView,
  createDefaultDemoMattersListQuery,
  listDemoMatterOwners,
  listDemoMatterPropertyTypes,
  listDemoMatterStatuses,
  pageAfterDemoMattersFilterChange,
  type DemoMattersListQuery,
  type DemoMattersListSortKey,
} from '@/lib/demo/demoMattersListQuery'
import NewMatterModal, { getNextDemoFileId } from '@/app/demo/_components/NewMatterModal'
import MatterDetailModal from '@/components/demo/MatterDetailModal'
import MatterRowActionsMenu from '@/components/demo/MatterRowActionsMenu'
import AccessibleConfirmDialog from '@/components/a11y/AccessibleConfirmDialog'
import type { DemoCondoDiligenceMatterStatus, DemoMatter } from '@/lib/demo/types'
import { condoDiligenceMatterStatusPresentation, isCondoDiligenceEligible } from '@/lib/demo/condoDiligence'
import {
  condoDiligenceMatterDueAttentionPresentation,
  condoDiligenceMattersListReviewTaskChipPresentation,
} from '@/lib/demo/demoMatterReviewTask'
import { isFincenEligibleMatter } from '@/lib/demo/fincenEligibility'
import { getMatterPartyDisplayRows } from '@/lib/demo/matterPartyDisplay'
import { useSearchParams } from 'next/navigation'

function statusColor(status: DemoMatter['status']) {
  if (status === 'Closed/Post-Closing') return '#2f855a'
  if (status === 'Scheduled for Closing') return '#805ad5'
  if (status === 'Cleared to Close') return '#208096'
  if (status === 'Title Search') return '#975a16'
  return '#627c71'
}

function fincenListSignalPresentation(matter: DemoMatter): { label: string; bg: string; color: string; border: string } | null {
  if (!isFincenEligibleMatter(matter)) return null
  const completed = matter.fincen?.completedFields ?? 0
  if (completed >= 111) {
    return { label: 'AML · OK', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
  }
  return { label: 'AML · Attention', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
}

type MatterDetailInitialTab = 'Condo Diligence' | 'FinCEN / AML' | 'Tasks'

export default function DemoMattersPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading matters…</div>}>
      <DemoMattersContent />
    </Suspense>
  )
}

function DemoMattersContent() {
  const { matters, archiveMatter, archivedMatters, getCondoDiligence, matterReviewTasks, demoEpoch } =
    useDemoStore()

  const [hoveredMatterId, setHoveredMatterId] = useState<string | null>(null)
  /** Stable id only — always re-resolve from latest open matters before render/actions. */
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null)
  const [selectedMatterInitialTab, setSelectedMatterInitialTab] = useState<MatterDetailInitialTab | undefined>(undefined)
  const didOpenFromQueryRef = useRef(false)
  const [isNewMatterOpen, setIsNewMatterOpen] = useState(false)
  const [showDemoCreationDisabledBanner, setShowDemoCreationDisabledBanner] = useState(false)
  const [copiedMatterId, setCopiedMatterId] = useState<string | null>(null)
  const [listQuery, setListQuery] = useState<DemoMattersListQuery>(() => createDefaultDemoMattersListQuery())
  const [archiveConfirm, setArchiveConfirm] = useState<{
    matterId: string
    fileId: string
  } | null>(null)

  const searchParams = useSearchParams()
  const selectedMatterFromQuery = searchParams.get('matter')

  const nextDemoFileId = useMemo(() => {
    const allFileIds = [...matters, ...archivedMatters].map((m) => m.file_id)
    return getNextDemoFileId(allFileIds)
  }, [matters, archivedMatters])

  const statusOptions = useMemo(() => listDemoMatterStatuses(matters), [matters])
  const propertyTypeOptions = useMemo(() => listDemoMatterPropertyTypes(matters), [matters])
  const ownerOptions = useMemo(() => listDemoMatterOwners(matters), [matters])

  const listView = useMemo(
    () =>
      buildDemoMattersListView({
        matters,
        query: listQuery,
        reviewTasks: matterReviewTasks,
      }),
    [matters, listQuery, matterReviewTasks],
  )

  const visibleMatters = listView.filteredMatters
  const pageMatters = listView.pageMatters

  const selectedMatter = useMemo(
    () => resolveOpenMatterById(matters, selectedMatterId),
    [matters, selectedMatterId],
  )

  const updateListFilters = (patch: Partial<DemoMattersListQuery>) => {
    setListQuery((prev) => ({
      ...prev,
      ...patch,
      page: pageAfterDemoMattersFilterChange(),
    }))
  }

  const clearListFilters = () => {
    setListQuery((prev) =>
      createDefaultDemoMattersListQuery({
        sortKey: prev.sortKey,
        sortDirection: prev.sortDirection,
        pageSize: prev.pageSize,
      }),
    )
  }

  const openMatterDetail = (matterId: string, initialTab?: MatterDetailInitialTab) => {
    const latest = resolveOpenMatterById(matters, matterId)
    if (!latest) return
    setSelectedMatterInitialTab(initialTab)
    setSelectedMatterId(latest.id)
  }

  const clearMatterDetailSelection = () => {
    setSelectedMatterId(null)
    setSelectedMatterInitialTab(undefined)
  }

  const requestArchiveMatter = (matterId: string) => {
    const beforeConfirm = resolveMatterForListAction({ matterId, openMatters: matters })
    if (!beforeConfirm) {
      clearMatterDetailSelection()
      return
    }
    setArchiveConfirm({ matterId: beforeConfirm.id, fileId: beforeConfirm.file_id })
  }

  const cancelArchiveMatter = () => {
    setArchiveConfirm(null)
  }

  const confirmArchiveMatter = () => {
    if (!archiveConfirm) return
    const matterId = archiveConfirm.matterId
    setArchiveConfirm(null)
    const latest = resolveMatterForListAction({ matterId, openMatters: matters })
    if (!latest) {
      clearMatterDetailSelection()
      return
    }
    archiveMatter(latest.id)
    if (selectedMatterId === latest.id) clearMatterDetailSelection()
  }

  useEffect(() => {
    if (didOpenFromQueryRef.current) return
    if (!selectedMatterFromQuery) return
    // Prefer live store row; fall back to canonical seed identity for list/detail alignment.
    const canonical = getDemoMatterById(selectedMatterFromQuery)
    const match =
      matters.find(
        (m) =>
          m.file_id === selectedMatterFromQuery ||
          m.id === selectedMatterFromQuery ||
          (canonical != null && m.id === canonical.id),
      ) ?? null
    if (!match) return
    didOpenFromQueryRef.current = true
    setSelectedMatterId(match.id)
  }, [selectedMatterFromQuery, matters])

  useEffect(() => {
    if (!showDemoCreationDisabledBanner) return
    const t = window.setTimeout(() => setShowDemoCreationDisabledBanner(false), 8000)
    return () => window.clearTimeout(t)
  }, [showDemoCreationDisabledBanner])

  // Close modal / clear selection when the target is archived or filtered out of view.
  useEffect(() => {
    const nextId = nextSelectedMatterIdAfterListChange({
      selectedMatterId,
      openMatters: matters,
      visibleMatters,
    })
    if (nextId === selectedMatterId) return
    setSelectedMatterId(nextId)
    if (!nextId) setSelectedMatterInitialTab(undefined)
  }, [matters, visibleMatters, selectedMatterId])

  // Keep page clamped if the filtered set shrinks under the current page.
  useEffect(() => {
    if (listQuery.page === listView.page) return
    setListQuery((prev) => ({ ...prev, page: listView.page }))
  }, [listQuery.page, listView.page])

  // Reset list filters / selection when demo fixtures are restored.
  useEffect(() => {
    if (demoEpoch === 0) return
    setListQuery(createDefaultDemoMattersListQuery())
    clearMatterDetailSelection()
    setHoveredMatterId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: react only to demoEpoch
  }, [demoEpoch])

  const emptyStateMessage = (() => {
    if (matters.length === 0) return 'No open matters.'
    if (listQuery.openCondoReviewTasksOnly && listView.totalCount === 0 && !listView.hasActiveFilters) {
      return 'No matters with open condo review tasks.'
    }
    if (listView.totalCount === 0) return 'No matters match your search or filters.'
    return null
  })()

  return (
    <div className="demo-matters-a11y-scope">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Matters</h1>
          <p style={{ margin: 0, color: '#627c71' }}>Open matters for your demo firm.</p>
          <p style={{ marginTop: '6px', marginBottom: 0, color: '#627c71', fontSize: '12px' }}>
            Demo mode: edits persist in this browser after refresh. Use Reset demo data to restore fixtures.
          </p>
        </div>
        <button
          type="button"
          aria-label="Create new matter"
          style={{
            background: '#208096',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '6px',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          onClick={() => setIsNewMatterOpen(true)}
        >
          + New matter
        </button>
      </div>

      {showDemoCreationDisabledBanner && (
        <div
          role="alert"
          style={{
            marginBottom: '20px',
            padding: '14px 16px',
            border: '1px solid #f0b429',
            borderRadius: '8px',
            background: '#fff8e6',
            color: '#134252',
          }}
        >
          <strong>Demo mode:</strong> matter created in this browser for the demo session (persists after refresh).{' '}
          <Link href="/auth/signup" style={{ color: '#208096', fontWeight: 800, textDecoration: 'none' }}>
            Sign up to create real matters.
          </Link>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200, flex: '1 1 200px' }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#627c71' }}>Search</span>
          <input
            type="search"
            value={listQuery.search}
            onChange={(e) => updateListFilters({ search: e.target.value })}
            placeholder="File, party, property, owner…"
            aria-label="Search matters"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(94,82,64,0.2)',
              fontSize: 13,
              color: '#134252',
            }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#627c71' }}>Status</span>
          <select
            value={listQuery.status}
            onChange={(e) => updateListFilters({ status: e.target.value })}
            aria-label="Filter by status"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(94,82,64,0.2)',
              fontSize: 13,
              color: '#134252',
              background: '#fff',
            }}
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#627c71' }}>Property type</span>
          <select
            value={listQuery.propertyType}
            onChange={(e) => updateListFilters({ propertyType: e.target.value })}
            aria-label="Filter by property type"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(94,82,64,0.2)',
              fontSize: 13,
              color: '#134252',
              background: '#fff',
            }}
          >
            <option value="">All types</option>
            {propertyTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#627c71' }}>Owner</span>
          <select
            value={listQuery.owner}
            onChange={(e) => updateListFilters({ owner: e.target.value })}
            aria-label="Filter by owner"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(94,82,64,0.2)',
              fontSize: 13,
              color: '#134252',
              background: '#fff',
            }}
          >
            <option value="">All owners</option>
            {ownerOptions.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#627c71' }}>Sort</span>
          <select
            value={`${listQuery.sortKey}:${listQuery.sortDirection}`}
            onChange={(e) => {
              const [sortKey, sortDirection] = e.target.value.split(':') as [
                DemoMattersListSortKey,
                'asc' | 'desc',
              ]
              setListQuery((prev) => ({ ...prev, sortKey, sortDirection }))
            }}
            aria-label="Sort matters"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(94,82,64,0.2)',
              fontSize: 13,
              color: '#134252',
              background: '#fff',
            }}
          >
            <option value="file_id:asc">File (A–Z)</option>
            <option value="file_id:desc">File (Z–A)</option>
            <option value="closing_date:asc">Closing (earliest)</option>
            <option value="closing_date:desc">Closing (latest)</option>
            <option value="status:asc">Status (A–Z)</option>
            <option value="property_type:asc">Property type (A–Z)</option>
          </select>
        </label>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 800,
            color: '#134252',
            cursor: 'pointer',
            userSelect: 'none',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(94,82,64,0.2)',
            background: listQuery.openCondoReviewTasksOnly ? '#f0f7f8' : '#fff',
            alignSelf: 'flex-end',
          }}
        >
          <input
            type="checkbox"
            checked={listQuery.openCondoReviewTasksOnly}
            onChange={(e) => updateListFilters({ openCondoReviewTasksOnly: e.target.checked })}
            aria-label="Open condo review tasks"
            style={{ width: 16, height: 16 }}
          />
          Open condo review tasks
        </label>
        {listView.hasActiveFilters ? (
          <button
            type="button"
            onClick={clearListFilters}
            style={{
              alignSelf: 'flex-end',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(94,82,64,0.25)',
              background: '#fff',
              color: '#134252',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Clear filters
          </button>
        ) : null}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 12, color: '#627c71', fontWeight: 700 }}>
          {listView.totalCount} matter{listView.totalCount === 1 ? '' : 's'}
          {listView.hasActiveFilters ? ' matching filters' : ''}
          {listView.pageCount > 1
            ? ` · Page ${listView.page} of ${listView.pageCount}`
            : ''}
        </span>
        {listQuery.openCondoReviewTasksOnly ? (
          <span style={{ fontSize: 12, color: '#627c71', fontWeight: 700 }}>
            Showing matters with open or in-review internal Condo Diligence summary review tasks.
          </span>
        ) : null}
      </div>

      <div
        style={{
          position: 'relative',
          background: 'white',
          borderRadius: '8px',
          border: '1px solid rgba(94,82,64,0.2)',
          overflowX: 'auto',
        }}
      >
        {emptyStateMessage ? (
          <div
            role="status"
            style={{ padding: 24, color: '#627c71', fontSize: 14, fontWeight: 700 }}
          >
            {emptyStateMessage}
            {listView.hasActiveFilters ? (
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  onClick={clearListFilters}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(94,82,64,0.25)',
                    background: '#fff',
                    color: '#208096',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <table
            style={{ width: '100%', borderCollapse: 'collapse' }}
            aria-label="Open demo matters"
          >
            <caption
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              Open demo matters list
            </caption>
            <thead>
              <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
                <th scope="col" style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>
                  File
                </th>
                <th scope="col" style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>
                  Parties
                </th>
                <th scope="col" style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>
                  Property
                </th>
                <th scope="col" style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>
                  Closing
                </th>
                <th scope="col" style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>
                  Status
                </th>
                <th scope="col" style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pageMatters.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => {
                    openMatterDetail(m.id)
                  }}
                  onMouseEnter={() => setHoveredMatterId(m.id)}
                  onMouseLeave={() => setHoveredMatterId(null)}
                  style={{
                    borderBottom: '1px solid rgba(94,82,64,0.12)',
                    cursor: 'pointer',
                    background: hoveredMatterId === m.id ? 'rgba(32, 128, 150, 0.07)' : 'white',
                  }}
                >
                  {(() => {
                    const partyRows = getMatterPartyDisplayRows(m)
                    const condoEligible = isCondoDiligenceEligible(m)
                    const condoRow = condoEligible ? getCondoDiligence(m.id) : undefined
                    const condoStatus: DemoCondoDiligenceMatterStatus = condoRow?.status ?? 'not_started'
                    const condoChip = condoEligible ? condoDiligenceMatterStatusPresentation(condoStatus) : null
                    const fincenChip = fincenListSignalPresentation(m)
                    const reviewTaskChip = condoDiligenceMattersListReviewTaskChipPresentation(
                      matterReviewTasks,
                      m.id,
                    )
                    const reviewDueAttention = condoDiligenceMatterDueAttentionPresentation(
                      matterReviewTasks,
                      m.id,
                      new Date(),
                    )
                    const condoNeedsAttention = condoEligible && condoStatus !== 'cleared'
                    const fincenNeedsAttention = isFincenEligibleMatter(m) && (m.fincen?.completedFields ?? 0) < 111
                    const complianceInitialTab: MatterDetailInitialTab | undefined = condoNeedsAttention
                      ? 'Condo Diligence'
                      : fincenNeedsAttention
                        ? 'FinCEN / AML'
                        : undefined
                    const actionItems = [
                      ...(complianceInitialTab
                        ? [
                            {
                              id: 'review-compliance',
                              label: 'Review compliance',
                              onSelect: () => openMatterDetail(m.id, complianceInitialTab),
                            },
                          ]
                        : []),
                      ...(reviewTaskChip
                        ? [
                            {
                              id: 'review-tasks',
                              label: 'Review tasks',
                              onSelect: () => openMatterDetail(m.id, 'Tasks'),
                            },
                          ]
                        : []),
                      {
                        id: 'copy-portal',
                        label: copiedMatterId === m.id ? 'Portal link copied' : 'Copy portal link',
                        onSelect: () => {
                          const latest = resolveMatterForListAction({
                            matterId: m.id,
                            openMatters: matters,
                          })
                          if (!latest) return
                          void navigator.clipboard.writeText(
                            `${window.location.origin}/demo/portal/${latest.portal_token}`,
                          )
                          setCopiedMatterId(latest.id)
                          window.setTimeout(
                            () => setCopiedMatterId((prev) => (prev === latest.id ? null : prev)),
                            2000,
                          )
                        },
                      },
                      {
                        id: 'archive',
                        label: 'Archive',
                        destructive: true,
                        disabled: !canCommitMatterListAction({ matterId: m.id, openMatters: matters }),
                        onSelect: () => requestArchiveMatter(m.id),
                      },
                    ]
                    return (
                      <>
                        <td style={{ padding: '14px', color: '#134252', fontWeight: 800 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Link
                              href={getDemoMatterDetailPath(m.file_id)}
                              aria-label={`Open matter ${m.file_id}`}
                              style={{ color: '#208096', textDecoration: 'underline' }}
                              onClick={(e) => {
                                // Prefer the in-page modal for plain left-clicks; keep href for new tab / copy link.
                                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                                e.preventDefault()
                                e.stopPropagation()
                                openMatterDetail(m.id)
                              }}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              {m.file_id}
                            </Link>
                            {condoChip && (
                              <span
                                title="Condo diligence (demo)"
                                aria-label={`Condo diligence: ${condoChip.label}`}
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: '999px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  letterSpacing: '0.02em',
                                  background: condoChip.bg,
                                  color: condoChip.color,
                                  border: `1px solid ${condoChip.border}`,
                                }}
                              >
                                Condo · {condoChip.label}
                              </span>
                            )}
                            {fincenChip && (
                              <span
                                title="AML / FinCEN (demo)"
                                aria-label={fincenChip.label}
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: '999px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  letterSpacing: '0.02em',
                                  background: fincenChip.bg,
                                  color: fincenChip.color,
                                  border: `1px solid ${fincenChip.border}`,
                                }}
                              >
                                {fincenChip.label}
                              </span>
                            )}
                            {reviewTaskChip && (
                              <>
                                <span
                                  title={`${reviewTaskChip.fullLabel} (internal triage — not a compliance determination)`}
                                  aria-label={reviewTaskChip.fullLabel}
                                  style={{
                                    display: 'inline-block',
                                    padding: '3px 8px',
                                    borderRadius: '999px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    letterSpacing: '0.02em',
                                    background: reviewTaskChip.bg,
                                    color: reviewTaskChip.color,
                                    border: `1px solid ${reviewTaskChip.border}`,
                                  }}
                                >
                                  <span className="condo-review-chip-compact" aria-hidden="true">
                                    {reviewTaskChip.compactLabel}
                                  </span>
                                  <span className="condo-review-chip-full" style={{ display: 'none' }}>
                                    {reviewTaskChip.fullLabel}
                                  </span>
                                </span>
                                {reviewDueAttention ? (
                                  <span
                                    title="Internal task timing only — not a statutory, legal, or closing deadline."
                                    aria-label={reviewDueAttention.label}
                                    style={{
                                      display: 'inline-block',
                                      padding: '3px 8px',
                                      borderRadius: '999px',
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      letterSpacing: '0.02em',
                                      background: reviewDueAttention.bg,
                                      color: reviewDueAttention.color,
                                      border: `1px solid ${reviewDueAttention.border}`,
                                    }}
                                  >
                                    {reviewDueAttention.label}
                                  </span>
                                ) : null}
                              </>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px', color: '#134252' }}>
                          {partyRows.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {partyRows.map((row) => (
                                <div key={`${m.id}-${row.label}`}>
                                  <span style={{ fontWeight: 700 }}>{row.value}</span>
                                  <span style={{ color: '#627c71', fontSize: '12px', marginLeft: 6 }}>{row.label}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: '#627c71', fontSize: '12px' }}>No parties added</div>
                          )}
                        </td>
                        <td style={{ padding: '14px', color: '#134252' }}>
                          <div style={{ fontWeight: 700 }}>{m.property.property_type}</div>
                          <div style={{ color: '#627c71', fontSize: '12px' }}>{m.property.address}</div>
                        </td>
                        <td style={{ padding: '14px', color: '#627c71' }}>
                          <time dateTime={m.key_dates.closing_date}>
                            {new Date(m.key_dates.closing_date).toLocaleDateString()}
                          </time>
                        </td>
                        <td style={{ padding: '14px', color: statusColor(m.status), fontWeight: 800 }}>{m.status}</td>
                        <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                          <MatterRowActionsMenu
                            matterId={m.id}
                            matterFileId={m.file_id}
                            items={actionItems}
                          />
                        </td>
                      </>
                    )
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {listView.pageCount > 1 && !emptyStateMessage ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 12,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            disabled={listView.page <= 1}
            onClick={() =>
              setListQuery((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
            aria-label="Previous page"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(94,82,64,0.25)',
              background: '#fff',
              color: '#134252',
              fontWeight: 800,
              fontSize: 13,
              cursor: listView.page <= 1 ? 'not-allowed' : 'pointer',
              opacity: listView.page <= 1 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: 12, color: '#627c71', fontWeight: 700 }}>
            Page {listView.page} of {listView.pageCount}
          </span>
          <button
            type="button"
            disabled={listView.page >= listView.pageCount}
            onClick={() =>
              setListQuery((prev) => ({
                ...prev,
                page: Math.min(listView.pageCount, prev.page + 1),
              }))
            }
            aria-label="Next page"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(94,82,64,0.25)',
              background: '#fff',
              color: '#134252',
              fontWeight: 800,
              fontSize: 13,
              cursor: listView.page >= listView.pageCount ? 'not-allowed' : 'pointer',
              opacity: listView.page >= listView.pageCount ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      ) : null}

      <style>{`
        @media (min-width: 1100px) {
          .condo-review-chip-compact { display: none !important; }
          .condo-review-chip-full { display: inline !important; }
        }
        .demo-matters-a11y-scope button:focus-visible,
        .demo-matters-a11y-scope a:focus-visible,
        .demo-matters-a11y-scope select:focus-visible,
        .demo-matters-a11y-scope input:focus-visible {
          outline: 2px solid #208096;
          outline-offset: 2px;
        }
      `}</style>
      {archivedMatters.length > 0 && (
        <p style={{ marginTop: '10px', fontSize: '12px', color: '#627c71' }}>
          {archivedMatters.length} matter(s) archived in this demo session.{' '}
          <Link href="/demo/archive/matters" style={{ color: '#208096' }}>
            View Archive
          </Link>
        </p>
      )}

      <AccessibleConfirmDialog
        open={archiveConfirm != null}
        destructive
        title={
          archiveConfirm
            ? `Archive matter ${archiveConfirm.fileId}?`
            : 'Archive matter?'
        }
        description={
          archiveConfirm
            ? `Archive ${archiveConfirm.fileId}? In demo mode it stays archived in this browser after refresh. Use Reset demo data to restore fixtures.`
            : 'Archive this matter?'
        }
        confirmLabel="Archive matter"
        cancelLabel="Cancel"
        onConfirm={confirmArchiveMatter}
        onCancel={cancelArchiveMatter}
      />

      <NewMatterModal
        isOpen={isNewMatterOpen}
        onClose={() => setIsNewMatterOpen(false)}
        nextFileId={nextDemoFileId}
        onCreateDemo={() => {
          setIsNewMatterOpen(false)
          setShowDemoCreationDisabledBanner(true)
        }}
      />

      <MatterDetailModal
        matter={selectedMatter}
        open={selectedMatter !== null}
        initialTab={selectedMatterInitialTab}
        onClose={clearMatterDetailSelection}
        onArchive={(id) => {
          const latest = resolveMatterForListAction({ matterId: id, openMatters: matters })
          if (!latest) {
            clearMatterDetailSelection()
            return
          }
          archiveMatter(latest.id)
          clearMatterDetailSelection()
        }}
      />
    </div>
  )
}
