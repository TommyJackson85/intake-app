'use client'

/**
 * Dev-only UI at `/demo/dev/ai-payloads` — matter-summary AI prototype (easy to pause; no production rollout).
 *
 * What this is for: preview `buildMatterSummaryPayload` from the demo store, optionally call the gated dev API for a
 * Claude draft, validate `MatterSummaryResponse` in-browser, pin/compare runs, and keep a tiny local history — all
 * without backend or main-store persistence for summaries.
 *
 * Generation: the server must set `ENABLE_DEV_AI_GENERATION=true` or the route returns 403 (`route_disabled`). See
 * `isDevAiMatterSummaryRouteEnabled` in `lib/ai/env.ts`.
 *
 * Outputs: draft / human-review only — not legal advice, not client-ready, not a substitute for recorded matter state.
 *
 * sessionStorage in this module (keys below) is browser-local dev convenience only; it is not the demo Zustand store.
 */

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import { buildMatterSummaryPayload } from '@/lib/ai/builders/build-matter-summary-payload'
import {
  MATTER_SUMMARY_RESPONSE_EXAMPLE,
  safeParseMatterSummaryResponse,
  type MatterSummaryResponse,
} from '@/lib/ai/schemas/matter-summary-response'
import type { MatterSummaryGenerationMeta } from '@/lib/ai/matter-summary-generation-meta'

type ResponseValidateStatus = 'idle' | 'valid' | 'invalid_json' | 'schema_errors'

type ApiGenerateStatus = 'idle' | 'loading' | 'success' | 'error'

type ApiGenerateErrorInfo = {
  httpStatus: number | null
  errorKind?: string
  message?: string
  issues?: Array<{ path: string; message: string }>
  rawText?: string
  fallbackBody?: string
  meta?: MatterSummaryGenerationMeta
}

function parseGenerationMeta(value: unknown): MatterSummaryGenerationMeta | null {
  if (!value || typeof value !== 'object') return null
  const o = value as Record<string, unknown>
  if (typeof o.model !== 'string' || typeof o.providerDurationMs !== 'number' || typeof o.maxTokensRequested !== 'number') {
    return null
  }
  return {
    model: o.model,
    providerDurationMs: o.providerDurationMs,
    maxTokensRequested: o.maxTokensRequested,
    anthropicMessageId: typeof o.anthropicMessageId === 'string' ? o.anthropicMessageId : undefined,
    stopReason: o.stopReason === null || typeof o.stopReason === 'string' ? (o.stopReason as string | null) : undefined,
    inputTokens: typeof o.inputTokens === 'number' ? o.inputTokens : undefined,
    outputTokens: typeof o.outputTokens === 'number' ? o.outputTokens : undefined,
  }
}

/**
 * sessionStorage key for the pinned comparison baseline. Value shape: `PinnedMatterSummaryRunV1` serialized JSON
 * (`{ v: 1, pinnedAt, data, meta?, rawText? }`). Bump `v` if the stored object shape changes incompatibly.
 */
const DEV_PINNED_MATTER_SUMMARY_RUN_KEY = 'intake-app:dev:ai-matter-summary-pinned-run'

type PinnedMatterSummaryRunV1 = {
  v: 1
  pinnedAt: string
  data: MatterSummaryResponse
  meta: MatterSummaryGenerationMeta | null
  rawText?: string
}

function saveDevPinnedMatterSummaryRun(run: PinnedMatterSummaryRunV1 | null) {
  try {
    if (typeof sessionStorage === 'undefined') return
    if (run === null) {
      sessionStorage.removeItem(DEV_PINNED_MATTER_SUMMARY_RUN_KEY)
      return
    }
    sessionStorage.setItem(DEV_PINNED_MATTER_SUMMARY_RUN_KEY, JSON.stringify(run))
  } catch {
    /* best-effort dev persistence only */
  }
}

/**
 * sessionStorage key for rolling successful runs. Value shape: `DevRunHistoryStoreV1` — `{ v: 1, runs: [...] }`,
 * each run `DevMatterSummaryHistoryEntryV1`, list capped at `MAX_DEV_RUN_HISTORY`. Bump `v` on breaking changes.
 */
const DEV_RUN_HISTORY_KEY = 'intake-app:dev:ai-matter-summary-run-history'
const MAX_DEV_RUN_HISTORY = 8

type DevRunFeedbackV1 = {
  rating: 'useful' | 'partially_useful' | 'not_useful'
  notes?: string
}

type DevMatterSummaryHistoryEntryV1 = {
  id: string
  createdAt: string
  matterId: string
  fileIdLabel?: string
  data: MatterSummaryResponse
  meta: MatterSummaryGenerationMeta | null
  rawText?: string
  httpStatus: number
  feedback?: DevRunFeedbackV1
}

type DevRunHistoryStoreV1 = { v: 1; runs: DevMatterSummaryHistoryEntryV1[] }

function parseDevRunFeedback(value: unknown): DevRunFeedbackV1 | undefined {
  if (!value || typeof value !== 'object') return undefined
  const o = value as Record<string, unknown>
  if (o.rating !== 'useful' && o.rating !== 'partially_useful' && o.rating !== 'not_useful') return undefined
  return {
    rating: o.rating,
    notes: typeof o.notes === 'string' && o.notes.length > 0 ? o.notes : undefined,
  }
}

function parseHistoryEntry(raw: unknown): DevMatterSummaryHistoryEntryV1 | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.createdAt !== 'string' || typeof r.matterId !== 'string') return null
  const dataResult = safeParseMatterSummaryResponse(r.data)
  if (!dataResult.success) return null
  const meta =
    r.meta === null || r.meta === undefined ? null : parseGenerationMeta(r.meta)
  const httpStatus = typeof r.httpStatus === 'number' ? r.httpStatus : 200
  return {
    id: r.id,
    createdAt: r.createdAt,
    matterId: r.matterId,
    fileIdLabel: typeof r.fileIdLabel === 'string' ? r.fileIdLabel : undefined,
    data: dataResult.data,
    meta,
    rawText: typeof r.rawText === 'string' ? r.rawText : undefined,
    httpStatus,
    feedback: parseDevRunFeedback(r.feedback),
  }
}

function saveDevRunHistory(runs: DevMatterSummaryHistoryEntryV1[]) {
  try {
    if (typeof sessionStorage === 'undefined') return
    const bounded = runs.slice(0, MAX_DEV_RUN_HISTORY)
    const payload: DevRunHistoryStoreV1 = { v: 1, runs: bounded }
    sessionStorage.setItem(DEV_RUN_HISTORY_KEY, JSON.stringify(payload))
  } catch {
    /* dev-only best effort */
  }
}

