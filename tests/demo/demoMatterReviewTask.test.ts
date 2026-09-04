import { describe, expect, it } from 'vitest'
import {
  appendDemoMatterReviewTaskIfValid,
  buildCondoDiligenceWorkQueueRows,
  buildDemoMatterReviewTask,
  condoDiligenceMatterDueAttentionPresentation,
  condoDiligenceMattersListReviewTaskChipPresentation,
  condoDiligenceReviewTaskDueAttentionPresentation,
  countCondoDiligenceWorkQueueDueSoon,
  defaultCondoDiligenceSummaryReviewTaskTitle,
  demoMatterReviewTaskStatusPresentation,
  filterCondoDiligenceWorkQueueRows,
  filterMattersWithActiveCondoDiligenceSummaryReviewTasks,
  formatCondoDiligenceActiveReviewTaskCountLabel,
  formatCondoDiligenceDueSoonCountLabel,
  isCondoDiligenceWorkQueueDueSoon,
  listActiveCondoDiligenceSummaryReviewTasks,
  listCondoDiligenceSummaryReviewTasks,
  matterHasActiveCondoDiligenceSummaryReviewTasks,
  matterHasDueSoonCondoDiligenceSummaryReviewTask,
  parseStoredDemoMatterReviewTasks,
  patchDemoMatterReviewTaskStatus,
} from '@/lib/demo/demoMatterReviewTask'

