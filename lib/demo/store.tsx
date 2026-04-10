'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { demoSeedData } from '@/lib/demo/demoData'
import type {
  DemoCalendarEvent,
  DemoClient,
  DemoDocument,
  DemoIntakeDemoDelivery,
  DemoIntakeLead,
  DemoIntakeSnapshot,
  DemoMatter,
  DemoSeedData,
  DemoTaskStatus,
} from '@/lib/demo/types'
import { deriveMatterStatus } from '@/lib/demo-utils'
import { findExistingDemoClient } from '@/lib/demo/demoIntakeFlow'

type DemoContextType = {
  demoFirm: DemoSeedData['demoFirm']
  staff: DemoSeedData['staff']
  matters: DemoMatter[]
  clients: DemoClient[]
  calendarEvents: DemoCalendarEvent[]
  documents: DemoDocument[]
  intakeLeads: DemoIntakeLead[]
  archivedMatters: DemoMatter[]
  archivedClients: DemoClient[]
  recentlyDeletedMatters: DemoMatter[]
  recentlyDeletedClients: DemoClient[]
  getMatterById: (matterId: string) => DemoMatter | undefined
  getArchivedMatterById: (matterId: string) => DemoMatter | undefined
  updateMatterStatus: (matterId: string, status: DemoMatter['status']) => void
  toggleTaskComplete: (matterId: string, taskId: string) => void
  updateTaskStatus: (matterId: string, taskId: string, status: DemoTaskStatus) => void
  addTimelineNote: (matterId: string, note: string) => void
  archiveMatter: (matterId: string) => void
  archiveClient: (clientId: string) => void
  restoreMatter: (matterId: string) => void
  restoreClient: (clientId: string) => void
  permanentlyDeleteMatter: (matterId: string) => void
  permanentlyDeleteClient: (clientId: string) => void
  createDemoMatter: (input: CreateDemoMatterInput) => void
  registerIntakeLead: (input: {
    token: string
    fileReference: string
    emailRecipientName: string
    emailRecipientEmail: string
    emailSubject: string
    emailBody: string
    intakeUrl: string
    demoDelivery: DemoIntakeDemoDelivery
    intake: DemoIntakeSnapshot
  }) => void
  submitDemoIntakeLead: (token: string, intake: DemoIntakeSnapshot) => void
  getIntakeLeadByToken: (token: string) => DemoIntakeLead | undefined
  patchIntakeLead: (
    leadId: string,
    patch: Partial<Pick<DemoIntakeLead, 'linkedMatterFileId' | 'linkedClientId'>>
  ) => void
  createDemoClientIfNotExists: (input: {
    full_name: string
    email: string
    phone: string
    linkMatterFileId?: string | null
  }) => { created: boolean; client: DemoClient }
  linkDemoClientToMatterByFileId: (clientId: string, fileId: string) => void
}

type CreateDemoMatterInput = {
  file_id: string
  matter_type: string
  transactionType: string
  purchasePrice: number
  property_address: string
  property_type: DemoMatter['property']['property_type']
  county: string
  closing_date: string // YYYY-MM-DD
  buyer_name: string
  seller_name: string
  buyer_email?: string
  buyer_phone?: string
  special_notes?: string
  onCreated?: (r: { matterId: string; fileId: string }) => void
}

const DemoContext = createContext<DemoContextType | null>(null)

/** Persists demo intake leads so /demo/intake/[token] works across tabs and refreshes */
const DEMO_INTAKE_LEADS_STORAGE_KEY = 'lawintake-demo-intake-leads-v1'
const LEGACY_DEMO_INTAKE_LEADS_SESSION_KEY = DEMO_INTAKE_LEADS_STORAGE_KEY

function persistIntakeLeads(leads: DemoIntakeLead[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEMO_INTAKE_LEADS_STORAGE_KEY, JSON.stringify(leads))
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(LEGACY_DEMO_INTAKE_LEADS_SESSION_KEY, JSON.stringify(leads))
    }
  } catch {
    /* ignore quota / private mode */
  }
}

function cloneSeedData(): DemoSeedData {
  if (typeof structuredClone === 'function') {
    return structuredClone(demoSeedData)
  }
  return JSON.parse(JSON.stringify(demoSeedData)) as DemoSeedData
}

