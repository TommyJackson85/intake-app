import type {
  DemoClient,
  DemoIntakeLead,
  DemoIntakeSnapshot,
  DemoPartyType,
  DemoTransactionRole,
} from '@/lib/demo/types'

/** Labels for client + lawyer intake UIs */
export const DEMO_TRANSACTION_ROLE_OPTIONS: { value: DemoTransactionRole; label: string }[] = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'both', label: 'Both buyer and seller' },
  { value: 'other', label: 'Other' },
]

export const DEMO_BUYER_TYPE_OPTIONS: { value: DemoPartyType; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'entity', label: 'Legal entity / trust' },
]

/** Prefer submitted intake when present */
export function effectiveIntakeSnapshot(lead: DemoIntakeLead): DemoIntakeSnapshot {
  return lead.submittedIntake ?? lead.intake
}

/** Values for the demo  modal (all editable by the lawyer) */
export type DemoNewMatterInitialValues = {
  matterType: string
  propertyAddress: string
  propertyType: string
  county: string
  closingDate: string
  buyerName: string
  sellerName: string
  transactionType: string
  purchasePrice: number
  buyerEmail: string
  buyerPhone: string
  /** Mapped to matter `specialNotes` */
  intakeNotes: string
  /** From intake — used to show party-specific UI (e.g. Other → contact + role fields) */
  transactionRole?: DemoTransactionRole
  /** Intake `other` description; shown when opening matter from an Other-role lead */
  partyRoleOther?: string
  /** Intake client name when role is Other (maps to contact, not buyer/seller by default) */
  contactName?: string
  /** Intake purchaser type — maps to `matter.buyer.type` */
  buyerType?: DemoPartyType
}

const DEFAULT_MATTER: Omit<DemoNewMatterInitialValues, never> = {
  matterType: 'Financed Residential Purchase',
  propertyAddress: '',
  propertyType: 'Single-Family Home',
  county: '',
  closingDate: '',
  buyerName: '',
  sellerName: '',
  transactionType: 'Purchase',
  purchasePrice: 0,
  buyerEmail: '',
  buyerPhone: '',
  intakeNotes: '',
}

export function mapIntakeLeadToNewMatterInitialValues(lead: DemoIntakeLead): DemoNewMatterInitialValues {
  const s = effectiveIntakeSnapshot(lead)
  const role: DemoTransactionRole = s.transactionRole ?? 'buyer'
  const clientName = s.clientName.trim()

  const isRefi = s.matterType.includes('Refinance') || s.matterType.toLowerCase().includes('refinance')
  let transactionType: string
  if (isRefi) transactionType = 'Refinance'
  else if (role === 'seller') transactionType = 'Sale'
  else if (role === 'both') transactionType = 'Both'
  else transactionType = 'Purchase'

  let buyerName = ''
  let sellerName = ''
  if (role === 'buyer') buyerName = clientName
  else if (role === 'seller') sellerName = clientName
  else if (role === 'both') {
    buyerName = clientName
    sellerName = clientName
  }

  const notes = [s.notes?.trim(), lead.fileReference ? `Intake file ref: ${lead.fileReference}` : ''].filter(Boolean).join('\n')

  const buyerSide = role === 'buyer' || role === 'both'

  return {
    matterType: s.matterType || DEFAULT_MATTER.matterType,
    propertyAddress: s.propertyAddress,
    propertyType: inferPropertyTypeFromMatterType(s.matterType),
    county: s.county,
    closingDate: s.targetClosingDate,
    buyerName,
    sellerName,
    transactionType,
    purchasePrice: 0,
    buyerEmail: s.clientEmail,
    buyerPhone: s.clientPhone,
    intakeNotes: notes,
    transactionRole: role,
    partyRoleOther: role === 'other' ? (s.transactionRoleOther ?? '') : '',
    contactName: role === 'other' ? clientName : '',
    buyerType: buyerSide ? s.buyerType : undefined,
  }
}

function inferPropertyTypeFromMatterType(matterType: string): string {
  const m = matterType.toLowerCase()
  if (m.includes('condo')) return 'Condo'
  if (m.includes('townhouse')) return 'Townhouse'
  if (m.includes('commercial')) return 'Commercial'
  if (m.includes('land')) return 'Land'
  return 'Single-Family Home'
}

export type DemoClientCreateFromIntakeInput = {
  full_name: string
  email: string
  phone: string
  /** Mailing / current address — uses property address when no separate address on intake */
  addressLine: string
}

export function mapIntakeLeadToClientCreateInput(lead: DemoIntakeLead): DemoClientCreateFromIntakeInput {
  const s = effectiveIntakeSnapshot(lead)
  return {
    full_name: s.clientName.trim() || 'Unknown client',
    email: s.clientEmail.trim(),
    phone: s.clientPhone.trim(),
    addressLine: s.propertyAddress.trim(),
  }
}

function normalizePhone(p: string) {
  return p.replace(/\D/g, '')
}

/** Primary: email (case-insensitive). Fallback: normalized full name + phone */
export function findExistingDemoClient(
  clients: DemoClient[],
  input: { email: string; full_name: string; phone: string }
): DemoClient | undefined {
  const email = input.email.trim().toLowerCase()
  if (email) {
    const byEmail = clients.find((c) => !c.deletedAt && c.email.toLowerCase() === email)
    if (byEmail) return byEmail
  }
  const name = input.full_name.trim().toLowerCase()
  const phone = normalizePhone(input.phone)
  if (name && phone) {
    return clients.find(
      (c) =>
        !c.deletedAt &&
        c.full_name.trim().toLowerCase() === name &&
        normalizePhone(c.phone) === phone
    )
  }
  return undefined
}
