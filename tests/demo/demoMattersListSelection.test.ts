import { describe, expect, it } from 'vitest'
import {
  canCommitMatterListAction,
  isMatterIdVisible,
  nextSelectedMatterIdAfterListChange,
  resolveMatterForListAction,
  resolveOpenMatterById,
} from '@/lib/demo/demoMattersListSelection'
import { DEMO_MATTERS } from '@/lib/demo/demoMatters'
import type { DemoMatter } from '@/lib/demo/types'
import { filterMattersWithActiveCondoDiligenceSummaryReviewTasks } from '@/lib/demo/demoMatterReviewTask'

function cloneMatter(id: string, patch?: Partial<DemoMatter>): DemoMatter {
  const base = DEMO_MATTERS.find((m) => m.id === id)
  if (!base) throw new Error(`missing seed ${id}`)
  return { ...structuredClone(base), ...patch }
}

describe('demoMattersListSelection', () => {
  const openMatters = DEMO_MATTERS.map((m) => structuredClone(m)) as DemoMatter[]

  it('resolves open matters by stable id and rejects unknown ids', () => {
    const known = openMatters[0]!
    expect(resolveOpenMatterById(openMatters, known.id)?.file_id).toBe(known.file_id)
    expect(resolveOpenMatterById(openMatters, ` ${known.id} `)?.id).toBe(known.id)
    expect(resolveOpenMatterById(openMatters, 'missing')).toBeNull()
    expect(resolveOpenMatterById(openMatters, '')).toBeNull()
    expect(resolveOpenMatterById(openMatters, null)).toBeNull()
  })

  it('clears selection when search/filter removes the selected matter from the visible set', () => {
    const selected = openMatters[0]!
    const afterSearch = openMatters.filter((m) => m.id !== selected.id)

    expect(
      nextSelectedMatterIdAfterListChange({
        selectedMatterId: selected.id,
        openMatters,
        visibleMatters: afterSearch,
      }),
    ).toBeNull()

    expect(
      nextSelectedMatterIdAfterListChange({
        selectedMatterId: selected.id,
        openMatters,
        visibleMatters: openMatters,
      }),
    ).toBe(selected.id)
  })

  it('clears selection when a condo-review filter hides the selected matter', () => {
    const selected = openMatters.find((m) => m.id === 'matter-001')!
    const visibleWithFilter = filterMattersWithActiveCondoDiligenceSummaryReviewTasks(
      openMatters,
      [], // no open review tasks → filter empties the list
    )
    expect(isMatterIdVisible(visibleWithFilter, selected.id)).toBe(false)
    expect(
      nextSelectedMatterIdAfterListChange({
        selectedMatterId: selected.id,
        openMatters,
        visibleMatters: visibleWithFilter,
      }),
    ).toBeNull()
  })

  it('clears selection and blocks actions after the selected matter is archived', () => {
    const selected = openMatters[1]!
    const afterArchive = openMatters.filter((m) => m.id !== selected.id)

    expect(
      nextSelectedMatterIdAfterListChange({
        selectedMatterId: selected.id,
        openMatters: afterArchive,
        visibleMatters: afterArchive,
      }),
    ).toBeNull()

    expect(
      resolveMatterForListAction({
        matterId: selected.id,
        openMatters: afterArchive,
      }),
    ).toBeNull()
    expect(
      canCommitMatterListAction({
        matterId: selected.id,
        openMatters: afterArchive,
      }),
    ).toBe(false)
  })

  it('refuses to confirm an action when the target no longer exists in open matters', () => {
    const ghost = cloneMatter('matter-003', { deletedAt: '2026-04-01T00:00:00.000Z' })
    const open = openMatters.filter((m) => m.id !== ghost.id)

    expect(
      canCommitMatterListAction({
        matterId: ghost.id,
        openMatters: open,
      }),
    ).toBe(false)
    expect(
      resolveMatterForListAction({
        matterId: ghost.id,
        openMatters: [...open, ghost],
      }),
    ).toBeNull()
  })
})
