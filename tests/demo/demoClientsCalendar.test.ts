import { describe, expect, it } from 'vitest'
import { demoSeedData } from '@/lib/demo/demoData'
import {
  buildCalendarEventsForNewMatter,
  mergeStoredCalendarEventsWithSeed,
  mergeStoredClientsWithSeed,
  reconcileDemoCalendarEventsWithMatters,
  reconcileDemoClientsWithMatters,
  reconcileIntakeLeadsLinkedClients,
} from '@/lib/demo/demoClientsCalendar'
import type { DemoCalendarEvent, DemoClient, DemoIntakeLead, DemoMatter } from '@/lib/demo/types'

describe('demoClientsCalendar', () => {
  it('merges stored clients over seed by id and keeps seed-only rows', () => {
    const seed = demoSeedData.clients
    const stored: DemoClient[] = [
      {
        ...seed[0]!,
        full_name: 'Stored Noah',
      },
      {
        id: 'client-new',
        full_name: 'New Client',
        email: 'new@demo.example',
        phone: '',
        kyc_status: 'pending',
        type: 'individual',
        linked_matter_ids: ['matter-999'],
        created_at: '2026-04-01',
        deletedAt: null,
      },
    ]
    const merged = mergeStoredClientsWithSeed(stored, seed)
    expect(merged.find((c) => c.id === seed[0]!.id)?.full_name).toBe('Stored Noah')
    expect(merged.some((c) => c.id === 'client-new')).toBe(true)
    expect(merged.some((c) => c.id === seed[1]!.id)).toBe(true)
  })

  it('merges stored calendar events over seed by id', () => {
    const seed = demoSeedData.calendarEvents
    const stored: DemoCalendarEvent[] = [
      { ...seed[0]!, title: 'Stored closing title' },
      {
        id: 'evt-new',
        title: 'New matter closing',
        kind: 'closing',
        date: '2026-05-01T14:00:00',
        matter_id: 'matter-new',
        location: 'Office',
        assigned_staff_id: 'staff-emma-kline',
        deletedAt: null,
      },
    ]
    const merged = mergeStoredCalendarEventsWithSeed(stored, seed)
    expect(merged.find((e) => e.id === seed[0]!.id)?.title).toBe('Stored closing title')
    expect(merged.some((e) => e.id === 'evt-new')).toBe(true)
  })

  it('reconciles dangling client matter links and orphan calendar events', () => {
    const matters = demoSeedData.matters.slice(0, 1) as DemoMatter[]
    const clients: DemoClient[] = [
      {
        ...demoSeedData.clients[0]!,
        linked_matter_ids: [matters[0]!.id, 'matter-missing'],
      },
    ]
    const events: DemoCalendarEvent[] = [
      { ...demoSeedData.calendarEvents[0]!, matter_id: matters[0]!.id },
      { ...demoSeedData.calendarEvents[1]!, matter_id: 'matter-missing' },
    ]
    const nextClients = reconcileDemoClientsWithMatters(clients, matters)
    expect(nextClients[0]!.linked_matter_ids).toEqual([matters[0]!.id])
    const nextEvents = reconcileDemoCalendarEventsWithMatters(events, matters)
    expect(nextEvents).toHaveLength(1)
    expect(nextEvents[0]!.matter_id).toBe(matters[0]!.id)
  })

  it('clears intake linkedClientId when client is missing', () => {
    const clients = demoSeedData.clients.slice(0, 1)
    const leads = [
      { id: 'lead-1', token: 'tok-1', linkedClientId: clients[0]!.id },
      { id: 'lead-2', token: 'tok-2', linkedClientId: 'client-gone' },
      { id: 'lead-3', token: 'tok-3', linkedClientId: null },
    ] as DemoIntakeLead[]
    const next = reconcileIntakeLeadsLinkedClients(leads, clients)
    expect(next[0]!.linkedClientId).toBe(clients[0]!.id)
    expect(next[1]!.linkedClientId).toBeNull()
    expect(next[2]!.linkedClientId).toBeNull()
  })

  it('builds closing + deadline calendar events for a new matter', () => {
    const events = buildCalendarEventsForNewMatter({
      matterId: 'matter-100',
      fileId: 'FL-2026-100',
      closingDate: '2026-06-15',
      financingDeadline: '2026-06-08',
      inspectionDeadline: '2026-06-06',
      financingType: 'Conventional',
      assignedStaffId: 'staff-katherine-ruiz',
      ts: 1000,
      propertyAddress: '1 Demo Way',
    })
    expect(events.map((e) => e.kind).sort()).toEqual(['closing', 'deadline', 'deadline'])
    expect(events.every((e) => e.matter_id === 'matter-100')).toBe(true)
    expect(events.some((e) => e.title.includes('Closing'))).toBe(true)
    expect(events.some((e) => e.title.includes('Loan approval'))).toBe(true)
    expect(events.some((e) => e.title.includes('Inspection'))).toBe(true)
  })

  it('skips loan deadline for cash financing', () => {
    const events = buildCalendarEventsForNewMatter({
      matterId: 'matter-101',
      fileId: 'FL-2026-101',
      closingDate: '2026-06-15',
      financingDeadline: '2026-06-08',
      inspectionDeadline: '2026-06-06',
      financingType: 'Cash',
      assignedStaffId: 'staff-emma-kline',
      ts: 2000,
    })
    expect(events.map((e) => e.kind).sort()).toEqual(['closing', 'deadline'])
    expect(events.some((e) => e.title.includes('Loan'))).toBe(false)
  })
})
