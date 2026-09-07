/**
 * Pure search / filter / sort / pagination helpers for the demo matters list.
 * Never mutates the source array. Demo-only — no Supabase/DB coupling.
 */
import type { DemoMatter, DemoMatterStatus } from '@/lib/demo/types'
import { filterMattersWithActiveCondoDiligenceSummaryReviewTasks } from '@/lib/demo/demoMatterReviewTask'
import type { DemoMatterReviewTask } from '@/lib/demo/types'

export const DEMO_MATTERS_LIST_DEFAULT_PAGE_SIZE = 5

export type DemoMattersListSortKey = 'file_id' | 'closing_date' | 'status' | 'property_type'
export type DemoMattersListSortDirection = 'asc' | 'desc'

export type DemoMattersListFilters = {
  search: string
  status: '' | DemoMatterStatus | string
  propertyType: '' | DemoMatter['property']['property_type'] | string
  owner: string
  openCondoReviewTasksOnly: boolean
}

export type DemoMattersListQuery = DemoMattersListFilters & {
  sortKey: DemoMattersListSortKey
  sortDirection: DemoMattersListSortDirection
  page: number
  pageSize: number
}

export type DemoMattersListView = {
  /** Filtered + sorted matters (not paginated). */
  filteredMatters: DemoMatter[]
  /** Current page slice. */
  pageMatters: DemoMatter[]
  totalCount: number
  page: number
  pageSize: number
  pageCount: number
  hasActiveFilters: boolean
  normalizedSearch: string
}

export function createDefaultDemoMattersListQuery(
  overrides?: Partial<DemoMattersListQuery>,
): DemoMattersListQuery {
  return {
    search: '',
    status: '',
    propertyType: '',
    owner: '',
    openCondoReviewTasksOnly: false,
    sortKey: 'file_id',
    sortDirection: 'asc',
    page: 1,
    pageSize: DEMO_MATTERS_LIST_DEFAULT_PAGE_SIZE,
    ...overrides,
  }
}

/** Trim edges and collapse internal whitespace. Blank / whitespace-only → ''. */
export function normalizeDemoMattersSearchQuery(raw: string | null | undefined): string {
  if (typeof raw !== 'string') return ''
  return raw.trim().replace(/\s+/g, ' ')
}

