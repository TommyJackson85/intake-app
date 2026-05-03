/**
 * Demo-only printable conflict memo (HTML). Staff gate: `app/demo/intakes/page.tsx`.
 * Not a compliance record — browser export for demos only.
 */

import {
  DEMO_CONFLICT_REASON_LABEL,
  type ConflictMatchReason,
  type DemoConflictCheckResult,
} from '@/lib/demo/demoConflictCheck'
import { effectiveIntakeSnapshot, formatRelatedPartiesMultiline } from '@/lib/demo/demoIntakeFlow'
import type { DemoConflictLastRun, DemoConflictCheckStatus, DemoIntakeLead, DemoIntakeSnapshot } from '@/lib/demo/types'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function statusLabel(s: DemoConflictCheckStatus | undefined): string {
  if (!s) return '—'
  const map: Record<DemoConflictCheckStatus, string> = {
    pending: 'Pending',
    clear: 'Clear',
    flagged: 'Flagged',
    confirmed_no_conflict: 'Confirmed no conflict',
  }
  return map[s] ?? s
}

function reasonsText(reasons: string[]): string {
  return reasons.map((r) => DEMO_CONFLICT_REASON_LABEL[r as ConflictMatchReason] ?? r).join(', ')
}

/** Normalized row set for memo body (check snapshot + match table). */
export type DemoConflictMemoRows = {
  intakeSnapshot: DemoIntakeSnapshot
  hasConflict: boolean
  clientRows: { fullName: string; email: string; reasons: string[] }[]
  matterRows: { fileId: string; buyerName: string; sellerName: string; reasons: string[] }[]
  intakeRows: { fileReference: string; clientName: string; reasons: string[] }[]
}

export function memoRowsFromLiveResult(lead: DemoIntakeLead, result: DemoConflictCheckResult): DemoConflictMemoRows {
  const intakeSnapshot = effectiveIntakeSnapshot(lead)
  return {
    intakeSnapshot,
    hasConflict: result.hasConflict,
    clientRows: result.clientMatches.map(({ client: c, reasons }) => ({
      fullName: c.full_name,
      email: c.email,
      reasons: [...reasons],
    })),
    matterRows: result.matterMatches.map(({ matter: m, reasons }) => ({
      fileId: m.file_id,
      buyerName: m.buyer.name,
      sellerName: m.seller.name,
      reasons: [...reasons],
    })),
    intakeRows: result.intakeMatches.map(({ lead: l, reasons }) => ({
      fileReference: l.fileReference,
      clientName: effectiveIntakeSnapshot(l).clientName,
      reasons: [...reasons],
    })),
  }
}

export function memoRowsFromLastRun(last: DemoConflictLastRun): DemoConflictMemoRows {
  return {
    intakeSnapshot: last.intakeSnapshot,
    hasConflict: last.hasConflict,
    clientRows: last.clientRows.map((r) => ({
      fullName: r.fullName,
      email: r.email,
      reasons: [...r.reasons],
    })),
    matterRows: last.matterRows.map((r) => ({
      fileId: r.fileId,
      buyerName: r.buyerName,
      sellerName: r.sellerName,
      reasons: [...r.reasons],
    })),
    intakeRows: last.intakeRows.map((r) => ({
      fileReference: r.fileReference,
      clientName: r.clientName,
      reasons: [...r.reasons],
    })),
  }
}

export type DemoConflictMemoInput = {
  lead: DemoIntakeLead
  /** When the conflict check produced these rows */
  checkRunAtIso: string
  checkRunByLabel: string
  /** When this HTML memo was generated (may differ for re-exports) */
  memoGeneratedAtIso: string
  memoExportedByLabel: string
  draftReviewerNote?: string
  rows: DemoConflictMemoRows
}

