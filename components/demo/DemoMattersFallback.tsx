import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { DemoMattersFallbackCopy } from '@/lib/demo/demoMattersFallback'

const panelStyle: CSSProperties = {
  background: 'white',
  border: '1px solid rgba(94,82,64,0.2)',
  borderRadius: '8px',
  padding: '24px',
  maxWidth: 560,
}

const titleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 8,
  fontSize: 22,
  fontWeight: 900,
  color: '#134252',
}

const bodyStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 18,
  color: '#627c71',
  fontSize: 14,
  lineHeight: 1.45,
}

const primaryButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#208096',
  color: 'white',
  padding: '10px 16px',
  borderRadius: 6,
  fontWeight: 800,
  fontSize: 14,
  textDecoration: 'none',
  border: 'none',
  cursor: 'pointer',
}

const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: '#fff',
  color: '#134252',
  border: '1px solid rgba(94,82,64,0.3)',
}

type DemoMattersFallbackProps = {
  copy: DemoMattersFallbackCopy
  /** Optional secondary action (e.g. Try again on error boundaries). */
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

/**
 * Shared friendly fallback for demo matters not-found / error screens.
 * Accessible landmark + heading; no technical details in the primary message.
 */
export default function DemoMattersFallback({ copy, secondaryAction }: DemoMattersFallbackProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      data-testid={copy.kind === 'not_found' ? 'demo-matters-not-found' : 'demo-matters-error'}
      style={panelStyle}
    >
      <h1 style={titleStyle}>{copy.title}</h1>
      <p style={bodyStyle}>{copy.description}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Link href={copy.recoveryHref} style={primaryButtonStyle} data-testid="demo-matters-recovery-link">
          {copy.recoveryLabel}
        </Link>
        {secondaryAction ? (
          <button type="button" onClick={secondaryAction.onClick} style={secondaryButtonStyle}>
            {secondaryAction.label}
          </button>
        ) : null}
      </div>
    </section>
  )
}
