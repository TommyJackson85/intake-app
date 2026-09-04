import { describe, expect, it } from 'vitest'
import {
  appendCondoDiligenceActivitiesForBulkStatusTransition,
  appendCondoDiligenceActivityIfValid,
  buildCondoDiligenceActivityForStatusTransition,
  buildCondoDiligenceActivityForTaskCreated,
  condoDiligenceActivityActionLabel,
  listCondoDiligenceActivitiesForMatter,
  parseStoredDemoCondoDiligenceActivities,
} from '@/lib/demo/demoCondoDiligenceActivity'
import {
  appendDemoMatterReviewTaskIfValid,
  buildDemoMatterReviewTask,
  patchDemoMatterReviewTaskStatus,
  patchDemoMatterReviewTasksStatus,
} from '@/lib/demo/demoMatterReviewTask'
import type { DemoCondoDiligenceActivity, DemoMatterReviewTask } from '@/lib/demo/types'

describe('demoCondoDiligenceActivity', () => {
  const baseTaskInput = {
    matter_id: 'matter-1',
    title: 'Review: Internal Condo Diligence Summary',
    linked_document_id: 'doc-summary-1',
  }

  function makeTask(
    overrides: Partial<Parameters<typeof buildDemoMatterReviewTask>[0]> = {},
    nowIso = '2026-09-04T15:00:00.000Z',
  ): DemoMatterReviewTask {
    return buildDemoMatterReviewTask(
      { ...baseTaskInput, id: 'rt-1', ...overrides },
      { nowIso: () => nowIso },
    )!
  }

  it('creates one internal task-created activity for a valid Condo Diligence review task', () => {
    const tasks = appendDemoMatterReviewTaskIfValid([], { ...baseTaskInput, id: 'rt-new' }, {
      nowIso: () => '2026-09-04T15:00:00.000Z',
    })
    expect(tasks).toHaveLength(1)
    const activity = buildCondoDiligenceActivityForTaskCreated(tasks[0]!, {
      idFactory: () => 'act-1',
      nowIso: () => '2026-09-04T15:00:00.000Z',
    })
    expect(activity).toMatchObject({
      id: 'act-1',
      matter_id: 'matter-1',
      review_task_id: 'rt-new',
      activity_type: 'review_task_created',
      linked_document_id: 'doc-summary-1',
      visibility: 'internal',
      note_excerpt: null,
      actor_id: null,
      created_at: '2026-09-04T15:00:00.000Z',
    })
    expect(condoDiligenceActivityActionLabel('review_task_created')).toBe('Review task created')
  })

  it('does not create Condo Diligence activity for unrelated task shapes', () => {
    const fake = {
      ...makeTask(),
      task_type: 'other_review' as DemoMatterReviewTask['task_type'],
    }
    expect(buildCondoDiligenceActivityForTaskCreated(fake)).toBeNull()
  })

  it('creates exactly one review-started activity for open → in_review', () => {
    const open = makeTask({ status: 'open' })
    const nextTasks = patchDemoMatterReviewTaskStatus([open], 'rt-1', 'in_review', {
      nowIso: () => '2026-09-04T16:00:00.000Z',
    })
    const activity = buildCondoDiligenceActivityForStatusTransition(open, nextTasks[0]!, {
      idFactory: () => 'act-start',
      nowIso: () => '2026-09-04T16:00:00.000Z',
    })
    expect(activity?.activity_type).toBe('review_started')
    expect(activity?.review_task_id).toBe('rt-1')
    expect(activity?.matter_id).toBe('matter-1')
    expect(activity?.linked_document_id).toBe('doc-summary-1')
    expect(activity?.visibility).toBe('internal')
    expect(activity?.created_at).toBe('2026-09-04T16:00:00.000Z')
    expect(condoDiligenceActivityActionLabel('review_started')).toBe('Review started')
  })

  it('creates no event when re-applying in_review to an already in-review task', () => {
    const inReview = makeTask({ status: 'in_review' })
    const source = [inReview]
    const noop = patchDemoMatterReviewTaskStatus(source, 'rt-1', 'in_review')
    expect(noop).toBe(source)
    expect(buildCondoDiligenceActivityForStatusTransition(inReview, inReview)).toBeNull()
  })

  it('creates exactly one completed activity for in_review → completed', () => {
    const inReview = makeTask({ status: 'in_review', internal_note: '  Check estoppel  ' })
    const next = patchDemoMatterReviewTaskStatus([inReview], 'rt-1', 'completed', {
      nowIso: () => '2026-09-04T17:00:00.000Z',
    })
    const activity = buildCondoDiligenceActivityForStatusTransition(inReview, next[0]!, {
      idFactory: () => 'act-done',
      nowIso: () => '2026-09-04T17:00:00.000Z',
    })
    expect(activity).toMatchObject({
      activity_type: 'review_task_completed',
      review_task_id: 'rt-1',
      matter_id: 'matter-1',
      linked_document_id: 'doc-summary-1',
      visibility: 'internal',
      note_excerpt: 'Check estoppel',
      created_at: '2026-09-04T17:00:00.000Z',
    })
    expect(condoDiligenceActivityActionLabel('review_task_completed')).toBe('Review task completed')
  })

  it('creates no activity for invalid, no-op, or skipped transitions', () => {
    const open = makeTask({ status: 'open' })
    const completed = makeTask({ status: 'completed' })
    expect(buildCondoDiligenceActivityForStatusTransition(open, open)).toBeNull()
    expect(buildCondoDiligenceActivityForStatusTransition(null, open)).toBeNull()
    expect(buildCondoDiligenceActivityForStatusTransition(open, null)).toBeNull()
    expect(
      buildCondoDiligenceActivityForStatusTransition(completed, {
        ...completed,
        status: 'open',
      }),
    ).toBeNull()
    expect(
      buildCondoDiligenceActivityForStatusTransition(open, {
        ...open,
        status: 'completed',
        id: 'other-id',
      }),
    ).toBeNull()
  })

  it('bulk transitions create one event per successfully updated eligible task', () => {
    const openA = makeTask({ id: 'rt-a', status: 'open' })
    const openB = makeTask({ id: 'rt-b', status: 'open', matter_id: 'matter-2' })
    const already = makeTask({ id: 'rt-c', status: 'in_review', matter_id: 'matter-3' })
    const before = [openA, openB, already]
    const result = patchDemoMatterReviewTasksStatus(before, ['rt-a', 'rt-b', 'rt-c'], 'in_review', {
      nowIso: () => '2026-09-04T16:30:00.000Z',
    })
    expect(result.updatedTaskIds).toEqual(['rt-a', 'rt-b'])
    const start: DemoCondoDiligenceActivity[] = []
    const next = appendCondoDiligenceActivitiesForBulkStatusTransition(
      start,
      before,
      result.tasks,
      result.updatedTaskIds,
      { nowIso: () => '2026-09-04T16:30:00.000Z' },
    )
    expect(start).toHaveLength(0)
    expect(next).toHaveLength(2)
    expect(next.map((a) => a.review_task_id).sort()).toEqual(['rt-a', 'rt-b'])
    expect(next.every((a) => a.activity_type === 'review_started')).toBe(true)
    expect(next.every((a) => a.visibility === 'internal')).toBe(true)
  })

  it('activities include matter ID, task ID, internal visibility, timestamp, and linked summary ID', () => {
    const task = makeTask({ id: 'rt-meta', linked_document_id: 'doc-xyz' })
    const activity = buildCondoDiligenceActivityForTaskCreated(task, {
      idFactory: () => 'act-meta',
      nowIso: () => '2026-09-04T12:00:00.000Z',
    })!
    expect(activity.matter_id).toBe('matter-1')
    expect(activity.review_task_id).toBe('rt-meta')
    expect(activity.visibility).toBe('internal')
    expect(activity.created_at).toBe('2026-09-04T12:00:00.000Z')
    expect(activity.linked_document_id).toBe('doc-xyz')
  })

  it('keeps existing persisted state without activities safe', () => {
    expect(parseStoredDemoCondoDiligenceActivities(undefined)).toEqual([])
    expect(parseStoredDemoCondoDiligenceActivities(null)).toEqual([])
    expect(parseStoredDemoCondoDiligenceActivities({})).toEqual([])
    expect(parseStoredDemoCondoDiligenceActivities([])).toEqual([])
    expect(
      parseStoredDemoCondoDiligenceActivities([
        { id: 'bad' },
        {
          id: 'act-ok',
          matter_id: 'matter-1',
          review_task_id: 'rt-1',
          activity_type: 'review_task_created',
          task_title: 'Review: Summary',
          linked_document_id: 'doc-1',
          actor_id: null,
          actor_label: null,
          note_excerpt: null,
          visibility: 'internal',
          created_at: '2026-09-04T10:00:00.000Z',
        },
        {
          id: 'portal-leak',
          matter_id: 'matter-1',
          review_task_id: 'rt-2',
          activity_type: 'review_started',
          task_title: 'X',
          visibility: 'client',
          created_at: '2026-09-04T11:00:00.000Z',
        },
      ]),
    ).toEqual([
      {
        id: 'act-ok',
        matter_id: 'matter-1',
        review_task_id: 'rt-1',
        activity_type: 'review_task_created',
        task_title: 'Review: Summary',
        linked_document_id: 'doc-1',
        actor_id: null,
        actor_label: null,
        note_excerpt: null,
        visibility: 'internal',
        created_at: '2026-09-04T10:00:00.000Z',
      },
    ])
  })

  it('lists current-matter internal activities newest first without mutating input', () => {
    const older = buildCondoDiligenceActivityForTaskCreated(makeTask({ id: 'rt-old' }), {
      idFactory: () => 'a-old',
      nowIso: () => '2026-09-01T10:00:00.000Z',
    })!
    const newer = buildCondoDiligenceActivityForStatusTransition(
      makeTask({ id: 'rt-new', status: 'open' }),
      makeTask({ id: 'rt-new', status: 'in_review' }, '2026-09-04T12:00:00.000Z'),
      { idFactory: () => 'a-new', nowIso: () => '2026-09-04T12:00:00.000Z' },
    )!
    const other = buildCondoDiligenceActivityForTaskCreated(
      makeTask({ id: 'rt-other', matter_id: 'matter-2' }),
      { idFactory: () => 'a-other', nowIso: () => '2026-09-05T12:00:00.000Z' },
    )!
    const input = [older, newer, other]
    const listed = listCondoDiligenceActivitiesForMatter(input, 'matter-1')
    expect(listed.map((a) => a.id)).toEqual(['a-new', 'a-old'])
    expect(input.map((a) => a.id)).toEqual(['a-old', 'a-new', 'a-other'])
  })

  it('missing linked summary id is allowed and View summary relies on document lookup', () => {
    const task = makeTask({ linked_document_id: 'missing-doc' })
    const activity = buildCondoDiligenceActivityForTaskCreated(task, {
      idFactory: () => 'act-missing-doc',
    })!
    expect(activity.linked_document_id).toBe('missing-doc')
    // UI only shows View summary when matterDocuments resolves the id; helpers stay non-mutating.
    const frozen = Object.freeze([activity])
    expect(listCondoDiligenceActivitiesForMatter(frozen, 'matter-1')).toHaveLength(1)
  })

  it('helpers do not mutate input state', () => {
    const activities: DemoCondoDiligenceActivity[] = []
    const task = makeTask()
    const created = buildCondoDiligenceActivityForTaskCreated(task, { idFactory: () => 'x1' })
    const next = appendCondoDiligenceActivityIfValid(activities, created)
    expect(activities).toHaveLength(0)
    expect(next).toHaveLength(1)
    expect(appendCondoDiligenceActivityIfValid(activities, null)).toBe(activities)
  })

  it('portal-facing activity exclusion: only internal visibility is listable', () => {
    const internal = buildCondoDiligenceActivityForTaskCreated(makeTask(), {
      idFactory: () => 'int-1',
      nowIso: () => '2026-09-04T10:00:00.000Z',
    })!
    const leaked = { ...internal, id: 'leak', visibility: 'client' as 'internal' }
    expect(listCondoDiligenceActivitiesForMatter([internal, leaked], 'matter-1').map((a) => a.id)).toEqual([
      'int-1',
    ])
  })
})
