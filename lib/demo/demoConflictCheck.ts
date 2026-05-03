/**
 * Demo-only intake conflict check: fuzzy name, related-party, property, and coarse role hints.
 * Staff UI: `app/demo/intakes/page.tsx`. No live API.
 */

import { effectiveIntakeSnapshot } from '@/lib/demo/demoIntakeFlow'
import type { DemoClient, DemoIntakeLead, DemoIntakeSnapshot, DemoMatter } from '@/lib/demo/types'

export type ConflictMatchReason = 'primary_name' | 'related_party' | 'property_match' | 'matter_role_context'

export const DEMO_CONFLICT_REASON_LABEL: Record<ConflictMatchReason, string> = {
  primary_name: 'Primary name',
  related_party: 'Related party',
  property_match: 'Property',
  matter_role_context: 'Role match',
}

const REASON_ORDER: ConflictMatchReason[] = [
  'primary_name',
  'related_party',
  'property_match',
  'matter_role_context',
]

export function sortConflictMatchReasons(reasons: ConflictMatchReason[]): ConflictMatchReason[] {
  return [...new Set(reasons)].sort((a, b) => REASON_ORDER.indexOf(a) - REASON_ORDER.indexOf(b))
}

function normalise(s: string): string {
  return s.toLowerCase().trim()
}

function nameHits(a: string, b: string): boolean {
  const na = normalise(a)
  const nb = normalise(b)
  if (na.length < 2 || nb.length < 2) return false
  return na.includes(nb) || nb.includes(na)
}

function propertyMatchTokens(intake: DemoIntakeSnapshot): string[] {
  const tokens: string[] = []
  const addr = intake.propertyAddress?.trim() ?? ''
  if (addr.length >= 8) tokens.push(normalise(addr))
  const dev = intake.developmentOrBuildingName?.trim() ?? ''
  if (dev.length >= 3) tokens.push(normalise(dev))
  return tokens
}

function matterHasPropertyHit(intake: DemoIntakeSnapshot, matter: DemoMatter): boolean {
  const tokens = propertyMatchTokens(intake)
  if (tokens.length === 0) return false
  const maddr = normalise(matter.property.address)
  return tokens.some((t) => {
    if (t.length < 5) return false
    return maddr.includes(t) || t.includes(maddr)
  })
}

function otherIntakePropertyHits(intake: DemoIntakeSnapshot, other: DemoIntakeSnapshot): boolean {
  const a = propertyMatchTokens(intake)
  const bTokens = propertyMatchTokens(other)
  const bAddr = normalise(other.propertyAddress?.trim() ?? '')
  const b = [...bTokens, ...(bAddr.length >= 5 ? [bAddr] : [])].filter((s) => s.length >= 5)
  if (a.length === 0 || b.length === 0) return false
  return a.some((ta) => b.some((tb) => ta.includes(tb) || tb.includes(ta)))
}

export function canRunDemoConflictCheck(intake: DemoIntakeSnapshot): boolean {
  if ((intake.clientName?.trim() ?? '').length > 0) return true
  if ((intake.relatedParties ?? []).some((p) => (p.name?.trim() ?? '').length >= 2)) return true
  if ((intake.propertyAddress?.trim() ?? '').length >= 8) return true
  if ((intake.developmentOrBuildingName?.trim() ?? '').length >= 3) return true
  return false
}

type NameToken = { label: 'primary' | 'related'; name: string }

function intakeNameTokens(intake: DemoIntakeSnapshot): NameToken[] {
  const out: NameToken[] = []
  const p = intake.clientName?.trim() ?? ''
  if (p.length >= 2) out.push({ label: 'primary', name: p })
  for (const rp of intake.relatedParties ?? []) {
    const n = rp.name?.trim() ?? ''
    if (n.length >= 2) out.push({ label: 'related', name: n })
  }
  return out
}

function roleMatchesParty(intake: DemoIntakeSnapshot, side: 'buyer' | 'seller'): boolean {
  const r = intake.transactionRole ?? 'buyer'
  if (r === 'both') return true
  if (side === 'buyer') return r === 'buyer'
  return r === 'seller'
}

export type TaggedDemoClientMatch = { client: DemoClient; reasons: ConflictMatchReason[] }
export type TaggedDemoMatterMatch = { matter: DemoMatter; reasons: ConflictMatchReason[] }
export type TaggedDemoIntakeMatch = { lead: DemoIntakeLead; reasons: ConflictMatchReason[] }

