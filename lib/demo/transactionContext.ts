/**
 * Transaction Context triage helpers (demo).
 *
 * Operational classification for staff workflow routing only. Does not:
 * - provide legal advice
 * - determine liability, disclosure obligations, or purchase eligibility
 * - certify compliance or closing readiness
 */
import type {
  DemoCondoDiligence,
  DemoCondoDiligenceDocStatus,
  DemoMatter,
  DemoTransactionContext,
  DemoTransactionContextClientRole,
  DemoTransactionContextMatterKind,
  DemoTransactionContextPrimaryConcern,
  DemoTransactionContextPropertyKind,
  DemoTransactionContextStage,
  DemoTransactionRole,
} from '@/lib/demo/types'

export const DEMO_TRANSACTION_CONTEXT_MATTER_KINDS: readonly DemoTransactionContextMatterKind[] = [
  'purchase',
  'sale',
  'refinance',
  'condo_transaction',
  'landlord_tenant',
  'title_ownership',
  'probate_property',
  'property_dispute',
  'other',
] as const

export const DEMO_TRANSACTION_CONTEXT_CLIENT_ROLES: readonly DemoTransactionContextClientRole[] = [
  'buyer',
  'seller',
  'owner',
  'tenant',
  'landlord',
  'association',
  'agent_broker',
  'entity_representative',
  'other',
] as const

export const DEMO_TRANSACTION_CONTEXT_PROPERTY_KINDS: readonly DemoTransactionContextPropertyKind[] = [
  'condominium',
  'single_family',
  'townhome',
  'cooperative',
  'commercial',
  'vacant_land',
  'other',
] as const

export const DEMO_TRANSACTION_CONTEXT_STAGES: readonly DemoTransactionContextStage[] = [
  'enquiry',
  'under_contract',
  'diligence',
  'pre_closing',
  'closing',
  'post_closing',
  'dispute_review',
] as const

export const DEMO_TRANSACTION_CONTEXT_PRIMARY_CONCERNS: readonly DemoTransactionContextPrimaryConcern[] =
  [
    'deadline',
    'title',
    'hoa_condo_documents',
    'condition_disclosure',
    'compliance',
    'financing',
    'other',
  ] as const

export const TRANSACTION_CONTEXT_SECTION_TITLE = 'Transaction Context'

export const TRANSACTION_CONTEXT_BOUNDARY_DISCLAIMER =
  'Operational triage for staff workflow routing. Confirm facts before acting. This section does not provide legal advice, determine liability, certify compliance, or decide whether a party may purchase or sell property.'

export const TRANSACTION_CONTEXT_MATTER_KIND_OPTIONS: readonly {
  value: DemoTransactionContextMatterKind
  label: string
}[] = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'sale', label: 'Sale' },
  { value: 'refinance', label: 'Refinance' },
  { value: 'condo_transaction', label: 'Condo transaction' },
  { value: 'landlord_tenant', label: 'Landlord–tenant / property condition' },
  { value: 'title_ownership', label: 'Title or ownership issue' },
  { value: 'probate_property', label: 'Probate-related property issue' },
  { value: 'property_dispute', label: 'Property dispute' },
  { value: 'other', label: 'Other (manual review)' },
]

export const TRANSACTION_CONTEXT_CLIENT_ROLE_OPTIONS: readonly {
  value: DemoTransactionContextClientRole
  label: string
}[] = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'owner', label: 'Owner' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'association', label: 'Association' },
  { value: 'agent_broker', label: 'Agent / broker' },
  { value: 'entity_representative', label: 'Entity representative' },
  { value: 'other', label: 'Other' },
]

export const TRANSACTION_CONTEXT_PROPERTY_KIND_OPTIONS: readonly {
  value: DemoTransactionContextPropertyKind
  label: string
}[] = [
  { value: 'condominium', label: 'Condominium' },
  { value: 'single_family', label: 'Single-family' },
  { value: 'townhome', label: 'Townhome' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'vacant_land', label: 'Vacant land' },
  { value: 'other', label: 'Other' },
]

