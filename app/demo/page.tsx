'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDemoStore } from '@/lib/demo/store'
import type { DemoMatter } from '@/lib/demo/types'
import NewMatterModal, { getNextDemoFileId } from '@/app/demo/_components/NewMatterModal'
import DemoTaskChecklist from '@/components/demo/DemoTaskChecklist'
import DemoTimelineNotes from '@/components/demo/DemoTimelineNotes'
import NewIntakeDemoModal from './_components/NewIntakeDemoModal'
import SystemContractMapCard from './_components/SystemContractMapCard'
import { getMatterPartyDisplayRows } from '@/lib/demo/matterPartyDisplay'
import {
  buildCondoDiligenceWorkQueueRows,
  collectCondoDiligenceWorkQueueOpenPrimaryTaskIds,
  condoDiligenceReviewTaskDueAttentionPresentation,
  countCondoDiligenceWorkQueueDueSoon,
  demoMatterReviewTaskStatusPresentation,
  filterCondoDiligenceWorkQueueRows,
  formatCondoDiligenceDueSoonCountLabel,
  type CondoDiligenceWorkQueueViewFilter,
} from '@/lib/demo/demoMatterReviewTask'

function statusColor(status: DemoMatter['status']) {
  if (status === 'Closed/Post-Closing') return '#2f855a'
  if (status === 'Scheduled for Closing') return '#805ad5'
  if (status === 'Cleared to Close') return '#208096'
  if (status === 'Title Search') return '#975a16'
  return '#627c71'
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading demo…</div>}>
      <DemoPageContent />
    </Suspense>
  )
}

