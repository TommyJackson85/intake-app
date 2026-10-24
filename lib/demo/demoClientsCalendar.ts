/**
 * Pure helpers for demo clients + calendar persistence and new-matter calendar seeding.
 * Demo-only — no Supabase/DB coupling.
 */
import type { DemoCalendarEvent, DemoClient, DemoIntakeLead, DemoMatter } from '@/lib/demo/types'

/** Stored rows win on id collision; seed fills any ids not present in storage. */
export function mergeStoredClientsWithSeed(stored: DemoClient[], seed: DemoClient[]): DemoClient[] {
  const map = new Map<string, DemoClient>()
  for (const row of seed) {
    if (row != null && typeof row.id === 'string') map.set(row.id, row)
  }
  for (const row of stored) {
    if (row != null && typeof row.id === 'string') map.set(row.id, row)
  }
  return Array.from(map.values())
}

/** Stored rows win on id collision; seed fills any ids not present in storage. */
export function mergeStoredCalendarEventsWithSeed(
  stored: DemoCalendarEvent[],
  seed: DemoCalendarEvent[],
): DemoCalendarEvent[] {
  const map = new Map<string, DemoCalendarEvent>()
  for (const row of seed) {
    if (row != null && typeof row.id === 'string') map.set(row.id, row)
  }
  for (const row of stored) {
    if (row != null && typeof row.id === 'string') map.set(row.id, row)
  }
  return Array.from(map.values())
}

/** Drop linked matter ids that no longer exist after hydrate/merge. */
export function reconcileDemoClientsWithMatters(
  clients: DemoClient[],
  matters: DemoMatter[],
): DemoClient[] {
  const matterIds = new Set(
    matters.filter((m) => m != null && typeof m.id === 'string').map((m) => m.id),
  )
  return clients.map((client) => {
    const linked = Array.isArray(client.linked_matter_ids) ? client.linked_matter_ids : []
    const next = linked.filter((id) => typeof id === 'string' && matterIds.has(id))
    if (next.length === linked.length) return client
    return { ...client, linked_matter_ids: next }
  })
}

/** Drop calendar events whose matter_id is missing after hydrate/merge. */
export function reconcileDemoCalendarEventsWithMatters(
  events: DemoCalendarEvent[],
  matters: DemoMatter[],
): DemoCalendarEvent[] {
  const matterIds = new Set(
    matters.filter((m) => m != null && typeof m.id === 'string').map((m) => m.id),
  )
  return events.filter((evt) => typeof evt.matter_id === 'string' && matterIds.has(evt.matter_id))
}

/** Clear intake lead linkedClientId when the client row is gone. */
export function reconcileIntakeLeadsLinkedClients(
  leads: DemoIntakeLead[],
  clients: DemoClient[],
): DemoIntakeLead[] {
  const clientIds = new Set(
    clients.filter((c) => c != null && typeof c.id === 'string').map((c) => c.id),
  )
  return leads.map((lead) => {
    if (!lead.linkedClientId) return lead
    if (clientIds.has(lead.linkedClientId)) return lead
    return { ...lead, linkedClientId: null }
  })
}

export type BuildCalendarEventsForNewMatterInput = {
  matterId: string
  fileId: string
  closingDate: string
  financingDeadline?: string
  inspectionDeadline?: string
  financingType?: string
  assignedStaffId: string
  /** Stable id seed (e.g. Date.now()) so event ids are unique. */
  ts: number
  propertyAddress?: string
}

/**
 * Seed calendar rows for a newly created demo matter (closing + key deadlines).
 * Pure — callers append to store state.
 */
export function buildCalendarEventsForNewMatter(
  input: BuildCalendarEventsForNewMatterInput,
): DemoCalendarEvent[] {
  const matterId = input.matterId.trim()
  const fileId = input.fileId.trim()
  const closingDate = input.closingDate.trim()
  const staffId = input.assignedStaffId.trim()
  if (!matterId || !fileId || !closingDate) return []

  const events: DemoCalendarEvent[] = []
  const location =
    input.propertyAddress?.trim() || 'Closing location TBD'

  events.push({
    id: `evt-${input.ts}-closing`,
    title: `Closing - ${fileId}`,
    kind: 'closing',
    date: `${closingDate}T14:00:00`,
    matter_id: matterId,
    location,
    assigned_staff_id: staffId,
    deletedAt: null,
  })

  const inspection = input.inspectionDeadline?.trim()
  if (inspection) {
    events.push({
      id: `evt-${input.ts}-inspection`,
      title: `Inspection deadline - ${fileId}`,
      kind: 'deadline',
      date: `${inspection}T17:00:00`,
      matter_id: matterId,
      location: 'Deadline tracking',
      assigned_staff_id: staffId,
      deletedAt: null,
    })
  }

  const financing = input.financingDeadline?.trim()
  const financingType = (input.financingType || '').trim().toLowerCase()
  if (financing && financingType !== 'cash') {
    events.push({
      id: `evt-${input.ts}-loan`,
      title: `Loan approval deadline - ${fileId}`,
      kind: 'deadline',
      date: `${financing}T17:00:00`,
      matter_id: matterId,
      location: 'Deadline tracking',
      assigned_staff_id: staffId,
      deletedAt: null,
    })
  }

  return events
}
