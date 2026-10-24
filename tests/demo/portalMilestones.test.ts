import { describe, expect, it } from 'vitest'
import { demoSeedData } from '@/lib/demo/demoData'
import {
  buildPortalMilestoneView,
  deriveCompletedPortalMilestones,
  MILESTONE_ORDER,
} from '@/lib/demo/portalMilestones'
import type { DemoMatter } from '@/lib/demo/types'

function minimalMatter(overrides: Partial<DemoMatter> = {}): DemoMatter {
  const base = demoSeedData.matters.find((m) => m.id === 'matter-001')
  if (!base) throw new Error('fixture matter-001 missing')
  return {
    ...base,
    tasks: [],
    timeline: [],
    status: 'Open',
    key_dates: {
      ...base.key_dates,
      closing_date: '',
    },
    ...overrides,
  }
}

describe('portalMilestones', () => {
  it('derives a coherent ladder for seed matter-001 (cleared to close)', () => {
    const matter = demoSeedData.matters.find((m) => m.id === 'matter-001')
    if (!matter) throw new Error('fixture missing')
    const completed = deriveCompletedPortalMilestones(matter)
    expect(completed).toContain('instruction_received')
    expect(completed).toContain('title_search_complete')
    expect(completed).toContain('contracts_received')
    expect(completed).toContain('contracts_signed')
    expect(completed).toContain('closing_date_set')
    expect(completed).not.toContain('closed')

    const view = buildPortalMilestoneView(matter)
    expect(view.nextStatus).toBe('closed')
    expect(view.currentLabel).toBe('Closing date confirmed')
    expect(view.logs.every((l) => l.matter_id === matter.id)).toBe(true)
    expect(view.logs.map((l) => l.status)).toEqual(completed)
  })

  it('cascades earlier milestones when a later task is complete', () => {
    const matter = minimalMatter({
      tasks: [
        {
          id: 't1',
          title: 'Order title search',
          status: 'completed',
          deletedAt: null,
        },
      ],
    })
    const completed = deriveCompletedPortalMilestones(matter)
    expect(completed).toEqual([
      'instruction_received',
      'aml_checks_started',
      'aml_checks_complete',
      'title_search_started',
      'title_search_complete',
    ])
  })

  it('ignores soft-deleted tasks', () => {
    const matter = minimalMatter({
      tasks: [
        {
          id: 't1',
          title: 'Order title search',
          status: 'completed',
          deletedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 't2',
          title: 'Receive executed contract',
          status: 'completed',
          deletedAt: null,
        },
      ],
    })
    const completed = deriveCompletedPortalMilestones(matter)
    expect(completed).toContain('instruction_received')
    expect(completed).not.toContain('title_search_complete')
  })

  it('marks closed when matter status is Closed', () => {
    const matter = minimalMatter({
      status: 'Closed',
      key_dates: {
        effective_date: '2026-03-03',
        inspection_deadline: '2026-03-11',
        loan_approval_deadline: '2026-03-18',
        closing_date: '2026-03-28',
      },
      tasks: [
        { id: 't1', title: 'Receive executed contract', status: 'completed', deletedAt: null },
      ],
    })
    const completed = deriveCompletedPortalMilestones(matter)
    expect(completed).toEqual([...MILESTONE_ORDER])
    expect(buildPortalMilestoneView(matter).nextStatus).toBeNull()
  })
})
