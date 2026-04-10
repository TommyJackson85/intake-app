'use client'

import React from 'react'
import { useDemoData } from '@/context/DemoDataContext'

export default function DemoTaskChecklist({ matterId }: { matterId: string }) {
  const { matters, updateTaskStatus } = useDemoData()
  const matter = matters.find((m) => m.id === matterId)
  const tasksWithIndex = matter?.tasks ?? []

  const [savedIndex, setSavedIndex] = React.useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
      <style>{'@keyframes demoSavedFade { from { opacity: 1; } to { opacity: 0; } }'}</style>
      {tasksWithIndex
        .map((task, idx) => ({ task, idx }))
        .filter(({ task }) => !task.deletedAt)
        .map(({ task, idx }) => (
          <div key={task.id} style={{ border: '1px solid rgba(94,82,64,0.15)', borderRadius: '6px', padding: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <div style={{ fontSize: '13px', color: '#134252', fontWeight: 800 }}>{task.title}</div>
              {savedIndex === idx && (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 900,
                    background: '#e8f5f0',
                    color: '#2f855a',
                    border: '1px solid rgba(47,133,90,0.25)',
                    animation: 'demoSavedFade 1.5s ease forwards',
                  }}
                >
                  Saved
                </span>
              )}
            </div>
          <select
            value={task.status}
            onChange={(e) =>
              (() => {
                updateTaskStatus(matterId, idx, e.target.value)
                setSavedIndex(idx)
                window.setTimeout(() => setSavedIndex(null), 1500)
              })()
            }
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
          </div>
        ))}
    </div>
  )
}

