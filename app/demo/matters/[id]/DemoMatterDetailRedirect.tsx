'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { getDemoMatterListDeepLink } from '@/lib/demo/demoMatterDetailRoutes'

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
  const href = getDemoMatterListDeepLink(fileId)

  useEffect(() => {
    router.replace(href)
  }, [href, router])

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid rgba(94,82,64,0.2)',
        borderRadius: '8px',
        padding: '20px',
        margin: '24px',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Opening matter {fileId}</h2>
      <p style={{ marginTop: 0, color: '#627c71' }}>
        Taking you to the demo matters list for this file.
      </p>
      <Link href={href} style={{ color: '#208096', textDecoration: 'none', fontWeight: 800 }}>
        Continue to matters
      </Link>
    </div>
  )
}
