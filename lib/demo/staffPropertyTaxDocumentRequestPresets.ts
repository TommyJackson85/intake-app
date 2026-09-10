/**
 * Staff-controlled Property-Tax & Tax-Deed document-request presets (demo).
 *
 * Suggests optional requests from intake facts. Staff must review, edit, and
 * explicitly create selected requests. Does not auto-send, calculate deadlines,
 * assert legal requirements, or file with any agency.
 */
import type {
  DemoDocument,
  DemoDocumentRequest,
  DemoMatter,
  DemoPropertyTaxIssue,
  DemoPropertyTaxIssueKind,
} from '@/lib/demo/types'
import {
  getPropertyTaxIssueKindLabel,
  normalizePropertyTaxIssue,
  shouldShowPropertyTaxMatterOverviewPanel,
} from '@/lib/demo/propertyTaxIssue'
import { isActiveClientDocumentRequest } from '@/lib/demo/staffCancelClientDocumentRequest'
import type { AddDemoDocumentRequestInput } from '@/lib/demo/demoDocumentRequest'

export const PROPERTY_TAX_DOC_PRESET_SOURCE_TAG = 'property_tax_issue'

export const PROPERTY_TAX_SUGGESTED_DOCS_SAFE_COPY =
  'Suggested based on reported intake information. Staff should review, edit, and decide whether to request each item. This list is not a legal document requirement or a determination of the client’s rights.'

export type DemoPropertyTaxDocAvailability =
  | 'reported_available'
  | 'unknown'
  | 'not_reported_available'

export type DemoPropertyTaxDocumentRequestPreset = {
  /** Stable preset/document identifier (used for de-dupe and request tagging). */
  id: string
  title: string
  description: string
  category: DemoDocument['category']
  associatedKinds: DemoPropertyTaxIssueKind[]
  /** Optional staff-facing reason / availability note. */
  reason: string | null
  availability: DemoPropertyTaxDocAvailability
  /** Default checkbox state before staff review. */
  defaultSelected: boolean
  /** Suggested / optional — never mandatory. */
  suggestedStatus: 'suggested'
}

export type DemoPropertyTaxDocumentRequestPresetRow = DemoPropertyTaxDocumentRequestPreset & {
  alreadyRequested: boolean
  matchingOpenRequestId: string | null
}

type PresetDef = {
  id: string
  title: string
  description: string
  category: DemoDocument['category']
  kind: DemoPropertyTaxIssueKind
}

const ASSESSMENT_PRESETS: readonly PresetDef[] = [
  {
    id: 'ptx-trim-notice',
    title: 'Latest tax bill or TRIM notice',
    description: 'Request if available — suggested for firm review of assessment / VAB facts.',
    category: 'Compliance',
    kind: 'assessment_vab',
  },
  {
    id: 'ptx-property-appraiser-correspondence',
    title: 'Property Appraiser correspondence',
    description: 'Request if available — suggested for firm review.',
    category: 'Compliance',
    kind: 'assessment_vab',
  },
  {
    id: 'ptx-vab-petition',
    title: 'VAB petition and/or hearing notice',
    description: 'Request if filed/received — suggested for firm review (not a filing instruction).',
    category: 'Compliance',
    kind: 'assessment_vab',
  },
  {
    id: 'ptx-appraisal-comparables',
    title: 'Appraisal, comparable-sales, or valuation support',
    description: 'Request if available — appraisals, comps, photos, or repair estimates for firm review.',
    category: 'Compliance',
    kind: 'assessment_vab',
  },
  {
    id: 'ptx-assessment-exemption-docs',
    title: 'Exemption, classification, or portability-related records',
    description: 'Request if available — suggested for firm review.',
    category: 'Compliance',
    kind: 'assessment_vab',
  },
  {
    id: 'ptx-assessment-other',
    title: 'Other assessment-related notice',
    description: 'Request if available — any other client-provided assessment-related notice.',
    category: 'Compliance',
    kind: 'assessment_vab',
  },
]

