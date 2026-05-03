/**
 * Demo-only intake conflict check: fuzzy name, alias, related-party, email/phone, property, and coarse role hints.
 * Staff UI: `app/demo/intakes/page.tsx`. No live API.
 */

import { effectiveIntakeSnapshot } from '@/lib/demo/demoIntakeFlow'
import type { DemoClient, DemoIntakeLead, DemoIntakeSnapshot, DemoMatter, DemoParty } from '@/lib/demo/types'

export type ConflictMatchReason =
  | 'primary_name'
  | 'related_party'
  | 'alias_match'
  | 'email_match'
  | 'phone_match'
  | 'property_match'
  | 'matter_role_context'

export const DEMO_CONFLICT_REASON_LABEL: Record<ConflictMatchReason, string> = {
  primary_name: 'Primary name',
  related_party: 'Related party',
  alias_match: 'Alias',
  email_match: 'Email',
  phone_match: 'Phone',
  property_match: 'Property',
  matter_role_context: 'Transaction side',
}

const REASON_ORDER: ConflictMatchReason[] = [
  'primary_name',
  'related_party',
  'alias_match',
  'email_match',
  'phone_match',
  'property_match',
  'matter_role_context',
]

export function sortConflictMatchReasons(reasons: ConflictMatchReason[]): ConflictMatchReason[] {
  return [...new Set(reasons)].sort((a, b) => REASON_ORDER.indexOf(a) - REASON_ORDER.indexOf(b))
}

function normalise(s: string): string {
  return s.toLowerCase().trim()
}

function normaliseEmail(s: string): string {
  return s.toLowerCase().trim()
}

function phoneDigits(s: string): string {
  return s.replace(/\D/g, '')
}

function emailsMatch(a: string, b: string): boolean {
  const ea = normaliseEmail(a)
  const eb = normaliseEmail(b)
  return ea.length > 3 && eb.length > 3 && ea === eb
}

function phonesMatch(a: string, b: string): boolean {
  const da = phoneDigits(a)
  const db = phoneDigits(b)
  return da.length >= 7 && db.length >= 7 && da === db
}

function nameHits(a: string, b: string): boolean {
  const na = normalise(a)
  const nb = normalise(b)
  if (na.length < 2 || nb.length < 2) return false
  return na.includes(nb) || nb.includes(na)
}

function matterEmailsNormalized(m: DemoMatter): string[] {
  const raw = [
    m.buyer.email,
    m.seller.email,
    m.buyerEmail,
    m.sellerEmail,
  ].filter(Boolean)
  const set = new Set<string>()
  for (const r of raw) {
    const n = normaliseEmail(r)
    if (n.length > 3) set.add(n)
  }
  return [...set]
}

function matterPhonesNormalized(m: DemoMatter): string[] {
  const raw = [m.buyer.phone, m.seller.phone, m.buyerPhone, m.sellerPhone].filter(Boolean)
  const set = new Set<string>()
  for (const r of raw) {
    const d = phoneDigits(r)
    if (d.length >= 7) set.add(d)
  }
  return [...set]
}

function intakeEmailNormalized(intake: DemoIntakeSnapshot): string | null {
  const n = normaliseEmail(intake.clientEmail ?? '')
  return n.length > 3 ? n : null
}

function intakePhoneDigits(intake: DemoIntakeSnapshot): string | null {
  const d = phoneDigits(intake.clientPhone ?? '')
  return d.length >= 7 ? d : null
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
  const b = [...new Set([...bTokens, ...(bAddr.length >= 5 ? [bAddr] : [])])].filter((s) => s.length >= 5)
  if (a.length === 0 || b.length === 0) return false
  return a.some((ta) => b.some((tb) => ta.includes(tb) || tb.includes(ta)))
}

