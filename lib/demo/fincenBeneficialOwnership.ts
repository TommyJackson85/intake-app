/**
 * FinCEN **Beneficial Ownership Review** — internal issue-spotting only.
 *
 * Not a filing engine, ownership determination, or compliance certificate.
 * Public FinCEN guidance has indicated that the residential real estate rule is
 * currently without legal effect while the March 2026 vacatur remains in force,
 * and that reporting persons are not currently required to file Real Estate Reports
 * during that period. Confirm current firm guidance and official sources before any filing posture.
 */
import type { DemoMatter, FinCENBeneficialOwner } from '@/lib/demo/types'
import { isFincenEligibleMatter } from '@/lib/demo/fincenEligibility'
import { FINCEN_SECTION_IDS } from '@/lib/demo/fincenReportability'

export type FinCENBeneficialOwnershipBadge = {
  label: string
  bg: string
  color: string
  border: string
}

export type FinCENBeneficialOwnershipRowId =
  | 'purchaser_context'
  | 'demo_gate'
  | 'cert_workflow'
  | 'certified_owners'
  | 'identity_completeness'
  | 'gov_id_completeness'
  | 'entity_alignment'
  | 'regulatory_posture'

export type FinCENBeneficialOwnershipRow = {
  id: FinCENBeneficialOwnershipRowId
  title: string
  badge: FinCENBeneficialOwnershipBadge
  attention: boolean
  detail: string | null
  /** Stable DOM id on the FinCEN / AML tab for Overview deep-links. */
  sectionId: string
}

export type FinCENBeneficialOwnershipReviewDashboard = {
  /** Coarse workspace posture — never a legal ownership / filing conclusion. */
  workspaceStatus: FinCENBeneficialOwnershipBadge
  nextAction: string
  attentionRowCount: number
  eligibleUnderDemoGate: boolean
  certifiedOwnerCount: number
  ownerCount: number
  rows: FinCENBeneficialOwnershipRow[]
  disclaimer: string
  regulatoryNote: string
}

const NEUTRAL: FinCENBeneficialOwnershipBadge = {
  label: 'Review',
  bg: '#f5f5f5',
  color: '#627c71',
  border: 'rgba(94,82,64,0.2)',
}

const ATTENTION: FinCENBeneficialOwnershipBadge = {
  label: 'Attention',
  bg: '#fff4d6',
  color: '#b45309',
  border: 'rgba(240,180,41,0.35)',
}

const INFO: FinCENBeneficialOwnershipBadge = {
  label: 'Noted',
  bg: '#dbeafe',
  color: '#1e40af',
  border: 'rgba(30,64,175,0.25)',
}

const QUIET: FinCENBeneficialOwnershipBadge = {
  label: 'Quiet',
  bg: '#e8f5f0',
  color: '#166534',
  border: 'rgba(47,133,90,0.35)',
}

