'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import DemoMattersFallback from '@/components/demo/DemoMattersFallback'
import { buildDemoMattersErrorCopy } from '@/lib/demo/demoMattersFallback'

/**
 * Route error boundary for `/demo/matters`.
 * Logs to Sentry; user-facing copy stays non-technical (no stack / secrets).
 */
export default function DemoMattersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    if (process.env.NODE_ENV === 'development') {
      console.error('[demo/matters]', error)
    }
  }, [error])

  return (
    <div style={{ padding: '8px 0' }}>
      <DemoMattersFallback
        copy={buildDemoMattersErrorCopy()}
        secondaryAction={{ label: 'Try again', onClick: () => reset() }}
      />
    </div>
  )
}
