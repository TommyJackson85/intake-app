/**
 * Internal-only Condo Diligence review-task activity events (demo-only).
 * Separate from matter `timeline` notes and checklist DemoTask updates.
 */
import type {
  DemoCondoDiligenceActivity,
  DemoCondoDiligenceActivityType,
  DemoMatterReviewTask,
  DemoMatterReviewTaskStatus,
} from '@/lib/demo/types'
import { formatCondoDiligenceReviewTaskNoteExcerpt } from '@/lib/demo/demoMatterReviewTask'

export type BuildCondoDiligenceActivityOptions = {
  idFactory?: () => string
  nowIso?: () => string
  /** Demo has no signed-in identity; pass only when a stable staff id exists. */
  actorId?: string | null
  actorLabel?: string | null
}

const ACTIVITY_TYPES: readonly DemoCondoDiligenceActivityType[] = [
  'review_task_created',
  'review_started',
  'review_task_completed',
]

export function isDemoCondoDiligenceActivityType(value: unknown): value is DemoCondoDiligenceActivityType {
  return typeof value === 'string' && (ACTIVITY_TYPES as readonly string[]).includes(value)
}

/** Neutral action labels for Overview timeline rows. */
export function condoDiligenceActivityActionLabel(type: DemoCondoDiligenceActivityType): string {
  switch (type) {
    case 'review_task_created':
      return 'Review task created'
    case 'review_started':
      return 'Review started'
    case 'review_task_completed':
      return 'Review task completed'
    default:
      return 'Internal activity'
  }
}

function resolveActor(options?: BuildCondoDiligenceActivityOptions): {
  actor_id: string | null
  actor_label: string | null
} {
  const actor_id = options?.actorId?.trim() || null
  const actor_label = options?.actorLabel?.trim() || null
  if (!actor_id) return { actor_id: null, actor_label: null }
  return { actor_id, actor_label }
}

function buildActivityBase(
  input: {
    activity_type: DemoCondoDiligenceActivityType
    matter_id: string
    review_task_id: string
    task_title: string
    linked_document_id: string | null
    note_excerpt: string | null
  },
  options?: BuildCondoDiligenceActivityOptions,
): DemoCondoDiligenceActivity | null {
  const matter_id = input.matter_id.trim()
  const review_task_id = input.review_task_id.trim()
  const task_title = input.task_title.trim()
  if (!matter_id || !review_task_id || !task_title) return null
  if (!isDemoCondoDiligenceActivityType(input.activity_type)) return null

  const nowIso = options?.nowIso?.() ?? new Date().toISOString()
  const idFactory = options?.idFactory ?? (() => `condo-activity-${Date.now()}`)
  const { actor_id, actor_label } = resolveActor(options)
  const linked = input.linked_document_id?.trim() || null

  return {
    id: idFactory(),
    matter_id,
    review_task_id,
    activity_type: input.activity_type,
    task_title,
    linked_document_id: linked,
    actor_id,
    actor_label,
    note_excerpt: input.note_excerpt,
    visibility: 'internal',
    created_at: nowIso,
  }
}

/** One immutable event when a Condo Diligence summary review task is created. */
export function buildCondoDiligenceActivityForTaskCreated(
  task: DemoMatterReviewTask,
  options?: BuildCondoDiligenceActivityOptions,
): DemoCondoDiligenceActivity | null {
  if (task.task_type !== 'condo_diligence_summary_review' || task.visibility !== 'internal') return null
  return buildActivityBase(
    {
      activity_type: 'review_task_created',
      matter_id: task.matter_id,
      review_task_id: task.id,
      task_title: task.title,
      linked_document_id: task.linked_document_id,
      note_excerpt: null,
    },
    options,
  )
}

/**
 * One immutable event for a successful review-task status transition.
 * - open → in_review → Review started
 * - * → completed → Review task completed
 * No-ops and other transitions return null.
 */
export function buildCondoDiligenceActivityForStatusTransition(
  before: DemoMatterReviewTask | null | undefined,
  after: DemoMatterReviewTask | null | undefined,
  options?: BuildCondoDiligenceActivityOptions,
): DemoCondoDiligenceActivity | null {
  if (!before || !after) return null
  if (before.id !== after.id) return null
  if (after.task_type !== 'condo_diligence_summary_review' || after.visibility !== 'internal') return null
  if (before.status === after.status) return null

  let activity_type: DemoCondoDiligenceActivityType | null = null
  let note_excerpt: string | null = null

  if (before.status === 'open' && after.status === 'in_review') {
    activity_type = 'review_started'
  } else if (after.status === 'completed' && before.status !== 'completed') {
    activity_type = 'review_task_completed'
    note_excerpt = formatCondoDiligenceReviewTaskNoteExcerpt(after.internal_note)
  }

  if (!activity_type) return null

  return buildActivityBase(
    {
      activity_type,
      matter_id: after.matter_id,
      review_task_id: after.id,
      task_title: after.title,
      linked_document_id: after.linked_document_id,
      note_excerpt,
    },
    options,
  )
}

/** Append a built activity; returns the same array reference when activity is null. */
export function appendCondoDiligenceActivityIfValid(
  activities: DemoCondoDiligenceActivity[],
  activity: DemoCondoDiligenceActivity | null,
): DemoCondoDiligenceActivity[] {
  if (!activity) return activities
  return [...activities, activity]
}

