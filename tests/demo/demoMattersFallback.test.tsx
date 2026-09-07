/** @vitest-environment jsdom */
import React from 'react'
import { describe, expect, it, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import DemoMattersFallback from '@/components/demo/DemoMattersFallback'
import {
  buildDemoMatterNotFoundCopy,
  buildDemoMattersErrorCopy,
  sanitizeDemoMatterRefForDisplay,
  shouldNotFoundDemoMatterParam,
} from '@/lib/demo/demoMattersFallback'
import { findDemoMatterByDetailParam } from '@/lib/demo/demoMatterDetailRoutes'
import DemoMatterByIdNotFound from '@/app/demo/matters/[id]/not-found'

afterEach(() => {
  cleanup()
})

describe('demoMattersFallback helpers', () => {
  it('treats invalid IDs as not-found', () => {
    expect(shouldNotFoundDemoMatterParam('not-a-real-matter', findDemoMatterByDetailParam)).toBe(true)
    expect(shouldNotFoundDemoMatterParam('', findDemoMatterByDetailParam)).toBe(true)
    expect(shouldNotFoundDemoMatterParam('   ', findDemoMatterByDetailParam)).toBe(true)
    expect(shouldNotFoundDemoMatterParam(null, findDemoMatterByDetailParam)).toBe(true)
  })

  it('accepts known seeded file ids', () => {
    expect(shouldNotFoundDemoMatterParam('FL-2026-001', findDemoMatterByDetailParam)).toBe(false)
  })

  it('sanitizes unsafe refs out of user-facing copy', () => {
    expect(sanitizeDemoMatterRefForDisplay('FL-2026-001')).toBe('FL-2026-001')
    expect(sanitizeDemoMatterRefForDisplay('../../../etc/passwd')).toBeNull()
    expect(sanitizeDemoMatterRefForDisplay('Error: boom\n    at Object.<anonymous>')).toBeNull()
    expect(sanitizeDemoMatterRefForDisplay('a'.repeat(80))).toBeNull()

    const safe = buildDemoMatterNotFoundCopy({ attemptedRef: 'FL-MISSING-99' })
    expect(safe.description).toContain('FL-MISSING-99')
    expect(safe.recoveryHref).toBe('/demo/matters')

    const unsafe = buildDemoMatterNotFoundCopy({
      attemptedRef: 'secret-token-abc Error at Function',
    })
    expect(unsafe.description).not.toContain('secret-token')
    expect(unsafe.description).not.toContain('Error at')
  })

  it('builds non-technical error copy without digests or stacks', () => {
    const copy = buildDemoMattersErrorCopy()
    expect(copy.title).toBe('Something went wrong')
    expect(copy.description.toLowerCase()).not.toContain('stack')
    expect(copy.description.toLowerCase()).not.toContain('digest')
    expect(copy.recoveryHref).toBe('/demo/matters')
  })
})

describe('DemoMattersFallback rendering', () => {
  it('renders not-found fallback with recovery link', () => {
    render(<DemoMattersFallback copy={buildDemoMatterNotFoundCopy({ attemptedRef: 'FL-NOPE' })} />)
    expect(screen.getByRole('heading', { name: 'Matter not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to matters' })).toHaveAttribute('href', '/demo/matters')
    expect(screen.getByText(/FL-NOPE/)).toBeInTheDocument()
  })

  it('renders route not-found page without technical details', () => {
    render(<DemoMatterByIdNotFound />)
    expect(screen.getByRole('heading', { name: 'Matter not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to matters' })).toHaveAttribute('href', '/demo/matters')
    expect(screen.queryByText(/stack/i)).toBeNull()
    expect(screen.queryByText(/digest/i)).toBeNull()
  })

  it('renders error fallback with try-again action', async () => {
    let tried = false
    render(
      <DemoMattersFallback
        copy={buildDemoMattersErrorCopy()}
        secondaryAction={{
          label: 'Try again',
          onClick: () => {
            tried = true
          },
        }}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    screen.getByRole('button', { name: 'Try again' }).click()
    expect(tried).toBe(true)
  })
})
