import { describe, expect, it } from 'vitest'
import {
  DEMO_MATTERS,
  getDemoMatterById,
  getDemoMatterFileIds,
  getDemoMatterIds,
  getDemoMatters,
} from '@/lib/demo/demoMatters'
import {
  findDemoMatterByDetailParam,
  getDemoMatterDetailIds,
  getDemoMatterDetailStaticParams,
} from '@/lib/demo/demoMatterDetailRoutes'
import { demoSeedData } from '@/lib/demo/demoData'

describe('demoMatters canonical fixtures', () => {
  it('exposes unique non-empty matter IDs', () => {
    const ids = getDemoMatterIds()
    expect(ids.length).toBeGreaterThan(0)
    expect(ids.every((id) => id.trim().length > 0)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
    expect(getDemoMatters()).toBe(DEMO_MATTERS)
    expect(demoSeedData.matters.map((m) => m.id)).toEqual(ids)
  })

  it('looks up a known matter by id and file_id', () => {
    const seed = DEMO_MATTERS[0]!
    expect(getDemoMatterById(seed.id)).toMatchObject({
      id: seed.id,
      file_id: seed.file_id,
      status: seed.status,
    })
    expect(getDemoMatterById(` ${seed.file_id} `)?.id).toBe(seed.id)
  })

  it('returns null for unknown or empty IDs', () => {
    expect(getDemoMatterById('not-a-real-matter')).toBeNull()
    expect(getDemoMatterById('')).toBeNull()
    expect(getDemoMatterById('   ')).toBeNull()
    expect(getDemoMatterById(null)).toBeNull()
    expect(getDemoMatterById(undefined)).toBeNull()
  })

  it('resolves every list fixture to a valid detail record and static param', () => {
    const fileIds = getDemoMatterFileIds()
    expect(fileIds).toEqual(getDemoMatterDetailIds())
    expect(getDemoMatterDetailStaticParams()).toEqual(fileIds.map((id) => ({ id })))

    for (const matter of DEMO_MATTERS) {
      const byId = getDemoMatterById(matter.id)
      const byFile = findDemoMatterByDetailParam(matter.file_id)
      expect(byId).not.toBeNull()
      expect(byFile).not.toBeNull()
      expect(byId?.id).toBe(matter.id)
      expect(byFile?.file_id).toBe(matter.file_id)
      expect(byId?.status).toBe(matter.status)
    }
  })
})
