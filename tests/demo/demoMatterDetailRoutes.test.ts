import { describe, expect, it } from 'vitest'
import {
  getDemoMatterById,
  getDemoMatterFileIds,
} from '@/lib/demo/demoMatters'
import {
  findDemoMatterByDetailParam,
  getDemoMatterDetailIds,
  getDemoMatterDetailStaticParams,
  getDemoMatterListDeepLink,
} from '@/lib/demo/demoMatterDetailRoutes'

describe('demoMatterDetailRoutes', () => {
  it('generates static params from the canonical demoMatters module', () => {
    const ids = getDemoMatterDetailIds()
    const params = getDemoMatterDetailStaticParams()

    expect(ids).toEqual(getDemoMatterFileIds())
    expect(params).toEqual(ids.map((id) => ({ id })))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves a known matter file_id and matter id via shared lookup', () => {
    const seed = getDemoMatterById('matter-001')
    expect(seed).not.toBeNull()
    const byFileId = findDemoMatterByDetailParam(seed!.file_id)
    const byMatterId = findDemoMatterByDetailParam(seed!.id)

    expect(byFileId).toMatchObject({
      id: seed!.id,
      file_id: seed!.file_id,
    })
    expect(byMatterId?.id).toBe(seed!.id)
    expect(getDemoMatterListDeepLink(seed!.file_id)).toBe(
      `/demo/matters?matter=${encodeURIComponent(seed!.file_id)}`,
    )
  })

  it('treats invalid or missing IDs as not found', () => {
    expect(findDemoMatterByDetailParam('not-a-real-matter')).toBeNull()
    expect(findDemoMatterByDetailParam('')).toBeNull()
    expect(findDemoMatterByDetailParam('   ')).toBeNull()
    expect(findDemoMatterByDetailParam(null)).toBeNull()
    expect(findDemoMatterByDetailParam(undefined)).toBeNull()
  })
})
