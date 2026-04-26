import type { DemoDocument } from '@/lib/demo/types'

export type EngagementLetterPreviewFields = {
  clientName?: string
  attorneyName?: string
  fileReference?: string
  propertyAddress?: string
  scopeSummary?: string
  feeSummary?: string
  exclusionsSummary?: string
  costsSummary?: string
}

export type EngagementLetterPreviewModel = {
  dateLabel: string
  clientName: string
  attorneyName: string
  fileReference: string
  matterType: string
  propertyAddress: string
  scopeSummary: string
  exclusionsSummary: string
  feeSummary: string
  costsSummary: string
}

type ResolveEngagementLetterPreviewInput = {
  dateLabel: string
  matterType: string
  defaults: {
    clientName: string
    attorneyName: string
    fileReference: string
    propertyAddress: string
  }
  fields: EngagementLetterPreviewFields
}

const DEFAULTS = {
  scopeSummary: 'Representation scope summary not provided.',
  exclusionsSummary: 'No exclusions summary provided.',
  feeSummary: 'Fee arrangement summary not provided.',
  costsSummary: 'Costs summary not provided.',
}

const PREFIX = 'Template variables - '

export function isEngagementLetterDocument(document: Pick<DemoDocument, 'name' | 'category' | 'document_subtype'>): boolean {
  const name = document.name.toLowerCase()
  const subtype = (document.document_subtype ?? '').toLowerCase()
  return document.category === 'Contract' && (subtype.includes('engagement') || name.includes('engagement letter'))
}

export function buildEngagementLetterDescription(fields: EngagementLetterPreviewFields): string {
  const parts = [
    fields.clientName?.trim() ? `Client: ${fields.clientName.trim()}` : '',
    fields.attorneyName?.trim() ? `Attorney: ${fields.attorneyName.trim()}` : '',
    fields.fileReference?.trim() ? `File: ${fields.fileReference.trim()}` : '',
    fields.propertyAddress?.trim() ? `Property: ${fields.propertyAddress.trim()}` : '',
    fields.scopeSummary?.trim() ? `Scope: ${fields.scopeSummary.trim()}` : '',
    fields.feeSummary?.trim() ? `Fee summary: ${fields.feeSummary.trim()}` : '',
    fields.exclusionsSummary?.trim() ? `Exclusions: ${fields.exclusionsSummary.trim()}` : '',
    fields.costsSummary?.trim() ? `Costs: ${fields.costsSummary.trim()}` : '',
  ].filter(Boolean)

  if (parts.length === 0) return 'Starter draft created when opening the matter.'
  return `${PREFIX}${parts.join(' | ')}.`
}

export function parseEngagementLetterDescription(description: string | null | undefined): EngagementLetterPreviewFields {
  const raw = description?.trim()
  if (!raw || !raw.startsWith(PREFIX)) return {}
  const body = raw.slice(PREFIX.length).replace(/\.$/, '')
  const values: EngagementLetterPreviewFields = {}
  for (const part of body.split(' | ')) {
    const idx = part.indexOf(':')
    if (idx < 0) continue
    const key = part.slice(0, idx).trim().toLowerCase()
    const value = part.slice(idx + 1).trim()
    if (!value) continue
    if (key === 'client') values.clientName = value
    else if (key === 'attorney') values.attorneyName = value
    else if (key === 'file') values.fileReference = value
    else if (key === 'property') values.propertyAddress = value
    else if (key === 'scope') values.scopeSummary = value
    else if (key === 'fee summary') values.feeSummary = value
    else if (key === 'exclusions') values.exclusionsSummary = value
    else if (key === 'costs') values.costsSummary = value
  }
  return values
}

export function resolveEngagementLetterPreview(input: ResolveEngagementLetterPreviewInput): EngagementLetterPreviewModel {
  const f = input.fields
  return {
    dateLabel: input.dateLabel,
    clientName: f.clientName?.trim() || input.defaults.clientName,
    attorneyName: f.attorneyName?.trim() || input.defaults.attorneyName,
    fileReference: f.fileReference?.trim() || input.defaults.fileReference,
    matterType: input.matterType,
    propertyAddress: f.propertyAddress?.trim() || input.defaults.propertyAddress,
    scopeSummary: f.scopeSummary?.trim() || DEFAULTS.scopeSummary,
    exclusionsSummary: f.exclusionsSummary?.trim() || DEFAULTS.exclusionsSummary,
    feeSummary: f.feeSummary?.trim() || DEFAULTS.feeSummary,
    costsSummary: f.costsSummary?.trim() || DEFAULTS.costsSummary,
  }
}