describe('demoMatterReviewTask', () => {
  const base = {
    matter_id: 'matter-1',
    title: 'Review: Internal Condo Diligence Summary',
    linked_document_id: 'doc-summary-1',
  }

  it('builds an internal condo summary review task', () => {
    const task = buildDemoMatterReviewTask(
      {
        ...base,
        assignee_id: 'staff-1',
        due_date: '2026-09-10',
        internal_note: 'Check estoppel changes',
        id: 'rt-1',
      },
      { nowIso: () => '2026-09-04T15:00:00.000Z' },
    )
    expect(task).toEqual({
      id: 'rt-1',
      matter_id: 'matter-1',
      title: 'Review: Internal Condo Diligence Summary',
      status: 'open',
      assignee_id: 'staff-1',
      due_date: '2026-09-10',
      internal_note: 'Check estoppel changes',
      linked_document_id: 'doc-summary-1',
      task_type: 'condo_diligence_summary_review',
      visibility: 'internal',
      created_at: '2026-09-04T15:00:00.000Z',
      updated_at: '2026-09-04T15:00:00.000Z',
    })
  })

  it('returns null when required fields are empty', () => {
    expect(buildDemoMatterReviewTask({ ...base, title: '  ' })).toBeNull()
    expect(buildDemoMatterReviewTask({ ...base, linked_document_id: '' })).toBeNull()
    expect(buildDemoMatterReviewTask({ ...base, matter_id: '' })).toBeNull()
  })

  it('appends only valid tasks', () => {
    const start: ReturnType<typeof buildDemoMatterReviewTask>[] = []
    const valid = appendDemoMatterReviewTaskIfValid([], { ...base, id: 'a' }, {
      nowIso: () => '2026-09-04T15:00:00.000Z',
    })
    expect(valid).toHaveLength(1)
    expect(appendDemoMatterReviewTaskIfValid(valid, { ...base, title: '' })).toBe(valid)
    expect(start).toHaveLength(0)
  })

  it('patches status and updates updated_at', () => {
    const task = buildDemoMatterReviewTask(
      { ...base, id: 'rt-1' },
      { nowIso: () => '2026-09-04T15:00:00.000Z' },
    )!
    const next = patchDemoMatterReviewTaskStatus([task], 'rt-1', 'in_review', {
      nowIso: () => '2026-09-04T16:00:00.000Z',
    })
    expect(next[0]?.status).toBe('in_review')
    expect(next[0]?.updated_at).toBe('2026-09-04T16:00:00.000Z')
    expect(patchDemoMatterReviewTaskStatus(next, 'rt-1', 'in_review')).toBe(next)
  })

  it('lists matter review tasks newest-first and ignores other matters', () => {
    const a = buildDemoMatterReviewTask(
      { ...base, id: 'older', title: 'Older' },
      { nowIso: () => '2026-09-01T10:00:00.000Z' },
    )!
    const b = buildDemoMatterReviewTask(
      { ...base, id: 'newer', title: 'Newer' },
      { nowIso: () => '2026-09-04T10:00:00.000Z' },
    )!
    const other = buildDemoMatterReviewTask(
      { ...base, id: 'other', matter_id: 'matter-2', title: 'Other' },
      { nowIso: () => '2026-09-05T10:00:00.000Z' },
    )!
    expect(listCondoDiligenceSummaryReviewTasks([a, b, other], 'matter-1').map((t) => t.id)).toEqual([
      'newer',
      'older',
    ])
  })

  it('lists only open and in_review tasks for Overview and formats count labels', () => {
    const open = buildDemoMatterReviewTask(
      { ...base, id: 'open', status: 'open' },
      { nowIso: () => '2026-09-04T12:00:00.000Z' },
    )!
    const inReview = buildDemoMatterReviewTask(
      { ...base, id: 'in-review', status: 'in_review' },
      { nowIso: () => '2026-09-04T11:00:00.000Z' },
    )!
    const completed = buildDemoMatterReviewTask(
      { ...base, id: 'done', status: 'completed' },
      { nowIso: () => '2026-09-04T10:00:00.000Z' },
    )!
    expect(listActiveCondoDiligenceSummaryReviewTasks([open, inReview, completed], 'matter-1').map((t) => t.id)).toEqual([
      'open',
      'in-review',
    ])
    expect(formatCondoDiligenceActiveReviewTaskCountLabel(0)).toBeNull()
    expect(formatCondoDiligenceActiveReviewTaskCountLabel(1)).toBe('1 condo review task')
    expect(formatCondoDiligenceActiveReviewTaskCountLabel(2)).toBe('2 condo review tasks')
    expect(formatCondoDiligenceActiveReviewTaskCountLabel(3)).toBe('3 condo review tasks')
  })

  it('builds matters-list chips and filters matters with active review tasks', () => {
    const openOnly = buildDemoMatterReviewTask(
      { ...base, id: 'open', status: 'open' },
      { nowIso: () => '2026-09-04T12:00:00.000Z' },
    )!
    const withInReview = buildDemoMatterReviewTask(
      { ...base, id: 'in-review', status: 'in_review' },
      { nowIso: () => '2026-09-04T11:00:00.000Z' },
    )!
    const completed = buildDemoMatterReviewTask(
      { ...base, id: 'done', status: 'completed' },
      { nowIso: () => '2026-09-04T10:00:00.000Z' },
    )!
    const otherMatter = buildDemoMatterReviewTask(
      { ...base, id: 'other', matter_id: 'matter-2', status: 'open' },
      { nowIso: () => '2026-09-04T09:00:00.000Z' },
    )!

    expect(matterHasActiveCondoDiligenceSummaryReviewTasks([completed], 'matter-1')).toBe(false)
    expect(matterHasActiveCondoDiligenceSummaryReviewTasks([openOnly, completed], 'matter-1')).toBe(true)

    const openChip = condoDiligenceMattersListReviewTaskChipPresentation([openOnly, completed], 'matter-1')
    expect(openChip?.compactLabel).toBe('Condo review · 1')
    expect(openChip?.fullLabel).toBe('1 condo review task')
    expect(openChip?.prioritizesInReview).toBe(false)

    const inReviewChip = condoDiligenceMattersListReviewTaskChipPresentation(
      [openOnly, withInReview, completed],
      'matter-1',
    )
    expect(inReviewChip?.compactLabel).toBe('Condo review · in review')
    expect(inReviewChip?.fullLabel).toBe('2 condo review tasks')
    expect(inReviewChip?.prioritizesInReview).toBe(true)

    expect(
      filterMattersWithActiveCondoDiligenceSummaryReviewTasks(
        [{ id: 'matter-1' }, { id: 'matter-2' }, { id: 'matter-3' }],
        [openOnly, completed, otherMatter],
      ).map((m) => m.id),
    ).toEqual(['matter-1', 'matter-2'])
  })

  it('builds dashboard work-queue rows sorted by in-review then due date', () => {
    const matters = [
      {
        id: 'matter-a',
        file_id: 'FL-200',
        status: 'Title Search',
        property: { address: '200 A St' },
      },
      {
        id: 'matter-b',
        file_id: 'FL-100',
        status: 'Intake',
        property: { address: '100 B Ave' },
      },
      {
        id: 'matter-c',
        file_id: 'FL-300',
        status: 'Intake',
        property: { address: '300 C Rd' },
      },
    ]
    const tasks = [
      buildDemoMatterReviewTask(
        {
          matter_id: 'matter-a',
          title: 'Open later due',
          linked_document_id: 'd1',
          status: 'open',
          due_date: '2026-09-20',
          id: 't-a',
        },
        { nowIso: () => '2026-09-04T10:00:00.000Z' },
      )!,
      buildDemoMatterReviewTask(
        {
          matter_id: 'matter-b',
          title: 'In review sooner due',
          linked_document_id: 'd2',
          status: 'in_review',
          due_date: '2026-09-10',
          assignee_id: 'staff-1',
          id: 't-b',
        },
        { nowIso: () => '2026-09-04T11:00:00.000Z' },
      )!,
      buildDemoMatterReviewTask(
        {
          matter_id: 'matter-c',
          title: 'Completed only',
          linked_document_id: 'd3',
          status: 'completed',
          id: 't-c',
        },
        { nowIso: () => '2026-09-04T12:00:00.000Z' },
      )!,
    ]

    const rows = buildCondoDiligenceWorkQueueRows(matters, tasks)
    expect(rows.map((r) => r.matterId)).toEqual(['matter-b', 'matter-a'])
    expect(rows[0]?.chip.compactLabel).toBe('Condo review · in review')
    expect(rows[0]?.primaryTask.assignee_id).toBe('staff-1')
    expect(rows[1]?.chip.fullLabel).toBe('1 condo review task')
  })

  it('filters work-queue rows by assigned staff and due-soon window with fixed now', () => {
    const now = new Date(2026, 8, 4) // 2026-09-04 local
    const matters = [
      { id: 'm1', file_id: 'FL-1', status: 'Intake', property: { address: '1 Main' } },
      { id: 'm2', file_id: 'FL-2', status: 'Intake', property: { address: '2 Main' } },
      { id: 'm3', file_id: 'FL-3', status: 'Intake', property: { address: '3 Main' } },
      { id: 'm4', file_id: 'FL-4', status: 'Intake', property: { address: '4 Main' } },
    ]
    const tasks = [
      buildDemoMatterReviewTask({
        matter_id: 'm1',
        title: 'Mine due today',
        linked_document_id: 'd1',
        status: 'open',
        assignee_id: 'staff-me',
        due_date: '2026-09-04',
        id: 't1',
      })!,
      buildDemoMatterReviewTask({
        matter_id: 'm2',
        title: 'Other overdue',
        linked_document_id: 'd2',
        status: 'in_review',
        assignee_id: 'staff-other',
        due_date: '2026-09-01',
        id: 't2',
      })!,
      buildDemoMatterReviewTask({
        matter_id: 'm3',
        title: 'No due',
        linked_document_id: 'd3',
        status: 'open',
        assignee_id: 'staff-me',
        due_date: null,
        id: 't3',
      })!,
      buildDemoMatterReviewTask({
        matter_id: 'm4',
        title: 'Too far',
        linked_document_id: 'd4',
        status: 'open',
        assignee_id: 'staff-me',
        due_date: '2026-09-20',
        id: 't4',
      })!,
    ]
    const rows = buildCondoDiligenceWorkQueueRows(matters, tasks)

    expect(isCondoDiligenceWorkQueueDueSoon('2026-09-01', now)).toBe(true)
    expect(isCondoDiligenceWorkQueueDueSoon('2026-09-11', now)).toBe(true)
    expect(isCondoDiligenceWorkQueueDueSoon('2026-09-12', now)).toBe(false)
    expect(isCondoDiligenceWorkQueueDueSoon(null, now)).toBe(false)

    expect(
      filterCondoDiligenceWorkQueueRows(rows, 'assigned_to_me', { currentStaffId: 'staff-me' }).map((r) => r.matterId),
    ).toEqual(['m1', 'm4', 'm3'])
    expect(filterCondoDiligenceWorkQueueRows(rows, 'assigned_to_me', { currentStaffId: null })).toEqual([])
    expect(filterCondoDiligenceWorkQueueRows(rows, 'due_soon', { now }).map((r) => r.matterId)).toEqual([
      'm2',
      'm1',
    ])
    expect(filterCondoDiligenceWorkQueueRows(rows, 'all_active')).toHaveLength(4)

    expect(countCondoDiligenceWorkQueueDueSoon(rows, now)).toBe(2)
    expect(formatCondoDiligenceDueSoonCountLabel(2)).toBe('2 due soon')
    expect(formatCondoDiligenceDueSoonCountLabel(1)).toBe('1 due soon')
    expect(formatCondoDiligenceDueSoonCountLabel(0)).toBeNull()
    expect(condoDiligenceReviewTaskDueAttentionPresentation('2026-09-01', now)?.kind).toBe('overdue')
    expect(condoDiligenceReviewTaskDueAttentionPresentation('2026-09-04', now)?.label).toBe('Due soon')
    expect(matterHasDueSoonCondoDiligenceSummaryReviewTask(tasks, 'm1', now)).toBe(true)
    expect(matterHasDueSoonCondoDiligenceSummaryReviewTask(tasks, 'm3', now)).toBe(false)
    expect(condoDiligenceMatterDueAttentionPresentation(tasks, 'm2', now)?.kind).toBe('overdue')
  })

  it('parses stored rows and drops invalid ones', () => {
    const parsed = parseStoredDemoMatterReviewTasks([
      {
        id: 'rt-1',
        matter_id: 'm1',
        title: 'Review snapshot',
        linked_document_id: 'd1',
        status: 'completed',
        assignee_id: null,
        due_date: null,
        internal_note: null,
        created_at: '2026-09-04T15:00:00.000Z',
        updated_at: '2026-09-04T15:00:00.000Z',
      },
      { id: 'bad', title: 'missing matter' },
      null,
    ])
    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.status).toBe('completed')
    expect(parsed[0]?.visibility).toBe('internal')
    expect(parsed[0]?.task_type).toBe('condo_diligence_summary_review')
  })

  it('provides status presentation and default titles', () => {
    expect(demoMatterReviewTaskStatusPresentation('open').label).toBe('Open')
    expect(demoMatterReviewTaskStatusPresentation('in_review').label).toBe('In review')
    expect(demoMatterReviewTaskStatusPresentation('completed').label).toBe('Completed')
    expect(defaultCondoDiligenceSummaryReviewTaskTitle('Internal Condo Diligence Summary — 2026-09-04')).toBe(
      'Review: Internal Condo Diligence Summary — 2026-09-04',
    )
  })
})
