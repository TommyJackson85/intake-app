/**
 * FinCEN **Reportability Review** — internal issue-spotting only.
 *
 * Not a filing engine, automated determination, or compliance certificate.
 * Public FinCEN guidance has indicated that the residential real estate rule is
 * currently without legal effect while the March 2026 vacatur remains in force,
 * and that reporting persons are not currently required to file Real Estate Reports
 * during that period. Confirm current firm guidance and official sources before any filing posture.
 */
import type { DemoMatter } from '@/lib/demo/types'
import { isFincenEligibleMatter } from '@/lib/demo/fincenEligibility'

export type FinCENReportabilityBadge = {
  label: string
  bg: string
  color: string
  border: string
}

export type FinCENReportabilityRowId =
  | 'financing'
  | 'purchaser_type'
  | 'eligibility_gate'
  | 'intake_readiness'
  | 'client_cert'
  | 'regulatory_posture'

export type FinCENReportabilityRow = {
  id: FinCENReportabilityRowId
  title: string
  badge: FinCENReportabilityBadge
  attention: boolean
  detail: string | null
}

export type FinCENReportabilityReviewDashboard = {
  /** Coarse workspace posture — never a "must file" / "not reportable" legal conclusion. */
  workspaceStatus: FinCENReportabilityBadge
  nextAction: string
  attentionRowCount: number
  eligibleUnderDemoGate: boolean
  financingTypeLabel: string
  purchaserTypeLabel: string
  rows: FinCENReportabilityRow[]
  disclaimer: string
  regulatoryNote: string
}

const NEUTRAL: FinCENReportabilityBadge = {
  label: 'Review',
  bg: '#f5f5f5',
  color: '#627c71',
  border: 'rgba(94,82,64,0.2)',
}

const ATTENTION: FinCENReportabilityBadge = {
  label: 'Attention',
  bg: '#fff4d6',
  color: '#b45309',
  border: 'rgba(240,180,41,0.35)',
}

const INFO: FinCENReportabilityBadge = {
  label: 'Noted',
  bg: '#dbeafe',
  color: '#1e40af',
  border: 'rgba(30,64,175,0.25)',
}

const QUIET: FinCENReportabilityBadge = {
  label: 'Quiet',
  bg: '#e8f5f0',
  color: '#166534',
  border: 'rgba(47,133,90,0.35)',
}

function financingTypeLabel(financingType: string): string {
  const t = financingType.trim()
  return t || 'Not recorded'
}

function purchaserTypeLabel(buyerType: DemoMatter['buyer']['type']): string {
  if (buyerType === 'entity') return 'Entity / trust'
  if (buyerType === 'individual') return 'Individual'
  return 'Not recorded'
}

