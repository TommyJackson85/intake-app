/**
 * Matters list selection / action guards.
 *
 * Prevents stale modal targets when filters hide a matter or it is archived.
 * Pure helpers — no Supabase/DB coupling.
 */
import type { DemoMatter } from '@/lib/demo/types'

/** Resolve the latest open (non-archived) matter by stable id. */
export function resolveOpenMatterById(
  openMatters: DemoMatter[],
  matterId: string | null | undefined,
): DemoMatter | null {
  const id = typeof matterId === 'string' ? matterId.trim() : ''
  if (!id) return null
  return openMatters.find((m) => m.id === id && !m.deletedAt) ?? null
}

/** True when the matter id is present in the currently visible list rows. */
export function isMatterIdVisible(
  visibleMatters: DemoMatter[],
  matterId: string | null | undefined,
): boolean {
  const id = typeof matterId === 'string' ? matterId.trim() : ''
  if (!id) return false
  return visibleMatters.some((m) => m.id === id)
}

/**
 * After visible-set or open-matters changes: keep selection only when the id is
 * still open AND still visible. Otherwise clear (closes modal / menus).
 */
export function nextSelectedMatterIdAfterListChange(input: {
  selectedMatterId: string | null | undefined
  openMatters: DemoMatter[]
  visibleMatters: DemoMatter[]
}): string | null {
  const current = typeof input.selectedMatterId === 'string' ? input.selectedMatterId.trim() : ''
  if (!current) return null
  const stillOpen = resolveOpenMatterById(input.openMatters, current)
  if (!stillOpen) return null
  if (!isMatterIdVisible(input.visibleMatters, current)) return null
  return stillOpen.id
}

/**
 * Resolve the live open matter immediately before committing a list action
 * (archive, etc.). Returns null when the target is gone — callers must no-op.
 */
export function resolveMatterForListAction(input: {
  matterId: string | null | undefined
  openMatters: DemoMatter[]
}): DemoMatter | null {
  return resolveOpenMatterById(input.openMatters, input.matterId)
}

/** Whether a destructive list action may be submitted for this id. */
export function canCommitMatterListAction(input: {
  matterId: string | null | undefined
  openMatters: DemoMatter[]
}): boolean {
  return resolveMatterForListAction(input) != null
}