const OWNERSHIP_PRESETS: readonly PresetDef[] = [
  {
    id: 'ptx-trim-notice',
    title: 'Latest tax bill or TRIM notice',
    description: 'Request if available — suggested for firm review of buyer tax-estimate risk.',
    category: 'Compliance',
    kind: 'ownership_change_tax_risk',
  },
  {
    id: 'ptx-purchase-closing-info',
    title: 'Purchase contract, closing statement, or proposed closing information',
    description: 'Request if available — suggested for firm review.',
    category: 'Closing',
    kind: 'ownership_change_tax_risk',
  },
  {
    id: 'ptx-seller-homestead-info',
    title: 'Available seller homestead / exemption information',
    description: 'Request if available — suggested for firm review (not a determination of homestead status).',
    category: 'Compliance',
    kind: 'ownership_change_tax_risk',
  },
  {
    id: 'ptx-parcel-appraiser-info',
    title: 'Property Appraiser record or parcel / folio information',
    description: 'Request if available — suggested for firm review.',
    category: 'Compliance',
    kind: 'ownership_change_tax_risk',
  },
  {
    id: 'ptx-estimated-tax-correspondence',
    title: 'Client correspondence concerning estimated post-closing property taxes',
    description: 'Request if available — suggested for firm review (not a tax calculation).',
    category: 'Compliance',
    kind: 'ownership_change_tax_risk',
  },
]

const DELINQUENT_PRESETS: readonly PresetDef[] = [
  {
    id: 'ptx-tax-collector-delinquent',
    title: 'Tax Collector delinquent-tax notice or tax certificate notice',
    description: 'Request if available — suggested for firm review.',
    category: 'Compliance',
    kind: 'delinquent_tax_deed_surplus',
  },
  {
    id: 'ptx-tax-certificate-docs',
    title: 'Tax certificate details / records',
    description: 'Request if available — suggested for firm review.',
    category: 'Compliance',
    kind: 'delinquent_tax_deed_surplus',
  },
  {
    id: 'ptx-tax-deed-application-sale',
    title: 'Tax-deed application, sale notice, or auction record',
    description: 'Request if available — suggested for firm review.',
    category: 'Compliance',
    kind: 'delinquent_tax_deed_surplus',
  },
  {
    id: 'ptx-surplus-notice',
    title: 'Clerk surplus-proceeds notice',
    description: 'Request if available — suggested for firm review (not an entitlement determination).',
    category: 'Compliance',
    kind: 'delinquent_tax_deed_surplus',
  },
  {
    id: 'ptx-deed-title-lien',
    title: 'Recorded deed, title report, or lien documents',
    description: 'Request if available — suggested for firm review.',
    category: 'Title',
    kind: 'delinquent_tax_deed_surplus',
  },
  {
    id: 'ptx-probate-authority',
    title: 'Probate, trust, authority, personal-representative, or heirship documents',
    description: 'Request if relevant and available — suggested for firm review.',
    category: 'Compliance',
    kind: 'delinquent_tax_deed_surplus',
  },
  {
    id: 'ptx-party-correspondence',
    title: 'Correspondence with Tax Collector, Clerk, lienholders, or other parties',
    description: 'Request if available — suggested for firm review.',
    category: 'Compliance',
    kind: 'delinquent_tax_deed_surplus',
  },
  {
    id: 'ptx-delinquent-other',
    title: 'Other relevant notice or document',
    description: 'Request if available — any other relevant notice or document.',
    category: 'Compliance',
    kind: 'delinquent_tax_deed_surplus',
  },
]