function inferTransactionTypeFromIntake(intake: DemoIntakeSnapshot): string {
  const isRefi = intake.matterType.includes('Refinance') || intake.matterType.toLowerCase().includes('refinance')
  if (isRefi) return 'Refinance'
  if (intake.transactionRole === 'seller') return 'Sale'
  if (intake.transactionRole === 'both') return 'Both'
  return 'Purchase'
}

function upsertSpecialNotesLine(notes: string, label: string, value: string): string {
  const pattern = new RegExp(`(?:^|\\n)${label}:.*?(?=\\n|$)`, 'i')
  const trimmed = notes.trim()
  const cleaned = trimmed.replace(pattern, '').replace(/\n{3,}/g, '\n\n').trim()
  if (!value.trim()) return cleaned
  return cleaned ? `${label}: ${value.trim()}.\n\n${cleaned}` : `${label}: ${value.trim()}.`
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  // Intentionally in-memory only. Full reload resets to seed state.
  const [state, setState] = useState<DemoSeedData & {
    recentlyDeletedMatters: DemoMatter[]
    recentlyDeletedClients: DemoClient[]
  }>(() => ({
    ...cloneSeedData(),
    recentlyDeletedMatters: [],
    recentlyDeletedClients: [],
  }))

  useEffect(() => {
    try {
      const rawLocal = typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_INTAKE_LEADS_STORAGE_KEY) : null
      const rawSession =
        typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(LEGACY_DEMO_INTAKE_LEADS_SESSION_KEY) : null
      const raw = rawLocal ?? rawSession
      if (!raw) return
      const parsed = JSON.parse(raw) as DemoIntakeLead[]
      if (!Array.isArray(parsed) || parsed.length === 0) return
      if (!rawLocal && rawSession && typeof localStorage !== 'undefined') {
        localStorage.setItem(DEMO_INTAKE_LEADS_STORAGE_KEY, rawSession)
      }
      setState((prev) => ({ ...prev, intakeLeads: parsed }))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DEMO_INTAKE_LEADS_STORAGE_KEY || !e.newValue) return
      try {
        const parsed = JSON.parse(e.newValue) as DemoIntakeLead[]
        if (Array.isArray(parsed)) setState((prev) => ({ ...prev, intakeLeads: parsed }))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo<DemoContextType>(() => {
    return {
      demoFirm: state.demoFirm,
      staff: state.staff,
      matters: state.matters.filter((m) => !m.deletedAt),
      clients: state.clients.filter((c) => !c.deletedAt),
      calendarEvents: state.calendarEvents.filter((e) => !e.deletedAt),
      documents: state.documents.filter((d) => !d.deletedAt),
      intakeLeads: state.intakeLeads,
      archivedMatters: state.matters.filter((m) => Boolean(m.deletedAt)),
      archivedClients: state.clients.filter((c) => Boolean(c.deletedAt)),
      recentlyDeletedMatters: state.recentlyDeletedMatters,
      recentlyDeletedClients: state.recentlyDeletedClients,
      getMatterById: (matterId) => state.matters.find((m) => m.id === matterId && !m.deletedAt),
      getArchivedMatterById: (matterId) =>
        state.matters.find((m) => m.id === matterId && Boolean(m.deletedAt)),
      updateMatterStatus: (matterId, status) => {
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((m) => (m.id === matterId && !m.deletedAt ? { ...m, status } : m)),
        }))
      },
      toggleTaskComplete: (matterId, taskId) => {
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((m) => {
            if (m.id !== matterId) return m
            const tasksNext = m.tasks.map((task) => {
              if (task.id !== taskId) return task
              if (task.deletedAt) return task
              const nextStatus: DemoTaskStatus = task.status === 'completed' ? 'not_started' : 'completed'
              return { ...task, status: nextStatus }
            })
            return {
              ...m,
              tasks: tasksNext,
              status: deriveMatterStatus(tasksNext, m.key_dates.closing_date),
            }
          }),
        }))
      },
      updateTaskStatus: (matterId, taskId, status) => {
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((m) => {
            if (m.id !== matterId) return m
            const tasksNext = m.tasks.map((task) =>
              task.id === taskId && !task.deletedAt ? { ...task, status } : task
            )
            const newStatus = deriveMatterStatus(tasksNext, m.key_dates.closing_date)
            return { ...m, status: newStatus, tasks: tasksNext }
          }),
        }))
      },
      addTimelineNote: (matterId, note) => {
        if (!note.trim()) return
        const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((m) => {
            if (m.id !== matterId) return m
            return {
              ...m,
              timeline: [
                {
                  id: `note-${Date.now()}`,
                  at: timestamp,
                  note: note.trim(),
                  deletedAt: null,
                },
                ...m.timeline,
              ],
            }
          }),
        }))
      },
      archiveMatter: (matterId) => {
        const deletedAt = new Date().toISOString()
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((m) => {
            if (m.id !== matterId || m.deletedAt) return m
            return {
              ...m,
              deletedAt,
              tasks: m.tasks.map((task) => ({ ...task, deletedAt })),
              timeline: m.timeline.map((evt) => ({ ...evt, deletedAt })),
            }
          }),
          calendarEvents: prev.calendarEvents.map((evt) =>
            evt.matter_id === matterId && !evt.deletedAt ? { ...evt, deletedAt } : evt
          ),
          documents: prev.documents.map((doc) =>
            doc.matter_id === matterId && !doc.deletedAt ? { ...doc, deletedAt } : doc
          ),
        }))
      },
      archiveClient: (clientId) => {
        const deletedAt = new Date().toISOString()
        setState((prev) => ({
          ...prev,
          clients: prev.clients.map((client) => {
            if (client.id !== clientId || client.deletedAt) return client
            return { ...client, deletedAt }
          }),
        }))
      },
      restoreMatter: (matterId) => {
        setState((prev) => ({
          ...prev,
          matters: prev.matters.map((m) => {
            if (m.id !== matterId || !m.deletedAt) return m
            return {
              ...m,
              deletedAt: null,
              tasks: m.tasks.map((task) => ({ ...task, deletedAt: null })),
              timeline: m.timeline.map((evt) => ({ ...evt, deletedAt: null })),
            }
          }),
          calendarEvents: prev.calendarEvents.map((evt) =>
            evt.matter_id === matterId ? { ...evt, deletedAt: null } : evt
          ),
          documents: prev.documents.map((doc) =>
            doc.matter_id === matterId ? { ...doc, deletedAt: null } : doc
          ),
        }))
      },
      restoreClient: (clientId) => {
        setState((prev) => ({
          ...prev,
          clients: prev.clients.map((client) =>
            client.id === clientId ? { ...client, deletedAt: null } : client
          ),
        }))
      },
      permanentlyDeleteMatter: (matterId) => {
        setState((prev) => ({
          ...(() => {
            const target = prev.matters.find((m) => m.id === matterId)
            if (!target) return prev
            const removedAt = target.deletedAt ?? new Date().toISOString()
            return {
              ...prev,
              matters: prev.matters.filter((m) => m.id !== matterId),
              calendarEvents: prev.calendarEvents.filter((evt) => evt.matter_id !== matterId),
              documents: prev.documents.filter((doc) => doc.matter_id !== matterId),
              recentlyDeletedMatters: [
                { ...target, deletedAt: removedAt },
                ...prev.recentlyDeletedMatters.filter((m) => m.id !== matterId),
              ],
            }
          })(),
        }))
      },
      permanentlyDeleteClient: (clientId) => {
        setState((prev) => ({
          ...(() => {
            const target = prev.clients.find((client) => client.id === clientId)
            if (!target) return prev
            const removedAt = target.deletedAt ?? new Date().toISOString()
            return {
              ...prev,
              clients: prev.clients.filter((client) => client.id !== clientId),
              recentlyDeletedClients: [
                { ...target, deletedAt: removedAt },
                ...prev.recentlyDeletedClients.filter((c) => c.id !== clientId),
              ],
            }
          })(),
        }))
      },
      getIntakeLeadByToken: (token) => state.intakeLeads.find((l) => l.token === token),
      registerIntakeLead: (input) => {
        const id = `intake-lead-${Date.now()}`
        const lead: DemoIntakeLead = {
          id,
          token: input.token,
          createdAt: new Date().toISOString(),
          fileReference: input.fileReference,
          emailRecipientName: input.emailRecipientName,
          emailRecipientEmail: input.emailRecipientEmail,
          emailSubject: input.emailSubject,
          emailBody: input.emailBody,
          intakeUrl: input.intakeUrl,
          demoDelivery: input.demoDelivery,
          intake: input.intake,
          status: 'pending_client',
          clientSubmittedAt: null,
          submittedIntake: null,
        }
        setState((prev) => {
          const intakeLeads = [lead, ...prev.intakeLeads]
          persistIntakeLeads(intakeLeads)
          return { ...prev, intakeLeads }
        })
      },
      submitDemoIntakeLead: (token, intake) => {
        const at = new Date().toISOString()
        setState((prev) => {
          const lead = prev.intakeLeads.find((l) => l.token === token)
          if (!lead) return prev

          const normalizedIntake: DemoIntakeSnapshot = {
            ...intake,
            transactionRole: intake.transactionRole ?? 'buyer',
            transactionRoleOther: intake.transactionRole === 'other' ? intake.transactionRoleOther ?? '' : '',
          }

          const intakeLeads = prev.intakeLeads.map((l) =>
            l.token === token
              ? { ...l, status: 'submitted' as const, submittedIntake: normalizedIntake, clientSubmittedAt: at }
              : l
          )

          const clients = lead.linkedClientId
            ? prev.clients.map((client) =>
                client.id === lead.linkedClientId && !client.deletedAt
                  ? {
                      ...client,
                      full_name: normalizedIntake.clientName.trim() || client.full_name,
                      email: normalizedIntake.clientEmail.trim() || client.email,
                      phone: normalizedIntake.clientPhone.trim() || client.phone,
                    }
                  : client
              )
            : prev.clients

          const matters = lead.linkedMatterFileId
            ? prev.matters.map((matter) => {
                if (matter.file_id !== lead.linkedMatterFileId || matter.deletedAt) return matter

                const buyerName =
                  normalizedIntake.transactionRole === 'buyer' || normalizedIntake.transactionRole === 'both'
                    ? normalizedIntake.clientName.trim() || matter.buyer.name
                    : matter.buyer.name
                const sellerName =
                  normalizedIntake.transactionRole === 'seller' || normalizedIntake.transactionRole === 'both'
                    ? normalizedIntake.clientName.trim() || matter.seller.name
                    : matter.seller.name
                const buyerEmail =
                  normalizedIntake.transactionRole === 'buyer' || normalizedIntake.transactionRole === 'both'
                    ? normalizedIntake.clientEmail.trim() || matter.buyerEmail
                    : matter.buyerEmail
                const sellerEmail =
                  normalizedIntake.transactionRole === 'seller' || normalizedIntake.transactionRole === 'both'
                    ? normalizedIntake.clientEmail.trim() || matter.sellerEmail
                    : matter.sellerEmail
                const buyerPhone =
                  normalizedIntake.transactionRole === 'buyer' || normalizedIntake.transactionRole === 'both'
                    ? normalizedIntake.clientPhone.trim() || matter.buyerPhone
                    : matter.buyerPhone
                const sellerPhone =
                  normalizedIntake.transactionRole === 'seller' || normalizedIntake.transactionRole === 'both'
                    ? normalizedIntake.clientPhone.trim() || matter.sellerPhone
                    : matter.sellerPhone

                let specialNotes = matter.specialNotes
                specialNotes = upsertSpecialNotesLine(
                  specialNotes,
                  'Other Title',
                  normalizedIntake.transactionRole === 'other' ? normalizedIntake.transactionRoleOther : ''
                )
                specialNotes = upsertSpecialNotesLine(
                  specialNotes,
                  "Title's Name",
                  normalizedIntake.transactionRole === 'other' ? normalizedIntake.clientName : ''
                )

                return {
                  ...matter,
                  matter_type: normalizedIntake.matterType.trim() || matter.matter_type,
                  property: {
                    ...matter.property,
                    address: normalizedIntake.propertyAddress.trim() || matter.property.address,
                    county: normalizedIntake.county.trim() || matter.property.county,
                  },
                  buyer: {
                    ...matter.buyer,
                    name: buyerName,
                    email: buyerEmail,
                    phone: buyerPhone,
                  },
                  seller: {
                    ...matter.seller,
                    name: sellerName,
                    email: sellerEmail,
                    phone: sellerPhone,
                  },
                  transactionType: inferTransactionTypeFromIntake(normalizedIntake),
                  buyerEmail,
                  buyerPhone,
                  sellerEmail,
                  sellerPhone,
                  possessionDate: normalizedIntake.targetClosingDate.trim() || matter.possessionDate,
                  specialNotes,
                  key_dates: {
                    ...matter.key_dates,
                    closing_date: normalizedIntake.targetClosingDate.trim() || matter.key_dates.closing_date,
                  },
                }
              })
            : prev.matters

          persistIntakeLeads(intakeLeads)
          return { ...prev, intakeLeads, clients, matters }
        })
      },
      patchIntakeLead: (leadId, patch) => {
        setState((prev) => {
          const intakeLeads = prev.intakeLeads.map((l) => (l.id === leadId ? { ...l, ...patch } : l))
          persistIntakeLeads(intakeLeads)
          return { ...prev, intakeLeads }
        })
      },
      createDemoClientIfNotExists: (input) => {
        const linkedMatterId =
          input.linkMatterFileId
            ? state.matters.find((x) => x.file_id === input.linkMatterFileId && !x.deletedAt)?.id ?? null
            : null
        const active = state.clients.filter((c) => !c.deletedAt)
        const existing = findExistingDemoClient(active, {
          email: input.email,
          full_name: input.full_name,
          phone: input.phone,
        })

        if (existing) {
          const client =
            linkedMatterId && !existing.linked_matter_ids.includes(linkedMatterId)
              ? { ...existing, linked_matter_ids: [...existing.linked_matter_ids, linkedMatterId] }
              : existing
          if (client !== existing) {
            setState((prev) => ({
              ...prev,
              clients: prev.clients.map((c) => (c.id === existing.id ? client : c)),
            }))
          }
          return { created: false, client }
        }

        const ts = Date.now()
        const client: DemoClient = {
          id: `client-${ts}`,
          full_name: input.full_name,
          email: input.email.trim() || `client-${ts}@demo.example`,
          phone: input.phone,
          kyc_status: 'pending',
          type: 'individual',
          linked_matter_ids: linkedMatterId ? [linkedMatterId] : [],
          created_at: new Date().toISOString(),
          deletedAt: null,
        }
        setState((prev) => ({ ...prev, clients: [...prev.clients, client] }))
        return { created: true, client }
      },
      linkDemoClientToMatterByFileId: (clientId, fileId) => {
        setState((prev) => {
          const matterId = prev.matters.find((m) => m.file_id === fileId && !m.deletedAt)?.id
          if (!matterId) return prev
          return {
            ...prev,
            clients: prev.clients.map((client) =>
              client.id === clientId && !client.deletedAt && !client.linked_matter_ids.includes(matterId)
                ? { ...client, linked_matter_ids: [...client.linked_matter_ids, matterId] }
                : client
            ),
          }
        })
      },
      createDemoMatter: (input) => {
        const ymd = (dt: Date) => dt.toISOString().slice(0, 10)
        const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
        let createdInfo: { matterId: string; fileId: string } | null = null

        setState((prev) => {
          const ts = Date.now()
          const staff = prev.staff
          const attorney =
            staff.find((s) => s.role.toLowerCase().includes('attorney'))?.full_name ?? staff[0]?.full_name ?? ''
          const paralegal =
            staff.find((s) => s.role.toLowerCase().includes('paralegal'))?.full_name ?? staff[1]?.full_name ?? attorney

          const closingDate = input.closing_date || ymd(new Date())
          const closingDt = new Date(`${closingDate}T00:00:00`)
          const safeClosing = Number.isNaN(closingDt.getTime()) ? ymd(new Date()) : closingDate

          const contractDate = ymd(addDays(new Date(`${safeClosing}T00:00:00`), -24))
          const inspectionDeadline = ymd(addDays(new Date(`${safeClosing}T00:00:00`), -9))
          const financingDeadline = ymd(addDays(new Date(`${safeClosing}T00:00:00`), -7))
          const titleCommitmentDeadline = ymd(addDays(new Date(`${safeClosing}T00:00:00`), -5))
          const possessionDate = safeClosing
          const fileOpenedDate = ymd(addDays(new Date(`${safeClosing}T00:00:00`), -24))

          const financingType =
            input.matter_type === 'Cash Residential Purchase' ? 'Cash' : input.matter_type === 'Residential Purchase - New File' ? 'FHA' : 'Conventional'
          const loanNumber = financingType === 'Cash' ? '' : `LN-${safeClosing.slice(0, 4)}-${Math.floor(10000 + Math.random() * 90000)}`
          const lenderName = financingType === 'Cash' ? '' : 'Demo Lender'
          const lenderEmail = financingType === 'Cash' ? '' : 'lender@demo.example'

          const normalizeEmail = (name: string, fallback: string) => {
            const safe = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+/, '').replace(/\.+$/, '')
            return `${safe || fallback}@demo.example`
          }

          const buyerName = input.buyer_name.trim()
          const sellerName = input.seller_name.trim()
          const buyerEmail = input.buyer_email?.trim() || (buyerName ? normalizeEmail(buyerName, 'buyer') : '')
          const buyerPhone = input.buyer_phone?.trim() || ''
          const sellerEmail = sellerName ? normalizeEmail(sellerName, 'seller') : ''
          const sellerPhone = ''

          const hoaFlag = input.property_type === 'Condo' || input.property_type === 'Townhouse'

          const tasks: DemoMatter['tasks'] = [
            { id: `t-${ts}-1`, title: 'Receive executed contract', status: 'not_started', deletedAt: null },
            { id: `t-${ts}-2`, title: 'Open file & send welcome email', status: 'not_started', deletedAt: null },
            { id: `t-${ts}-3`, title: 'Order title search', status: 'not_started', deletedAt: null },
            { id: `t-${ts}-4`, title: 'Order municipal lien/search', status: 'not_started', deletedAt: null },
            { id: `t-${ts}-5`, title: 'Request payoff from seller lender', status: 'not_started', deletedAt: null },
            { id: `t-${ts}-6`, title: 'Prepare Closing Disclosure/ALTA', status: 'not_started', deletedAt: null },
            { id: `t-${ts}-7`, title: 'Schedule signing', status: 'not_started', deletedAt: null },
          ]

          const status = deriveMatterStatus(tasks, safeClosing)

          const buyerId = `buyer-${ts}-1`
          const sellerId = `seller-${ts}-1`
          const matterId = `matter-${ts}`

          const nextMatter: DemoMatter = {
            id: matterId,
            file_id: input.file_id,
            status,
            deletedAt: null,
            matter_type: input.matter_type,
            property: {
              address: input.property_address,
              county: input.county,
              property_type: input.property_type,
            },
            buyer: {
              id: buyerId,
              name: buyerName,
              type: 'individual',
              email: buyerEmail,
              phone: buyerPhone,
            },
            seller: {
              id: sellerId,
              name: sellerName,
              type: 'individual',
              email: sellerEmail,
              phone: sellerPhone,
            },
            transactionType: input.transactionType,
            purchasePrice: input.purchasePrice,
            financingType,
            loanNumber,
            lenderName,
            lenderEmail,
            buyerEmail,
            buyerPhone,
            sellerEmail,
            sellerPhone,
            buyerAgent: 'Demo Agent',
            listingAgent: 'Demo Listing Agent',
            assignedAttorney: attorney,
            assignedParalegal: paralegal,
            contractDate,
            inspectionDeadline,
            financingDeadline,
            titleCommitmentDeadline,
            possessionDate,
            fileOpenedDate,
            hoaFlag,
            referralSource: 'Demo mode',
            specialNotes: input.special_notes?.trim() ?? '',
            key_dates: {
              effective_date: contractDate,
              inspection_deadline: inspectionDeadline,
              loan_approval_deadline: financingDeadline,
              closing_date: safeClosing,
            },
            tasks,
            timeline: [
              {
                id: `e-${ts}-1`,
                at: `${fileOpenedDate} 09:00`,
                note: 'File opened in demo mode.',
                deletedAt: null,
              },
            ],
          }

          createdInfo = { matterId: nextMatter.id, fileId: nextMatter.file_id }

          return {
            ...prev,
            matters: [...prev.matters, nextMatter],
          }
        })
        if (createdInfo) input.onCreated?.(createdInfo)
      },
    }
  }, [state])

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemoStore() {
  const ctx = useContext(DemoContext)
  if (!ctx) {
    throw new Error('useDemoStore must be used inside DemoProvider')
  }
  return ctx
}