function safeLower(value: string | null | undefined): string {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

function matterSearchHaystack(matter: DemoMatter): string {
  return [
    matter.file_id,
    matter.id,
    matter.status,
    matter.matter_type,
    matter.transactionType,
    matter.property?.address,
    matter.property?.county,
    matter.property?.property_type,
    matter.buyer?.name,
    matter.seller?.name,
    matter.assignedAttorney,
    matter.assignedParalegal,
    matter.buyerAgent,
    matter.listingAgent,
  ]
    .map((part) => (typeof part === 'string' ? part : ''))
    .join('\n')
}

/** Case-insensitive substring match; empty normalized query matches all. */
export function matterMatchesDemoMattersSearch(
  matter: DemoMatter,
  normalizedQuery: string,
): boolean {
  if (!normalizedQuery) return true
  try {
    return safeLower(matterSearchHaystack(matter)).includes(safeLower(normalizedQuery))
  } catch {
    return false
  }
}

export function demoMattersListHasActiveFilters(filters: DemoMattersListFilters): boolean {
  return Boolean(
    normalizeDemoMattersSearchQuery(filters.search) ||
      filters.status ||
      filters.propertyType ||
      normalizeDemoMattersSearchQuery(filters.owner) ||
      filters.openCondoReviewTasksOnly,
  )
}

/**
 * Filter without mutating `source`. Applies condo-review gate, then status /
 * property type / owner / search.
 */
export function filterDemoMattersList(
  source: readonly DemoMatter[],
  filters: DemoMattersListFilters,
  reviewTasks: readonly DemoMatterReviewTask[] = [],
): DemoMatter[] {
  let rows = source.slice()

  if (filters.openCondoReviewTasksOnly) {
    rows = filterMattersWithActiveCondoDiligenceSummaryReviewTasks(
      rows,
      reviewTasks as DemoMatterReviewTask[],
    )
  }

  const status = typeof filters.status === 'string' ? filters.status.trim() : ''
  if (status) {
    rows = rows.filter((m) => m.status === status)
  }

  const propertyType =
    typeof filters.propertyType === 'string' ? filters.propertyType.trim() : ''
  if (propertyType) {
    rows = rows.filter((m) => m.property?.property_type === propertyType)
  }

  const owner = normalizeDemoMattersSearchQuery(filters.owner)
  if (owner) {
    const needle = safeLower(owner)
    rows = rows.filter((m) => {
      const attorney = safeLower(m.assignedAttorney)
      const paralegal = safeLower(m.assignedParalegal)
      return attorney.includes(needle) || paralegal.includes(needle)
    })
  }

  const normalizedSearch = normalizeDemoMattersSearchQuery(filters.search)
  if (normalizedSearch) {
    rows = rows.filter((m) => matterMatchesDemoMattersSearch(m, normalizedSearch))
  }

  return rows
}

function compareNullableString(a: string | null | undefined, b: string | null | undefined): number {
  const left = typeof a === 'string' ? a : ''
  const right = typeof b === 'string' ? b : ''
  if (left === right) return 0
  // Empty / missing values sort after populated ones (stable product behavior).
  if (!left && right) return 1
  if (left && !right) return -1
  return left.localeCompare(right, undefined, { sensitivity: 'base', numeric: true })
}

function matterSortValue(matter: DemoMatter, key: DemoMattersListSortKey): string {
  switch (key) {
    case 'closing_date':
      return matter.key_dates?.closing_date ?? ''
    case 'status':
      return matter.status ?? ''
    case 'property_type':
      return matter.property?.property_type ?? ''
    case 'file_id':
    default:
      return matter.file_id ?? ''
  }
}

/** Deterministic sort copy; ties broken by matter id. Does not mutate `source`. */
export function sortDemoMattersList(
  source: readonly DemoMatter[],
  sortKey: DemoMattersListSortKey = 'file_id',
  sortDirection: DemoMattersListSortDirection = 'asc',
): DemoMatter[] {
  const dir = sortDirection === 'desc' ? -1 : 1
  return source.slice().sort((a, b) => {
    const primary =
      compareNullableString(matterSortValue(a, sortKey), matterSortValue(b, sortKey)) * dir
    if (primary !== 0) return primary
    return compareNullableString(a.id, b.id)
  })
}

/** Clamp 1-based page into a valid range for the filtered total. */
export function clampDemoMattersListPage(
  page: number,
  totalCount: number,
  pageSize: number = DEMO_MATTERS_LIST_DEFAULT_PAGE_SIZE,
): number {
  const size = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : DEMO_MATTERS_LIST_DEFAULT_PAGE_SIZE
  const total = Math.max(0, totalCount)
  const pageCount = Math.max(1, Math.ceil(total / size) || 1)
  const raw = Number.isFinite(page) ? Math.floor(page) : 1
  if (raw < 1) return 1
  if (raw > pageCount) return pageCount
  return raw
}

/** Page index resets to 1 whenever filters change. */
export function pageAfterDemoMattersFilterChange(): number {
  return 1
}

export function paginateDemoMattersList(
  source: readonly DemoMatter[],
  page: number,
  pageSize: number = DEMO_MATTERS_LIST_DEFAULT_PAGE_SIZE,
): { pageMatters: DemoMatter[]; page: number; pageCount: number; totalCount: number } {
  const totalCount = source.length
  const size = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : DEMO_MATTERS_LIST_DEFAULT_PAGE_SIZE
  const pageCount = Math.max(1, Math.ceil(totalCount / size) || 1)
  const safePage = clampDemoMattersListPage(page, totalCount, size)
  const start = (safePage - 1) * size
  return {
    pageMatters: source.slice(start, start + size),
    page: safePage,
    pageCount,
    totalCount,
  }
}

/** Full list pipeline: filter → sort → paginate. Source array is never mutated. */
export function buildDemoMattersListView(input: {
  matters: readonly DemoMatter[]
  query: DemoMattersListQuery
  reviewTasks?: readonly DemoMatterReviewTask[]
}): DemoMattersListView {
  const normalizedSearch = normalizeDemoMattersSearchQuery(input.query.search)
  const filtered = filterDemoMattersList(
    input.matters,
    { ...input.query, search: normalizedSearch },
    input.reviewTasks ?? [],
  )
  const sorted = sortDemoMattersList(filtered, input.query.sortKey, input.query.sortDirection)
  const paged = paginateDemoMattersList(sorted, input.query.page, input.query.pageSize)

  return {
    filteredMatters: sorted,
    pageMatters: paged.pageMatters,
    totalCount: paged.totalCount,
    page: paged.page,
    pageSize: input.query.pageSize,
    pageCount: paged.pageCount,
    hasActiveFilters: demoMattersListHasActiveFilters({
      ...input.query,
      search: normalizedSearch,
    }),
    normalizedSearch,
  }
}

/** Unique status values present in the source list (for filter controls). */
export function listDemoMatterStatuses(source: readonly DemoMatter[]): DemoMatterStatus[] {
  const seen = new Set<string>()
  const out: DemoMatterStatus[] = []
  for (const m of source) {
    if (!m.status || seen.has(m.status)) continue
    seen.add(m.status)
    out.push(m.status)
  }
  return out.sort((a, b) => a.localeCompare(b))
}

export function listDemoMatterPropertyTypes(
  source: readonly DemoMatter[],
): Array<DemoMatter['property']['property_type']> {
  const seen = new Set<string>()
  const out: Array<DemoMatter['property']['property_type']> = []
  for (const m of source) {
    const value = m.property?.property_type
    if (!value || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out.sort((a, b) => a.localeCompare(b))
}

export function listDemoMatterOwners(source: readonly DemoMatter[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of source) {
    for (const name of [m.assignedAttorney, m.assignedParalegal]) {
      const trimmed = typeof name === 'string' ? name.trim() : ''
      if (!trimmed || seen.has(trimmed)) continue
      seen.add(trimmed)
      out.push(trimmed)
    }
  }
  return out.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}