function fieldFilled(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function identityComplete(owner: FinCENBeneficialOwner): boolean {
  return (
    fieldFilled(owner.fullName) &&
    fieldFilled(owner.dob) &&
    fieldFilled(owner.address) &&
    fieldFilled(owner.citizenship) &&
    fieldFilled(owner.tin)
  )
}

function govIdComplete(owner: FinCENBeneficialOwner): boolean {
  return (
    fieldFilled(owner.govIdType) &&
    fieldFilled(owner.govIdNumber) &&
    fieldFilled(owner.govIdIssuer)
  )
}

/**
 * Pure Overview projection for FinCEN Beneficial Ownership Review (issue-spotting).
 * Uses existing matter fields only — does not persist, file, or certify ownership.
 */
export function buildFinCENBeneficialOwnershipReviewDashboard(
  matter: Pick<DemoMatter, 'financingType' | 'buyer' | 'fincen'>,
): FinCENBeneficialOwnershipReviewDashboard {
  const eligible = isFincenEligibleMatter(matter as DemoMatter)
  const entityBuyer = matter.buyer?.type === 'entity'
  const f = matter.fincen
  const owners = f?.beneficialOwners ?? []
  const certified = owners.filter((o) => Boolean(o.certifiedAt))
  const pendingClient = f?.certRequest?.status === 'pending_client'
  const certStatus = f?.certRequest?.status ?? null
  const purchaserEntityName = f?.propertyInfo?.purchaserEntityName?.trim() ?? ''
  const buyerName = matter.buyer?.name?.trim() ?? ''
  const identityGaps = owners.filter((o) => !identityComplete(o)).length
  const govIdGaps = owners.filter((o) => !govIdComplete(o)).length

  const rows: FinCENBeneficialOwnershipRow[] = [
    {
      id: 'purchaser_context',
      title: 'Purchaser context',
      badge: entityBuyer
        ? { label: 'Entity / trust', bg: '#e8f5f0', color: '#166534', border: 'rgba(47,133,90,0.35)' }
        : ATTENTION,
      attention: !entityBuyer,
      detail: entityBuyer
        ? `Buyer recorded as entity/trust${buyerName ? ` (${buyerName})` : ''}. Confirm beneficial ownership facts against entity records.`
        : 'Buyer recorded as individual (or unset). Beneficial-ownership certification typically applies to entity/trust purchasers — confirm firm process.',
      sectionId: FINCEN_SECTION_IDS.propertyPurchaser,
    },
    {
      id: 'demo_gate',
      title: 'Demo workspace gate',
      badge: eligible
        ? { label: 'Workspace open', bg: '#dbeafe', color: '#1e40af', border: 'rgba(30,64,175,0.25)' }
        : NEUTRAL,
      attention: !eligible && entityBuyer,
      detail: eligible
        ? 'Cash + entity/trust demo gate is met — review beneficial-ownership intake for issue-spotting, not as a filing order.'
        : 'Outside the demo cash + entity/trust gate. Full FinCEN BO intake may be hidden; still screen if firm process requires it.',
      sectionId: eligible ? FINCEN_SECTION_IDS.beneficialOwners : FINCEN_SECTION_IDS.eligibility,
    },
    {
      id: 'cert_workflow',
      title: 'Certification workflow',
      badge: pendingClient
        ? ATTENTION
        : certStatus === 'submitted'
          ? INFO
          : eligible
            ? NEUTRAL
            : QUIET,
      attention: Boolean(pendingClient) || (eligible && !certStatus && certified.length === 0),
      detail: pendingClient
        ? 'Client certification link is outstanding — follow up before treating ownership facts as complete for internal review.'
        : certStatus === 'submitted'
          ? 'Client certification was submitted. Confirm certified owners on the FinCEN / AML tab.'
          : eligible
            ? 'No client certification request on file yet.'
            : 'Certification workflow is primarily used when the demo gate is open.',
      sectionId: FINCEN_SECTION_IDS.beneficialOwners,
    },
    {
      id: 'certified_owners',
      title: 'Certified beneficial owners',
      badge:
        certified.length > 0
          ? {
              label: `${certified.length} certified`,
              bg: '#e8f5f0',
              color: '#166534',
              border: 'rgba(47,133,90,0.35)',
            }
          : eligible
            ? NEUTRAL
            : QUIET,
      attention: eligible && certified.length === 0,
      detail:
        certified.length > 0
          ? `${certified.length} of ${owners.length} recorded owner${owners.length === 1 ? '' : 's'} certified — confirm completeness under firm process (not a legal determination of control).`
          : eligible
            ? owners.length > 0
              ? `${owners.length} owner record${owners.length === 1 ? '' : 's'} on file, none certified yet.`
              : 'No beneficial owners recorded yet.'
            : 'Certified-owner review surfaces after FinCEN intake under the demo gate.',
      sectionId: FINCEN_SECTION_IDS.beneficialOwners,
    },
    {
      id: 'identity_completeness',
      title: 'Identity fields',
      badge:
        owners.length === 0
          ? eligible
            ? NEUTRAL
            : QUIET
          : identityGaps === 0
            ? {
                label: 'Fields present',
                bg: '#e8f5f0',
                color: '#166534',
                border: 'rgba(47,133,90,0.35)',
              }
            : {
                label: `${identityGaps} gap${identityGaps === 1 ? '' : 's'}`,
                bg: '#fff4d6',
                color: '#b45309',
                border: 'rgba(240,180,41,0.35)',
              },
      attention: eligible && (owners.length === 0 || identityGaps > 0),
      detail:
        owners.length === 0
          ? eligible
            ? 'No owner identity records to review yet (name, DOB, address, citizenship, TIN).'
            : 'Identity completeness review applies when owner records exist under the demo gate.'
          : identityGaps === 0
            ? 'Core identity fields are present on all recorded owners — still confirm against source documents.'
            : `${identityGaps} owner record${identityGaps === 1 ? '' : 's'} missing one or more of name, DOB, address, citizenship, or TIN.`,
      sectionId: FINCEN_SECTION_IDS.beneficialOwners,
    },
    {
      id: 'gov_id_completeness',
      title: 'Government ID fields',
      badge:
        owners.length === 0
          ? eligible
            ? NEUTRAL
            : QUIET
          : govIdGaps === 0
            ? {
                label: 'ID fields present',
                bg: '#e8f5f0',
                color: '#166534',
                border: 'rgba(47,133,90,0.35)',
              }
            : {
                label: `${govIdGaps} gap${govIdGaps === 1 ? '' : 's'}`,
                bg: '#fff4d6',
                color: '#b45309',
                border: 'rgba(240,180,41,0.35)',
              },
      attention: eligible && owners.length > 0 && govIdGaps > 0,
      detail:
        owners.length === 0
          ? eligible
            ? 'No government-ID fields to review yet (type, number, issuer).'
            : 'Government-ID review applies when owner records exist under the demo gate.'
          : govIdGaps === 0
            ? 'Government ID type, number, and issuer are present on all recorded owners — confirm issuer and number formats under firm process.'
            : `${govIdGaps} owner record${govIdGaps === 1 ? '' : 's'} missing government ID type, number, and/or issuer.`,
      sectionId: FINCEN_SECTION_IDS.beneficialOwners,
    },
    {
      id: 'entity_alignment',
      title: 'Purchaser entity alignment',
      badge:
        !eligible || !f
          ? eligible
            ? NEUTRAL
            : QUIET
          : purchaserEntityName && buyerName && purchaserEntityName === buyerName
            ? INFO
            : ATTENTION,
      attention: Boolean(
        eligible && f && (!purchaserEntityName || (buyerName && purchaserEntityName !== buyerName)),
      ),
      detail: !eligible
        ? 'Entity-name alignment review is most relevant when the demo gate is open.'
        : !f
          ? 'Start FinCEN intake to record purchaser entity name for alignment checks.'
          : !purchaserEntityName
            ? 'Purchaser entity name is blank on FinCEN property facts — confirm against buyer entity name on the matter.'
            : buyerName && purchaserEntityName !== buyerName
              ? `FinCEN purchaser entity (“${purchaserEntityName}”) differs from matter buyer name (“${buyerName}”) — confirm which record controls.`
              : `Purchaser entity on FinCEN intake: ${purchaserEntityName}.`,
      sectionId: FINCEN_SECTION_IDS.propertyPurchaser,
    },
    {
      id: 'regulatory_posture',
      title: 'Regulatory posture (public guidance)',
      badge: INFO,
      attention: false,
      detail:
        'Residential Real Estate Report rule has been described by FinCEN as without legal effect during the March 2026 vacatur period; reporting persons are not currently required to file Real Estate Reports in that period. Beneficial-ownership review here is internal issue-spotting only.',
      sectionId: FINCEN_SECTION_IDS.regulatory,
    },
  ]

  const attentionRowCount = rows.filter((r) => r.attention).length

  let workspaceStatus: FinCENBeneficialOwnershipBadge = NEUTRAL
  let nextAction =
    'Confirm purchaser type and whether beneficial-ownership screening is needed under current firm guidance.'

  if (eligible && pendingClient) {
    workspaceStatus = ATTENTION
    nextAction =
      'Follow up on the pending beneficial-ownership certification request, then review certified owner facts on FinCEN / AML.'
  } else if (eligible && certified.length === 0) {
    workspaceStatus = ATTENTION
    nextAction =
      'No certified beneficial owners yet — open FinCEN / AML to request certification or record owner facts for internal review.'
  } else if (eligible && (identityGaps > 0 || govIdGaps > 0)) {
    workspaceStatus = ATTENTION
    nextAction =
      'Certified owners exist, but identity or government-ID fields still need attention before lawyer review.'
  } else if (eligible) {
    workspaceStatus = INFO
    nextAction =
      'Beneficial-ownership intake looks populated in demo. Perform lawyer review of owner facts and current regulatory posture — not a filing determination.'
  } else if (entityBuyer) {
    workspaceStatus = ATTENTION
    nextAction =
      'Entity/trust purchaser is recorded outside the cash demo gate. Confirm whether a light beneficial-ownership screen is still required under firm process.'
  } else {
    workspaceStatus = QUIET
    nextAction =
      'No entity/trust purchaser on the demo gate path. Keep a light factual check if firm process requires beneficial-ownership screening.'
  }

  return {
    workspaceStatus,
    nextAction,
    attentionRowCount,
    eligibleUnderDemoGate: eligible,
    certifiedOwnerCount: certified.length,
    ownerCount: owners.length,
    rows,
    disclaimer:
      'Internal FinCEN Beneficial Ownership Review — issue-spotting only. Not an ownership determination, filing instruction, compliance certification, or automated BSA decision.',
    regulatoryNote:
      'FinCEN has publicly indicated the residential real estate rule is currently without legal effect while the March 2026 vacatur remains in force, and that reporting persons are not currently required to file Real Estate Reports during that period. Always verify the latest official guidance.',
  }
}
