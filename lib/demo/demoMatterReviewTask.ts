/**
 * Build/merge helpers for internal Condo Diligence summary review tasks (demo-only).
 * Separate from checklist `DemoTask` so matter-status derivation is unaffected.
 */
import type { DemoMatterReviewTask, DemoMatterReviewTaskStatus } from '@/lib/demo/types'

export type AddDemoMatterReviewTaskInput = {
  matter_id: string
  title: string
  linked_document_id: string
  assignee_id?: string | null
  due_date?: string | null
  internal_note?: string | null
  status?: DemoMatterReviewTaskStatus
  id?: string
  created_at?: string
  updated_at?: string
}

export type BuildDemoMatterReviewTaskOptions = {
  idFactory?: () => string
  nowIso?: () => string
}

const STATUSES: readonly DemoMatterReviewTaskStatus[] = ['open', 'in_review', 'completed']

export function isDemoMatterReviewTaskStatus(value: unknown): value is DemoMatterReviewTaskStatus {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value)
}

export function demoMatterReviewTaskStatusPresentation(status: DemoMatterReviewTaskStatus): {
  label: string
  bg: string
  color: string
  border: string
} {
  switch (status) {
    case 'completed':
      return { label: 'Completed', bg: '#e8f5f0', color: '#2f855a', border: 'rgba(47,133,90,0.35)' }
    case 'in_review':
      return { label: 'In review', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.35)' }
    case 'open':
    default:
      return { label: 'Open', bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
  }
}

/**
 * Builds an internal review task linked to a saved summary document.
 * Returns null when required ids/title are empty after trim.
 */
export function buildDemoMatterReviewTask(
  input: AddDemoMatterReviewTaskInput,
  options?: BuildDemoMatterReviewTaskOptions,
): DemoMatterReviewTask | null {
  const matter_id = input.matter_id.trim()
  const title = input.title.trim()
  const linked_document_id = input.linked_document_id.trim()
  if (!matter_id || !title || !linked_document_id) return null

  const nowIso = options?.nowIso?.() ?? new Date().toISOString()
  const created_at = input.created_at?.trim() || nowIso
  const updated_at = input.updated_at?.trim() || created_at
  const assignee_id = input.assignee_id?.trim() || null
  const due_date = input.due_date?.trim() || null
  const internal_note = input.internal_note?.trim() || null
  const status = input.status && isDemoMatterReviewTaskStatus(input.status) ? input.status : 'open'
  const idFactory = options?.idFactory ?? (() => `review-task-${Date.now()}`)

  return {
    id: input.id?.trim() || idFactory(),
    matter_id,
    title,
    status,
    assignee_id,
    due_date,
    internal_note,
    linked_document_id,
    task_type: 'condo_diligence_summary_review',
    visibility: 'internal',
    created_at,
    updated_at,
  }
}

export function appendDemoMatterReviewTaskIfValid(
  tasks: DemoMatterReviewTask[],
  input: AddDemoMatterReviewTaskInput,
  options?: BuildDemoMatterReviewTaskOptions,
): DemoMatterReviewTask[] {
  const next = buildDemoMatterReviewTask(input, options)
  if (!next) return tasks
  return [...tasks, next]
}

export function patchDemoMatterReviewTaskStatus(
  tasks: DemoMatterReviewTask[],
  taskId: string,
  status: DemoMatterReviewTaskStatus,
  options?: { nowIso?: () => string },
): DemoMatterReviewTask[] {
  const id = taskId.trim()
  if (!id || !isDemoMatterReviewTaskStatus(status)) return tasks
  const nowIso = options?.nowIso?.() ?? new Date().toISOString()
  let changed = false
  const next = tasks.map((task) => {
    if (task.id !== id) return task
    if (task.status === status) return task
    changed = true
    return { ...task, status, updated_at: nowIso }
  })
  return changed ? next : tasks
}

export function listCondoDiligenceSummaryReviewTasks(
  tasks: DemoMatterReviewTask[],
  matterId: string,
): DemoMatterReviewTask[] {
  const id = matterId.trim()
  if (!id) return []
  return tasks
    .filter(
      (t) =>
        t.matter_id === id &&
        t.task_type === 'condo_diligence_summary_review' &&
        t.visibility === 'internal',
    )
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

/** Non-completed internal summary review tasks for Overview badges/lists. */
export function listActiveCondoDiligenceSummaryReviewTasks(
  tasks: DemoMatterReviewTask[],
  matterId: string,
): DemoMatterReviewTask[] {
  return listCondoDiligenceSummaryReviewTasks(tasks, matterId).filter((t) => t.status !== 'completed')
}

/** Neutral count copy for Overview: `1 condo review task` / `N condo review tasks`. */
export function formatCondoDiligenceActiveReviewTaskCountLabel(count: number): string | null {
  if (!Number.isFinite(count) || count < 1) return null
  const n = Math.floor(count)
  return n === 1 ? '1 condo review task' : `${n} condo review tasks`
}

/** True when the matter has at least one open/in_review internal summary review task. */
export function matterHasActiveCondoDiligenceSummaryReviewTasks(
  tasks: DemoMatterReviewTask[],
  matterId: string,
): boolean {
  return listActiveCondoDiligenceSummaryReviewTasks(tasks, matterId).length > 0
}

export type CondoDiligenceMattersListReviewTaskChip = {
  /** Compact table chip text (e.g. `Condo review · 2` or `Condo review · in review`). */
  compactLabel: string
  /** Fuller label for title/tooltip (e.g. `2 condo review tasks`). */
  fullLabel: string
  bg: string
  color: string
  border: string
  prioritizesInReview: boolean
  activeCount: number
}

/**
 * Matters-list chip for active Condo Diligence summary review tasks.
 * Returns null when the matter has no open/in_review internal review tasks.
 */
export function condoDiligenceMattersListReviewTaskChipPresentation(
  tasks: DemoMatterReviewTask[],
  matterId: string,
): CondoDiligenceMattersListReviewTaskChip | null {
  const active = listActiveCondoDiligenceSummaryReviewTasks(tasks, matterId)
  if (active.length === 0) return null

  const prioritizesInReview = active.some((t) => t.status === 'in_review')
  const fullLabel =
    formatCondoDiligenceActiveReviewTaskCountLabel(active.length) ??
    `${active.length} condo review tasks`
  const tone = prioritizesInReview
    ? demoMatterReviewTaskStatusPresentation('in_review')
    : demoMatterReviewTaskStatusPresentation('open')

  return {
    compactLabel: prioritizesInReview
      ? 'Condo review · in review'
      : `Condo review · ${active.length}`,
    fullLabel,
    bg: tone.bg,
    color: tone.color,
    border: tone.border,
    prioritizesInReview,
    activeCount: active.length,
  }
}

/** Matters that currently have open/in_review Condo Diligence summary review tasks. */
export function filterMattersWithActiveCondoDiligenceSummaryReviewTasks<T extends { id: string }>(
  matters: T[],
  tasks: DemoMatterReviewTask[],
): T[] {
  return matters.filter((m) => matterHasActiveCondoDiligenceSummaryReviewTasks(tasks, m.id))
}

export type CondoDiligenceWorkQueueMatterInput = {
  id: string
  file_id: string
  status: string
  property: { address: string }
  key_dates?: { closing_date?: string }
}

export type CondoDiligenceWorkQueueRow = {
  matterId: string
  fileId: string
  propertyAddress: string
  matterStatus: string
  activeCount: number
  chip: CondoDiligenceMattersListReviewTaskChip
  /** Representative active task for compact assignee/due/status display. */
  primaryTask: DemoMatterReviewTask
}

function dueDateSortKey(dueDate: string | null): number {
  if (!dueDate?.trim()) return Number.POSITIVE_INFINITY
  const t = new Date(dueDate).getTime()
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY
}

function pickPrimaryActiveReviewTask(tasks: DemoMatterReviewTask[]): DemoMatterReviewTask {
  return [...tasks].sort((a, b) => {
    const aInReview = a.status === 'in_review' ? 0 : 1
    const bInReview = b.status === 'in_review' ? 0 : 1
    if (aInReview !== bInReview) return aInReview - bInReview
    const dueCmp = dueDateSortKey(a.due_date) - dueDateSortKey(b.due_date)
    if (dueCmp !== 0) return dueCmp
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })[0]!
}

/**
 * Compact dashboard triage rows for matters with active Condo Diligence summary review tasks.
 * Read-only derivation — does not mutate tasks or imply compliance/closing readiness.
 */
export function buildCondoDiligenceWorkQueueRows(
  matters: CondoDiligenceWorkQueueMatterInput[],
  tasks: DemoMatterReviewTask[],
): CondoDiligenceWorkQueueRow[] {
  const queuedMatters = filterMattersWithActiveCondoDiligenceSummaryReviewTasks(matters, tasks)
  const rows: CondoDiligenceWorkQueueRow[] = []

  for (const matter of queuedMatters) {
    const active = listActiveCondoDiligenceSummaryReviewTasks(tasks, matter.id)
    const chip = condoDiligenceMattersListReviewTaskChipPresentation(tasks, matter.id)
    if (active.length === 0 || !chip) continue
    const primaryTask = pickPrimaryActiveReviewTask(active)
    rows.push({
      matterId: matter.id,
      fileId: matter.file_id,
      propertyAddress: matter.property.address,
      matterStatus: matter.status,
      activeCount: active.length,
      chip,
      primaryTask,
    })
  }

  return rows.sort((a, b) => {
    const aInReview = a.chip.prioritizesInReview ? 0 : 1
    const bInReview = b.chip.prioritizesInReview ? 0 : 1
    if (aInReview !== bInReview) return aInReview - bInReview
    const dueCmp = dueDateSortKey(a.primaryTask.due_date) - dueDateSortKey(b.primaryTask.due_date)
    if (dueCmp !== 0) return dueCmp
    return a.fileId.localeCompare(b.fileId)
  })
}

export type CondoDiligenceWorkQueueViewFilter = 'all_active' | 'assigned_to_me' | 'due_soon'

/** Calendar-day YMD from a Date (local components) for date-only comparisons. */
export function toCondoDiligenceWorkQueueDateKey(date: Date): string | null {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Normalize stored due values (`YYYY-MM-DD` or ISO) to a date-only key. */
export function parseCondoDiligenceWorkQueueDueDateKey(dueDate: string | null | undefined): string | null {
  const raw = dueDate?.trim()
  if (!raw) return null
  const ymd = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if (ymd) return ymd[1]
  const parsed = new Date(raw)
  return toCondoDiligenceWorkQueueDateKey(parsed)
}

function addCalendarDaysToDateKey(dateKey: string, days: number): string | null {
  const m = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(dt.getTime())) return null
  dt.setDate(dt.getDate() + days)
  return toCondoDiligenceWorkQueueDateKey(dt)
}

/**
 * True when due date is overdue or within the next `withinDays` calendar days (inclusive of today).
 * Missing/invalid due dates are never "due soon".
 */
export function isCondoDiligenceWorkQueueDueSoon(
  dueDate: string | null | undefined,
  now: Date,
  withinDays = 7,
): boolean {
  const dueKey = parseCondoDiligenceWorkQueueDueDateKey(dueDate)
  const todayKey = toCondoDiligenceWorkQueueDateKey(now)
  if (!dueKey || !todayKey) return false
  const endKey = addCalendarDaysToDateKey(todayKey, withinDays)
  if (!endKey) return false
  return dueKey <= endKey
}

/**
 * Filters existing work-queue rows for dashboard viewing only.
 * `assigned_to_me` requires a stable staff ID; without one, returns [].
 */
export function filterCondoDiligenceWorkQueueRows(
  rows: CondoDiligenceWorkQueueRow[],
  filter: CondoDiligenceWorkQueueViewFilter,
  options?: {
    now?: Date
    currentStaffId?: string | null
    dueSoonWithinDays?: number
  },
): CondoDiligenceWorkQueueRow[] {
  if (filter === 'all_active') return rows

  if (filter === 'assigned_to_me') {
    const staffId = options?.currentStaffId?.trim()
    if (!staffId) return []
    return rows.filter((row) => row.primaryTask.assignee_id === staffId)
  }

  const now = options?.now ?? new Date()
  const withinDays = options?.dueSoonWithinDays ?? 7
  return rows.filter((row) => isCondoDiligenceWorkQueueDueSoon(row.primaryTask.due_date, now, withinDays))
}

export type CondoDiligenceDueSoonAttentionKind = 'overdue' | 'due_soon'

export type CondoDiligenceDueSoonAttention = {
  kind: CondoDiligenceDueSoonAttentionKind
  /** Compact UI label: `Overdue` or `Due soon`. */
  label: string
  bg: string
  color: string
  border: string
}

/** Due-attention presentation for a due date relative to explicit `now` (not a legal deadline). */
export function condoDiligenceReviewTaskDueAttentionPresentation(
  dueDate: string | null | undefined,
  now: Date,
  withinDays = 7,
): CondoDiligenceDueSoonAttention | null {
  if (!isCondoDiligenceWorkQueueDueSoon(dueDate, now, withinDays)) return null
  const dueKey = parseCondoDiligenceWorkQueueDueDateKey(dueDate)
  const todayKey = toCondoDiligenceWorkQueueDateKey(now)
  if (!dueKey || !todayKey) return null
  if (dueKey < todayKey) {
    return {
      kind: 'overdue',
      label: 'Overdue',
      bg: '#fee2e2',
      color: '#991b1b',
      border: 'rgba(185,28,28,0.35)',
    }
  }
  return {
    kind: 'due_soon',
    label: 'Due soon',
    bg: '#fff4d6',
    color: '#b45309',
    border: 'rgba(240,180,41,0.35)',
  }
}

export function isCondoDiligenceWorkQueueRowDueSoon(
  row: Pick<CondoDiligenceWorkQueueRow, 'primaryTask'>,
  now: Date,
  withinDays = 7,
): boolean {
  return isCondoDiligenceWorkQueueDueSoon(row.primaryTask.due_date, now, withinDays)
}

/** Count of work-queue rows whose prioritized active task is due soon. */
export function countCondoDiligenceWorkQueueDueSoon(
  rows: CondoDiligenceWorkQueueRow[],
  now: Date,
  withinDays = 7,
): number {
  return rows.filter((row) => isCondoDiligenceWorkQueueRowDueSoon(row, now, withinDays)).length
}

/** Neutral header copy: `1 due soon` / `N due soon`. */
export function formatCondoDiligenceDueSoonCountLabel(count: number): string | null {
  if (!Number.isFinite(count) || count < 1) return null
  const n = Math.floor(count)
  return n === 1 ? '1 due soon' : `${n} due soon`
}

/** True when any active internal review task for the matter is due soon. */
export function matterHasDueSoonCondoDiligenceSummaryReviewTask(
  tasks: DemoMatterReviewTask[],
  matterId: string,
  now: Date,
  withinDays = 7,
): boolean {
  return listActiveCondoDiligenceSummaryReviewTasks(tasks, matterId).some((t) =>
    isCondoDiligenceWorkQueueDueSoon(t.due_date, now, withinDays),
  )
}

/** Strongest due-attention among active tasks for a matter (overdue wins over due soon). */
export function condoDiligenceMatterDueAttentionPresentation(
  tasks: DemoMatterReviewTask[],
  matterId: string,
  now: Date,
  withinDays = 7,
): CondoDiligenceDueSoonAttention | null {
  let best: CondoDiligenceDueSoonAttention | null = null
  for (const task of listActiveCondoDiligenceSummaryReviewTasks(tasks, matterId)) {
    const attention = condoDiligenceReviewTaskDueAttentionPresentation(task.due_date, now, withinDays)
    if (!attention) continue
    if (!best || (attention.kind === 'overdue' && best.kind !== 'overdue')) best = attention
  }
  return best
}

/** Parse persisted rows; drops invalid entries. */
export function parseStoredDemoMatterReviewTasks(raw: unknown): DemoMatterReviewTask[] {
  if (!Array.isArray(raw)) return []
  const out: DemoMatterReviewTask[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const built = buildDemoMatterReviewTask({
      id: typeof o.id === 'string' ? o.id : undefined,
      matter_id: typeof o.matter_id === 'string' ? o.matter_id : '',
      title: typeof o.title === 'string' ? o.title : '',
      linked_document_id: typeof o.linked_document_id === 'string' ? o.linked_document_id : '',
      assignee_id: typeof o.assignee_id === 'string' ? o.assignee_id : null,
      due_date: typeof o.due_date === 'string' ? o.due_date : null,
      internal_note: typeof o.internal_note === 'string' ? o.internal_note : null,
      status: isDemoMatterReviewTaskStatus(o.status) ? o.status : 'open',
      created_at: typeof o.created_at === 'string' ? o.created_at : undefined,
      updated_at: typeof o.updated_at === 'string' ? o.updated_at : undefined,
    })
    if (built) out.push(built)
  }
  return out
}

export function defaultCondoDiligenceSummaryReviewTaskTitle(documentName: string): string {
  const name = documentName.trim() || 'Internal Condo Diligence Summary'
  return `Review: ${name}`
}
