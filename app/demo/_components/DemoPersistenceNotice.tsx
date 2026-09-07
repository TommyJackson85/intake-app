'use client'

import { DemoResetControls } from '@/app/demo/_components/DemoResetControls'

/** Concise banner explaining demo persistence + reset. */
export function DemoPersistenceNotice() {
  return (
    <div
      role="status"
      style={{
        marginBottom: '20px',
        padding: '14px 16px',
        border: '1px solid #f0b429',
        borderRadius: '8px',
        background: '#fff8e6',
        color: '#134252',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ flex: '1 1 240px', fontSize: 14, lineHeight: 1.45 }}>
        <strong>You are in demo mode.</strong> Edits are fake and stay in this browser
        (localStorage) after refresh. Use <strong>Reset demo data</strong> to restore the original
        fixtures. No real client data is sent to a server.
      </div>
      <DemoResetControls />
    </div>
  )
}
