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
  | 'reporting_party'
  | 'property_purchaser'
  | 'beneficial_owners'
  | 'client_cert'
  | 'retention'
  | 'regulatory_posture'

export type FinCENReportabilityRow = {
  id: FinCENReportabilityRowId
  title: string
  badge: FinCENReportabilityBadge
  attention: boolean
  detail: string | null
  /** Stable DOM id on the FinCEN / AML tab for Overview deep-links. */
  sectionId: string
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

/** DOM anchors used by DemoFinCENTab + Overview deep-links. */
export const FINCEN_SECTION_IDS = {
  regulatory: 'fincen-regulatory-note',
  intake: 'fincen-intake-status',
  reportingParty: 'fincen-reporting-party',
  propertyPurchaser: 'fincen-property-purchaser',
  beneficialOwners: 'fincen-beneficial-owners',
  retention: 'fincen-retention',
  eligibility: 'fincen-eligibility-note',
} as const

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

function countReportingComplete(f: NonNullable<DemoMatter['fincen']>): number {
  const rp = f.reportingParty
  let n = 0
  if (rp.firmName.trim()) n += 1
  if (rp.firmAddress.trim()) n += 1
  if (rp.firmEin.trim()) n += 1
  if (rp.filingAttorney.trim()) n += 1
  return n
}

function countPropertyComplete(f: NonNullable<DemoMatter['fincen']>): number {
  const pi = f.propertyInfo
  let n = 0
  if (pi.purchaserEntityName.trim()) n += 1
  if (pi.purchaserEntityType.trim()) n += 1
  if (pi.purchaserEin.trim()) n += 1
  if (pi.stateOfFormation.trim()) n += 1
  if (pi.totalCashAmount.trim()) n += 1
  if (pi.paymentMethods.length > 0) n += 1
  return n
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

function reportingPartyRow(matter: Pick<DemoMatter, 'fincen'>, eligible: boolean): FinCENReportabilityRow {
  const f = matter.fincen
  if (!eligible || !f) {
    return {
      id: 'reporting_party',
      title: 'Reporting party',
      badge: eligible ? NEUTRAL : QUIET,
      attention: Boolean(eligible && !f),
      detail: eligible
        ? 'Start FinCEN intake to record reporting-party facts for internal review.'
        : 'Reporting-party intake is hidden unless the demo gate is met.',
      sectionId: FINCEN_SECTION_IDS.reportingParty,
    }
  }
  const n = countReportingComplete(f)
  const attention = n < 4
  return {
    id: 'reporting_party',
    title: 'Reporting party',
    badge: attention
      ? { label: `${n}/4 fields`, bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
      : { label: '4/4 fields', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' },
    attention,
    detail: attention
      ? `${n} of 4 reporting-party fields recorded (firm name, address, EIN, filing attorney).`
      : 'Reporting-party fields look complete in demo — confirm against firm records.',
    sectionId: FINCEN_SECTION_IDS.reportingParty,
  }
}

function propertyPurchaserRow(matter: Pick<DemoMatter, 'fincen'>, eligible: boolean): FinCENReportabilityRow {
  const f = matter.fincen
  if (!eligible || !f) {
    return {
      id: 'property_purchaser',
      title: 'Property & purchaser entity',
      badge: eligible ? NEUTRAL : QUIET,
      attention: Boolean(eligible && !f),
      detail: eligible
        ? 'Start FinCEN intake to record purchaser entity and cash-payment facts.'
        : 'Property / purchaser intake is hidden unless the demo gate is met.',
      sectionId: FINCEN_SECTION_IDS.propertyPurchaser,
    }
  }
  const n = countPropertyComplete(f)
  const attention = n < 6
  const cashHint = f.propertyInfo.totalCashAmount.trim()
    ? ` Cash amount on file: ${f.propertyInfo.totalCashAmount}.`
    : ''
  return {
    id: 'property_purchaser',
    title: 'Property & purchaser entity',
    badge: attention
      ? { label: `${n}/6 items`, bg: '#fff4d6', color: '#b45309', border: 'rgba(240,180,41,0.35)' }
      : { label: '6/6 items', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' },
    attention,
    detail: attention
      ? `${n} of 6 property/purchaser items recorded.${cashHint}`
      : `Purchaser entity and payment facts look complete in demo.${cashHint}`,
    sectionId: FINCEN_SECTION_IDS.propertyPurchaser,
  }
}

function beneficialOwnersRow(matter: Pick<DemoMatter, 'fincen'>, eligible: boolean): FinCENReportabilityRow {
  const f = matter.fincen
  if (!eligible || !f) {
    return {
      id: 'beneficial_owners',
      title: 'Beneficial owners',
      badge: eligible ? NEUTRAL : QUIET,
      attention: Boolean(eligible && !f),
      detail: eligible
        ? 'Start FinCEN intake to request or review beneficial-ownership certification.'
        : 'Beneficial-owner intake is hidden unless the demo gate is met.',
      sectionId: FINCEN_SECTION_IDS.beneficialOwners,
    }
  }
  const owners = f.beneficialOwners ?? []
  const certified = owners.filter((o) => o.certifiedAt).length
  if (certified > 0) {
    return {
      id: 'beneficial_owners',
      title: 'Beneficial owners',
      badge: { label: `${certified} certified`, bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' },
      attention: false,
      detail: `${certified} beneficial owner${certified === 1 ? '' : 's'} certified on this matter — confirm completeness under firm process.`,
      sectionId: FINCEN_SECTION_IDS.beneficialOwners,
    }
  }
  if (f.certRequest?.status === 'pending_client') {
    return {
      id: 'beneficial_owners',
      title: 'Beneficial owners',
      badge: ATTENTION,
      attention: true,
      detail: 'Awaiting client certification of beneficial ownership.',
      sectionId: FINCEN_SECTION_IDS.beneficialOwners,
    }
  }
  return {
    id: 'beneficial_owners',
    title: 'Beneficial owners',
    badge: NEUTRAL,
    attention: true,
    detail: 'No certified beneficial owners on file yet.',
    sectionId: FINCEN_SECTION_IDS.beneficialOwners,
  }
}

function retentionRow(matter: Pick<DemoMatter, 'fincen'>, eligible: boolean): FinCENReportabilityRow {
  const deadline = matter.fincen?.retentionDeadline ?? null
  if (!eligible) {
    return {
      id: 'retention',
      title: 'AML retention clock',
      badge: QUIET,
      attention: false,
      detail: 'Retention tracking appears after FinCEN intake is started under the demo gate.',
      sectionId: FINCEN_SECTION_IDS.retention,
    }
  }
  if (!deadline) {
    return {
      id: 'retention',
      title: 'AML retention clock',
      badge: NEUTRAL,
      attention: false,
      detail: 'No retention deadline recorded yet (set when intake / certification workflow progresses).',
      sectionId: FINCEN_SECTION_IDS.retention,
    }
  }
  const deadlineDate = new Date(`${deadline}T00:00:00`)
  const now = new Date()
  const diffDays = Math.floor((deadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  const label = deadlineDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  if (diffDays < 0) {
    return {
      id: 'retention',
      title: 'AML retention clock',
      badge: ATTENTION,
      attention: true,
      detail: `Recorded retention date ${label} is in the past — confirm retention posture under firm process.`,
      sectionId: FINCEN_SECTION_IDS.retention,
    }
  }
  if (diffDays <= 90) {
    return {
      id: 'retention',
      title: 'AML retention clock',
      badge: ATTENTION,
      attention: true,
      detail: `Retention deadline ${label} is within 90 days — confirm calendar and file retention.`,
      sectionId: FINCEN_SECTION_IDS.retention,
    }
  }
  return {
    id: 'retention',
    title: 'AML retention clock',
    badge: INFO,
    attention: false,
    detail: `AML records retention target on file through ${label}.`,
    sectionId: FINCEN_SECTION_IDS.retention,
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
      sectionId: FINCEN_SECTION_IDS.propertyPurchaser,
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
      sectionId: FINCEN_SECTION_IDS.propertyPurchaser,
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
      sectionId: eligible ? FINCEN_SECTION_IDS.intake : FINCEN_SECTION_IDS.eligibility,
    },
    {
      id: 'intake_readiness',
      title: 'Intake readiness',
      badge: eligible ? intake.badge : QUIET,
      attention: eligible ? intake.attention : false,
      detail: eligible ? intake.detail : 'Full FinCEN intake UI is hidden unless the demo gate is met.',
      sectionId: FINCEN_SECTION_IDS.intake,
    },
    reportingPartyRow(matter, eligible),
    propertyPurchaserRow(matter, eligible),
    beneficialOwnersRow(matter, eligible),
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
      sectionId: FINCEN_SECTION_IDS.beneficialOwners,
    },
    retentionRow(matter, eligible),
    {
      id: 'regulatory_posture',
      title: 'Regulatory posture (public guidance)',
      badge: INFO,
      attention: false,
      detail:
        'Residential Real Estate Report rule has been described by FinCEN as without legal effect during the March 2026 vacatur period; reporting persons are not currently required to file Real Estate Reports in that period. Verify current official guidance before any filing posture.',
      sectionId: FINCEN_SECTION_IDS.regulatory,
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
