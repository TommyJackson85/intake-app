import { describe, expect, it } from 'vitest'
import {
  appendDemoMatterReviewTaskIfValid,
  buildDemoMatterReviewTask,
  defaultCondoDiligenceSummaryReviewTaskTitle,
  demoMatterReviewTaskStatusPresentation,
  listCondoDiligenceSummaryReviewTasks,
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
