/**
 * Demo matter detail route helpers for `/demo/matters/[id]`.
 *
 * The dynamic segment is the matter **file_id** (e.g. `FL-2026-001`), matching the
 * `?matter=` query used by the matters list modal. Seeded IDs only — no DB/API.
 */
import { demoSeedData } from '@/lib/demo/demoData'
import type { DemoMatter } from '@/lib/demo/types'

/** Canonical demo matter detail path params (file_id values from seed data). */
export function getDemoMatterDetailIds(): string[] {
  return demoSeedData.matters
    .map((m) => m.file_id.trim())
    .filter((id) => id.length > 0)
}

/** App Router `generateStaticParams` payload for every seeded demo matter. */
export function getDemoMatterDetailStaticParams(): Array<{ id: string }> {
  return getDemoMatterDetailIds().map((id) => ({ id }))
}

/** Resolve a seeded matter by detail-route param (file_id, or matter id as alias). */
export function findDemoMatterByDetailParam(
  id: string | null | undefined,
): DemoMatter | null {
  const key = typeof id === 'string' ? id.trim() : ''
  if (!key) return null
  return (
    demoSeedData.matters.find((m) => m.file_id === key || m.id === key) ?? null
  )
}

/** Matters-list deep link that opens the detail modal for a known file_id. */
export function getDemoMatterListDeepLink(fileId: string): string {
  return `/demo/matters?matter=${encodeURIComponent(fileId.trim())}`
}
