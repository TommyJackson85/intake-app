/**
 * Post-Closing Undertakings — internal operational record helpers.
 *
 * Records internal post-closing items and follow-up context for a matter.
 * Does not determine whether an obligation is satisfied, whether closing is
 * complete, or whether any legal, title, escrow, recording, payoff, or
 * trust-account requirement has been met.
 */
import type {
  DemoPostClosingUndertakingItem,
  DemoPostClosingUndertakingItemStatus,
  DemoPostClosingUndertakings,
  DemoPostClosingUndertakingsStatus,
} from '@/lib/demo/types'

export const POST_CLOSING_UNDERTAKINGS_DISCLAIMER =
  'Record internal post-closing items and follow-up context for this matter. This workspace does not determine whether an obligation is satisfied, whether closing is complete, or whether any legal, title, escrow, recording, payoff, or trust-account requirement has been met.'

export type PostClosingUndertakingsStatusPresentation = {
  label: string
  bg: string
  color: string
  border: string
}

export type PostClosingUndertakingItemDraft = {
  description: string
  status: DemoPostClosingUndertakingItemStatus
  followUpContext: string
  targetDate: string
  notes: string
}

export type PostClosingUndertakingsDraft = {
  status: DemoPostClosingUndertakingsStatus
  followUpContext: string
  internalNote: string
  items: DemoPostClosingUndertakingItem[]
}

const EMPTY_UNDERTAKINGS: DemoPostClosingUndertakings = {
  status: 'not_started',
  items: [],
  followUpContext: '',
  internalNote: '',
  recordedByStaffId: null,
  recordedByStaffName: null,
  recordedAt: null,
  updatedAt: null,
}

export function buildDefaultPostClosingUndertakings(): DemoPostClosingUndertakings {
  return { ...EMPTY_UNDERTAKINGS, items: [] }
}

export function normalizePostClosingUndertakingItem(
  item: Partial<DemoPostClosingUndertakingItem> | null | undefined,
  index = 0
): DemoPostClosingUndertakingItem {
  const status = normalizeItemStatus(item?.status)
  return {
    id: (item?.id || '').trim() || `pcu-item-${index + 1}`,
    description: (item?.description || '').trim(),
    status,
    followUpContext: (item?.followUpContext || '').trim(),
    targetDate: (item?.targetDate || '').trim(),
    notes: (item?.notes || '').trim(),
  }
}

export function normalizePostClosingUndertakings(
  record: DemoPostClosingUndertakings | null | undefined
): DemoPostClosingUndertakings {
  if (!record) return buildDefaultPostClosingUndertakings()
  const items = Array.isArray(record.items)
    ? record.items.map((item, index) => normalizePostClosingUndertakingItem(item, index))
    : []
  return {
    status: normalizeWorkspaceStatus(record.status),
    items,
    followUpContext: (record.followUpContext || '').trim(),
    internalNote: (record.internalNote || '').trim(),
    recordedByStaffId: record.recordedByStaffId ?? null,
    recordedByStaffName: record.recordedByStaffName ?? null,
    recordedAt: record.recordedAt ?? null,
    updatedAt: record.updatedAt ?? null,
  }
}

function normalizeWorkspaceStatus(
  status: DemoPostClosingUndertakingsStatus | string | null | undefined
): DemoPostClosingUndertakingsStatus {
  switch (status) {
    case 'in_progress':
    case 'monitoring':
    case 'internally_noted':
    case 'not_started':
      return status
    default:
      return 'not_started'
  }
}

function normalizeItemStatus(
  status: DemoPostClosingUndertakingItemStatus | string | null | undefined
): DemoPostClosingUndertakingItemStatus {
  switch (status) {
    case 'in_progress':
    case 'noted':
    case 'closed_internally':
    case 'open':
      return status
    default:
      return 'open'
  }
}

export function postClosingUndertakingsStatusLabel(
  status: DemoPostClosingUndertakingsStatus
): string {
  switch (status) {
    case 'not_started':
      return 'Not started'
    case 'in_progress':
      return 'In progress'
    case 'monitoring':
      return 'Monitoring'
    case 'internally_noted':
      return 'Internally noted'
    default:
      return status
  }
}

export function postClosingUndertakingItemStatusLabel(
  status: DemoPostClosingUndertakingItemStatus
): string {
  switch (status) {
    case 'open':
      return 'Open'
    case 'in_progress':
      return 'In progress'
    case 'noted':
      return 'Noted'
    case 'closed_internally':
      return 'Closed internally'
    default:
      return status
  }
}

export function postClosingUndertakingsStatusPresentation(
  status: DemoPostClosingUndertakingsStatus
): PostClosingUndertakingsStatusPresentation {
  switch (status) {
    case 'internally_noted':
      return {
        label: postClosingUndertakingsStatusLabel(status),
        bg: '#e8f5f0',
        color: '#2f855a',
        border: 'rgba(47,133,90,0.35)',
      }
    case 'monitoring':
      return {
        label: postClosingUndertakingsStatusLabel(status),
        bg: '#fff8e6',
        color: '#b45309',
        border: 'rgba(180,83,9,0.35)',
      }
    case 'in_progress':
      return {
        label: postClosingUndertakingsStatusLabel(status),
        bg: '#e8f4f8',
        color: '#208096',
        border: 'rgba(32,128,150,0.35)',
      }
    case 'not_started':
    default:
      return {
        label: postClosingUndertakingsStatusLabel(status),
        bg: '#f5f5f5',
        color: '#627c71',
        border: 'rgba(94,82,64,0.2)',
      }
  }
}

export function buildDefaultPostClosingUndertakingItem(input?: {
  id?: string
  description?: string
}): DemoPostClosingUndertakingItem {
  return {
    id: input?.id?.trim() || `pcu-item-${Date.now()}`,
    description: (input?.description || '').trim(),
    status: 'open',
    followUpContext: '',
    targetDate: '',
    notes: '',
  }
}

export function createPostClosingUndertakingsPatch(input: {
  draft: PostClosingUndertakingsDraft
  actor: { staffId: string; staffName: string }
  existing?: DemoPostClosingUndertakings | null
  nowIso?: string
}): DemoPostClosingUndertakings {
  const existing = normalizePostClosingUndertakings(input.existing)
  const nowIso = input.nowIso || new Date().toISOString()
  const items = input.draft.items.map((item, index) =>
    normalizePostClosingUndertakingItem(item, index)
  )
  return {
    ...existing,
    status: input.draft.status,
    followUpContext: input.draft.followUpContext.trim(),
    internalNote: input.draft.internalNote.trim(),
    items,
    recordedByStaffId: input.actor.staffId,
    recordedByStaffName: input.actor.staffName,
    recordedAt: existing.recordedAt || nowIso,
    updatedAt: nowIso,
  }
}

export function isPostClosingUndertakingsUntouched(
  record: DemoPostClosingUndertakings | null | undefined
): boolean {
  const normalized = normalizePostClosingUndertakings(record)
  return (
    normalized.status === 'not_started' &&
    normalized.items.length === 0 &&
    !normalized.followUpContext &&
    !normalized.internalNote
  )
}

export function countOpenPostClosingUndertakingItems(
  record: DemoPostClosingUndertakings | null | undefined
): number {
  const normalized = normalizePostClosingUndertakings(record)
  return normalized.items.filter(
    (item) => item.status === 'open' || item.status === 'in_progress' || item.status === 'noted'
  ).length
}

export function formatPostClosingUndertakingsItemCount(count: number): string {
  if (count <= 0) return 'No recorded items'
  if (count === 1) return '1 recorded item'
  return `${count} recorded items`
}
