'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DemoIntakeLead, DemoClient, DemoMatter, DemoConflictCheckStatus } from '@/lib/demo/types'
import {
  buildIntakeStarterDocuments,
  effectiveIntakeSnapshot,
  mapIntakeLeadToClientCreateInput,
  mapIntakeLeadToNewMatterInitialValues,
} from '@/lib/demo/demoIntakeFlow'
import { useDemoStore } from '@/lib/demo/store'
import NewIntakeDemoModal from '@/app/demo/_components/NewIntakeDemoModal'
import NewMatterModal, { getNextDemoFileId } from '@/app/demo/_components/NewMatterModal'

type ConflictResult = {
  hasConflict: boolean
  clientMatches: DemoClient[]
  matterMatches: DemoMatter[]
  intakeMatches: DemoIntakeLead[]
}

function runConflictCheck(
  lead: DemoIntakeLead,
  clients: DemoClient[],
  matters: DemoMatter[],
  allIntakeLeads: DemoIntakeLead[],
): ConflictResult {
  const normalise = (s: string) => s.toLowerCase().trim()
  const intake = effectiveIntakeSnapshot(lead)
  const searchName = normalise(intake.clientName?.trim() ?? '')

  const clientMatches = clients.filter(c =>
    !c.deletedAt &&
    (normalise(c.full_name).includes(searchName) || searchName.includes(normalise(c.full_name)))
  )

  const matterMatches = matters.filter(m =>
    !m.deletedAt &&
    (normalise(m.buyer.name).includes(searchName) || searchName.includes(normalise(m.buyer.name)) ||
     normalise(m.seller.name).includes(searchName) || searchName.includes(normalise(m.seller.name)))
  )

  const intakeMatches = allIntakeLeads.filter(i => {
    if (i.id === lead.id) return false
    const otherSnapshot = effectiveIntakeSnapshot(i)
    const otherName = normalise(otherSnapshot.clientName?.trim() ?? '')
    return otherName.includes(searchName) || searchName.includes(otherName)
  })

  return {
    hasConflict: clientMatches.length > 0 || matterMatches.length > 0 || intakeMatches.length > 0,
    clientMatches,
    matterMatches,
    intakeMatches,
  }
}

function resolveIntakeUrl(lead: DemoIntakeLead, origin: string) {
  if (lead.intakeUrl) return lead.intakeUrl
  if (origin) return `${origin}/demo/intake/${lead.token}`
  return `/demo/intake/${lead.token}`
}

