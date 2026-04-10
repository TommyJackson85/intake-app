'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DemoIntakeLead } from '@/lib/demo/types'
import {
  effectiveIntakeSnapshot,
  mapIntakeLeadToClientCreateInput,
  mapIntakeLeadToNewMatterInitialValues,
} from '@/lib/demo/demoIntakeFlow'
import { useDemoStore } from '@/lib/demo/store'
import NewIntakeDemoModal from '@/app/demo/_components/NewIntakeDemoModal'
import NewMatterModal, { getNextDemoFileId } from '@/app/demo/_components/NewMatterModal'

function resolveIntakeUrl(lead: DemoIntakeLead, origin: string) {
  if (lead.intakeUrl) return lead.intakeUrl
  if (origin) return `${origin}/demo/intake/${lead.token}`
  return `/demo/intake/${lead.token}`
}

export default function DemoIntakesPage() {
  const { matters, intakeLeads, patchIntakeLead, createDemoClientIfNotExists, linkDemoClientToMatterByFileId } = useDemoStore()
  const [isNewIntakeOpen, setIsNewIntakeOpen] = useState(false)
  const [origin, setOrigin] = useState('')
  const [toast, setToast] = useState<{ message: string; tone: 'ok' | 'err' } | null>(null)

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

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '')
  }, [])

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
      }
      showToast(`Matter ${info.fileId} created. You can open it from Matters or the dashboard.`)
    },
    [intakeLeads, linkDemoClientToMatterByFileId, matterLeadId, patchIntakeLead, showToast]
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
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

      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94,82,64,0.2)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
          <thead>
            <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Created</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>File</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Email recipient</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Intake (preview)</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Intake link</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Workflow</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Demo action</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Client submitted</th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '24px', color: '#627c71', textAlign: 'center' }}>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {lead.linkedMatterFileId ? (
                          <span style={{ fontWeight: 800, color: '#208096' }}>
                            Matter:{' '}
                            <Link href="/demo/matters" style={{ color: '#208096' }}>
                              {lead.linkedMatterFileId}
                            </Link>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={Boolean(lead.linkedMatterFileId)}
                            onClick={() => openMatterFromLead(lead)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: '1px solid #134252',
                              background: 'white',
                              color: '#134252',
                              fontWeight: 800,
                              fontSize: 12,
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            Open as matter
                          </button>
                        )}
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
    </div>
  )
}