export const TRANSACTION_CONTEXT_STAGE_OPTIONS: readonly {
  value: DemoTransactionContextStage
  label: string
}[] = [
  { value: 'enquiry', label: 'Enquiry' },
  { value: 'under_contract', label: 'Under contract' },
  { value: 'diligence', label: 'Diligence' },
  { value: 'pre_closing', label: 'Pre-closing' },
  { value: 'closing', label: 'Closing' },
  { value: 'post_closing', label: 'Post-closing' },
  { value: 'dispute_review', label: 'Dispute review' },
]

export const TRANSACTION_CONTEXT_PRIMARY_CONCERN_OPTIONS: readonly {
  value: DemoTransactionContextPrimaryConcern
  label: string
}[] = [
  { value: 'deadline', label: 'Deadline' },
  { value: 'title', label: 'Title' },
  { value: 'hoa_condo_documents', label: 'HOA / condo documents' },
  { value: 'condition_disclosure', label: 'Condition / disclosure' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'financing', label: 'Financing' },
  { value: 'other', label: 'Other' },
]

export function createEmptyTransactionContext(
  overrides: Partial<DemoTransactionContext> = {},
): DemoTransactionContext {
  return {
    matterKind: isTransactionContextMatterKind(overrides.matterKind) ? overrides.matterKind : '',
    clientRole: isTransactionContextClientRole(overrides.clientRole) ? overrides.clientRole : '',
    propertyKind: isTransactionContextPropertyKind(overrides.propertyKind)
      ? overrides.propertyKind
      : '',
    transactionStage: isTransactionContextStage(overrides.transactionStage)
      ? overrides.transactionStage
      : '',
    primaryConcern: isTransactionContextPrimaryConcern(overrides.primaryConcern)
      ? overrides.primaryConcern
      : '',
    notes: typeof overrides.notes === 'string' ? overrides.notes : '',
  }
}

export function isTransactionContextMatterKind(
  value: unknown,
): value is DemoTransactionContextMatterKind {
  return (
    typeof value === 'string' &&
    (DEMO_TRANSACTION_CONTEXT_MATTER_KINDS as readonly string[]).includes(value)
  )
}

export function isTransactionContextClientRole(
  value: unknown,
): value is DemoTransactionContextClientRole {
  return (
    typeof value === 'string' &&
    (DEMO_TRANSACTION_CONTEXT_CLIENT_ROLES as readonly string[]).includes(value)
  )
}

export function isTransactionContextPropertyKind(
  value: unknown,
): value is DemoTransactionContextPropertyKind {
  return (
    typeof value === 'string' &&
    (DEMO_TRANSACTION_CONTEXT_PROPERTY_KINDS as readonly string[]).includes(value)
  )
}

export function isTransactionContextStage(value: unknown): value is DemoTransactionContextStage {
  return (
    typeof value === 'string' &&
    (DEMO_TRANSACTION_CONTEXT_STAGES as readonly string[]).includes(value)
  )
}

export function isTransactionContextPrimaryConcern(
  value: unknown,
): value is DemoTransactionContextPrimaryConcern {
  return (
    typeof value === 'string' &&
    (DEMO_TRANSACTION_CONTEXT_PRIMARY_CONCERNS as readonly string[]).includes(value)
  )
}

/** Normalize unknown / legacy payloads. Never invent classification values. */
export function normalizeTransactionContext(
  raw: unknown,
): DemoTransactionContext | undefined {
  if (raw == null || typeof raw !== 'object') return undefined
  const o = raw as Partial<DemoTransactionContext>
  const next = createEmptyTransactionContext(o)
  const hasAny =
    Boolean(next.matterKind) ||
    Boolean(next.clientRole) ||
    Boolean(next.propertyKind) ||
    Boolean(next.transactionStage) ||
    Boolean(next.primaryConcern) ||
    Boolean(next.notes.trim())
  return hasAny ? next : undefined
}

/** Snapshot helper: omit empty context so legacy leads stay clean. */
export function transactionContextForIntakeSnapshot(
  context: DemoTransactionContext | null | undefined,
): DemoTransactionContext | undefined {
  return normalizeTransactionContext(context)
}

export function patchTransactionContext(
  current: DemoTransactionContext | null | undefined,
  patch: Partial<DemoTransactionContext>,
): DemoTransactionContext {
  return createEmptyTransactionContext({
    ...createEmptyTransactionContext(current ?? undefined),
    ...patch,
  })
}

