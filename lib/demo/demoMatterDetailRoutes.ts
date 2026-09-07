/**
 * Demo matter detail route helpers for `/demo/matters/[id]`.
 *
 * Uses the canonical `demoMatters` fixtures so list and detail stay aligned.
 * The dynamic segment is the matter **file_id** (e.g. `FL-2026-001`).
 */
import {
  getDemoMatterById,
  getDemoMatterFileIds,
} from '@/lib/demo/demoMatters'
import type { DemoMatter } from '@/lib/demo/types'

/** Canonical demo matter detail path params (file_id values from seed data). */
export function getDemoMatterDetailIds(): string[] {
  return getDemoMatterFileIds()
}

/** App Router `generateStaticParams` payload for every seeded demo matter. */
export function getDemoMatterDetailStaticParams(): Array<{ id: string }> {
  return getDemoMatterDetailIds().map((id) => ({ id }))
}

/** Resolve a seeded matter by detail-route param (file_id or matter id). */
export function findDemoMatterByDetailParam(
  id: string | null | undefined,
): DemoMatter | null {
  return getDemoMatterById(id)
}

/** Matters-list deep link that opens the detail modal for a known file_id. */
export function getDemoMatterListDeepLink(fileId: string): string {
  return `/demo/matters?matter=${encodeURIComponent(fileId.trim())}`
}

/** Detail path for a seeded matter file_id (basePath-safe via next/link). */
export function getDemoMatterDetailPath(fileId: string): string {
  return `/demo/matters/${encodeURIComponent(fileId.trim())}`
}