export default function DemoIntakesPage() {
  const { matters, staff, clients, intakeLeads, patchIntakeLead, createDemoClientIfNotExists, linkDemoClientToMatterByFileId, addDemoDocument } = useDemoStore()
  const [isNewIntakeOpen, setIsNewIntakeOpen] = useState(false)
  const [origin, setOrigin] = useState('')
  const [toast, setToast] = useState<{ message: string; tone: 'ok' | 'err' } | null>(null)

  const [conflictModal, setConflictModal] = useState<{
    open: boolean
    lead: DemoIntakeLead | null
    result: ConflictResult | null
  }>({ open: false, lead: null, result: null })
  const [confirmNote, setConfirmNote] = useState('')
  const closeConflictModal = useCallback(() => {
    setConflictModal({ open: false, lead: null, result: null })
  }, [])

  const [matterModalOpen, setMatterModalOpen] = useState(false)
  const [matterPreset, setMatterPreset] = useState<ReturnType<typeof mapIntakeLeadToNewMatterInitialValues> | null>(null)
  const [matterLeadId, setMatterLeadId] = useState<string | null>(null)
  const [nextMatterFileId, setNextMatterFileId] = useState('')

  const [clientBusyLeadId, setClientBusyLeadId] = useState<string | null>(null)

  const nextIntakeFileId = useMemo(() => getNextDemoFileId(matters.map((m) => m.file_id)), [matters])

  const showToast = useCallback((message: string, tone: 'ok' | 'err' = 'ok') => {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 6000)
  }, [])

  const handleRunCheck = useCallback(
    (lead: DemoIntakeLead) => {
      const intake = effectiveIntakeSnapshot(lead)
      const name = intake.clientName?.trim()
      if (!name) {
        showToast('No client name on this intake — cannot run conflict check.', 'err')
        return
      }
      const result = runConflictCheck(lead, clients, matters, intakeLeads)
      setConflictModal({ open: true, lead, result })
      setConfirmNote('')
    },
    [clients, matters, intakeLeads, showToast]
  )

  const handleMarkClear = useCallback(
    (leadId: string) => {
      patchIntakeLead(leadId, {
        conflict_check_status: 'clear',
        conflict_check_completed_at: new Date().toISOString(),
      })
      setConflictModal({ open: false, lead: null, result: null })
      showToast('Conflict check marked as clear.')
    },
    [patchIntakeLead, showToast]
  )

  const handleConfirmNoConflict = useCallback(
    (leadId: string, note: string) => {
      patchIntakeLead(leadId, {
        conflict_check_status: 'confirmed_no_conflict',
        conflict_check_completed_at: new Date().toISOString(),
        conflict_check_note: note || 'Reviewed and confirmed — no conflict.',
      })
      setConflictModal({ open: false, lead: null, result: null })
      showToast('Conflict reviewed and confirmed clear.')
    },
    [patchIntakeLead, showToast]
  )

  const handleFlagConflict = useCallback(
    (leadId: string) => {
      patchIntakeLead(leadId, {
        conflict_check_status: 'flagged',
        conflict_check_completed_at: new Date().toISOString(),
      })
      setConflictModal({ open: false, lead: null, result: null })
      showToast('Intake flagged as conflict.', 'err')
    },
    [patchIntakeLead, showToast]
  )

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '')
  }, [])

  useEffect(() => {
    if (!conflictModal.open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConflictModal()
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [closeConflictModal, conflictModal.open])

  const openMatterFromLead = useCallback(
    (lead: DemoIntakeLead) => {
      if (lead.linkedMatterFileId) {
        showToast('A matter is already linked to this intake.', 'err')
        return
      }
      setMatterPreset(mapIntakeLeadToNewMatterInitialValues(lead))
      setMatterLeadId(lead.id)
      setNextMatterFileId(getNextDemoFileId(matters.map((m) => m.file_id)))
      setMatterModalOpen(true)
    },
    [matters, showToast]
  )

  const onMatterCreatedFromIntake = useCallback(
    (info: { matterId: string; fileId: string }) => {
      if (matterLeadId) {
        const lead = intakeLeads.find((l) => l.id === matterLeadId)
        patchIntakeLead(matterLeadId, { linkedMatterFileId: info.fileId })
        if (lead?.linkedClientId) {
          linkDemoClientToMatterByFileId(lead.linkedClientId, info.fileId)
        }
        if (lead) {
          // Starter docs are created here (not at lead creation) so each row has a real `matter_id` link.
          const uploadedByStaffId = staff[0]?.id ?? ''
          const starterDocuments = buildIntakeStarterDocuments({
            lead,
            matterId: info.matterId,
            uploadedByStaffId,
          })
          for (const row of starterDocuments) addDemoDocument(row)
        }
      }
      showToast(`Matter ${info.fileId} created. You can open it from Matters or the dashboard.`)
    },
    [addDemoDocument, intakeLeads, linkDemoClientToMatterByFileId, matterLeadId, patchIntakeLead, showToast, staff]
  )

  const createClientFromLead = useCallback(
    (lead: DemoIntakeLead) => {
      setClientBusyLeadId(lead.id)
      try {
        const input = mapIntakeLeadToClientCreateInput(lead)
        const result = createDemoClientIfNotExists({
          full_name: input.full_name,
          email: input.email,
          phone: input.phone,
          linkMatterFileId: lead.linkedMatterFileId ?? null,
        })
        patchIntakeLead(lead.id, { linkedClientId: result.client.id })
        if (!result.created) {
          showToast(`Client record already exists (${result.client.email}). Linked this intake to that client.`, 'err')
          return
        }
        showToast(`Client record created for ${result.client.full_name}. See Clients.`)
      } catch (e) {
        showToast(e instanceof Error ? e.message : 'Could not create client.', 'err')
      } finally {
        setClientBusyLeadId(null)
      }
    },
    [createDemoClientIfNotExists, patchIntakeLead, showToast]
  )

  const sortedLeads = useMemo(
    () => [...intakeLeads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [intakeLeads]
  )

  return (
    <div>
      {toast && (
        <div
          role="status"
          style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 8,
            border: toast.tone === 'err' ? '1px solid #f5c2c7' : '1px solid rgba(47,133,90,0.35)',
            background: toast.tone === 'err' ? '#fff5f5' : '#e8f5f0',
            color: toast.tone === 'err' ? '#842029' : '#2f855a',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Intake / Leads</h1>
          <p style={{ margin: 0, color: '#627c71' }}>
            Demo intake leads (saved in this browser session). Open a matter or create a client from any lead. Client submissions update the row.
          </p>
        </div>
        <button
          type="button"
          style={{
            background: '#208096',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 800,
          }}
          onClick={() => setIsNewIntakeOpen(true)}
        >
          + New intake link
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94,82,64,0.2)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1250 }}>
          <thead>
            <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Created</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>File</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Email recipient</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Intake (preview)</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Intake link</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Conflict check</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Workflow</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Demo action</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Client submitted</th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '24px', color: '#627c71', textAlign: 'center' }}>
                  No intake leads yet. Use &quot;+ New intake link&quot; then <strong>Generate intake link and save (Demo)</strong> or{' '}
                  <strong>Send and save (Demo)</strong>.
                </td>
              </tr>
            ) : (
              sortedLeads.map((lead) => {
                const intake = effectiveIntakeSnapshot(lead)
                const fullUrl = resolveIntakeUrl(lead, origin)
                const delivery = lead.demoDelivery
                const clientBusy = clientBusyLeadId === lead.id
                return (
                  <tr key={lead.id} style={{ borderBottom: '1px solid rgba(94,82,64,0.12)' }}>
                    <td style={{ padding: '14px', color: '#627c71', fontSize: 13, whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      {new Date(lead.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 800, color: '#134252', verticalAlign: 'top' }}>{lead.fileReference}</td>
                    <td style={{ padding: '14px', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 800, color: '#134252' }}>{lead.emailRecipientName || '—'}</div>
                      <div style={{ color: '#627c71', fontSize: '12px', fontWeight: 600 }}>{lead.emailRecipientEmail || '—'}</div>
                    </td>
                    <td style={{ padding: '14px', color: '#134252', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 800 }}>{intake.clientName || '—'}</div>
                      <div style={{ color: '#627c71', fontSize: '12px' }}>{intake.matterType}</div>
                      <div style={{ color: '#627c71', fontSize: '12px' }}>{intake.propertyAddress || '—'}</div>
                      <div style={{ color: '#627c71', fontSize: '12px' }}>
                        Role:{' '}
                        {intake.transactionRole === 'other'
                          ? intake.transactionRoleOther?.trim() || 'Other'
                          : intake.transactionRole}
                      </div>
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top', wordBreak: 'break-all' }}>
                      <a href={fullUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#208096', fontWeight: 800, fontSize: 12 }}>
                        {fullUrl}
                      </a>
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(fullUrl)
                          }}
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: '1px solid rgba(94,82,64,0.25)',
                            background: 'white',
                            color: '#134252',
                            cursor: 'pointer',
                          }}
                        >
                          Copy link
                        </button>
                        <Link
                          href={`/demo/intake/${lead.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 11, color: '#208096', fontWeight: 800, alignSelf: 'center' }}
                        >
                          Open form
                        </Link>
                      </div>
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top', fontSize: 12 }}>
                      {(() => {
                        const ccs: DemoConflictCheckStatus = lead.conflict_check_status ?? 'pending'
                        if (ccs === 'pending') {
                          return (
                            <button
                              type="button"
                              onClick={() => handleRunCheck(lead)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1px solid #b45309',
                                background: '#fff8e6',
                                color: '#b45309',
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Run Conflict Check
                            </button>
                          )
                        }
                        if (ccs === 'clear') {
                          return (
                            <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 4, background: '#e8f5f0', color: '#2f855a', fontWeight: 800, fontSize: 12 }}>
                              &#10003; Clear
                            </span>
                          )
                        }
                        if (ccs === 'flagged') {
                          return (
                            <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 4, background: '#fee', color: '#c0152f', fontWeight: 800, fontSize: 12 }}>
                              &#9888; Conflict Found
                            </span>
                          )
                        }
                        return (
                          <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 4, background: '#f5f5f5', color: '#627c71', fontWeight: 800, fontSize: 12 }}>
                            Confirmed Clear
                          </span>
                        )
                      })()}
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top', fontSize: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {lead.linkedMatterFileId ? (
                          <span style={{ fontWeight: 800, color: '#208096' }}>
                            Matter:{' '}
                            <Link href="/demo/matters" style={{ color: '#208096' }}>
                              {lead.linkedMatterFileId}
                            </Link>
                          </span>
                        ) : (() => {
                          const ccs = lead.conflict_check_status ?? 'pending'
                          const canOpen = ccs === 'clear' || ccs === 'confirmed_no_conflict'
                          return (
                            <div style={{ position: 'relative' }}>
                              <button
                                type="button"
                                disabled={!canOpen}
                                onClick={() => openMatterFromLead(lead)}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: 6,
                                  border: canOpen ? '1px solid #134252' : '1px solid rgba(94,82,64,0.2)',
                                  background: canOpen ? 'white' : '#f5f5f5',
                                  color: canOpen ? '#134252' : '#999',
                                  fontWeight: 800,
                                  fontSize: 12,
                                  cursor: canOpen ? 'pointer' : 'not-allowed',
                                  textAlign: 'left',
                                }}
                                title={canOpen ? 'Open this intake as a new matter' : 'Complete conflict check first'}
                              >
                                Open as matter
                              </button>
                              {!canOpen && (
                                <div style={{ fontSize: 10, color: '#b45309', marginTop: 3 }}>
                                  Complete conflict check first
                                </div>
                              )}
                            </div>
                          )
                        })()}
                        {lead.linkedClientId ? (
                          <span style={{ fontWeight: 800, color: '#208096' }}>
                            Client:{' '}
                            <Link href={`/demo/clients#client-row-${lead.linkedClientId}`} style={{ color: '#208096' }}>
                              View record
                            </Link>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={clientBusy}
                            onClick={() => createClientFromLead(lead)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: '1px solid #208096',
                              background: 'white',
                              color: '#208096',
                              fontWeight: 800,
                              fontSize: 12,
                              cursor: clientBusy ? 'not-allowed' : 'pointer',
                              opacity: clientBusy ? 0.65 : 1,
                              textAlign: 'left',
                            }}
                          >
                            {clientBusy ? 'Creating…' : 'Create client record'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px', verticalAlign: 'top', fontSize: 12, color: '#627c71', fontWeight: 700 }}>
                      {delivery === 'email_sent' ? (
                        <span style={{ color: '#208096' }}>Emailed (demo)</span>
                      ) : delivery === 'link_saved' ? (
                        <span>Link saved</span>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 800, color: lead.status === 'submitted' ? '#208096' : '#b45309', verticalAlign: 'top' }}>
                      {lead.status === 'submitted' ? 'Submitted' : 'Pending client'}
                    </td>
                    <td style={{ padding: '14px', color: '#627c71', fontSize: 13, verticalAlign: 'top' }}>
                      {lead.submittedIntake ? (
                        <>
                          <div style={{ fontWeight: 800, color: '#134252' }}>{lead.submittedIntake.clientName}</div>
                          <div>{lead.submittedIntake.clientEmail}</div>
                          {lead.clientSubmittedAt && (
                            <div style={{ fontSize: '11px', marginTop: 4 }}>{new Date(lead.clientSubmittedAt).toLocaleString()}</div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <NewIntakeDemoModal
        isOpen={isNewIntakeOpen}
        onClose={() => setIsNewIntakeOpen(false)}
        nextFileId={nextIntakeFileId}
        mode="demo"
        onCreateDemo={() => setIsNewIntakeOpen(false)}
      />

      <NewMatterModal
        isOpen={matterModalOpen}
        onClose={() => {
          setMatterModalOpen(false)
          setMatterPreset(null)
          setMatterLeadId(null)
        }}
        nextFileId={nextMatterFileId}
        initialValues={matterPreset}
        onMatterCreated={onMatterCreatedFromIntake}
        onCreateDemo={() => {
          setMatterModalOpen(false)
          setMatterPreset(null)
          setMatterLeadId(null)
        }}
      />

      {conflictModal.open && conflictModal.lead && conflictModal.result && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Conflict check result"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeConflictModal()
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: '28px 32px',
              maxWidth: 520,
              width: '90%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#134252', marginBottom: 2 }}>Conflict check</div>
                <div style={{ color: '#627c71', fontSize: 13 }}>Demo only — review and update intake conflict status.</div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={closeConflictModal}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: '#627c71',
                  cursor: 'pointer',
                  fontSize: 18,
                  fontWeight: 900,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
            {!conflictModal.result.hasConflict ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#2f855a', marginBottom: 8 }}>
                  No Conflicts Found
                </div>
                <div style={{ borderTop: '1px solid rgba(94,82,64,0.15)', marginBottom: 16 }} />
                <p style={{ color: '#134252', fontSize: 14, lineHeight: 1.6 }}>
                  No existing clients, matters, or other intakes match &ldquo;{effectiveIntakeSnapshot(conflictModal.lead).clientName}&rdquo;.
                  This intake is clear to proceed.
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button
                    type="button"
                    onClick={() => handleMarkClear(conflictModal.lead!.id)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#208096',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Mark as Clear
                  </button>
                  <button
                    type="button"
                    onClick={closeConflictModal}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 6,
                      border: '1px solid rgba(94,82,64,0.3)',
                      background: 'white',
                      color: '#134252',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#c0152f', marginBottom: 8 }}>
                  Possible Conflict Detected
                </div>
                <div style={{ borderTop: '1px solid rgba(94,82,64,0.15)', marginBottom: 16 }} />
                <p style={{ color: '#134252', fontSize: 14, lineHeight: 1.6, margin: '0 0 12px' }}>
                  &ldquo;{effectiveIntakeSnapshot(conflictModal.lead).clientName}&rdquo; matches existing records:
                </p>

                {conflictModal.result.clientMatches.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#134252', marginBottom: 6 }}>
                      Existing Clients:
                    </div>
                    {conflictModal.result.clientMatches.map((c) => (
                      <div key={c.id} style={{ padding: '8px 12px', background: '#fff5f5', borderRadius: 6, marginBottom: 6, fontSize: 13 }}>
                        <strong>{c.full_name}</strong> — {c.email}
                        {c.linked_matter_ids.length > 0 && (
                          <span style={{ color: '#627c71' }}> ({c.linked_matter_ids.length} linked matter{c.linked_matter_ids.length !== 1 ? 's' : ''})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {conflictModal.result.matterMatches.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#134252', marginBottom: 6 }}>
                      Existing Matters:
                    </div>
                    {conflictModal.result.matterMatches.map((m) => (
                      <div key={m.id} style={{ padding: '8px 12px', background: '#fff5f5', borderRadius: 6, marginBottom: 6, fontSize: 13 }}>
                        <strong>{m.file_id}</strong> — {m.buyer.name} / {m.seller.name}
                        <div style={{ color: '#627c71', fontSize: 12 }}>{m.property.address}</div>
                      </div>
                    ))}
                  </div>
                )}

                {conflictModal.result.intakeMatches.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontWeight: 600, color: '#92400e', marginBottom: 6, fontSize: 13, margin: '0 0 6px' }}>
                      Other Pending Intakes:
                    </p>
                    {conflictModal.result.intakeMatches.map((i) => (
                      <div key={i.id} style={{
                        padding: '8px 12px',
                        backgroundColor: '#fef3c7',
                        borderRadius: 6,
                        marginBottom: 6,
                        fontSize: 13,
                      }}>
                        <span style={{ fontWeight: 600 }}>{effectiveIntakeSnapshot(i).clientName}</span>
                        {' '}&mdash; {i.id} submitted {new Date(i.createdAt).toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <br />
                        <span style={{ color: '#6b7280' }}>{effectiveIntakeSnapshot(i).propertyAddress} &mdash; {effectiveIntakeSnapshot(i).matterType}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p style={{ color: '#627c71', fontSize: 13, margin: '12px 0 6px' }}>
                  You must review before proceeding. Optionally add a note:
                </p>
                <textarea
                  value={confirmNote}
                  onChange={(e) => setConfirmNote(e.target.value)}
                  placeholder="e.g. Different person — confirmed via phone call"
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid rgba(94,82,64,0.25)',
                    fontSize: 13,
                    resize: 'vertical',
                    minHeight: 56,
                    boxSizing: 'border-box',
                  }}
                />

                <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleConfirmNoConflict(conflictModal.lead!.id, confirmNote)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#208096',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Confirm No Conflict
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFlagConflict(conflictModal.lead!.id)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#c0152f',
                      color: 'white',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Flag as Conflict
                  </button>
                  <button
                    type="button"
                    onClick={closeConflictModal}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 6,
                      border: '1px solid rgba(94,82,64,0.3)',
                      background: 'white',
                      color: '#134252',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