function DemoPageContent() {
  const { demoFirm, staff, matters, archivedMatters, matterReviewTasks, updateMatterStatus, updateMatterReviewTasksStatus } =
    useDemoStore()
  const [selectedMatterId, setSelectedMatterId] = useState(mattersDefault(matters))
  const [isNewMatterOpen, setIsNewMatterOpen] = useState(false)
  const [showDemoCreationDisabledBanner, setShowDemoCreationDisabledBanner] = useState(false)
  const [isNewIntakeOpen, setIsNewIntakeOpen] = useState(false)
  const [showDemoIntakeDisabledBanner, setShowDemoIntakeDisabledBanner] = useState(false)
  const [workQueueFilter, setWorkQueueFilter] = useState<CondoDiligenceWorkQueueViewFilter>('all_active')
  const [selectedWorkQueueMatterIds, setSelectedWorkQueueMatterIds] = useState<string[]>([])
  const [workQueueBulkFeedback, setWorkQueueBulkFeedback] = useState<string | null>(null)
  /** Demo has no session current-user identity; Assigned to me stays disabled until one exists. */
  const demoCurrentStaffId: string | null = null

  const searchParams = useSearchParams()
  const selectedMatterFromQuery = searchParams.get('matter')

  const detailPanelRef = useRef<HTMLElement | null>(null)
  const didScrollForQueryRef = useRef(false)

  const selectedMatter = useMemo(
    () => matters.find((m) => m.id === selectedMatterId) ?? matters[0],
    [matters, selectedMatterId]
  )

  const nextDemoFileId = useMemo(() => {
    const allFileIds = [...matters, ...archivedMatters].map((m) => m.file_id)
    return getNextDemoFileId(allFileIds)
  }, [matters, archivedMatters])

  useEffect(() => {
    if (!selectedMatterFromQuery) return
    const match = matters.find((m) => m.file_id === selectedMatterFromQuery)
    if (!match) return
    setSelectedMatterId(match.id)
    if (typeof window !== 'undefined' && window.innerWidth < 768 && !didScrollForQueryRef.current) {
      didScrollForQueryRef.current = true
      window.requestAnimationFrame(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [selectedMatterFromQuery, matters])

  useEffect(() => {
    if (matters.length === 0) return
    setSelectedMatterId((id) => (matters.some((m) => m.id === id) ? id : matters[0].id))
  }, [matters])

  // Reset scroll trigger when the query changes.
  useEffect(() => {
    didScrollForQueryRef.current = false
  }, [selectedMatterFromQuery])

  useEffect(() => {
    if (!showDemoCreationDisabledBanner) return
    const t = window.setTimeout(() => setShowDemoCreationDisabledBanner(false), 8000)
    return () => window.clearTimeout(t)
  }, [showDemoCreationDisabledBanner])

  useEffect(() => {
    if (!showDemoIntakeDisabledBanner) return
    const t = window.setTimeout(() => setShowDemoIntakeDisabledBanner(false), 8000)
    return () => window.clearTimeout(t)
  }, [showDemoIntakeDisabledBanner])

  const condoDiligenceWorkQueue = useMemo(
    () => buildCondoDiligenceWorkQueueRows(matters, matterReviewTasks),
    [matters, matterReviewTasks],
  )
  const workQueueNow = useMemo(() => new Date(), [matters, matterReviewTasks])
  const visibleCondoDiligenceWorkQueue = useMemo(
    () =>
      filterCondoDiligenceWorkQueueRows(condoDiligenceWorkQueue, workQueueFilter, {
        now: workQueueNow,
        currentStaffId: demoCurrentStaffId,
      }),
    [condoDiligenceWorkQueue, workQueueFilter, demoCurrentStaffId, workQueueNow],
  )
  const workQueueDueSoonCountLabel = useMemo(
    () => formatCondoDiligenceDueSoonCountLabel(countCondoDiligenceWorkQueueDueSoon(condoDiligenceWorkQueue, workQueueNow)),
    [condoDiligenceWorkQueue, workQueueNow],
  )

  const selectedVisibleWorkQueueRows = useMemo(
    () => visibleCondoDiligenceWorkQueue.filter((row) => selectedWorkQueueMatterIds.includes(row.matterId)),
    [visibleCondoDiligenceWorkQueue, selectedWorkQueueMatterIds],
  )
  const selectedOpenPrimaryTaskIds = useMemo(
    () => collectCondoDiligenceWorkQueueOpenPrimaryTaskIds(selectedVisibleWorkQueueRows),
    [selectedVisibleWorkQueueRows],
  )
  const allVisibleSelected =
    visibleCondoDiligenceWorkQueue.length > 0 &&
    visibleCondoDiligenceWorkQueue.every((row) => selectedWorkQueueMatterIds.includes(row.matterId))

  useEffect(() => {
    const visibleIds = new Set(visibleCondoDiligenceWorkQueue.map((row) => row.matterId))
    setSelectedWorkQueueMatterIds((prev) => prev.filter((id) => visibleIds.has(id)))
  }, [visibleCondoDiligenceWorkQueue])

  useEffect(() => {
    if (!workQueueBulkFeedback) return
    const t = window.setTimeout(() => setWorkQueueBulkFeedback(null), 2500)
    return () => window.clearTimeout(t)
  }, [workQueueBulkFeedback])

  if (!selectedMatter) {
    return (
      <div>
        <div style={{ background: 'white', border: '1px solid rgba(94,82,64,0.2)', borderRadius: '8px', padding: '20px' }}>
          <h2 style={{ marginTop: 0 }}>No active matters</h2>
          <p style={{ color: '#627c71', marginBottom: 0 }}>
            All demo matters may be archived for this session. Refresh the page to restore seeded demo data.
          </p>
        </div>
        <SystemContractMapCard />
      </div>
    )
  }

  const closingsNext7 = matters.filter((m) => {
    const closing = new Date(m.key_dates.closing_date).getTime()
    const now = new Date().getTime()
    const in7 = now + 7 * 24 * 60 * 60 * 1000
    return closing >= now && closing <= in7
  }).length

  const inProgressTasks = matters.flatMap((m) => m.tasks).filter((t) => t.status === 'in_progress').length
  const awaitingTasks = matters.flatMap((m) => m.tasks).filter((t) => t.status === 'not_started').length
  const selectedMatterPartyRows = getMatterPartyDisplayRows(selectedMatter)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Dashboard</h1>
          <p style={{ margin: 0, color: '#627c71', fontSize: '14px' }}>Your worklist and key dates for the next 7 days.</p>
          <p style={{ margin: '10px 0 0', color: '#627c71', fontSize: '13px', maxWidth: '52rem', lineHeight: 1.55 }}>
            <strong style={{ color: '#134252' }}>New intake link</strong> captures a lead and optional pseudo-send (saved under Intake / Leads).
            <strong style={{ color: '#134252' }}> New matter</strong> opens a file directly in this demo session. Use the table for a quick
            snapshot; <strong style={{ color: '#134252' }}>full workspace</strong> covers documents, missing-doc requests, client portal, and
            compliance (FinCEN / condo).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" style={actionBtn('#208096', 'white')} onClick={() => setIsNewIntakeOpen(true)}>
            + New intake link
          </button>
          <button type="button" style={actionBtn('rgba(94, 82, 64, 0.12)', '#134252')} onClick={() => setIsNewMatterOpen(true)}>
            + New matter
          </button>
        </div>
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
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <strong>Demo mode:</strong> matter created in-memory for this session.{' '}
            <Link href="/auth/signup" style={{ color: '#208096', fontWeight: 800, textDecoration: 'none' }}>
              Sign up to create real matters.
            </Link>
          </div>
        </div>
      )}

      {showDemoIntakeDisabledBanner && (
        <div
          role="alert"
          style={{
            marginBottom: '20px',
            padding: '14px 16px',
            border: '1px solid #f0b429',
            borderRadius: '8px',
            background: '#fff8e6',
            color: '#134252',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <strong>Demo mode:</strong> intake saved to{' '}
            <Link href="/demo/intakes" style={{ color: '#208096', fontWeight: 800, textDecoration: 'none' }}>
              Intake / Leads
            </Link>{' '}
            (this browser session). Use &quot;Send and save (Demo)&quot; for a pseudo-email or &quot;Generate intake link and save (Demo)&quot; for link-only.{' '}
            <Link href="/auth/signup" style={{ color: '#208096', fontWeight: 800, textDecoration: 'none' }}>
              Sign up for real intakes.
            </Link>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '18px',
        }}
      >
        {[
          { label: 'Open matters', value: matters.length },
          { label: 'Tasks in progress', value: inProgressTasks },
          { label: 'Closings (next 7 days)', value: closingsNext7 },
          { label: 'Tasks not started', value: awaitingTasks },
        ].map((stat) => (
          <div key={stat.label} style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid rgba(94,82,64,0.2)' }}>
            <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '10px' }}>{stat.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#208096' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'white',
          border: '1px solid rgba(94,82,64,0.2)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            marginBottom: 10,
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, color: '#134252' }}>Condo Diligence Work Queue</h2>
            <p style={{ margin: 0, color: '#627c71', fontSize: 13, lineHeight: 1.45, maxWidth: '46rem' }}>
              Internal triage for matters with open or in-review Condo Diligence summary review tasks. Not a
              compliance determination or closing-readiness signal.
            </p>
            {workQueueDueSoonCountLabel ? (
              <div style={{ marginTop: 8 }}>
                <span
                  title="Due soon includes overdue tasks and tasks due in the next 7 days. Not a legal or closing deadline."
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    background: '#fff4d6',
                    color: '#b45309',
                    border: '1px solid rgba(240,180,41,0.35)',
                  }}
                >
                  {workQueueDueSoonCountLabel}
                </span>
              </div>
            ) : null}
          </div>
          <Link
            href="/demo/matters"
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#208096',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Open matters list →
          </Link>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            marginBottom: 10,
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}
            role="group"
            aria-label="Condo Diligence Work Queue filters"
          >
            {(
              [
                { id: 'all_active' as const, label: 'All active', disabled: false },
                {
                  id: 'assigned_to_me' as const,
                  label: 'Assigned to me',
                  disabled: !demoCurrentStaffId,
                },
                { id: 'due_soon' as const, label: 'Due soon', disabled: false },
              ] as const
            ).map((opt) => {
              const active = workQueueFilter === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={opt.disabled}
                  title={
                    opt.disabled
                      ? 'Assigned to me needs a demo current-user staff ID. Demo mode has no signed-in identity yet.'
                      : opt.id === 'due_soon'
                        ? 'Due soon includes overdue tasks and tasks due in the next 7 days.'
                        : undefined
                  }
                  onClick={() => {
                    if (opt.disabled) return
                    setWorkQueueFilter(opt.id)
                  }}
                  aria-pressed={active}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border: active ? '1px solid #208096' : '1px solid rgba(94,82,64,0.25)',
                    background: opt.disabled ? '#f5f5f5' : active ? '#e8f4f7' : '#fff',
                    color: opt.disabled ? '#9aa8a1' : active ? '#134252' : '#627c71',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            disabled={selectedOpenPrimaryTaskIds.length === 0}
            title={
              selectedVisibleWorkQueueRows.length === 0
                ? 'Select one or more queue rows first'
                : selectedOpenPrimaryTaskIds.length === 0
                  ? 'Selected rows have no open primary review tasks to start (already in review are skipped)'
                  : `Mark ${selectedOpenPrimaryTaskIds.length} open primary review task${
                      selectedOpenPrimaryTaskIds.length === 1 ? '' : 's'
                    } as in review`
            }
            onClick={() => {
              const taskIds = selectedOpenPrimaryTaskIds
              if (taskIds.length === 0) return
              const ok = window.confirm(
                `Mark ${taskIds.length} open review task${taskIds.length === 1 ? '' : 's'} as in review? Already in-review tasks are left unchanged.`,
              )
              if (!ok) return
              const updated = updateMatterReviewTasksStatus(taskIds, 'in_review')
              setSelectedWorkQueueMatterIds([])
              setWorkQueueBulkFeedback(
                updated === 0
                  ? 'No open review tasks needed updating.'
                  : `Marked ${updated} review task${updated === 1 ? '' : 's'} as in review.`,
              )
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid rgba(94,82,64,0.25)',
              background: selectedOpenPrimaryTaskIds.length === 0 ? '#f5f5f5' : '#134252',
              color: selectedOpenPrimaryTaskIds.length === 0 ? '#9aa8a1' : '#fff',
              fontWeight: 800,
              fontSize: 12,
              cursor: selectedOpenPrimaryTaskIds.length === 0 ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Mark selected as in review
          </button>
        </div>
        {workQueueBulkFeedback ? (
          <div
            role="status"
            style={{
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 8,
              padding: '8px 10px',
              borderRadius: 8,
              background: '#edf7f0',
              color: '#2f855a',
              border: '1px solid rgba(47,133,90,0.25)',
            }}
          >
            {workQueueBulkFeedback}
          </div>
        ) : null}
        {workQueueFilter === 'due_soon' ? (
          <div style={{ fontSize: 12, color: '#627c71', fontWeight: 700, marginBottom: 8 }}>
            Due soon includes overdue tasks and tasks due in the next 7 days.
          </div>
        ) : null}
        {workQueueFilter === 'assigned_to_me' && !demoCurrentStaffId ? (
          <div style={{ fontSize: 12, color: '#627c71', fontWeight: 700, marginBottom: 8 }}>
            Assigned to me is unavailable until demo mode has a current-user staff identity.
          </div>
        ) : null}

        {condoDiligenceWorkQueue.length === 0 ? (
          <div style={{ color: '#627c71', fontSize: 13, fontWeight: 700, padding: '6px 0' }}>
            No open condo review tasks right now.
          </div>
        ) : visibleCondoDiligenceWorkQueue.length === 0 ? (
          <div style={{ color: '#627c71', fontSize: 13, fontWeight: 700, padding: '6px 0' }}>
            {workQueueFilter === 'due_soon'
              ? 'No condo review tasks due soon.'
              : workQueueFilter === 'assigned_to_me'
                ? 'No condo review tasks assigned to you.'
                : 'No matching condo review tasks.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr style={{ background: '#fcfcf9' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, width: 36 }}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedVisibleWorkQueueRows.length > 0 && !allVisibleSelected
                        }
                      }}
                      onChange={() => {
                        if (allVisibleSelected) {
                          setSelectedWorkQueueMatterIds((prev) =>
                            prev.filter((id) => !visibleCondoDiligenceWorkQueue.some((r) => r.matterId === id)),
                          )
                        } else {
                          setSelectedWorkQueueMatterIds((prev) => {
                            const next = new Set(prev)
                            for (const row of visibleCondoDiligenceWorkQueue) next.add(row.matterId)
                            return Array.from(next)
                          })
                        }
                      }}
                      aria-label="Select all visible work queue rows"
                    />
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }}>Matter</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }}>Review signal</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }}>Assignee</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }}>Due</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12 }} />
                </tr>
              </thead>
              <tbody>
                {visibleCondoDiligenceWorkQueue.map((row) => {
                  const assignee =
                    staff.find((s) => s.id === row.primaryTask.assignee_id)?.full_name ??
                    (row.primaryTask.assignee_id ? row.primaryTask.assignee_id : 'Unassigned')
                  const statusPresent = demoMatterReviewTaskStatusPresentation(row.primaryTask.status)
                  const dueAttention = condoDiligenceReviewTaskDueAttentionPresentation(
                    row.primaryTask.due_date,
                    workQueueNow,
                  )
                  const rowSelected = selectedWorkQueueMatterIds.includes(row.matterId)
                  return (
                    <tr
                      key={row.matterId}
                      onClick={() => setSelectedMatterId(row.matterId)}
                      style={{
                        borderTop: '1px solid rgba(94,82,64,0.12)',
                        cursor: 'pointer',
                        background:
                          row.matterId === selectedMatter.id
                            ? '#f7fbfc'
                            : rowSelected
                              ? '#faf8f4'
                              : 'white',
                      }}
                    >
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <input
                          type="checkbox"
                          checked={rowSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => {
                            setSelectedWorkQueueMatterIds((prev) =>
                              prev.includes(row.matterId)
                                ? prev.filter((id) => id !== row.matterId)
                                : [...prev, row.matterId],
                            )
                          }}
                          aria-label={`Select ${row.fileId}`}
                        />
                      </td>
                      <td style={{ padding: '12px', color: '#134252', fontWeight: 700, verticalAlign: 'top' }}>
                        {row.fileId}
                        <div style={{ color: '#627c71', fontWeight: 500, fontSize: 12, marginTop: 2 }}>
                          {row.propertyAddress}
                        </div>
                        <div style={{ color: '#9aa8a1', fontWeight: 600, fontSize: 11, marginTop: 2 }}>
                          {row.matterStatus}
                        </div>
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <span
                          title={row.chip.fullLabel}
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                            background: row.chip.bg,
                            color: row.chip.color,
                            border: `1px solid ${row.chip.border}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.chip.compactLabel}
                        </span>
                        <div style={{ color: '#627c71', fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                          {row.chip.fullLabel}
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: '#134252', fontSize: 13, fontWeight: 700, verticalAlign: 'top' }}>
                        {assignee}
                      </td>
                      <td style={{ padding: '12px', color: '#627c71', fontSize: 13, fontWeight: 700, verticalAlign: 'top' }}>
                        <div>{row.primaryTask.due_date || 'None'}</div>
                        {dueAttention ? (
                          <span
                            title="Internal task timing only — not a statutory, legal, or closing deadline."
                            style={{
                              display: 'inline-block',
                              marginTop: 4,
                              padding: '2px 6px',
                              borderRadius: 999,
                              fontSize: 10,
                              fontWeight: 800,
                              background: dueAttention.bg,
                              color: dueAttention.color,
                              border: `1px solid ${dueAttention.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {dueAttention.label}
                          </span>
                        ) : null}
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                            background: statusPresent.bg,
                            color: statusPresent.color,
                            border: `1px solid ${statusPresent.border}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {statusPresent.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                        <Link
                          href={`/demo/matters?matter=${encodeURIComponent(row.fileId)}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: '#208096',
                            textDecoration: 'none',
                          }}
                        >
                          Open workspace →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '20px' }}>
        <section>
        <h2 style={{ marginBottom: '8px', fontSize: '24px' }}>Matter worklist</h2>
        <p style={{ marginTop: 0, color: '#627c71' }}>
          {demoFirm.name} - {demoFirm.office_location}
        </p>

        <div style={{ marginBottom: '14px', fontSize: '13px', color: '#627c71' }}>
          Staff: {staff.map((s) => `${s.full_name} (${s.role})`).join(' | ')}
        </div>

        <div style={{ background: 'white', border: '1px solid rgba(94,82,64,0.2)', borderRadius: '8px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fcfcf9' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>File</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Property</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Closing</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {matters.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelectedMatterId(m.id)}
                  style={{
                    borderTop: '1px solid rgba(94,82,64,0.12)',
                    cursor: 'pointer',
                    background: m.id === selectedMatter.id ? '#f7fbfc' : 'white',
                  }}
                >
                  <td style={{ padding: '12px', color: '#134252', fontWeight: 700 }}>
                    {m.file_id}
                    <div style={{ color: '#627c71', fontWeight: 500, fontSize: '12px' }}>{m.matter_type}</div>
                  </td>
                  <td style={{ padding: '12px', color: '#134252' }}>{m.property.address}</td>
                  <td style={{ padding: '12px', color: '#627c71' }}>
                    {new Date(m.key_dates.closing_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', color: statusColor(m.status), fontWeight: 700 }}>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside ref={detailPanelRef}>
        <div style={{ background: 'white', border: '1px solid rgba(94,82,64,0.2)', borderRadius: '8px', padding: '16px' }}>
          <h2 style={{ marginTop: 0, fontSize: '18px' }}>{selectedMatter.file_id}</h2>
          <p style={{ marginTop: 0, color: '#627c71', fontSize: '13px' }}>
            {selectedMatter.property.property_type} - {selectedMatter.property.county}
          </p>
          <p style={{ margin: '0 0 12px' }}>
            <Link
              href={`/demo/matters?matter=${encodeURIComponent(selectedMatter.file_id)}`}
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#208096',
                textDecoration: 'none',
              }}
            >
              Open full matter workspace →
            </Link>
          </p>
          <label style={{ fontSize: '12px', color: '#627c71', display: 'block', marginBottom: '6px' }}>
            Matter status
          </label>
          <select
            value={selectedMatter.status}
            onChange={(e) => updateMatterStatus(selectedMatter.id, e.target.value as DemoMatter['status'])}
            style={{ width: '100%', marginBottom: '14px', padding: '10px' }}
          >
            <option>Intake</option>
            <option>Title Search</option>
            <option>Cleared to Close</option>
            <option>Scheduled for Closing</option>
            <option>Closed/Post-Closing</option>
          </select>

          <div style={{ fontSize: '14px', marginBottom: '10px' }}>
            {selectedMatterPartyRows.length > 0 ? (
              selectedMatterPartyRows.map((row) => (
                <div key={`${selectedMatter.id}-${row.label}`}>
                  <strong>{row.label}:</strong> {row.value}
                </div>
              ))
            ) : (
              <div style={{ color: '#627c71' }}>No parties added</div>
            )}
          </div>

          <h3 style={{ marginBottom: '8px', fontSize: '15px' }}>Task checklist</h3>
          <DemoTaskChecklist matterId={selectedMatter.id} />

          <h3 style={{ marginBottom: '8px', fontSize: '15px' }}>Timeline notes</h3>
          <DemoTimelineNotes matterId={selectedMatter.id} />
        </div>
      </aside>
      </div>

      <SystemContractMapCard />

      <NewMatterModal
        isOpen={isNewMatterOpen}
        onClose={() => setIsNewMatterOpen(false)}
        nextFileId={nextDemoFileId}
        onCreateDemo={() => {
          setIsNewMatterOpen(false)
          setShowDemoCreationDisabledBanner(true)
        }}
      />

      <NewIntakeDemoModal
        isOpen={isNewIntakeOpen}
        onClose={() => setIsNewIntakeOpen(false)}
        nextFileId={nextDemoFileId}
        mode="demo"
        onCreateDemo={() => {
          setShowDemoIntakeDisabledBanner(true)
        }}
      />
    </div>
  )
}

function actionBtn(background: string, color: string) {
  return {
    background,
    color,
    padding: '12px 18px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '14px',
  } as const
}

function mattersDefault(matters: DemoMatter[]) {
  return matters[0]?.id ?? ''
}