function intakeReadiness(matter: Pick<DemoMatter, 'fincen'>): {
  badge: FinCENReportabilityBadge
  attention: boolean
  detail: string
} {
  const completed = matter.fincen?.completedFields ?? 0
  const status = matter.fincen?.reportStatus ?? 'not_started'
  const pendingClient = matter.fincen?.certRequest?.status === 'pending_client'

  if (pendingClient) {
    return {
      badge: ATTENTION,
      attention: true,
      detail: 'Client certification request is pending.',
    }
  }
  if (completed >= 111 || status === 'ready') {
    return {
      badge: { label: 'Intake complete', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' },
      attention: false,
      detail: 'Demo intake fields are complete — still not a filing determination.',
    }
  }
  if (completed > 0 || status === 'in_progress') {
    return {
      badge: { label: 'Intake in progress', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' },
      attention: true,
      detail: `${completed} of 111 demo intake fields recorded.`,
    }
  }
  return {
    badge: NEUTRAL,
    attention: true,
    detail: 'No AML / FinCEN intake data recorded yet.',
  }
}

/**
 * Pure Overview projection for FinCEN Reportability Review (issue-spotting).
 * Uses existing matter fields only — does not persist, file, or certify reportability.
 */
export function buildFinCENReportabilityReviewDashboard(
  matter: Pick<DemoMatter, 'financingType' | 'buyer' | 'fincen'>,
): FinCENReportabilityReviewDashboard {
  const financingLabel = financingTypeLabel(matter.financingType)
  const purchaserLabel = purchaserTypeLabel(matter.buyer?.type)
  const eligible = isFincenEligibleMatter(matter as DemoMatter)
  const cash = matter.financingType === 'Cash'
  const entityBuyer = matter.buyer?.type === 'entity'
  const intake = intakeReadiness(matter)
  const pendingClient = matter.fincen?.certRequest?.status === 'pending_client'

  const rows: FinCENReportabilityRow[] = [
    {
      id: 'financing',
      title: 'Financing type',
      badge: cash
        ? { label: 'Cash', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
        : ATTENTION,
      attention: !cash,
      detail: cash
        ? 'Recorded as cash. Confirm payment method facts against the file.'
        : `Recorded as “${financingLabel}”. Demo gate focuses on cash transfers — confirm whether FinCEN residential-report questions still apply under current firm guidance.`,
    },
    {
      id: 'purchaser_type',
      title: 'Purchaser type',
      badge: entityBuyer
        ? { label: 'Entity / trust', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
        : ATTENTION,
      attention: !entityBuyer,
      detail: entityBuyer
        ? 'Buyer recorded as entity/trust. Confirm entity details and beneficial ownership facts.'
        : 'Buyer recorded as individual (or unset). Demo gate focuses on entity/trust purchasers — confirm whether additional review is needed.',
    },
    {
      id: 'eligibility_gate',
      title: 'Demo workspace gate',
      badge: eligible
        ? { label: 'Workspace open', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
        : NEUTRAL,
      attention: !eligible && (cash || entityBuyer),
      detail: eligible
        ? 'Cash + entity/trust demo gate is met — open intake for issue-spotting, not as a filing order.'
        : 'Outside the demo cash + entity/trust gate. Still review facts if firm process requires a reportability screen.',
    },
    {
      id: 'intake_readiness',
      title: 'Intake readiness',
      badge: eligible ? intake.badge : QUIET,
      attention: eligible ? intake.attention : false,
      detail: eligible ? intake.detail : 'Full FinCEN intake UI is hidden unless the demo gate is met.',
    },
    {
      id: 'client_cert',
      title: 'Client certification',
      badge: pendingClient ? ATTENTION : matter.fincen?.certRequest ? INFO : NEUTRAL,
      attention: Boolean(pendingClient),
      detail: pendingClient
        ? 'Pending client certification link is outstanding.'
        : matter.fincen?.certRequest
          ? `Certification status: ${matter.fincen.certRequest.status}.`
          : 'No client certification request on file.',
    },
    {
      id: 'regulatory_posture',
      title: 'Regulatory posture (public guidance)',
      badge: INFO,
      attention: false,
      detail:
        'Residential Real Estate Report rule has been described by FinCEN as without legal effect during the March 2026 vacatur period; reporting persons are not currently required to file Real Estate Reports in that period. Verify current official guidance before any filing posture.',
    },
  ]

  const attentionRowCount = rows.filter((r) => r.attention).length

  let workspaceStatus: FinCENReportabilityBadge = NEUTRAL
  let nextAction =
    'Confirm financing and purchaser facts, then decide whether internal reportability screening is needed under current firm guidance.'

  if (eligible && pendingClient) {
    workspaceStatus = ATTENTION
    nextAction =
      'Follow up on the pending client certification request, then complete remaining intake fields for internal review.'
  } else if (eligible && intake.attention) {
    workspaceStatus = ATTENTION
    nextAction =
      'Continue AML / FinCEN intake on the FinCEN / AML tab for internal issue-spotting — not a filing determination.'
  } else if (eligible) {
    workspaceStatus = INFO
    nextAction =
      'Intake fields look complete in demo. Perform lawyer review of facts and current regulatory posture before any filing decision.'
  } else if (cash || entityBuyer) {
    workspaceStatus = ATTENTION
    nextAction =
      'Partial reportability signals are present (cash or entity/trust). Confirm whether a full internal screen is required under firm process.'
  } else {
    workspaceStatus = QUIET
    nextAction = 'No demo cash + entity/trust gate match. Keep a light factual check if firm process requires one.'
  }

  return {
    workspaceStatus,
    nextAction,
    attentionRowCount,
    eligibleUnderDemoGate: eligible,
    financingTypeLabel: financingLabel,
    purchaserTypeLabel: purchaserLabel,
    rows,
    disclaimer:
      'Internal FinCEN Reportability Review — issue-spotting only. Not a reportability determination, filing instruction, compliance certification, or automated BSA decision.',
    regulatoryNote:
      'FinCEN has publicly indicated the residential real estate rule is currently without legal effect while the March 2026 vacatur remains in force, and that reporting persons are not currently required to file Real Estate Reports during that period. Always verify the latest official guidance.',
  }
}