function presetsForKind(kind: DemoPropertyTaxIssueKind): readonly PresetDef[] {
  switch (kind) {
    case 'assessment_vab':
      return ASSESSMENT_PRESETS
    case 'ownership_change_tax_risk':
      return OWNERSHIP_PRESETS
    case 'delinquent_tax_deed_surplus':
      return DELINQUENT_PRESETS
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

function collectReportedAvailableIds(issue: DemoPropertyTaxIssue): Set<string> {
  const ids = new Set<string>()
  for (const kind of issue.kinds) {
    const branch = issue.byKind[kind]
    if (!branch || !Array.isArray(branch.availableDocumentIds)) continue
    for (const id of branch.availableDocumentIds) {
      if (typeof id === 'string' && id.trim()) ids.add(id)
    }
  }
  // Ownership track may report tax-bill availability without checklist ids.
  const ownership = issue.byKind.ownership_change_tax_risk
  if (ownership?.taxBillOrTrimAvailable === true) {
    ids.add('ptx-trim-notice')
  }
  return ids
}

function availabilityForPreset(
  presetId: string,
  reportedAvailable: Set<string>,
): { availability: DemoPropertyTaxDocAvailability; defaultSelected: boolean; reason: string | null } {
  if (reportedAvailable.has(presetId)) {
    return {
      availability: 'reported_available',
      defaultSelected: false,
      reason: 'Reported available — confirm receipt',
    }
  }
  // Not marked available: treat as unknown / not confirmed available.
  // May be preselected as a suggestion; staff can deselect. Not a legal “missing” claim.
  return {
    availability: 'unknown',
    defaultSelected: true,
    reason: 'Client reported this document is unavailable or unknown',
  }
}

/**
 * Derive de-duplicated suggested document presets for active property-tax kinds.
 * Pure — does not create requests.
 */
export function buildPropertyTaxDocumentRequestPresets(
  issue: DemoPropertyTaxIssue | null | undefined,
): DemoPropertyTaxDocumentRequestPreset[] {
  const n = normalizePropertyTaxIssue(issue)
  if (!n.enabled || n.kinds.length === 0) return []

  const reportedAvailable = collectReportedAvailableIds(n)
  const byId = new Map<string, DemoPropertyTaxDocumentRequestPreset>()

  for (const kind of n.kinds) {
    for (const def of presetsForKind(kind)) {
      const existing = byId.get(def.id)
      if (existing) {
        if (!existing.associatedKinds.includes(kind)) {
          existing.associatedKinds = [...existing.associatedKinds, kind]
        }
        continue
      }
      const avail = availabilityForPreset(def.id, reportedAvailable)
      byId.set(def.id, {
        id: def.id,
        title: def.title,
        description: def.description,
        category: def.category,
        associatedKinds: [kind],
        reason: avail.reason,
        availability: avail.availability,
        defaultSelected: avail.defaultSelected,
        suggestedStatus: 'suggested',
      })
    }
  }

  // Stable order: assessment → ownership → delinquent, then definition order within kinds
  const order: DemoPropertyTaxIssueKind[] = [
    'assessment_vab',
    'ownership_change_tax_risk',
    'delinquent_tax_deed_surplus',
  ]
  const ordered: DemoPropertyTaxDocumentRequestPreset[] = []
  const seen = new Set<string>()
  for (const kind of order) {
    if (!n.kinds.includes(kind)) continue
    for (const def of presetsForKind(kind)) {
      if (seen.has(def.id)) continue
      const row = byId.get(def.id)
      if (!row) continue
      seen.add(def.id)
      ordered.push(row)
    }
  }
  return ordered
}

/** Whether the Suggested Documents UI should appear on a matter. */
export function shouldShowPropertyTaxSuggestedDocuments(input: {
  propertyAddress: string
  propertyTaxIssue?: DemoPropertyTaxIssue | null
}): boolean {
  if (
    !shouldShowPropertyTaxMatterOverviewPanel({
      propertyAddress: input.propertyAddress,
      propertyTaxIssue: input.propertyTaxIssue,
    })
  ) {
    return false
  }
  const n = normalizePropertyTaxIssue(input.propertyTaxIssue)
  return n.kinds.length > 0
}

export function propertyTaxDocumentRequestMatchesPreset(
  request: Pick<DemoDocumentRequest, 'title' | 'description' | 'category'>,
  presetId: string,
): boolean {
  const haystack = [request.title, request.description ?? '', request.category]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  const idNeedle = presetId.toLowerCase()
  const spaced = presetId.replace(/_/g, ' ').toLowerCase()
  const sourceNeedle = PROPERTY_TAX_DOC_PRESET_SOURCE_TAG.toLowerCase()
  return (
    haystack.includes(idNeedle) ||
    haystack.includes(spaced) ||
    (haystack.includes(sourceNeedle) && haystack.includes(idNeedle))
  )
}

export function findOpenPropertyTaxPresetRequest(
  requests: readonly DemoDocumentRequest[],
  matterId: string,
  presetId: string,
): DemoDocumentRequest | null {
  for (const request of requests) {
    if (request.matter_id !== matterId) continue
    if (request.status !== 'open') continue
    if (!isActiveClientDocumentRequest(request)) continue
    if (propertyTaxDocumentRequestMatchesPreset(request, presetId)) return request
  }
  return null
}

export function annotatePropertyTaxDocumentRequestPresets(input: {
  issue: DemoPropertyTaxIssue | null | undefined
  matterId: string
  documentRequests: readonly DemoDocumentRequest[]
}): DemoPropertyTaxDocumentRequestPresetRow[] {
  const presets = buildPropertyTaxDocumentRequestPresets(input.issue)
  return presets.map((preset) => {
    const match = findOpenPropertyTaxPresetRequest(
      input.documentRequests,
      input.matterId,
      preset.id,
    )
    return {
      ...preset,
      alreadyRequested: Boolean(match),
      matchingOpenRequestId: match?.id ?? null,
      // Already-requested items cannot be selected for create
      defaultSelected: match ? false : preset.defaultSelected,
    }
  })
}

export function buildPropertyTaxDocumentRequestPayload(input: {
  matterId: string
  staffId: string
  preset: Pick<
    DemoPropertyTaxDocumentRequestPreset,
    'id' | 'title' | 'description' | 'category' | 'associatedKinds'
  >
  titleOverride?: string
  descriptionOverride?: string | null
  requestedAt?: string
}): AddDemoDocumentRequestInput {
  const title = (input.titleOverride ?? input.preset.title).trim() || input.preset.title
  const kindLabels = input.preset.associatedKinds.map(getPropertyTaxIssueKindLabel).join('; ')
  const baseDescription = (input.descriptionOverride ?? input.preset.description)?.trim() || input.preset.description
  const description = [
    baseDescription,
    `Requested from Property-Tax checklist (${input.preset.id}).`,
    `source=${PROPERTY_TAX_DOC_PRESET_SOURCE_TAG}`,
    kindLabels ? `Issue kinds: ${kindLabels}.` : null,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    matter_id: input.matterId,
    title,
    description,
    category: input.preset.category,
    requested_by_staff_id: input.staffId,
    requested_at: input.requestedAt ?? new Date().toISOString(),
    status: 'open',
  }
}

/**
 * Create selected presets that are not already open.
 * Returns payloads that were accepted for creation (caller persists via store).
 */
export function selectPropertyTaxDocumentRequestsToCreate(input: {
  matter: DemoMatter
  staffId: string
  documentRequests: readonly DemoDocumentRequest[]
  selectedPresetIds: readonly string[]
  titleOverrides?: Record<string, string>
  descriptionOverrides?: Record<string, string>
}): AddDemoDocumentRequestInput[] {
  if (!input.staffId.trim() || input.matter.deletedAt) return []
  if (
    !shouldShowPropertyTaxSuggestedDocuments({
      propertyAddress: input.matter.property.address,
      propertyTaxIssue: input.matter.propertyTaxIssue,
    })
  ) {
    return []
  }

  const rows = annotatePropertyTaxDocumentRequestPresets({
    issue: input.matter.propertyTaxIssue,
    matterId: input.matter.id,
    documentRequests: input.documentRequests,
  })
  const selected = new Set(input.selectedPresetIds)
  const payloads: AddDemoDocumentRequestInput[] = []

  for (const row of rows) {
    if (!selected.has(row.id)) continue
    if (row.alreadyRequested) continue
    payloads.push(
      buildPropertyTaxDocumentRequestPayload({
        matterId: input.matter.id,
        staffId: input.staffId,
        preset: row,
        titleOverride: input.titleOverrides?.[row.id],
        descriptionOverride: input.descriptionOverrides?.[row.id],
      }),
    )
  }
  return payloads
}

export function getPropertyTaxPresetKindLabels(kinds: readonly DemoPropertyTaxIssueKind[]): string {
  return kinds.map(getPropertyTaxIssueKindLabel).join(' · ')
}