export function canRunDemoConflictCheck(intake: DemoIntakeSnapshot): boolean {
  if ((intake.clientName?.trim() ?? '').length > 0) return true
  if ((intake.clientAliases ?? []).some((a) => (a?.trim() ?? '').length >= 2)) return true
  if ((intake.relatedParties ?? []).some((p) => (p.name?.trim() ?? '').length >= 2)) return true
  if ((intake.relatedParties ?? []).some((p) => (p.aliases ?? []).some((a) => (a?.trim() ?? '').length >= 2)))
    return true
  if (intakeEmailNormalized(intake)) return true
  if (intakePhoneDigits(intake)) return true
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

type AliasToken = { text: string; label: 'primary' | 'related' }

/** Primary client + related-party alias strings (each ≥2 chars after trim). */
function intakeAliasTokens(intake: DemoIntakeSnapshot): AliasToken[] {
  const out: AliasToken[] = []
  for (const a of intake.clientAliases ?? []) {
    const t = a?.trim() ?? ''
    if (t.length >= 2) out.push({ text: t, label: 'primary' })
  }
  for (const rp of intake.relatedParties ?? []) {
    for (const a of rp.aliases ?? []) {
      const t = a?.trim() ?? ''
      if (t.length >= 2) out.push({ text: t, label: 'related' })
    }
  }
  return out
}

function roleMatchesParty(intake: DemoIntakeSnapshot, side: 'buyer' | 'seller'): boolean {
  const r = intake.transactionRole ?? 'buyer'
  if (r === 'both') return true
  if (side === 'buyer') return r === 'buyer'
  return r === 'seller'
}

function addMatterRoleIfNeeded(
  s: Set<ConflictMatchReason>,
  intake: DemoIntakeSnapshot,
  side: 'buyer' | 'seller',
  label: 'primary' | 'related',
) {
  if (label === 'primary' && roleMatchesParty(intake, side)) s.add('matter_role_context')
  if (label === 'related' && roleMatchesParty(intake, side)) s.add('matter_role_context')
}

function matchPartyNamesToMatter(
  matterMap: Map<string, Set<ConflictMatchReason>>,
  m: DemoMatter,
  intake: DemoIntakeSnapshot,
  party: DemoParty,
  side: 'buyer' | 'seller',
) {
  const nameTokens = intakeNameTokens(intake)
  for (const { label, name } of nameTokens) {
    if (nameHits(name, party.name)) {
      if (!matterMap.has(m.id)) matterMap.set(m.id, new Set())
      const s = matterMap.get(m.id)!
      s.add(label === 'primary' ? 'primary_name' : 'related_party')
      addMatterRoleIfNeeded(s, intake, side, label)
    }
    for (const pa of party.aliases ?? []) {
      if (nameHits(name, pa)) {
        if (!matterMap.has(m.id)) matterMap.set(m.id, new Set())
        const s = matterMap.get(m.id)!
        s.add('alias_match')
        addMatterRoleIfNeeded(s, intake, side, label)
      }
    }
  }
  for (const { text: ia, label: aliasLabel } of intakeAliasTokens(intake)) {
    if (nameHits(ia, party.name)) {
      if (!matterMap.has(m.id)) matterMap.set(m.id, new Set())
      const s = matterMap.get(m.id)!
      s.add('alias_match')
      addMatterRoleIfNeeded(s, intake, side, aliasLabel)
    }
    for (const pa of party.aliases ?? []) {
      if (nameHits(ia, pa)) {
        if (!matterMap.has(m.id)) matterMap.set(m.id, new Set())
        const s = matterMap.get(m.id)!
        s.add('alias_match')
        addMatterRoleIfNeeded(s, intake, side, aliasLabel)
      }
    }
  }
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
  const aliasToks = intakeAliasTokens(intake)
  const iEmail = intakeEmailNormalized(intake)
  const iPhone = intakePhoneDigits(intake)

  const clientMap = new Map<string, Set<ConflictMatchReason>>()
  for (const c of clients) {
    if (c.deletedAt) continue
    for (const { label, name } of nameTokens) {
      if (nameHits(name, c.full_name)) {
        if (!clientMap.has(c.id)) clientMap.set(c.id, new Set())
        clientMap.get(c.id)!.add(label === 'primary' ? 'primary_name' : 'related_party')
      }
      for (const ca of c.aliases ?? []) {
        if (nameHits(name, ca)) {
          if (!clientMap.has(c.id)) clientMap.set(c.id, new Set())
          clientMap.get(c.id)!.add('alias_match')
        }
      }
    }
    for (const { text: ia } of aliasToks) {
      if (nameHits(ia, c.full_name)) {
        if (!clientMap.has(c.id)) clientMap.set(c.id, new Set())
        clientMap.get(c.id)!.add('alias_match')
      }
      for (const ca of c.aliases ?? []) {
        if (nameHits(ia, ca)) {
          if (!clientMap.has(c.id)) clientMap.set(c.id, new Set())
          clientMap.get(c.id)!.add('alias_match')
        }
      }
    }
    if (iEmail && normaliseEmail(c.email) === iEmail) {
      if (!clientMap.has(c.id)) clientMap.set(c.id, new Set())
      clientMap.get(c.id)!.add('email_match')
    }
    if (iPhone && phoneDigits(c.phone) === iPhone) {
      if (!clientMap.has(c.id)) clientMap.set(c.id, new Set())
      clientMap.get(c.id)!.add('phone_match')
    }
  }

  const matterMap = new Map<string, Set<ConflictMatchReason>>()
  for (const m of matters) {
    if (m.deletedAt) continue
    matchPartyNamesToMatter(matterMap, m, intake, m.buyer, 'buyer')
    matchPartyNamesToMatter(matterMap, m, intake, m.seller, 'seller')

    if (iEmail) {
      for (const me of matterEmailsNormalized(m)) {
        if (me === iEmail) {
          if (!matterMap.has(m.id)) matterMap.set(m.id, new Set())
          const s = matterMap.get(m.id)!
          s.add('email_match')
          if (emailsMatch(intake.clientEmail, m.buyer.email) || emailsMatch(intake.clientEmail, m.buyerEmail)) {
            if (roleMatchesParty(intake, 'buyer')) s.add('matter_role_context')
          }
          if (emailsMatch(intake.clientEmail, m.seller.email) || emailsMatch(intake.clientEmail, m.sellerEmail)) {
            if (roleMatchesParty(intake, 'seller')) s.add('matter_role_context')
          }
        }
      }
    }
    if (iPhone) {
      for (const mp of matterPhonesNormalized(m)) {
        if (mp === iPhone) {
          if (!matterMap.has(m.id)) matterMap.set(m.id, new Set())
          const s = matterMap.get(m.id)!
          s.add('phone_match')
          if (phonesMatch(intake.clientPhone, m.buyer.phone) || phonesMatch(intake.clientPhone, m.buyerPhone)) {
            if (roleMatchesParty(intake, 'buyer')) s.add('matter_role_context')
          }
          if (phonesMatch(intake.clientPhone, m.seller.phone) || phonesMatch(intake.clientPhone, m.sellerPhone)) {
            if (roleMatchesParty(intake, 'seller')) s.add('matter_role_context')
          }
        }
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
    const oAliasToks = intakeAliasTokens(oSnap)
    const oEmail = intakeEmailNormalized(oSnap)
    const oPhone = intakePhoneDigits(oSnap)

    for (const { label, name } of nameTokens) {
      for (const { name: on } of oNames) {
        if (nameHits(name, on)) {
          if (!intakeMap.has(other.id)) intakeMap.set(other.id, new Set())
          intakeMap.get(other.id)!.add(label === 'primary' ? 'primary_name' : 'related_party')
        }
      }
      for (const { text: oa } of oAliasToks) {
        if (nameHits(name, oa)) {
          if (!intakeMap.has(other.id)) intakeMap.set(other.id, new Set())
          intakeMap.get(other.id)!.add('alias_match')
        }
      }
    }
    for (const { text: ia } of aliasToks) {
      for (const { name: on } of oNames) {
        if (nameHits(ia, on)) {
          if (!intakeMap.has(other.id)) intakeMap.set(other.id, new Set())
          intakeMap.get(other.id)!.add('alias_match')
        }
      }
      for (const { text: oa } of oAliasToks) {
        if (nameHits(ia, oa)) {
          if (!intakeMap.has(other.id)) intakeMap.set(other.id, new Set())
          intakeMap.get(other.id)!.add('alias_match')
        }
      }
    }
    if (iEmail && oEmail && iEmail === oEmail) {
      if (!intakeMap.has(other.id)) intakeMap.set(other.id, new Set())
      intakeMap.get(other.id)!.add('email_match')
    }
    if (iPhone && oPhone && iPhone === oPhone) {
      if (!intakeMap.has(other.id)) intakeMap.set(other.id, new Set())
      intakeMap.get(other.id)!.add('phone_match')
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
