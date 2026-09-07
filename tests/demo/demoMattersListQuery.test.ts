import { describe, expect, it } from 'vitest'
import { DEMO_MATTERS } from '@/lib/demo/demoMatters'
import {
  buildDemoMattersListView,
  clampDemoMattersListPage,
  createDefaultDemoMattersListQuery,
  filterDemoMattersList,
  matterMatchesDemoMattersSearch,
  normalizeDemoMattersSearchQuery,
  pageAfterDemoMattersFilterChange,
  paginateDemoMattersList,
  sortDemoMattersList,
} from '@/lib/demo/demoMattersListQuery'
import type { DemoMatter } from '@/lib/demo/types'

function snapshotIds(matters: readonly DemoMatter[]): string[] {
  return matters.map((m) => m.id)
}

describe('demoMattersListQuery', () => {
  const source = DEMO_MATTERS as DemoMatter[]

  it('normalizes whitespace-only queries to empty and matches all', () => {
    expect(normalizeDemoMattersSearchQuery('   \t  ')).toBe('')
    expect(normalizeDemoMattersSearchQuery('  FL-2026-001  ')).toBe('FL-2026-001')
    expect(normalizeDemoMattersSearchQuery('Noah   Carter')).toBe('Noah Carter')
    const normalized = normalizeDemoMattersSearchQuery('   ')
    expect(source.every((m) => matterMatchesDemoMattersSearch(m, normalized))).toBe(true)
  })

  it('matches search case-insensitively', () => {
    const target = source.find((m) => m.file_id === 'FL-2026-001')!
    expect(matterMatchesDemoMattersSearch(target, 'fl-2026-001')).toBe(true)
    expect(matterMatchesDemoMattersSearch(target, 'NOAH CARTER')).toBe(true)
    expect(matterMatchesDemoMattersSearch(target, 'winter garden')).toBe(true)
  })

  it('handles punctuation, apostrophes, hyphens, and slashes in search safely', () => {
    const closed = source.find((m) => m.status === 'Closed/Post-Closing')!
    expect(matterMatchesDemoMattersSearch(closed, 'Closed/Post-Closing')).toBe(true)
    expect(matterMatchesDemoMattersSearch(closed, 'FL-2026')).toBe(true)
    expect(() => matterMatchesDemoMattersSearch(closed, "O'Brien / test-hyphen")).not.toThrow()
    expect(matterMatchesDemoMattersSearch(closed, "O'Brien / test-hyphen")).toBe(false)

    const filtered = filterDemoMattersList(source, {
      search: "  Closed/Post-Closing  ",
      status: '',
      propertyType: '',
      owner: '',
      openCondoReviewTasksOnly: false,
    })
    expect(filtered.some((m) => m.id === closed.id)).toBe(true)
  })

  it('returns an empty filtered set for no-result queries', () => {
    const filtered = filterDemoMattersList(source, {
      search: 'zzz-no-such-matter-xxx',
      status: '',
      propertyType: '',
      owner: '',
      openCondoReviewTasksOnly: false,
    })
    expect(filtered).toEqual([])
    const view = buildDemoMattersListView({
      matters: source,
      query: createDefaultDemoMattersListQuery({ search: 'zzz-no-such-matter-xxx', page: 3 }),
    })
    expect(view.totalCount).toBe(0)
    expect(view.pageMatters).toEqual([])
    expect(view.page).toBe(1)
  })

  it('resets page number to 1 when filters change', () => {
    expect(pageAfterDemoMattersFilterChange()).toBe(1)
  })

  it('clamps page after a restrictive filter leaves fewer pages', () => {
    expect(clampDemoMattersListPage(9, 4, 2)).toBe(2)
    expect(clampDemoMattersListPage(0, 4, 2)).toBe(1)
    expect(clampDemoMattersListPage(2, 0, 2)).toBe(1)

    const sorted = sortDemoMattersList(source, 'file_id', 'asc')
    const page = paginateDemoMattersList(sorted, 99, 2)
    expect(page.page).toBe(page.pageCount)
    expect(page.pageMatters.length).toBeGreaterThan(0)

    const restrictive = buildDemoMattersListView({
      matters: source,
      query: createDefaultDemoMattersListQuery({
        status: 'Title Search',
        page: 8,
        pageSize: 2,
      }),
    })
    expect(restrictive.totalCount).toBeLessThanOrEqual(source.length)
    expect(restrictive.page).toBe(1)
    expect(restrictive.page).toBeLessThanOrEqual(restrictive.pageCount)
  })

  it('does not mutate source data when filtering or sorting', () => {
    const originalIds = snapshotIds(source)
    const originalJson = JSON.stringify(source)
    const firstRef = source[0]

    const filtered = filterDemoMattersList(source, {
      search: 'FL-2026',
      status: '',
      propertyType: '',
      owner: '',
      openCondoReviewTasksOnly: false,
    })
    const sorted = sortDemoMattersList(source, 'status', 'desc')
    void paginateDemoMattersList(sorted, 1, 2)
    void buildDemoMattersListView({
      matters: source,
      query: createDefaultDemoMattersListQuery({ sortKey: 'closing_date', sortDirection: 'desc' }),
    })

    expect(snapshotIds(source)).toEqual(originalIds)
    expect(JSON.stringify(source)).toBe(originalJson)
    expect(source[0]).toBe(firstRef)
    expect(filtered).not.toBe(source)
    expect(sorted).not.toBe(source)
  })

  it('restores the full list when all filters are cleared', () => {
    const restricted = buildDemoMattersListView({
      matters: source,
      query: createDefaultDemoMattersListQuery({
        search: 'FL-2026-001',
        status: 'Cleared to Close',
        page: 2,
      }),
    })
    expect(restricted.totalCount).toBeLessThan(source.length)

    const cleared = buildDemoMattersListView({
      matters: source,
      query: createDefaultDemoMattersListQuery(),
    })
    expect(cleared.hasActiveFilters).toBe(false)
    expect(cleared.totalCount).toBe(source.length)
    expect(snapshotIds(cleared.filteredMatters).sort()).toEqual(snapshotIds(source).sort())
  })

  it('sorts deterministically with id tie-break for equal values', () => {
    const twins: DemoMatter[] = [
      { ...source[0]!, id: 'matter-z', file_id: 'FL-SAME', status: source[0]!.status },
      { ...source[0]!, id: 'matter-a', file_id: 'FL-SAME', status: source[0]!.status },
    ]
    const sorted = sortDemoMattersList(twins, 'file_id', 'asc')
    expect(sorted.map((m) => m.id)).toEqual(['matter-a', 'matter-z'])
  })
})
