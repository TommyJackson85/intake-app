'use client'

import { useAuth } from '@/lib/auth-context'

/**
 * Fixed banner shown at top of app when developer is impersonating another user.
 * Distinct from demo banner; warns that actions affect real data.
 */
export function ImpersonationBanner() {
  const { impersonating, profile, firm } = useAuth()

  if (!impersonating || !profile) return null

  const userName = profile.full_name || profile.email || 'Unknown user'
  const firmName = (firm as { name?: string } | null)?.name
  const label = firmName ? `${userName} at ${firmName}` : userName

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        marginBottom: 0,
        padding: '12px 20px',
        background: 'linear-gradient(135deg, #1a3a42 0%, #134252 100%)',
        borderBottom: '2px solid #f0b429',
        fontSize: '14px',
        color: 'white',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <div>
        <strong>You are impersonating {label}</strong>
        <span style={{ marginLeft: '8px', opacity: 0.9 }}>
          All actions may affect real data.
        </span>
      </div>
      <form action="/api/dev/stop-impersonate" method="POST" style={{ margin: 0 }}>
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            background: '#f0b429',
            color: '#134252',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          Stop impersonating
        </button>
      </form>
    </div>
  )
}