function loadDevRunHistory(): DevMatterSummaryHistoryEntryV1[] {
  try {
    if (typeof sessionStorage === 'undefined') return []
    const raw = sessionStorage.getItem(DEV_RUN_HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      sessionStorage.removeItem(DEV_RUN_HISTORY_KEY)
      return []
    }
    const o = parsed as Record<string, unknown>
    if (o.v !== 1 || !Array.isArray(o.runs)) {
      sessionStorage.removeItem(DEV_RUN_HISTORY_KEY)
      return []
    }
    const runs = o.runs
      .map(parseHistoryEntry)
      .filter((e): e is DevMatterSummaryHistoryEntryV1 => e !== null)
      .slice(0, MAX_DEV_RUN_HISTORY)
    return runs
  } catch {
    try {
      sessionStorage.removeItem(DEV_RUN_HISTORY_KEY)
    } catch {
      /* ignore */
    }
    return []
  }
}

function feedbackSummaryMarkdown(entry: DevMatterSummaryHistoryEntryV1): string {
  const f = entry.feedback
  if (!f) return ''
  const lines = [
    '### Dev run feedback (local)',
    `- **run id:** \`${entry.id}\``,
    `- **created:** ${entry.createdAt}`,
    `- **matter:** ${entry.fileIdLabel ?? entry.matterId}`,
    `- **rating:** ${f.rating.replace(/_/g, ' ')}`,
  ]
  if (f.notes) lines.push(`- **notes:** ${f.notes.replace(/\r?\n/g, ' ')}`)
  return `${lines.join('\n')}\n`
}

function loadDevPinnedMatterSummaryRun(): PinnedMatterSummaryRunV1 | null {
  try {
    if (typeof sessionStorage === 'undefined') return null
    const raw = sessionStorage.getItem(DEV_PINNED_MATTER_SUMMARY_RUN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      sessionStorage.removeItem(DEV_PINNED_MATTER_SUMMARY_RUN_KEY)
      return null
    }
    const o = parsed as Record<string, unknown>
    if (o.v !== 1 || typeof o.pinnedAt !== 'string') {
      sessionStorage.removeItem(DEV_PINNED_MATTER_SUMMARY_RUN_KEY)
      return null
    }
    const dataResult = safeParseMatterSummaryResponse(o.data)
    if (!dataResult.success) {
      sessionStorage.removeItem(DEV_PINNED_MATTER_SUMMARY_RUN_KEY)
      return null
    }
    const meta =
      o.meta === null || o.meta === undefined ? null : parseGenerationMeta(o.meta)
    return {
      v: 1,
      pinnedAt: o.pinnedAt,
      data: dataResult.data,
      meta,
      rawText: typeof o.rawText === 'string' ? o.rawText : undefined,
    }
  } catch {
    try {
      sessionStorage.removeItem(DEV_PINNED_MATTER_SUMMARY_RUN_KEY)
    } catch {
      /* ignore */
    }
    return null
  }
}

function riskTitlesMultiline(d: MatterSummaryResponse): string {
  if (d.keyRisksAndConcerns.length === 0) return '—'
  return d.keyRisksAndConcerns.map((r) => r.title).join('\n')
}

function stringListMultiline(items: string[]): string {
  if (items.length === 0) return '—'
  return items.join('\n')
}

function formatMetaTokens(m: MatterSummaryGenerationMeta | null): string {
  if (!m || m.inputTokens == null || m.outputTokens == null) return '—'
  return `${m.inputTokens} / ${m.outputTokens}`
}

function chipStyle(bg: string, color: string): CSSProperties {
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
    background: bg,
    color,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.02em',
  }
}

