/**
 * Serialize the latest demo conflict check for persistence on `DemoIntakeLead.conflict_check_last_run`.
 */

import { sortConflictMatchReasons, type DemoConflictCheckResult } from '@/lib/demo/demoConflictCheck'
import { effectiveIntakeSnapshot, normalizeIntakeSnapshotForPersist } from '@/lib/demo/demoIntakeFlow'
import type { DemoConflictLastRun, DemoIntakeLead } from '@/lib/demo/types'

export function buildConflictCheckLastRun(
  lead: DemoIntakeLead,
  result: DemoConflictCheckResult,
  ctx: { runByLabel: string; runAt?: string },
): DemoConflictLastRun {
  const runAt = ctx.runAt ?? new Date().toISOString()
  const intakeSnapshot = normalizeIntakeSnapshotForPersist(effectiveIntakeSnapshot(lead))

  return {
    runAt,
    runByLabel: ctx.runByLabel,
    intakeSnapshot,
    hasConflict: result.hasConflict,
    clientRows: result.clientMatches.map(({ client: c, reasons }) => ({
      clientId: c.id,
      fullName: c.full_name,
      email: c.email,
      reasons: sortConflictMatchReasons([...reasons]),
    })),
    matterRows: result.matterMatches.map(({ matter: m, reasons }) => ({
      matterId: m.id,
      fileId: m.file_id,
      buyerName: m.buyer.name,
      sellerName: m.seller.name,
      reasons: sortConflictMatchReasons([...reasons]),
    })),
    intakeRows: result.intakeMatches.map(({ lead: l, reasons }) => ({
      leadId: l.id,
      fileReference: l.fileReference,
      clientName: effectiveIntakeSnapshot(l).clientName,
      reasons: sortConflictMatchReasons([...reasons]),
    })),
  }
}