export function transactionContextMatterKindLabel(
  value: DemoTransactionContextMatterKind | '',
): string {
  if (!value) return ''
  return TRANSACTION_CONTEXT_MATTER_KIND_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export function transactionContextClientRoleLabel(
  value: DemoTransactionContextClientRole | '',
): string {
  if (!value) return ''
  return TRANSACTION_CONTEXT_CLIENT_ROLE_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export function transactionContextPropertyKindLabel(
  value: DemoTransactionContextPropertyKind | '',
): string {
  if (!value) return ''
  return TRANSACTION_CONTEXT_PROPERTY_KIND_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export function transactionContextStageLabel(value: DemoTransactionContextStage | ''): string {
  if (!value) return ''
  return TRANSACTION_CONTEXT_STAGE_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export function transactionContextPrimaryConcernLabel(
  value: DemoTransactionContextPrimaryConcern | '',
): string {
  if (!value) return ''
  return TRANSACTION_CONTEXT_PRIMARY_CONCERN_OPTIONS.find((o) => o.value === value)?.label ?? value
}

/** Map existing property.property_type labels into triage propertyKind when useful. */
export function inferTransactionContextPropertyKindFromMatterPropertyType(
  propertyType: DemoMatter['property']['property_type'] | string | undefined,
): DemoTransactionContextPropertyKind | '' {
  switch (propertyType) {
    case 'Condo':
      return 'condominium'
    case 'Single-Family Home':
      return 'single_family'
    case 'Townhouse':
      return 'townhome'
    case 'Commercial':
      return 'commercial'
    case 'Land':
      return 'vacant_land'
    default:
      return ''
  }
}

/** Map intake transactionRole into triage clientRole when useful. */
export function inferTransactionContextClientRoleFromIntakeRole(
  role: DemoTransactionRole | null | undefined,
): DemoTransactionContextClientRole | '' {
  if (role === 'buyer') return 'buyer'
  if (role === 'seller') return 'seller'
  if (role === 'other') return 'other'
  return ''
}

export type DemoMatterReadinessStatus =
  | 'ready_for_next_workflow_stage'
  | 'information_incomplete'
  | 'attorney_review_recommended'

export type DemoMatterReadinessSummary = {
  status: DemoMatterReadinessStatus
  label: string
  message: string
  /** Neutral missing/review items for staff — not legal findings. */
  items: string[]
}

export type BuildMatterReadinessInput = {
  transactionContext?: DemoTransactionContext | null
  propertyType?: DemoMatter['property']['property_type'] | string | null
  /**
   * Optional condo diligence checklist. When present, outstanding/requested docs
   * inform incomplete readiness for condo tracks — not a closing-readiness score.
   */
  condoRequiredDocuments?: readonly { status: DemoCondoDiligenceDocStatus | string }[] | null
  condoMatterStatus?: DemoCondoDiligence['status'] | null
}

const ATTORNEY_REVIEW_MATTER_KINDS: readonly DemoTransactionContextMatterKind[] = [
  'landlord_tenant',
  'property_dispute',
  'title_ownership',
  'probate_property',
]

const ATTORNEY_REVIEW_CONCERNS: readonly DemoTransactionContextPrimaryConcern[] = [
  'condition_disclosure',
  'compliance',
]

/**
 * Deterministic internal readiness summary from stored facts only.
 * Never certifies legal compliance, disclosure duties, or closing readiness.
 */
export function buildMatterReadinessSummary(
  input: BuildMatterReadinessInput,
): DemoMatterReadinessSummary {
  const ctx = normalizeTransactionContext(input.transactionContext) ?? createEmptyTransactionContext()
  const items: string[] = []

  if (!ctx.matterKind) items.push('Matter kind not selected')
  if (!ctx.clientRole) items.push('Client role not selected')

  const condoTrack =
    ctx.matterKind === 'condo_transaction' ||
    ctx.propertyKind === 'condominium' ||
    input.propertyType === 'Condo'
  const docs = input.condoRequiredDocuments ?? []
  const outstandingOrRequested = docs.filter(
    (d) => d.status === 'outstanding' || d.status === 'requested',
  ).length
  if (condoTrack && docs.length > 0 && outstandingOrRequested > 0) {
    items.push(
      `${outstandingOrRequested} condo diligence document${outstandingOrRequested === 1 ? '' : 's'} still outstanding or requested`,
    )
  }
  if (condoTrack && input.condoMatterStatus === 'flagged') {
    items.push('Condo diligence matter status is flagged for internal review')
  }

  const needsAttorneyReview =
    (ctx.matterKind &&
      (ATTORNEY_REVIEW_MATTER_KINDS as readonly string[]).includes(ctx.matterKind)) ||
    (ctx.primaryConcern &&
      (ATTORNEY_REVIEW_CONCERNS as readonly string[]).includes(ctx.primaryConcern)) ||
    input.condoMatterStatus === 'flagged'

  if (!ctx.matterKind || !ctx.clientRole) {
    return {
      status: 'information_incomplete',
      label: 'Information incomplete',
      message:
        'Transaction context is incomplete. Confirm the client role and matter type before routing.',
      items,
    }
  }

  if (condoTrack && outstandingOrRequested > 0) {
    return {
      status: 'information_incomplete',
      label: 'Information incomplete',
      message: 'Condo diligence items remain outstanding. Review the matter’s diligence checklist.',
      items,
    }
  }

  if (needsAttorneyReview) {
    return {
      status: 'attorney_review_recommended',
      label: 'Attorney review recommended',
      message:
        'This matter includes a condition, compliance, title, probate, or dispute concern. Attorney review is recommended before substantive guidance is sent.',
      items: items.length
        ? items
        : ['Review concern flagged from transaction context for attorney triage'],
    }
  }

  return {
    status: 'ready_for_next_workflow_stage',
    label: 'Ready for next workflow stage',
    message: 'Core transaction context is complete. Continue with the next assigned workflow task.',
    items: [],
  }
}

export function matterReadinessStatusPresentation(status: DemoMatterReadinessStatus): {
  label: string
  bg: string
  color: string
  border: string
} {
  switch (status) {
    case 'ready_for_next_workflow_stage':
      return {
        label: 'Ready for next workflow stage',
        bg: '#e8f5f0',
        color: '#2f855a',
        border: 'rgba(47,133,90,0.35)',
      }
    case 'information_incomplete':
      return {
        label: 'Information incomplete',
        bg: '#fff8e6',
        color: '#8a6d1d',
        border: 'rgba(240,180,41,0.45)',
      }
    case 'attorney_review_recommended':
      return {
        label: 'Attorney review recommended',
        bg: '#fdecea',
        color: '#842029',
        border: 'rgba(132,32,41,0.25)',
      }
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

export type DemoTransactionContextDisplayRow = {
  key: string
  label: string
  value: string
}

/** Rows with values only — for Overview display. */
export function getTransactionContextDisplayRows(
  context: DemoTransactionContext | null | undefined,
): DemoTransactionContextDisplayRow[] {
  const n = normalizeTransactionContext(context)
  if (!n) return []
  const rows: DemoTransactionContextDisplayRow[] = []
  if (n.matterKind) {
    rows.push({
      key: 'matterKind',
      label: 'Matter kind',
      value: transactionContextMatterKindLabel(n.matterKind),
    })
  }
  if (n.clientRole) {
    rows.push({
      key: 'clientRole',
      label: 'Client role',
      value: transactionContextClientRoleLabel(n.clientRole),
    })
  }
  if (n.propertyKind) {
    rows.push({
      key: 'propertyKind',
      label: 'Property kind',
      value: transactionContextPropertyKindLabel(n.propertyKind),
    })
  }
  if (n.transactionStage) {
    rows.push({
      key: 'transactionStage',
      label: 'Transaction stage',
      value: transactionContextStageLabel(n.transactionStage),
    })
  }
  if (n.primaryConcern) {
    rows.push({
      key: 'primaryConcern',
      label: 'Primary concern',
      value: transactionContextPrimaryConcernLabel(n.primaryConcern),
    })
  }
  if (n.notes.trim()) {
    rows.push({ key: 'notes', label: 'Context notes', value: n.notes.trim() })
  }
  return rows
}

export function shouldShowTransactionContextOverview(
  context: DemoTransactionContext | null | undefined,
): boolean {
  return getTransactionContextDisplayRows(context).length > 0
}
