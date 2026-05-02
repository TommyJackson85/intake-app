'use client'

/**
 * Narrow UI facade over `useDemoStore` for task index + timeline notes (e.g. checklist/timeline widgets).
 * Not a second store: the same matter rows and timeline mutations persist via `DemoProvider` / localStorage
 * where applicable. See `systemContract.knownDivergences` id `demo-data-context-wording` in `lib/domain/system-contract.ts`.
 */

import React, { createContext, useCallback, useContext, useMemo } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import type { DemoMatter, DemoTaskStatus } from '@/lib/demo/types'

type DemoDataContextType = {
  matters: DemoMatter[]
  updateTaskStatus: (matterId: string, taskIndex: number, newStatus: string) => void
  updateMatterStatus: (matterId: string, newStatus: string) => void
  addNote: (matterId: string, note: string) => void
}

const DemoDataContext = createContext<DemoDataContextType | null>(null)

export function DemoDataProvider({ children }: { children: React.ReactNode }) {
  // Delegates to `useDemoStore`; matters (and related demo slices) persist across refresh per store/localStorage rules.
  const { matters, updateTaskStatus: storeUpdateTaskStatus, updateMatterStatus, addTimelineNote } = useDemoStore()

  const updateTaskStatus = useCallback(
    (matterId: string, taskIndex: number, newStatus: string) => {
      const matter = matters.find((m) => m.id === matterId)
      const task = matter?.tasks?.[taskIndex]
      if (!task || task.deletedAt) return
      storeUpdateTaskStatus(matterId, task.id, newStatus as DemoTaskStatus)
    },
    [matters, storeUpdateTaskStatus]
  )

  const value = useMemo<DemoDataContextType>(
    () => ({
      matters,
      updateTaskStatus,
      updateMatterStatus: (matterId: string, newStatus: string) =>
        updateMatterStatus(matterId, newStatus as any),
      addNote: (matterId: string, note: string) => addTimelineNote(matterId, note),
    }),
    [addTimelineNote, matters, updateMatterStatus, updateTaskStatus]
  )

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>
}

export function useDemoData() {
  const ctx = useContext(DemoDataContext)
  if (!ctx) throw new Error('useDemoData must be used inside DemoDataProvider')
  return ctx
}

