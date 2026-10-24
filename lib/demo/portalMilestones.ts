/**
 * Client-portal milestone progress derived from live matter tasks / status.
 * Replaces static DEMO_MILESTONE_LOGS for portal UI so staff task updates move the narrative.
 */
import { MILESTONE_LABELS, MILESTONE_ORDER } from '@/lib/demo/demoData'
import type { DemoMatter, DemoMilestoneLog, DemoTask, MatterMilestoneStatus } from '@/lib/demo/types'

export { MILESTONE_LABELS, MILESTONE_ORDER }

export type PortalMilestoneView = {
  logs: DemoMilestoneLog[]
  completedStatuses: Set<MatterMilestoneStatus>
  nextStatus: MatterMilestoneStatus | null
  currentLabel: string
}

function activeTasks(matter: DemoMatter): DemoTask[] {
  return (matter.tasks || []).filter((t) => t != null && !t.deletedAt)
}

function findTask(tasks: DemoTask[], pattern: RegExp): DemoTask | undefined {
  return tasks.find((t) => pattern.test(t.title || ''))
}

function isCompleted(task: DemoTask | undefined): boolean {
  return task?.status === 'completed'
}

function isStarted(task: DemoTask | undefined): boolean {
  return task?.status === 'in_progress' || isCompleted(task)
}

function statusLooksClosed(status: string): boolean {
  return /closed/i.test(status || '')
}

function statusLooksNearClosing(status: string): boolean {
  return /cleared to close|scheduled for closing|closed/i.test(status || '')
}

/**
 * Evaluate which milestones are complete from live matter state.
 * Earlier milestones are forced complete when a later one is (coherent portal ladder).
 */
export function deriveCompletedPortalMilestones(matter: DemoMatter): MatterMilestoneStatus[] {
  const tasks = activeTasks(matter)
  const receiveContract = findTask(tasks, /receive executed contract/i)
  const openFile = findTask(tasks, /open file/i)
  const titleSearch = findTask(tasks, /order title search|title search/i)
  const closingPackage = findTask(tasks, /closing disclosure|alta|closing package/i)
  const scheduleSigning = findTask(tasks, /schedule signing|signing/i)

  const closingDate = (matter.key_dates?.closing_date || '').trim()
  const hasTimeline = (matter.timeline || []).some((e) => e && !e.deletedAt)
  const matterStatus = matter.status || ''

  const flags: Record<MatterMilestoneStatus, boolean> = {
    instruction_received:
      isCompleted(receiveContract) || isCompleted(openFile) || hasTimeline || tasks.length > 0,
    aml_checks_started: isStarted(openFile) || isCompleted(receiveContract),
    aml_checks_complete: isCompleted(openFile) || isCompleted(titleSearch),
    title_search_started: isStarted(titleSearch),
    title_search_complete: isCompleted(titleSearch),
    contracts_received: isStarted(closingPackage) || isCompleted(closingPackage),
    contracts_signed: isCompleted(scheduleSigning) || statusLooksNearClosing(matterStatus),
    closing_date_set: Boolean(closingDate) && statusLooksNearClosing(matterStatus),
    closed: statusLooksClosed(matterStatus),
  }

  // Cascade forward: if a later milestone is true, mark all earlier ones complete.
  let seenLater = false
  for (let i = MILESTONE_ORDER.length - 1; i >= 0; i -= 1) {
    const key = MILESTONE_ORDER[i]!
    if (flags[key]) seenLater = true
    else if (seenLater) flags[key] = true
  }

  // closing_date_set once contracts_signed and a closing date exists
  if (flags.contracts_signed && closingDate) flags.closing_date_set = true

  return MILESTONE_ORDER.filter((status) => flags[status])
}

function noteForMilestone(matter: DemoMatter, status: MatterMilestoneStatus): string | undefined {
  const tasks = activeTasks(matter)
  switch (status) {
    case 'instruction_received':
      return findTask(tasks, /receive executed contract/i)?.title || 'File opened in demo workspace.'
    case 'aml_checks_started':
      return 'Intake / welcome steps underway.'
    case 'aml_checks_complete':
      return 'Early file-opening checklist completed.'
    case 'title_search_started':
      return findTask(tasks, /title search/i)?.title
    case 'title_search_complete':
      return 'Title search marked complete on the matter checklist.'
    case 'contracts_received':
      return findTask(tasks, /closing disclosure|alta/i)?.title || 'Closing package in progress.'
    case 'contracts_signed':
      return findTask(tasks, /schedule signing/i)?.title || matter.status
    case 'closing_date_set':
      return matter.key_dates?.closing_date
        ? `Closing date ${matter.key_dates.closing_date}.`
        : undefined
    case 'closed':
      return matter.status
    default:
      return undefined
  }
}

function loggedAtForMilestone(matter: DemoMatter, status: MatterMilestoneStatus): string {
  const timeline = (matter.timeline || []).filter((e) => e && !e.deletedAt)
  if (timeline.length > 0) {
    const sorted = [...timeline].sort((a, b) => a.at.localeCompare(b.at))
    const idx = Math.min(
      MILESTONE_ORDER.indexOf(status),
      Math.max(0, sorted.length - 1),
    )
    const at = sorted[idx]?.at?.trim()
    if (at) {
      // Timeline uses "YYYY-MM-DD HH:mm" — normalize to ISO-ish for Date parsing.
      return at.includes('T') ? at : at.replace(' ', 'T')
    }
  }
  const closing = matter.key_dates?.closing_date?.trim()
  if (closing) return `${closing}T12:00:00.000Z`
  return matter.fileOpenedDate ? `${matter.fileOpenedDate}T12:00:00.000Z` : new Date().toISOString()
}

/** Build portal timeline rows from live matter tasks/status (not static seed logs). */
export function buildPortalMilestoneView(matter: DemoMatter): PortalMilestoneView {
  const completed = deriveCompletedPortalMilestones(matter)
  const completedStatuses = new Set(completed)
  const logs: DemoMilestoneLog[] = completed.map((status) => ({
    id: `ml-live-${matter.id}-${status}`,
    matter_id: matter.id,
    status,
    label: MILESTONE_LABELS[status],
    logged_at: loggedAtForMilestone(matter, status),
    note: noteForMilestone(matter, status),
  }))
  const nextStatus = MILESTONE_ORDER.find((s) => !completedStatuses.has(s)) ?? null
  const lastCompleted = [...MILESTONE_ORDER].reverse().find((s) => completedStatuses.has(s))
  const currentLabel = lastCompleted ? MILESTONE_LABELS[lastCompleted] : 'Pending'
  return { logs, completedStatuses, nextStatus, currentLabel }
}