export type DemoConflictCheckResult = {
  hasConflict: boolean
  clientMatches: TaggedDemoClientMatch[]
  matterMatches: TaggedDemoMatterMatch[]
  intakeMatches: TaggedDemoIntakeMatch[]
}

export function runDemoConflictCheck(
  lead: DemoIntakeLead,
  clients: DemoClient[],
  matters: DemoMatter[],
  allIntakeLeads: DemoIntakeLead[],
): DemoConflictCheckResult {
  const intake = effectiveIntakeSnapshot(lead)
  const nameTokens = intakeNameTokens(intake)

  const clientMap = new Map<string, Set<ConflictMatchReason>>()
  for (const c of clients) {
    if (c.deletedAt) continue
    for (const { label, name } of nameTokens) {
      if (nameHits(name, c.full_name)) {
        if (!clientMap.has(c.id)) clientMap.set(c.id, new Set())
        clientMap.get(c.id)!.add(label === 'primary' ? 'primary_name' : 'related_party')
      }
    }
  }

  const matterMap = new Map<string, Set<ConflictMatchReason>>()
  for (const m of matters) {
    if (m.deletedAt) continue
    for (const { label, name } of nameTokens) {
      const hitBuyer = nameHits(name, m.buyer.name)
      const hitSeller = nameHits(name, m.seller.name)
      if (hitBuyer) {
        if (!matterMap.has(m.id)) matterMap.set(m.id, new Set())
        const s = matterMap.get(m.id)!
        s.add(label === 'primary' ? 'primary_name' : 'related_party')
        if (label === 'primary' && roleMatchesParty(intake, 'buyer')) s.add('matter_role_context')
        if (label === 'related' && roleMatchesParty(intake, 'buyer')) s.add('matter_role_context')
      }
      if (hitSeller) {
        if (!matterMap.has(m.id)) matterMap.set(m.id, new Set())
        const s = matterMap.get(m.id)!
        s.add(label === 'primary' ? 'primary_name' : 'related_party')
        if (label === 'primary' && roleMatchesParty(intake, 'seller')) s.add('matter_role_context')
        if (label === 'related' && roleMatchesParty(intake, 'seller')) s.add('matter_role_context')
      }
    }
    if (matterHasPropertyHit(intake, m)) {
      if (!matterMap.has(m.id)) matterMap.set(m.id, new Set())
      matterMap.get(m.id)!.add('property_match')
    }
  }

  const intakeMap = new Map<string, Set<ConflictMatchReason>>()
  for (const other of allIntakeLeads) {
    if (other.id === lead.id) continue
    const oSnap = effectiveIntakeSnapshot(other)
    const oNames = intakeNameTokens(oSnap)
    for (const { label, name } of nameTokens) {
      for (const { name: on } of oNames) {
        if (nameHits(name, on)) {
          if (!intakeMap.has(other.id)) intakeMap.set(other.id, new Set())
          intakeMap.get(other.id)!.add(label === 'primary' ? 'primary_name' : 'related_party')
        }
      }
    }
    if (otherIntakePropertyHits(intake, oSnap)) {
      if (!intakeMap.has(other.id)) intakeMap.set(other.id, new Set())
      intakeMap.get(other.id)!.add('property_match')
    }
  }

  const clientMatches: TaggedDemoClientMatch[] = Array.from(clientMap.entries()).map(([id, rs]) => ({
    client: clients.find((c) => c.id === id)!,
    reasons: sortConflictMatchReasons([...rs]),
  }))

  const matterMatches: TaggedDemoMatterMatch[] = Array.from(matterMap.entries()).map(([id, rs]) => ({
    matter: matters.find((x) => x.id === id)!,
    reasons: sortConflictMatchReasons([...rs]),
  }))

  const intakeMatches: TaggedDemoIntakeMatch[] = Array.from(intakeMap.entries()).map(([id, rs]) => ({
    lead: allIntakeLeads.find((l) => l.id === id)!,
    reasons: sortConflictMatchReasons([...rs]),
  }))

  const hasConflict =
    clientMatches.length > 0 || matterMatches.length > 0 || intakeMatches.length > 0

  return { hasConflict, clientMatches, matterMatches, intakeMatches }
}
