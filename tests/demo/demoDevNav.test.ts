import { afterEach, describe, expect, it, vi } from 'vitest'
import { shouldShowDemoDevAiNav } from '@/lib/demo/demoDevNav'
import { isDevAiMatterSummaryRouteEnabled } from '@/lib/ai/env'

describe('shouldShowDemoDevAiNav', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is true only in development', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(shouldShowDemoDevAiNav()).toBe(true)

    vi.stubEnv('NODE_ENV', 'production')
    expect(shouldShowDemoDevAiNav()).toBe(false)

    vi.stubEnv('NODE_ENV', 'test')
    expect(shouldShowDemoDevAiNav()).toBe(false)
  })
})

describe('isDevAiMatterSummaryRouteEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('requires non-production NODE_ENV and ENABLE_DEV_AI_GENERATION=true', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('ENABLE_DEV_AI_GENERATION', 'true')
    expect(isDevAiMatterSummaryRouteEnabled()).toBe(false)

    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('ENABLE_DEV_AI_GENERATION', 'true')
    expect(isDevAiMatterSummaryRouteEnabled()).toBe(true)

    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('ENABLE_DEV_AI_GENERATION', 'false')
    expect(isDevAiMatterSummaryRouteEnabled()).toBe(false)

    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('ENABLE_DEV_AI_GENERATION', undefined)
    expect(isDevAiMatterSummaryRouteEnabled()).toBe(false)
  })
})
