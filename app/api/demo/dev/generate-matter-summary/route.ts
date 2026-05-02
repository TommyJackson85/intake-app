/**
 * Dev-only API: run `generateMatterSummaryDraft` server-side (Claude + Zod output validation).
 *
 * Prototype pair: browser lab at `/demo/dev/ai-payloads`. This route is not intended for production exposure — gate
 * with `ENABLE_DEV_AI_GENERATION`, add auth, or remove before any public rollout.
 *
 * - Does not expose ANTHROPIC_API_KEY to the browser.
 * - POST body = full matter summary payload JSON (same shape as `buildMatterSummaryPayload` output).
 */

import { NextResponse } from 'next/server'
import type { MatterSummaryPayload } from '@/lib/ai/builders/build-matter-summary-payload'
import { isDevAiMatterSummaryRouteEnabled } from '@/lib/ai/env'
import { safeParseMatterSummaryPayloadRequest } from '@/lib/ai/schemas/matter-summary-payload'
import { generateMatterSummaryDraft } from '@/lib/ai/workflows/generate-matter-summary'

export async function POST(req: Request) {
  if (!isDevAiMatterSummaryRouteEnabled()) {
    return NextResponse.json(
      {
        ok: false as const,
        errorKind: 'route_disabled' as const,
        message:
          'Dev AI matter-summary generation is disabled. Set ENABLE_DEV_AI_GENERATION=true on the server (development/testing only).',
      },
      { status: 403 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      {
        ok: false as const,
        errorKind: 'invalid_input' as const,
        message: 'Request body must be valid JSON.',
      },
      { status: 400 },
    )
  }

  const input = safeParseMatterSummaryPayloadRequest(body)
  if (!input.success) {
    return NextResponse.json(
      {
        ok: false as const,
        errorKind: 'invalid_input' as const,
        message: 'Request body does not match matter summary payload shape.',
        issues: input.error.issues.map((issue) => ({
          path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
          message: issue.message,
        })),
      },
      { status: 400 },
    )
  }

  const payload = input.data as MatterSummaryPayload
  const result = await generateMatterSummaryDraft(payload)

  if (result.ok) {
    return NextResponse.json(
      {
        ok: true as const,
        data: result.data,
        meta: result.meta,
        ...(result.rawText !== undefined ? { rawText: result.rawText } : {}),
      },
      { status: 200 },
    )
  }

  if (result.errorKind === 'missing_api_key') {
    return NextResponse.json(
      {
        ok: false as const,
        errorKind: result.errorKind,
        message: result.message,
        ...(result.rawText !== undefined ? { rawText: result.rawText } : {}),
      },
      { status: 503 },
    )
  }

  return NextResponse.json(
    {
      ok: false as const,
      errorKind: result.errorKind,
      message: result.message,
      ...(result.meta !== undefined ? { meta: result.meta } : {}),
      ...(result.rawText !== undefined ? { rawText: result.rawText } : {}),
      ...(result.issues !== undefined ? { issues: result.issues } : {}),
    },
    { status: 502 },
  )
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'POST' } })
}