export function buildDemoConflictMemoHtml(input: DemoConflictMemoInput): string {
  const {
    lead,
    checkRunAtIso,
    checkRunByLabel,
    memoGeneratedAtIso,
    memoExportedByLabel,
    draftReviewerNote,
    rows,
  } = input
  const snap = rows.intakeSnapshot
  const relatedBlock = formatRelatedPartiesMultiline(snap.relatedParties).trim() || '—'
  const aliasesLine = (snap.clientAliases ?? []).length > 0 ? snap.clientAliases!.join('; ') : '—'
  const dev = snap.developmentOrBuildingName?.trim() || '—'

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    } catch {
      return iso
    }
  }

  const clientRows = rows.clientRows
    .map(
      (c) => `
    <tr>
      <td>Existing client</td>
      <td>${esc(c.fullName)}</td>
      <td>${esc(reasonsText(c.reasons))}</td>
    </tr>`,
    )
    .join('')

  const matterRows = rows.matterRows
    .map(
      (m) => `
    <tr>
      <td>Existing matter</td>
      <td>${esc(m.fileId)} — ${esc(m.buyerName)} / ${esc(m.sellerName)}</td>
      <td>${esc(reasonsText(m.reasons))}</td>
    </tr>`,
    )
    .join('')

  const intakeRows = rows.intakeRows
    .map(
      (i) => `
    <tr>
      <td>Other intake</td>
      <td>${esc(i.fileReference)} — ${esc(i.clientName)}</td>
      <td>${esc(reasonsText(i.reasons))}</td>
    </tr>`,
    )
    .join('')

  const allRows = clientRows + matterRows + intakeRows
  const resultsBody =
    allRows.trim().length > 0
      ? allRows
      : `<tr><td colspan="3">No hits (demo heuristic search returned an empty result set).</td></tr>`

  const storedNote = lead.conflict_check_note?.trim()
  const noteSection =
    storedNote || draftReviewerNote
      ? `
  <h2>Notes</h2>
  <table>
    ${storedNote ? `<tr><th scope="row">Stored on lead</th><td>${esc(storedNote)}</td></tr>` : ''}
    ${draftReviewerNote ? `<tr><th scope="row">Draft (modal only, may be unsaved)</th><td>${esc(draftReviewerNote)}</td></tr>` : ''}
  </table>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Conflict memo — ${esc(lead.fileReference)}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #1a202c; max-width: 720px; margin: 24px auto; padding: 0 16px 48px; line-height: 1.45; font-size: 14px; }
    .banner { background: #fff8e6; border: 1px solid #d4a017; padding: 12px 14px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
    h1 { font-size: 1.35rem; margin: 0 0 8px; color: #134252; }
    h2 { font-size: 1.05rem; margin: 22px 0 8px; color: #134252; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 13px; }
    th, td { text-align: left; padding: 8px 10px; border: 1px solid #e2e8f0; vertical-align: top; }
    th { background: #f7fafc; font-weight: 700; width: 28%; }
    .muted { color: #627c71; font-size: 12px; }
    @media print { body { margin: 0; max-width: none; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="banner">
    <strong>Demo only.</strong> This memo is generated in the browser for demonstration. It is not a law-firm compliance or audit system. Match reasons are heuristic labels, not legal conclusions.
  </div>
  <h1>Intake conflict check memo</h1>
  <p class="muted">Conflict check run: ${esc(fmt(checkRunAtIso))} (${esc(checkRunAtIso)}) — by ${esc(checkRunByLabel)}<br />
  Memo generated: ${esc(fmt(memoGeneratedAtIso))} (${esc(memoGeneratedAtIso)}) — exported by ${esc(memoExportedByLabel)}</p>

  <h2>Lead</h2>
  <table>
    <tr><th scope="row">File reference</th><td>${esc(lead.fileReference)}</td></tr>
    <tr><th scope="row">Lead ID</th><td>${esc(lead.id)}</td></tr>
    <tr><th scope="row">Intake token</th><td>${esc(lead.token)}</td></tr>
    <tr><th scope="row">Recorded conflict status</th><td>${esc(statusLabel(lead.conflict_check_status))}</td></tr>
    <tr><th scope="row">Status timestamp</th><td>${esc(lead.conflict_check_completed_at ?? '—')}</td></tr>
  </table>

  <h2>Search inputs (snapshot at check time)</h2>
  <table>
    <tr><th scope="row">Primary client name</th><td>${esc(snap.clientName)}</td></tr>
    <tr><th scope="row">Aliases (primary)</th><td>${esc(aliasesLine)}</td></tr>
    <tr><th scope="row">Email</th><td>${esc(snap.clientEmail)}</td></tr>
    <tr><th scope="row">Phone</th><td>${esc(snap.clientPhone)}</td></tr>
    <tr><th scope="row">Related parties</th><td><pre style="margin:0;white-space:pre-wrap;font:inherit;">${esc(relatedBlock)}</pre></td></tr>
    <tr><th scope="row">Property address</th><td>${esc(snap.propertyAddress)}</td></tr>
    <tr><th scope="row">Development / building</th><td>${esc(dev)}</td></tr>
    <tr><th scope="row">Transaction role</th><td>${esc(snap.transactionRole)}</td></tr>
  </table>

  <h2>Result summary</h2>
  <p>Has possible conflict (demo): <strong>${rows.hasConflict ? 'Yes' : 'No'}</strong></p>

  <h2>Matches</h2>
  <table>
    <thead>
      <tr><th>Source type</th><th>Label</th><th>Match reasons</th></tr>
    </thead>
    <tbody>${resultsBody}
    </tbody>
  </table>
  ${noteSection}
  <p class="muted no-print" style="margin-top:28px">Use your browser’s Print dialog to save as PDF if needed.</p>
</body>
</html>`
}

/** Opens a new window with the memo HTML. Returns false if pop-ups are blocked. */
export function openDemoConflictMemoHtml(html: string): boolean {
  const w = typeof window !== 'undefined' ? window.open('', '_blank', 'noopener,noreferrer') : null
  if (!w) return false
  w.document.open()
  w.document.write(html)
  w.document.close()
  return true
}
