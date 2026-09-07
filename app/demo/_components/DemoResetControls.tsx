'use client'

import { useDemoStore } from '@/lib/demo/store'

/** Accessible reset control for demo localStorage-backed state. */
export function DemoResetControls({ compact = false }: { compact?: boolean }) {
  const { resetDemoData } = useDemoStore()

  const onReset = () => {
    const ok = window.confirm(
      'Reset all demo data in this browser? Matters, documents, intake leads, FinCEN certs, and related demo edits will be restored to the original fixtures.',
    )
    if (!ok) return
    resetDemoData()
  }

  return (
    <button
      type="button"
      onClick={onReset}
      aria-label="Reset demo data"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? '6px 10px' : '8px 12px',
        borderRadius: 6,
        border: compact ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(94,82,64,0.35)',
        background: compact ? 'transparent' : '#fff',
        color: compact ? '#fff' : '#134252',
        fontWeight: 800,
        fontSize: compact ? 12 : 13,
        cursor: 'pointer',
        width: compact ? '100%' : undefined,
      }}
    >
      Reset demo data
    </button>
  )
}
