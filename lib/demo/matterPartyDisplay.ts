import type { DemoMatter } from '@/lib/demo/types'

export type DemoOtherPartyInfo = {
  title: string
  name: string
}

export function parseOtherPartyInfo(specialNotes: string): DemoOtherPartyInfo {
  const title = specialNotes.match(/(?:^|\n)Other Title:\s*(.+?)(?:\.|$)/i)?.[1]?.trim() ?? ''
  const name = specialNotes.match(/(?:^|\n)Title's Name:\s*(.+?)(?:\.|$)/i)?.[1]?.trim() ?? ''
  return { title, name }
}

export function getMatterPartyDisplayRows(matter: DemoMatter): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = []
  const buyer = matter.buyer.name.trim()
  const seller = matter.seller.name.trim()
  const other = parseOtherPartyInfo(matter.specialNotes)

  if (buyer) rows.push({ label: 'Buyer', value: buyer })
  if (seller) rows.push({ label: 'Seller', value: seller })
  if (other.name || other.title) {
    const otherLabel = other.title ? `Other: ${other.title}` : 'Other'
    rows.push({ label: otherLabel, value: other.name || 'No name provided' })
  }

  return rows
}

export function displayOrFallback(value: string, fallback: string): string {
  return value.trim() || fallback
}
