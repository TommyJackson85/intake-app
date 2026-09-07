'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { getDemoMatterListDeepLink } from '@/lib/demo/demoMatterDetailRoutes'
import DemoMattersFallback from '@/components/demo/DemoMattersFallback'
import { buildDemoMatterNotFoundCopy } from '@/lib/demo/demoMattersFallback'

type DemoMatterDetailRedirectProps = {
  fileId: string
}

/**
 * Client redirect into the matters-list modal deep link.
 * Prefer this over server `redirect()` for static export so the HTML remains
 * usable on GitHub Pages before/while JS hydrates.
 */
export default function DemoMatterDetailRedirect({ fileId }: DemoMatterDetailRedirectProps) {
  const router = useRouter()
  const trimmed = typeof fileId === 'string' ? fileId.trim() : ''

  useEffect(() => {
    if (!trimmed) return
    router.replace(getDemoMatterListDeepLink(trimmed))
  }, [trimmed, router])

  if (!trimmed) {
    return (
      <div style={{ padding: '8px 0' }}>
        <DemoMattersFallback copy={buildDemoMatterNotFoundCopy()} />
      </div>
    )
  }

  const href = getDemoMatterListDeepLink(trimmed)

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: 'white',
        border: '1px solid rgba(94,82,64,0.2)',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <h1 style={{ marginTop: 0, fontSize: 22, fontWeight: 900, color: '#134252' }}>
        Opening matter
      </h1>
      <p style={{ marginTop: 0, color: '#627c71', fontSize: 14, lineHeight: 1.45 }}>
        Taking you to the demo matters list for this file.
      </p>
      <Link
        href={href}
        style={{
          display: 'inline-flex',
          background: '#208096',
          color: 'white',
          padding: '10px 16px',
          borderRadius: 6,
          fontWeight: 800,
          fontSize: 14,
          textDecoration: 'none',
        }}
      >
        Continue to matters
      </Link>
    </div>
  )
}
