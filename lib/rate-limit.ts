// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

// 1) Connect to Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// 2) Ratelimiter for *sensitive* routes (GDPR export, deletion, AML ops)
// Example: 10 requests per 10 minutes, per firm API key
export const sensitiveRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 m'),
  prefix: 'rl:sensitive',
})

// 3) Optional: different limiter for cheaper routes (e.g. leads)
// Example: 100 requests per hour per firm API key
export const leadsRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  prefix: 'rl:leads',
})

// 4) Derive an identifier (tenant or IP) from request

function getRateLimitIdFromRequest(req: NextRequest): string {
  // We primarily key by firm API key, falling back to IP if missing.
  const apiKey = req.headers.get('x-firm-api-key')
  if (apiKey) return `firm:${apiKey}`

  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown'

  return `ip:${ip}`
}

// 5) Helpers to use in routes

export async function limitSensitive(req: NextRequest) {
  const identifier = getRateLimitIdFromRequest(req)
  const result = await sensitiveRatelimit.limit(identifier)
  return result // { success, limit, remaining, reset, pending }
}

export async function limitLeads(req: NextRequest) {
  const identifier = getRateLimitIdFromRequest(req)
  const result = await leadsRatelimit.limit(identifier)
  return result
}
