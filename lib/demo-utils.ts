import type { DemoTask } from '@/lib/demo/types'

export type DerivedDemoMatterStatus =
  | 'Intake'
  | 'Title Search'
  | 'Cleared to Close'
  | 'Scheduled for Closing'
  | 'Closed/Post-Closing'

function parseYmdToLocalStart(dateStr: string) {
  // Input is expected to be `YYYY-MM-DD`.
  const dt = new Date(`${dateStr}T00:00:00`)
  return Number.isNaN(dt.getTime()) ? null : dt
}

/**
 * Pure helper: derives a demo matter **pipeline** status from task completion (same labels as `DemoMatter.status`).
 * This is one of several independent status concepts (`DemoMatter.status`, milestone logs, docs, condo, FinCEN, …).
 * See `systemContract.knownDivergences` id `multiple-status-concepts` in `lib/domain/system-contract.ts`.
 *
 * `closingDate` is optional so the function can be unit tested without it.
 * When `closingDate` is missing, `Closed/Post-Closing` will never be returned.
 */
export function deriveMatterStatus(tasks: DemoTask[], closingDate?: string, now: Date = new Date()): DerivedDemoMatterStatus {
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const closingDt = closingDate ? parseYmdToLocalStart(closingDate) : null
  const closingInPast = closingDt ? closingDt.getTime() < nowStart.getTime() : false

  const byTitle = (title: string) => tasks.find((t) => t.title === title && !t.deletedAt)

  const scheduleSigning = byTitle('Schedule signing')
  const scheduleSigningCompleted = scheduleSigning?.status === 'completed'

  const receivedExecutedContractCompleted = byTitle('Receive executed contract')?.status === 'completed'
  const orderTitleSearch = byTitle('Order title search')
  const orderTitleSearchInProgressOrCompleted =
    orderTitleSearch?.status === 'in_progress' || orderTitleSearch?.status === 'completed'

  const orderMunicipalLienSearchCompleted = byTitle('Order municipal lien/search')?.status === 'completed'
  const requestPayoffCompleted = byTitle('Request payoff from seller lender')?.status === 'completed'
  const prepareClosingDisclosureCompleted = byTitle('Prepare Closing Disclosure/ALTA')?.status === 'completed'

  const clearedToCloseConditionsMet =
    receivedExecutedContractCompleted &&
    byTitle('Order title search')?.status === 'completed' &&
    orderMunicipalLienSearchCompleted &&
    requestPayoffCompleted &&
    prepareClosingDisclosureCompleted &&
    !scheduleSigningCompleted

  // Evaluation order matters: first match wins.
  if (scheduleSigningCompleted && closingInPast) return 'Closed/Post-Closing'
  if (scheduleSigningCompleted) return 'Scheduled for Closing'
  if (clearedToCloseConditionsMet) return 'Cleared to Close'
  if (orderTitleSearchInProgressOrCompleted && !clearedToCloseConditionsMet) return 'Title Search'
  return 'Intake'
}