function sectionLabel(text: string): ReactNode {
  return (
    <div style={{ fontSize: '11px', fontWeight: 700, color: '#627c71', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
      {text}
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>None</p>
  }
  return (
    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', lineHeight: 1.55 }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: '4px' }}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function MatterSummaryDraftReviewPanel({ draft }: { draft: MatterSummaryResponse }) {
  const stageLabel = draft.matterStageInterpretation.replace(/_/g, ' ')
  const lowConfidence = draft.confidenceLabel === 'low'
  const needsReview = draft.requiresHumanReview

  return (
    <div
      style={{
        border: '1px solid rgba(94, 82, 64, 0.2)',
        borderRadius: '10px',
        padding: '16px',
        background: '#fafaf8',
      }}
    >
      <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
        <strong style={{ color: '#475569' }}>AI-assisted draft</strong> — for developer inspection only. Not legal advice,
        not verified for client or filing; compare sections below with raw JSON.
      </p>

      {needsReview && (
        <div
          style={{
            marginBottom: '14px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(180, 83, 9, 0.12)',
            border: '1px solid rgba(180, 83, 9, 0.35)',
            fontSize: '13px',
            fontWeight: 700,
            color: '#92400e',
          }}
        >
          Requires human review — do not treat as approved output.
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <span style={chipStyle('#e0e7ff', '#3730a3')}>{stageLabel}</span>
        <span
          style={
            lowConfidence
              ? chipStyle('#fef3c7', '#b45309')
              : draft.confidenceLabel === 'medium'
                ? chipStyle('#e2e8f0', '#475569')
                : chipStyle('#dcfce7', '#166534')
          }
        >
          Confidence: {draft.confidenceLabel}
        </span>
        <span style={needsReview ? chipStyle('#fee2e2', '#b91c1c') : chipStyle('#f1f5f9', '#64748b')}>
          Human review: {needsReview ? 'yes' : 'no'}
        </span>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          {draft.responseKind} · {draft.schemaVersion}
        </span>
      </div>

      <div style={{ marginBottom: '16px' }}>
        {sectionLabel('Headline')}
        <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#134252', lineHeight: 1.35 }}>{draft.headline}</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        {sectionLabel('Narrative summary')}
        <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
          {draft.narrativeSummary}
        </p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        {sectionLabel('Matter stage interpretation')}
        <p style={{ margin: 0, fontSize: '13px', color: '#334155' }}>{stageLabel}</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        {sectionLabel('Review reasons')}
        <BulletList items={draft.reviewReasons} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        {sectionLabel('Key risks and concerns')}
        {draft.keyRisksAndConcerns.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>None</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', lineHeight: 1.55 }}>
            {draft.keyRisksAndConcerns.map((r, i) => (
              <li key={i} style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#1e293b' }}>{r.title}</strong>
                {r.detail ? (
                  <div style={{ marginTop: '4px', fontWeight: 400, color: '#475569' }}>{r.detail}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        {sectionLabel('Missing information')}
        <BulletList items={draft.missingInformation} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        {sectionLabel('Recommended next steps')}
        <BulletList items={draft.recommendedNextSteps} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        {sectionLabel('Client-facing follow-up suggestion')}
        {draft.clientFacingFollowUpSuggestion ? (
          <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
            {draft.clientFacingFollowUpSuggestion}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>None</p>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        {sectionLabel('Internal staff note suggestion')}
        {draft.internalStaffNoteSuggestion ? (
          <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
            {draft.internalStaffNoteSuggestion}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>None</p>
        )}
      </div>

      <div>
        {sectionLabel('Assistive disclaimer')}
        {draft.assistiveDisclaimer ? (
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5, fontStyle: 'italic' }}>
            {draft.assistiveDisclaimer}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>None</p>
        )}
      </div>
    </div>
  )
}

function DevGenerationObservabilityPanel({ meta }: { meta: MatterSummaryGenerationMeta }) {
  const stop = meta.stopReason ?? null
  const truncated = stop === 'max_tokens'

  return (
    <div
      style={{
        marginBottom: '12px',
        padding: '12px 14px',
        borderRadius: '8px',
        border: '1px solid rgba(59, 130, 246, 0.28)',
        background: '#f0f7ff',
        fontSize: '12px',
        color: '#1e3a5f',
        lineHeight: 1.45,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '8px', color: '#134252' }}>Provider observability (dev)</div>
      <p style={{ margin: '0 0 10px', color: '#475569' }}>
        Use for latency, token, and model regressions — correlates with Anthropic logs via message id when present.
      </p>
      {truncated && (
        <p style={{ margin: '0 0 10px', fontWeight: 700, color: '#b45309' }}>
          stop_reason is max_tokens — output may be clipped; consider raising max_tokens or shortening prompts.
        </p>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <tbody>
          {[
            ['Model', <code key="m" style={{ fontSize: '11px', wordBreak: 'break-all' }}>{meta.model}</code>],
            ['Provider call', `${meta.providerDurationMs} ms`],
            ['max_tokens (request)', String(meta.maxTokensRequested)],
            [
              'Tokens (in / out)',
              meta.inputTokens != null && meta.outputTokens != null
                ? `${meta.inputTokens} / ${meta.outputTokens}`
                : '—',
            ],
            ['stop_reason', stop ?? '—'],
            [
              'Anthropic message id',
              meta.anthropicMessageId ? (
                <code key="id" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                  {meta.anthropicMessageId}
                </code>
              ) : (
                '—'
              ),
            ],
          ].map(([k, v], i) => (
            <tr key={i}>
              <td style={{ padding: '3px 10px 3px 0', verticalAlign: 'top', color: '#627c71', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {k}
              </td>
              <td style={{ padding: '3px 0', verticalAlign: 'top', color: '#0f172a' }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompareCell({
  children,
  differs,
}: {
  children: ReactNode
  differs: boolean
}) {
  return (
    <td
      style={{
        padding: '8px 10px',
        verticalAlign: 'top',
        fontSize: '12px',
        color: '#0f172a',
        lineHeight: 1.45,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxWidth: '280px',
        maxHeight: '140px',
        overflow: 'auto',
        background: differs ? 'rgba(254, 243, 199, 0.45)' : 'transparent',
        fontWeight: differs ? 600 : 400,
        borderBottom: '1px solid rgba(94, 82, 64, 0.1)',
      }}
    >
      {children}
    </td>
  )
}

function MatterSummaryRunComparePanel({
  baseline,
  current,
  baselineMeta,
  currentMeta,
}: {
  baseline: MatterSummaryResponse
  current: MatterSummaryResponse
  baselineMeta: MatterSummaryGenerationMeta | null
  currentMeta: MatterSummaryGenerationMeta | null
}) {
  const rows: Array<{ label: string; a: string; b: string }> = [
    { label: 'headline', a: baseline.headline, b: current.headline },
    { label: 'narrativeSummary', a: baseline.narrativeSummary, b: current.narrativeSummary },
    {
      label: 'matterStageInterpretation',
      a: baseline.matterStageInterpretation,
      b: current.matterStageInterpretation,
    },
    { label: 'confidenceLabel', a: baseline.confidenceLabel, b: current.confidenceLabel },
    {
      label: 'requiresHumanReview',
      a: String(baseline.requiresHumanReview),
      b: String(current.requiresHumanReview),
    },
    { label: 'keyRisksAndConcerns (titles)', a: riskTitlesMultiline(baseline), b: riskTitlesMultiline(current) },
    {
      label: 'missingInformation',
      a: stringListMultiline(baseline.missingInformation),
      b: stringListMultiline(current.missingInformation),
    },
    {
      label: 'recommendedNextSteps',
      a: stringListMultiline(baseline.recommendedNextSteps),
      b: stringListMultiline(current.recommendedNextSteps),
    },
    { label: 'meta · model', a: baselineMeta?.model ?? '—', b: currentMeta?.model ?? '—' },
    {
      label: 'meta · providerDurationMs',
      a: baselineMeta != null ? `${baselineMeta.providerDurationMs} ms` : '—',
      b: currentMeta != null ? `${currentMeta.providerDurationMs} ms` : '—',
    },
    {
      label: 'meta · tokens (in / out)',
      a: formatMetaTokens(baselineMeta),
      b: formatMetaTokens(currentMeta),
    },
    {
      label: 'meta · stopReason',
      a: baselineMeta?.stopReason != null && baselineMeta.stopReason !== '' ? String(baselineMeta.stopReason) : '—',
      b: currentMeta?.stopReason != null && currentMeta.stopReason !== '' ? String(currentMeta.stopReason) : '—',
    },
  ]

  const deltaMs =
    baselineMeta != null && currentMeta != null ? currentMeta.providerDurationMs - baselineMeta.providerDurationMs : null
  const deltaOut =
    baselineMeta != null &&
    currentMeta != null &&
    baselineMeta.outputTokens != null &&
    currentMeta.outputTokens != null
      ? currentMeta.outputTokens - baselineMeta.outputTokens
      : null
  const deltaIn =
    baselineMeta != null &&
    currentMeta != null &&
    baselineMeta.inputTokens != null &&
    currentMeta.inputTokens != null
      ? currentMeta.inputTokens - baselineMeta.inputTokens
      : null

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '12px 14px',
        borderRadius: '8px',
        border: '1px solid rgba(94, 82, 64, 0.22)',
        background: '#fffefb',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '6px', color: '#134252', fontSize: '13px' }}>
        Draft comparison (dev)
      </div>
      <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#627c71', lineHeight: 1.45 }}>
        Pinned baseline vs current successful run. Rows with a tinted background differ (string equality). Prompt version is
        not tracked in meta yet.
      </p>
      {(deltaMs != null || deltaOut != null || deltaIn != null) && (
        <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#475569' }}>
          {deltaMs != null && (
            <>
              Δ provider latency: <strong>{deltaMs >= 0 ? '+' : ''}{deltaMs} ms</strong>
            </>
          )}
          {deltaMs != null && (deltaIn != null || deltaOut != null) ? ' · ' : null}
          {deltaIn != null && (
            <>
              Δ input tokens: <strong>{deltaIn >= 0 ? '+' : ''}{deltaIn}</strong>
            </>
          )}
          {deltaIn != null && deltaOut != null ? ' · ' : null}
          {deltaOut != null && (
            <>
              Δ output tokens: <strong>{deltaOut >= 0 ? '+' : ''}{deltaOut}</strong>
            </>
          )}
        </p>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '520px' }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderBottom: '2px solid rgba(94, 82, 64, 0.2)',
                  color: '#627c71',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  width: '22%',
                }}
              >
                Field
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderBottom: '2px solid rgba(94, 82, 64, 0.2)',
                  color: '#627c71',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Pinned (baseline)
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderBottom: '2px solid rgba(94, 82, 64, 0.2)',
                  color: '#627c71',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Current run
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const differs = row.a !== row.b
              return (
                <tr key={row.label}>
                  <td
                    style={{
                      padding: '8px 10px',
                      verticalAlign: 'top',
                      color: '#134252',
                      fontWeight: 600,
                      fontSize: '11px',
                      borderBottom: '1px solid rgba(94, 82, 64, 0.1)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <code style={{ fontSize: '11px' }}>{row.label}</code>
                  </td>
                  <CompareCell differs={differs}>{row.a}</CompareCell>
                  <CompareCell differs={differs}>{row.b}</CompareCell>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const historyRowButton: CSSProperties = {
  padding: '4px 8px',
  borderRadius: '4px',
  border: '1px solid rgba(94, 82, 64, 0.35)',
  background: '#fff',
  color: '#134252',
  fontWeight: 600,
  fontSize: '11px',
  cursor: 'pointer',
}

function RecentDevRunsHistoryPanel({
  runs,
  activeRunId,
  onLoadAsCurrent,
  onPinBaseline,
  onRemove,
  onClearAll,
  onCopyFeedback,
  onLoadValidator,
  feedbackCopyState,
}: {
  runs: DevMatterSummaryHistoryEntryV1[]
  activeRunId: string | null
  onLoadAsCurrent: (entry: DevMatterSummaryHistoryEntryV1) => void
  onPinBaseline: (entry: DevMatterSummaryHistoryEntryV1) => void
  onRemove: (id: string) => void
  onClearAll: () => void
  onCopyFeedback: (entry: DevMatterSummaryHistoryEntryV1) => void
  onLoadValidator: (entry: DevMatterSummaryHistoryEntryV1) => void
  feedbackCopyState: 'idle' | 'ok' | 'err'
}) {
  return (
    <div
      style={{
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px dashed rgba(94, 82, 64, 0.25)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', color: '#134252' }}>Recent runs (dev)</h3>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          Last {MAX_DEV_RUN_HISTORY} successful generations · sessionStorage only · not production
        </span>
        {runs.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            style={{
              ...historyRowButton,
              color: '#b91c1c',
              borderColor: 'rgba(185, 28, 28, 0.35)',
              marginLeft: 'auto',
            }}
          >
            Clear all history
          </button>
        )}
      </div>
      {feedbackCopyState === 'ok' && (
        <span style={{ fontSize: '11px', color: '#166534', display: 'block', marginBottom: '8px' }}>Feedback copied.</span>
      )}
      {feedbackCopyState === 'err' && (
        <span style={{ fontSize: '11px', color: '#b91c1c', display: 'block', marginBottom: '8px' }}>Copy failed.</span>
      )}

      {runs.length === 0 ? (
        <p style={{ margin: 0, fontSize: '12px', color: '#627c71' }}>
          None yet. Each successful &quot;Generate via dev API&quot; is appended here for this tab/session.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {runs.map((entry) => {
            const isActive = entry.id === activeRunId
            const label = entry.data.headline.length > 72 ? `${entry.data.headline.slice(0, 72)}…` : entry.data.headline
            const metaMs = entry.meta != null ? `${entry.meta.providerDurationMs} ms` : '—'
            const metaModel = entry.meta?.model ?? '—'
            const ratingLabel = entry.feedback?.rating?.replace(/_/g, ' ') ?? null
            return (
              <div
                key={entry.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${isActive ? 'rgba(124, 58, 237, 0.45)' : 'rgba(94, 82, 64, 0.18)'}`,
                  background: isActive ? 'rgba(237, 233, 254, 0.35)' : '#fafafa',
                  fontSize: '12px',
                  color: '#334155',
                }}
              >
                <div style={{ fontWeight: 700, color: '#134252', marginBottom: '4px' }}>
                  {new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })}
                  {isActive ? <span style={{ marginLeft: '8px', fontSize: '11px', color: '#7c3aed' }}>(current view)</span> : null}
                </div>
                <div style={{ fontSize: '11px', color: '#627c71', marginBottom: '6px', lineHeight: 1.4 }}>
                  <strong>Matter:</strong> {entry.fileIdLabel ?? entry.matterId} · <strong>confidence:</strong> {entry.data.confidenceLabel}
                  {ratingLabel ? (
                    <>
                      {' '}
                      · <strong>feedback:</strong> {ratingLabel}
                    </>
                  ) : null}
                  <br />
                  <strong>Model / latency:</strong> <code style={{ fontSize: '10px' }}>{metaModel}</code> · {metaMs}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px', lineHeight: 1.35 }} title={entry.data.headline}>
                  {label}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  <button type="button" style={historyRowButton} onClick={() => onLoadAsCurrent(entry)}>
                    Load as current
                  </button>
                  <button type="button" style={historyRowButton} onClick={() => onPinBaseline(entry)}>
                    Pin as baseline
                  </button>
                  <button type="button" style={historyRowButton} onClick={() => onLoadValidator(entry)}>
                    Load into validator
                  </button>
                  {entry.feedback ? (
                    <button type="button" style={historyRowButton} onClick={() => onCopyFeedback(entry)}>
                      Copy feedback
                    </button>
                  ) : null}
                  <button
                    type="button"
                    style={{ ...historyRowButton, color: '#b91c1c', borderColor: 'rgba(185, 28, 28, 0.35)' }}
                    onClick={() => onRemove(entry.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function DemoDevAiPayloadsPage() {
  const { matters, documents, documentRequests, getCondoDiligence } = useDemoStore()
  const [selectedMatterId, setSelectedMatterId] = useState(() => matters[0]?.id ?? '')
  const [copyState, setCopyState] = useState<'idle' | 'ok' | 'err'>('idle')
  const [genCopyState, setGenCopyState] = useState<'idle' | 'ok' | 'err'>('idle')

  const [apiGenStatus, setApiGenStatus] = useState<ApiGenerateStatus>('idle')
  const [apiGenHttpStatus, setApiGenHttpStatus] = useState<number | null>(null)
  const [apiGenData, setApiGenData] = useState<MatterSummaryResponse | null>(null)
  const [apiGenMeta, setApiGenMeta] = useState<MatterSummaryGenerationMeta | null>(null)
  const [apiGenRawText, setApiGenRawText] = useState<string | undefined>(undefined)
  const [apiGenError, setApiGenError] = useState<ApiGenerateErrorInfo | null>(null)
  const [pinnedRun, setPinnedRun] = useState<PinnedMatterSummaryRunV1 | null>(null)
  const [runHistory, setRunHistory] = useState<DevMatterSummaryHistoryEntryV1[]>([])
  const [activeHistoryRunId, setActiveHistoryRunId] = useState<string | null>(null)
  const [devFeedbackRating, setDevFeedbackRating] = useState<'' | DevRunFeedbackV1['rating']>('')
  const [devFeedbackNotes, setDevFeedbackNotes] = useState('')
  const [historyFeedbackCopy, setHistoryFeedbackCopy] = useState<'idle' | 'ok' | 'err'>('idle')

  const [responseJsonInput, setResponseJsonInput] = useState('')
  const [responseValidateStatus, setResponseValidateStatus] = useState<ResponseValidateStatus>('idle')
  const [responseValidateDetail, setResponseValidateDetail] = useState<string[]>([])

  useEffect(() => {
    if (matters.length === 0) return
    setSelectedMatterId((id) => (id && matters.some((m) => m.id === id) ? id : matters[0].id))
  }, [matters])

  useEffect(() => {
    const loaded = loadDevPinnedMatterSummaryRun()
    if (loaded) setPinnedRun(loaded)
  }, [])

  useEffect(() => {
    setRunHistory(loadDevRunHistory())
  }, [])

  const selectedMatter = matters.find((m) => m.id === selectedMatterId) ?? matters[0]

  const payload = useMemo(() => {
    if (!selectedMatter) return null
    return buildMatterSummaryPayload({
      matter: selectedMatter,
      documents,
      documentRequests,
      condoDiligence: getCondoDiligence(selectedMatter.id) ?? null,
    })
  }, [selectedMatter, documents, documentRequests, getCondoDiligence])

  const json = payload ? JSON.stringify(payload, null, 2) : ''

  const copyJson = async () => {
    if (!json) return
    try {
      await navigator.clipboard.writeText(json)
      setCopyState('ok')
      window.setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('err')
      window.setTimeout(() => setCopyState('idle'), 3000)
    }
  }

  const validateResponseJson = () => {
    const raw = responseJsonInput.trim()
    if (!raw) {
      setResponseValidateStatus('idle')
      setResponseValidateDetail(['Nothing to validate — paste JSON or click “Load example”.'])
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(raw) as unknown
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown parse error'
      setResponseValidateStatus('invalid_json')
      setResponseValidateDetail([msg])
      return
    }

    const result = safeParseMatterSummaryResponse(parsed)
    if (result.success) {
      setResponseValidateStatus('valid')
      setResponseValidateDetail([
        `Conforms to matterSummaryResponseSchema (${result.data.responseKind}, ${result.data.schemaVersion}).`,
      ])
      return
    }

    const lines = result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
      return `${path}: ${issue.message}`
    })
    setResponseValidateStatus('schema_errors')
    setResponseValidateDetail(lines.length > 0 ? lines : [result.error.message])
  }

  const loadExampleResponse = () => {
    setResponseJsonInput(JSON.stringify(MATTER_SUMMARY_RESPONSE_EXAMPLE, null, 2))
    setResponseValidateStatus('idle')
    setResponseValidateDetail([])
  }

  const generateViaDevApi = async () => {
    if (!payload) return
    setApiGenStatus('loading')
    setApiGenHttpStatus(null)
    setApiGenData(null)
    setApiGenMeta(null)
    setApiGenRawText(undefined)
    setApiGenError(null)
    setGenCopyState('idle')

    try {
      const res = await fetch('/api/demo/dev/generate-matter-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      let parsed: unknown
      try {
        parsed = text.length > 0 ? JSON.parse(text) : null
      } catch {
        setApiGenStatus('error')
        setApiGenHttpStatus(res.status)
        setApiGenError({
          httpStatus: res.status,
          message: 'Response body is not valid JSON.',
          fallbackBody: text.length > 4000 ? `${text.slice(0, 4000)}…` : text,
        })
        return
      }

      setApiGenHttpStatus(res.status)

      if (
        res.ok &&
        parsed &&
        typeof parsed === 'object' &&
        parsed !== null &&
        'ok' in parsed &&
        (parsed as { ok: unknown }).ok === true &&
        'data' in parsed
      ) {
        const body = parsed as { ok: true; data: MatterSummaryResponse; rawText?: string; meta?: unknown }
        const metaParsed = parseGenerationMeta(body.meta)
        setApiGenStatus('success')
        setApiGenData(body.data)
        setApiGenMeta(metaParsed)
        setApiGenRawText(body.rawText)
        if (selectedMatter) {
          const historyEntry: DevMatterSummaryHistoryEntryV1 = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            matterId: selectedMatter.id,
            fileIdLabel: selectedMatter.file_id,
            data: body.data,
            meta: metaParsed,
            rawText: body.rawText,
            httpStatus: res.status,
          }
          setRunHistory((prev) => {
            const next = [historyEntry, ...prev].slice(0, MAX_DEV_RUN_HISTORY)
            saveDevRunHistory(next)
            return next
          })
          setActiveHistoryRunId(historyEntry.id)
        }
        setDevFeedbackRating('')
        setDevFeedbackNotes('')
        return
      }

      const body = parsed as {
        ok?: boolean
        errorKind?: string
        message?: string
        issues?: Array<{ path: string; message: string }>
        rawText?: string
        meta?: unknown
      }

      const parsedMeta = parseGenerationMeta(body.meta) ?? undefined
      setApiGenStatus('error')
      setApiGenError({
        httpStatus: res.status,
        errorKind: typeof body.errorKind === 'string' ? body.errorKind : undefined,
        message: typeof body.message === 'string' ? body.message : `HTTP ${res.status}`,
        issues: Array.isArray(body.issues) ? body.issues : undefined,
        rawText: typeof body.rawText === 'string' ? body.rawText : undefined,
        meta: parsedMeta,
      })
    } catch (e) {
      setApiGenStatus('error')
      setApiGenHttpStatus(null)
      setApiGenError({
        httpStatus: null,
        message: e instanceof Error ? e.message : 'Request failed',
      })
    }
  }

  const copyGeneratedResponseJson = async () => {
    if (!apiGenData) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(apiGenData, null, 2))
      setGenCopyState('ok')
      window.setTimeout(() => setGenCopyState('idle'), 2000)
    } catch {
      setGenCopyState('err')
      window.setTimeout(() => setGenCopyState('idle'), 3000)
    }
  }

  const loadGeneratedIntoValidator = () => {
    if (!apiGenData) return
    setResponseJsonInput(JSON.stringify(apiGenData, null, 2))
    setResponseValidateStatus('idle')
    setResponseValidateDetail([])
  }

  const pinCurrentRunAsBaseline = () => {
    if (!apiGenData || apiGenStatus !== 'success') return
    const run: PinnedMatterSummaryRunV1 = {
      v: 1,
      pinnedAt: new Date().toISOString(),
      data: apiGenData,
      meta: apiGenMeta,
      rawText: apiGenRawText,
    }
    setPinnedRun(run)
    saveDevPinnedMatterSummaryRun(run)
  }

  const clearPinnedBaseline = () => {
    setPinnedRun(null)
    saveDevPinnedMatterSummaryRun(null)
  }

  const loadHistoryEntryAsCurrent = (entry: DevMatterSummaryHistoryEntryV1) => {
    setApiGenStatus('success')
    setApiGenHttpStatus(entry.httpStatus)
    setApiGenData(entry.data)
    setApiGenMeta(entry.meta)
    setApiGenRawText(entry.rawText)
    setApiGenError(null)
    setGenCopyState('idle')
    setActiveHistoryRunId(entry.id)
    setDevFeedbackRating(entry.feedback?.rating ?? '')
    setDevFeedbackNotes(entry.feedback?.notes ?? '')
  }

  const pinHistoryEntryAsBaseline = (entry: DevMatterSummaryHistoryEntryV1) => {
    const run: PinnedMatterSummaryRunV1 = {
      v: 1,
      pinnedAt: new Date().toISOString(),
      data: entry.data,
      meta: entry.meta,
      rawText: entry.rawText,
    }
    setPinnedRun(run)
    saveDevPinnedMatterSummaryRun(run)
  }

  const removeHistoryEntry = (id: string) => {
    setRunHistory((prev) => {
      const next = prev.filter((r) => r.id !== id)
      saveDevRunHistory(next)
      return next
    })
    if (activeHistoryRunId === id) {
      setActiveHistoryRunId(null)
      setApiGenStatus('idle')
      setApiGenHttpStatus(null)
      setApiGenData(null)
      setApiGenMeta(null)
      setApiGenRawText(undefined)
      setDevFeedbackRating('')
      setDevFeedbackNotes('')
    }
  }

  const clearAllRunHistory = () => {
    setRunHistory([])
    saveDevRunHistory([])
    setActiveHistoryRunId(null)
    setApiGenStatus('idle')
    setApiGenHttpStatus(null)
    setApiGenData(null)
    setApiGenMeta(null)
    setApiGenRawText(undefined)
    setApiGenError(null)
    setDevFeedbackRating('')
    setDevFeedbackNotes('')
  }

  const saveDevFeedbackToActiveEntry = () => {
    if (!activeHistoryRunId || !devFeedbackRating) return
    setRunHistory((prev) => {
      const next = prev.map((r) =>
        r.id === activeHistoryRunId
          ? {
              ...r,
              feedback: {
                rating: devFeedbackRating,
                notes: devFeedbackNotes.trim() ? devFeedbackNotes.trim() : undefined,
              },
            }
          : r,
      )
      saveDevRunHistory(next)
      return next
    })
  }

  const copyHistoryFeedbackMarkdown = async (entry: DevMatterSummaryHistoryEntryV1) => {
    const md = feedbackSummaryMarkdown(entry)
    if (!md) return
    try {
      await navigator.clipboard.writeText(md)
      setHistoryFeedbackCopy('ok')
      window.setTimeout(() => setHistoryFeedbackCopy('idle'), 2000)
    } catch {
      setHistoryFeedbackCopy('err')
      window.setTimeout(() => setHistoryFeedbackCopy('idle'), 3000)
    }
  }

  const loadHistoryEntryIntoValidator = (entry: DevMatterSummaryHistoryEntryV1) => {
    setResponseJsonInput(JSON.stringify(entry.data, null, 2))
    setResponseValidateStatus('idle')
    setResponseValidateDetail([])
  }

  const responseStatusStyle = (): { color: string; fontWeight: number } => {
    if (responseValidateStatus === 'idle' && responseValidateDetail.length > 0) {
      return { color: '#b45309', fontWeight: 700 }
    }
    switch (responseValidateStatus) {
      case 'valid':
        return { color: '#166534', fontWeight: 700 }
      case 'invalid_json':
      case 'schema_errors':
        return { color: '#b91c1c', fontWeight: 700 }
      default:
        return { color: '#627c71', fontWeight: 600 }
    }
  }

  const responseStatusLabel = (): string => {
    if (responseValidateStatus === 'idle' && responseValidateDetail.length > 0) {
      return 'Needs input'
    }
    switch (responseValidateStatus) {
      case 'valid':
        return 'Valid (schema)'
      case 'invalid_json':
        return 'Invalid JSON'
      case 'schema_errors':
        return 'Schema errors'
      case 'idle':
      default:
        return 'Not validated yet'
    }
  }

  return (
    <div style={{ maxWidth: '960px' }}>
      <div
        role="note"
        style={{
          marginBottom: '16px',
          padding: '12px 14px',
          border: '1px dashed #94a3b8',
          borderRadius: '8px',
          background: '#f8fafc',
          color: '#334155',
          fontSize: '13px',
          lineHeight: 1.5,
        }}
      >
        <strong>Dev-only AI summary lab.</strong> Prototype tooling for payload + draft inspection — not a production
        feature; safe to leave idle while focus is elsewhere.
        <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
          <li>
            <strong>API generation</strong> is off unless the server sets <code>ENABLE_DEV_AI_GENERATION=true</code>{' '}
            (otherwise 403). The browser never receives the Anthropic key.
          </li>
          <li>
            <strong>Draft outputs</strong> are for developer review only — not legal truth, not client- or filing-ready.
          </li>
          <li>
            <strong>Payload preview</strong> and <strong>local JSON validation</strong> use no LLM. Pinned baseline and
            run history live in <code>sessionStorage</code> for this tab only (not the main demo store).
          </li>
        </ul>
      </div>

      <h1 style={{ margin: '0 0 8px', fontSize: '24px', color: '#134252' }}>Matter summary payload</h1>
      <p style={{ margin: '0 0 16px', color: '#627c71', fontSize: '14px' }}>
        Select a matter to preview the stable <code>matter_summary</code> object future tools can consume.
      </p>

      {!selectedMatter ? (
        <p style={{ color: '#627c71' }}>No active matters in the demo store.</p>
      ) : (
        <>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: '#134252', fontSize: '14px' }}>
            Matter
          </label>
          <select
            value={selectedMatter.id}
            onChange={(e) => setSelectedMatterId(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '420px',
              marginBottom: '14px',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(94, 82, 64, 0.25)',
              fontSize: '14px',
            }}
          >
            {matters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.file_id} — {m.matter_type}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => void copyJson()}
              disabled={!json}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                background: json ? '#208096' : '#94a3b8',
                color: 'white',
                fontWeight: 700,
                fontSize: '13px',
                cursor: json ? 'pointer' : 'not-allowed',
              }}
            >
              Copy JSON
            </button>
            {copyState === 'ok' && <span style={{ fontSize: '13px', color: '#166534' }}>Copied.</span>}
            {copyState === 'err' && <span style={{ fontSize: '13px', color: '#b91c1c' }}>Copy failed.</span>}
          </div>

          <pre
            style={{
              margin: 0,
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid rgba(94, 82, 64, 0.2)',
              background: '#fff',
              fontSize: '12px',
              lineHeight: 1.45,
              overflow: 'auto',
              maxHeight: '70vh',
              color: '#1e293b',
            }}
          >
            {json}
          </pre>
        </>
      )}

      <section style={{ marginTop: '40px', paddingTop: '28px', borderTop: '1px solid rgba(94, 82, 64, 0.15)' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '18px', color: '#134252' }}>
          Generate draft summary via dev API
        </h2>
        <p style={{ margin: '0 0 12px', color: '#627c71', fontSize: '13px', lineHeight: 1.5 }}>
          Posts the <strong>currently previewed</strong> payload to the dev route (server holds <code>ANTHROPIC_API_KEY</code>).
          The route is <strong>off by default</strong>: set <code>ENABLE_DEV_AI_GENERATION=true</code> in the server
          environment or the request returns <code>403</code> with <code>route_disabled</code>. This can incur API usage —
          development and testing only. The client never sees the provider key.
        </p>

        {pinnedRun ? (
          <div
            style={{
              marginBottom: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(100, 116, 139, 0.35)',
              background: '#f1f5f9',
              fontSize: '12px',
              color: '#334155',
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#134252' }}>Pinned baseline for comparison</strong> —{' '}
                {new Date(pinnedRun.pinnedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })}
                {pinnedRun.meta?.anthropicMessageId ? (
                  <>
                    {' '}
                    · Anthropic <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>{pinnedRun.meta.anthropicMessageId}</code>
                  </>
                ) : null}
                <span style={{ color: '#64748b' }}> (restored in this tab via sessionStorage — dev only)</span>
              </div>
              <button
                type="button"
                onClick={clearPinnedBaseline}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(94, 82, 64, 0.35)',
                  background: '#fff',
                  color: '#b91c1c',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Clear pinned run
              </button>
            </div>
            <details style={{ marginTop: '8px', fontSize: '11px', color: '#627c71' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Pinned run — raw debug (JSON / meta / rawText)</summary>
              <pre
                style={{
                  margin: '8px 0 0',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(94, 82, 64, 0.15)',
                  background: '#fff',
                  fontSize: '11px',
                  lineHeight: 1.4,
                  overflow: 'auto',
                  maxHeight: '28vh',
                  color: '#1e293b',
                }}
              >
                {JSON.stringify(
                  {
                    data: pinnedRun.data,
                    meta: pinnedRun.meta,
                    ...(pinnedRun.rawText !== undefined ? { rawText: pinnedRun.rawText } : {}),
                  },
                  null,
                  2,
                )}
              </pre>
            </details>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => void generateViaDevApi()}
            disabled={!payload || apiGenStatus === 'loading'}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              background: payload && apiGenStatus !== 'loading' ? '#7c3aed' : '#94a3b8',
              color: 'white',
              fontWeight: 700,
              fontSize: '13px',
              cursor: payload && apiGenStatus !== 'loading' ? 'pointer' : 'not-allowed',
            }}
          >
            {apiGenStatus === 'loading' ? 'Generating…' : 'Generate via dev API'}
          </button>
          {apiGenStatus === 'success' && apiGenData && (
            <>
              <button
                type="button"
                onClick={() => void copyGeneratedResponseJson()}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid rgba(94, 82, 64, 0.35)',
                  background: '#fff',
                  color: '#134252',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Copy generated response JSON
              </button>
              <button
                type="button"
                onClick={loadGeneratedIntoValidator}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid rgba(94, 82, 64, 0.35)',
                  background: '#fff',
                  color: '#134252',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Load into local validator
              </button>
              <button
                type="button"
                onClick={pinCurrentRunAsBaseline}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid rgba(94, 82, 64, 0.35)',
                  background: '#fff',
                  color: '#134252',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
                title="Saves this successful run as the baseline. Generate again to compare side by side."
              >
                Pin as baseline for comparison
              </button>
            </>
          )}
          {genCopyState === 'ok' && <span style={{ fontSize: '13px', color: '#166534' }}>Copied.</span>}
          {genCopyState === 'err' && <span style={{ fontSize: '13px', color: '#b91c1c' }}>Copy failed.</span>}
        </div>

        {apiGenStatus === 'idle' && !payload && (
          <p style={{ margin: 0, fontSize: '13px', color: '#627c71' }}>Select a matter above to enable generation.</p>
        )}

        {apiGenStatus === 'loading' && (
          <p style={{ margin: 0, fontSize: '13px', color: '#627c71' }}>Calling dev API…</p>
        )}

        {apiGenStatus === 'success' && apiGenData && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
              Success — HTTP {apiGenHttpStatus ?? '200'} — validated <code>MatterSummaryResponse</code> (server)
            </div>
            {apiGenMeta ? <DevGenerationObservabilityPanel meta={apiGenMeta} /> : null}
            {pinnedRun ? (
              <MatterSummaryRunComparePanel
                baseline={pinnedRun.data}
                current={apiGenData}
                baselineMeta={pinnedRun.meta}
                currentMeta={apiGenMeta}
              />
            ) : null}
            {activeHistoryRunId ? (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(94, 82, 64, 0.2)',
                  background: '#f8fafc',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: 700, color: '#134252', marginBottom: '8px' }}>
                  Tag this run in local history (dev)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#627c71' }}>Rating</span>
                    <select
                      value={devFeedbackRating}
                      onChange={(e) =>
                        setDevFeedbackRating(e.target.value as '' | DevRunFeedbackV1['rating'])
                      }
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(94, 82, 64, 0.25)',
                        fontSize: '12px',
                      }}
                    >
                      <option value="">—</option>
                      <option value="useful">Useful</option>
                      <option value="partially_useful">Partially useful</option>
                      <option value="not_useful">Not useful</option>
                    </select>
                  </label>
                  <input
                    type="text"
                    value={devFeedbackNotes}
                    onChange={(e) => setDevFeedbackNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    style={{
                      flex: '1 1 180px',
                      minWidth: '140px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(94, 82, 64, 0.25)',
                      fontSize: '12px',
                    }}
                  />
                  <button
                    type="button"
                    onClick={saveDevFeedbackToActiveEntry}
                    disabled={!devFeedbackRating}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: devFeedbackRating ? '#134252' : '#94a3b8',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: devFeedbackRating ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Save to history entry
                  </button>
                </div>
              </div>
            ) : null}
            <MatterSummaryDraftReviewPanel draft={apiGenData} />
            <details style={{ marginTop: '14px', fontSize: '12px', color: '#627c71' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Raw response JSON (debug)</summary>
              <pre
                style={{
                  margin: '8px 0 0',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(94, 82, 64, 0.2)',
                  background: '#fff',
                  fontSize: '12px',
                  lineHeight: 1.45,
                  overflow: 'auto',
                  maxHeight: '45vh',
                  color: '#1e293b',
                }}
              >
                {JSON.stringify(apiGenData, null, 2)}
              </pre>
            </details>
            {apiGenRawText && (
              <details style={{ marginTop: '10px', fontSize: '12px', color: '#627c71' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Raw model text (debug)</summary>
                <pre
                  style={{
                    margin: '8px 0 0',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(94, 82, 64, 0.15)',
                    background: '#f8fafc',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '30vh',
                    overflow: 'auto',
                  }}
                >
                  {apiGenRawText}
                </pre>
              </details>
            )}
          </div>
        )}

        {apiGenStatus === 'error' && apiGenError && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#b91c1c', marginBottom: '8px' }}>
              Error
              {apiGenError.httpStatus != null ? ` — HTTP ${apiGenError.httpStatus}` : ''}
              {apiGenError.errorKind ? ` — ${apiGenError.errorKind}` : ''}
            </div>
            {apiGenError.message && (
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#334155' }}>{apiGenError.message}</p>
            )}
            {apiGenError.meta ? <DevGenerationObservabilityPanel meta={apiGenError.meta} /> : null}
            {apiGenError.issues && apiGenError.issues.length > 0 && (
              <ul style={{ margin: '0 0 8px', paddingLeft: '20px', fontSize: '12px', color: '#334155' }}>
                {apiGenError.issues.map((issue, i) => (
                  <li key={i}>
                    <strong>{issue.path}:</strong> {issue.message}
                  </li>
                ))}
              </ul>
            )}
            {apiGenError.rawText && (
              <details style={{ fontSize: '12px', color: '#627c71' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>rawText from server (if any)</summary>
                <pre
                  style={{
                    margin: '8px 0 0',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(94, 82, 64, 0.15)',
                    background: '#fef2f2',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '30vh',
                    overflow: 'auto',
                  }}
                >
                  {apiGenError.rawText}
                </pre>
              </details>
            )}
            {apiGenError.fallbackBody && (
              <details style={{ marginTop: '8px', fontSize: '12px', color: '#627c71' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Raw response body (non-JSON)</summary>
                <pre
                  style={{
                    margin: '8px 0 0',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(94, 82, 64, 0.15)',
                    background: '#f8fafc',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '30vh',
                    overflow: 'auto',
                  }}
                >
                  {apiGenError.fallbackBody}
                </pre>
              </details>
            )}
          </div>
        )}

        <RecentDevRunsHistoryPanel
          runs={runHistory}
          activeRunId={activeHistoryRunId}
          onLoadAsCurrent={loadHistoryEntryAsCurrent}
          onPinBaseline={pinHistoryEntryAsBaseline}
          onRemove={removeHistoryEntry}
          onClearAll={clearAllRunHistory}
          onCopyFeedback={(entry) => void copyHistoryFeedbackMarkdown(entry)}
          onLoadValidator={loadHistoryEntryIntoValidator}
          feedbackCopyState={historyFeedbackCopy}
        />
      </section>

      <section style={{ marginTop: '40px', paddingTop: '28px', borderTop: '1px solid rgba(94, 82, 64, 0.15)' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '18px', color: '#134252' }}>
          Validate sample matter summary response JSON (dev only)
        </h2>
        <p style={{ margin: '0 0 12px', color: '#627c71', fontSize: '13px', lineHeight: 1.5 }}>
          Paste a <strong>draft AI-like</strong> matter summary object (the shape a future model will be required to
          return) and validate it with <code>safeParseMatterSummaryResponse</code> / <code>matterSummaryResponseSchema</code>.
          This runs entirely in the browser — <strong>no API, no LLM, no external service</strong>.
        </p>

        <textarea
          value={responseJsonInput}
          onChange={(e) => setResponseJsonInput(e.target.value)}
          spellCheck={false}
          placeholder='Paste JSON here, or click "Load example"'
          style={{
            width: '100%',
            minHeight: '220px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(94, 82, 64, 0.25)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '12px',
            lineHeight: 1.45,
            color: '#1e293b',
            background: '#fff',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={validateResponseJson}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              background: '#134252',
              color: 'white',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Validate
          </button>
          <button
            type="button"
            onClick={loadExampleResponse}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(94, 82, 64, 0.35)',
              background: '#fff',
              color: '#134252',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Load example (dev fixture)
          </button>
          <span style={{ fontSize: '13px', ...responseStatusStyle() }}>Status: {responseStatusLabel()}</span>
        </div>

        {responseValidateDetail.length > 0 && (
          <ul
            style={{
              margin: '12px 0 0',
              paddingLeft: '20px',
              fontSize: '12px',
              color: '#334155',
              lineHeight: 1.5,
            }}
          >
            {responseValidateDetail.map((line, i) => (
              <li key={i} style={{ wordBreak: 'break-word' }}>
                {line}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