/**
 * Append status-transition activities for each successfully updated task id.
 * Does not mutate `activities` or task arrays.
 */
export function appendCondoDiligenceActivitiesForBulkStatusTransition(
  activities: DemoCondoDiligenceActivity[],
  beforeTasks: readonly DemoMatterReviewTask[],
  afterTasks: readonly DemoMatterReviewTask[],
  updatedTaskIds: readonly string[],
  options?: BuildCondoDiligenceActivityOptions,
): DemoCondoDiligenceActivity[] {
  if (updatedTaskIds.length === 0) return activities
  const beforeById = new Map(beforeTasks.map((t) => [t.id, t]))
  const afterById = new Map(afterTasks.map((t) => [t.id, t]))
  let next = activities
  let i = 0
  for (const id of updatedTaskIds) {
    const activity = buildCondoDiligenceActivityForStatusTransition(beforeById.get(id), afterById.get(id), {
      ...options,
      idFactory: options?.idFactory
        ? options.idFactory
        : () => `condo-activity-${Date.now()}-${i++}`,
    })
    next = appendCondoDiligenceActivityIfValid(next, activity)
  }
  return next
}

/** Current-matter internal Condo Diligence activities, newest first. Does not mutate input. */
export function listCondoDiligenceActivitiesForMatter(
  activities: readonly DemoCondoDiligenceActivity[],
  matterId: string,
): DemoCondoDiligenceActivity[] {
  const id = matterId.trim()
  if (!id) return []
  return activities
    .filter(
      (a) =>
        a.matter_id === id &&
        a.visibility === 'internal' &&
        isDemoCondoDiligenceActivityType(a.activity_type),
    )
    .slice()
    .sort((a, b) => {
      const aT = new Date(a.created_at).getTime()
      const bT = new Date(b.created_at).getTime()
      const aSafe = Number.isFinite(aT) ? aT : 0
      const bSafe = Number.isFinite(bT) ? bT : 0
      return bSafe - aSafe
    })
}

/** Local Overview filter for Condo Diligence Activity timeline (display-only). */
export type CondoDiligenceActivityViewFilter =
  | 'all'
  | 'review_task_created'
  | 'review_started'
  | 'review_task_completed'

export const CONDO_DILIGENCE_ACTIVITY_VIEW_FILTERS: ReadonlyArray<{
  id: CondoDiligenceActivityViewFilter
  label: string
}> = [
  { id: 'all', label: 'All activity' },
  { id: 'review_task_created', label: 'Task created' },
  { id: 'review_started', label: 'Review started' },
  { id: 'review_task_completed', label: 'Task completed' },
]

export function isCondoDiligenceActivityViewFilter(value: unknown): value is CondoDiligenceActivityViewFilter {
  return (
    value === 'all' ||
    value === 'review_task_created' ||
    value === 'review_started' ||
    value === 'review_task_completed'
  )
}

/**
 * Filters a matter activity list by local Overview control. Does not mutate input.
 * Unknown filters fall back to all activities.
 */
export function filterCondoDiligenceActivitiesByView(
  activities: readonly DemoCondoDiligenceActivity[],
  filter: CondoDiligenceActivityViewFilter,
): DemoCondoDiligenceActivity[] {
  if (!isCondoDiligenceActivityViewFilter(filter) || filter === 'all') {
    return activities.slice()
  }
  return activities.filter((a) => a.activity_type === filter)
}

/** Safe parse for demo localStorage; missing/invalid → []. Never mutates input. */
export function parseStoredDemoCondoDiligenceActivities(raw: unknown): DemoCondoDiligenceActivity[] {
  if (!Array.isArray(raw)) return []
  const out: DemoCondoDiligenceActivity[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (!isDemoCondoDiligenceActivityType(o.activity_type)) continue
    const matter_id = typeof o.matter_id === 'string' ? o.matter_id.trim() : ''
    const review_task_id = typeof o.review_task_id === 'string' ? o.review_task_id.trim() : ''
    const task_title = typeof o.task_title === 'string' ? o.task_title.trim() : ''
    const id = typeof o.id === 'string' ? o.id.trim() : ''
    const created_at = typeof o.created_at === 'string' ? o.created_at.trim() : ''
    if (!matter_id || !review_task_id || !task_title || !id || !created_at) continue
    if (o.visibility !== 'internal') continue

    out.push({
      id,
      matter_id,
      review_task_id,
      activity_type: o.activity_type,
      task_title,
      linked_document_id: typeof o.linked_document_id === 'string' ? o.linked_document_id.trim() || null : null,
      actor_id: typeof o.actor_id === 'string' ? o.actor_id.trim() || null : null,
      actor_label: typeof o.actor_label === 'string' ? o.actor_label.trim() || null : null,
      note_excerpt: typeof o.note_excerpt === 'string' ? o.note_excerpt.trim() || null : null,
      visibility: 'internal',
      created_at,
    })
  }
  return out
}

/** Formats activity timestamp for Overview; null when unparseable. */
export function formatCondoDiligenceActivityTimestamp(iso: string | null | undefined): string | null {
  const raw = iso?.trim()
  if (!raw) return null
  const dt = new Date(raw)
  if (Number.isNaN(dt.getTime())) return null
  return dt.toLocaleString()
}

export type { DemoMatterReviewTaskStatus }
