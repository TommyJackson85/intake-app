import type { DemoDocument } from '@/lib/demo/types'

type BuildPreviewTitleInput = {
  name: string
  subtype?: string | null
  categoryTitle: string
}

export type PreviewTitleResult = {
  title: string
  secondaryLine: string | null
}

const GENERIC_FILE_NAMES = new Set([
  'document',
  'file',
  'upload',
  'untitled',
  'new document',
  'scan',
  'attachment',
])

const GENERIC_NAME_HINTS = ['document', 'draft', 'file', 'upload']
const LEGAL_HINTS = [
  'contract',
  'addendum',
  'title',
  'survey',
  'estoppel',
  'closing',
  'statement',
  'affidavit',
  'engagement',
  'disclosure',
  'deed',
  'hoa',
  'compliance',
]

function stripFileExtension(value: string): string {
  return value.replace(/\.[a-z0-9]{1,6}$/i, '').trim()
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function isWeakName(rawName: string): boolean {
  const name = stripFileExtension(rawName)
  const normalized = normalize(name)
  if (!normalized) return true
  if (GENERIC_FILE_NAMES.has(normalized)) return true
  if (normalized.length <= 3) return true

  // Heuristic: long single token with no recognizable legal keyword often reads like random filler.
  const parts = normalized.split(' ').filter(Boolean)
  if (
    parts.length === 1 &&
    parts[0].length >= 8 &&
    !LEGAL_HINTS.some((hint) => normalized.includes(hint))
  ) {
    return true
  }
  return false
}

function isGenericButUsable(name: string): boolean {
  const normalized = normalize(stripFileExtension(name))
  if (!normalized) return false
  return GENERIC_NAME_HINTS.some((hint) => normalized.includes(hint))
}

function hasOverlap(a: string, b: string): boolean {
  if (!a || !b) return false
  return a.includes(b) || b.includes(a)
}

export function buildPreviewTitle(input: BuildPreviewTitleInput): PreviewTitleResult {
  const rawName = input.name.trim()
  const rawSubtype = input.subtype?.trim() ?? ''
  const name = stripFileExtension(rawName)
  const subtype = rawSubtype
  const normalizedName = normalize(name)
  const normalizedSubtype = normalize(subtype)

  if (!normalizedSubtype) {
    if (isWeakName(name)) return { title: input.categoryTitle, secondaryLine: null }
    return { title: name, secondaryLine: null }
  }

  if (isWeakName(name)) return { title: subtype, secondaryLine: null }

  if (hasOverlap(normalizedName, normalizedSubtype)) {
    return { title: name, secondaryLine: null }
  }

  if (isGenericButUsable(name)) {
    return { title: subtype, secondaryLine: name }
  }

  return { title: name, secondaryLine: subtype }
}

export function buildPreviewSourceLabel(input: {
  source?: string | null
  status: DemoDocument['status']
  hasMatterLink: boolean
  fulfilledRequestTitle?: string | null
}): string {
  const explicitSource = input.source?.trim()
  if (input.fulfilledRequestTitle) return 'Client-submitted fulfillment'
  if (explicitSource && explicitSource.toLowerCase() !== 'internal upload') return explicitSource
  if (input.hasMatterLink) {
    return input.status === 'draft' ? 'Firm-generated draft' : 'Created from matter'
  }
  return explicitSource || 'Internal upload'
}
