'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDemoStore } from '@/lib/demo/store'
import type { DemoMatter } from '@/lib/demo/types'
import NewMatterModal, { getNextDemoFileId } from '@/app/demo/_components/NewMatterModal'
import DemoTaskChecklist from '@/components/demo/DemoTaskChecklist'
import DemoTimelineNotes from '@/components/demo/DemoTimelineNotes'
import NewIntakeDemoModal from './_components/NewIntakeDemoModal'
import SystemContractMapCard from './_components/SystemContractMapCard'
import { getMatterPartyDisplayRows } from '@/lib/demo/matterPartyDisplay'

function statusColor(status: DemoMatter['status']) {
  if (status === 'Closed/Post-Closing') return '#2f855a'
  if (status === 'Scheduled for Closing') return '#805ad5'
  if (status === 'Cleared to Close') return '#208096'
  if (status === 'Title Search') return '#975a16'
  return '#627c71'
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading demo…</div>}>
      <DemoPageContent />
    </Suspense>
  )
}

function DemoPageContent() {
  const { demoFirm, staff, matters, archivedMatters, updateMatterStatus } = useDemoStore()
  const [selectedMatterId, setSelectedMatterId] = useState(mattersDefault(matters))
  const [isNewMatterOpen, setIsNewMatterOpen] = useState(false)
  const [showDemoCreationDisabledBanner, setShowDemoCreationDisabledBanner] = useState(false)
  const [isNewIntakeOpen, setIsNewIntakeOpen] = useState(false)
  const [showDemoIntakeDisabledBanner, setShowDemoIntakeDisabledBanner] = useState(false)

  const searchParams = useSearchParams()
  const selectedMatterFromQuery = searchParams.get('matter')

  const detailPanelRef = useRef<HTMLElement | null>(null)
  const didScrollForQueryRef = useRef(false)

  const selectedMatter = useMemo(
    () => matters.find((m) => m.id === selectedMatterId) ?? matters[0],
    [matters, selectedMatterId]
  )

  const nextDemoFileId = useMemo(() => {
    const allFileIds = [...matters, ...archivedMatters].map((m) => m.file_id)
    return getNextDemoFileId(allFileIds)
  }, [matters, archivedMatters])

  useEffect(() => {
    if (!selectedMatterFromQuery) return
    const match = matters.find((m) => m.file_id === selectedMatterFromQuery)
    if (!match) return
    setSelectedMatterId(match.id)
    if (typeof window !== 'undefined' && window.innerWidth < 768 && !didScrollForQueryRef.current) {
      didScrollForQueryRef.current = true
      window.requestAnimationFrame(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }, [selectedMatterFromQuery, matters])

  useEffect(() => {
    if (matters.length === 0) return
    setSelectedMatterId((id) => (matters.some((m) => m.id === id) ? id : matters[0].id))
  }, [matters])

  // Reset scroll trigger when the query changes.
  useEffect(() => {
    didScrollForQueryRef.current = false
  }, [selectedMatterFromQuery])

  useEffect(() => {
    if (!showDemoCreationDisabledBanner) return
    const t = window.setTimeout(() => setShowDemoCreationDisabledBanner(false), 8000)
    return () => window.clearTimeout(t)
  }, [showDemoCreationDisabledBanner])

  useEffect(() => {
    if (!showDemoIntakeDisabledBanner) return
    const t = window.setTimeout(() => setShowDemoIntakeDisabledBanner(false), 8000)
    return () => window.clearTimeout(t)
  }, [showDemoIntakeDisabledBanner])

  if (!selectedMatter) {
    return (
      <div>
        <div style={{ background: 'white', border: '1px solid rgba(94,82,64,0.2)', borderRadius: '8px', padding: '20px' }}>
          <h2 style={{ marginTop: 0 }}>No active matters</h2>
          <p style={{ color: '#627c71', marginBottom: 0 }}>
            All demo matters may be archived for this session. Refresh the page to restore seeded demo data.
          </p>
        </div>
        <SystemContractMapCard />
      </div>
    )
  }

  const closingsNext7 = matters.filter((m) => {
    const closing = new Date(m.key_dates.closing_date).getTime()
    const now = new Date().getTime()
    const in7 = now + 7 * 24 * 60 * 60 * 1000
    return closing >= now && closing <= in7
  }).length

  const inProgressTasks = matters.flatMap((m) => m.tasks).filter((t) => t.status === 'in_progress').length
  const awaitingTasks = matters.flatMap((m) => m.tasks).filter((t) => t.status === 'not_started').length
  const selectedMatterPartyRows = getMatterPartyDisplayRows(selectedMatter)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Dashboard</h1>
          <p style={{ margin: 0, color: '#627c71', fontSize: '14px' }}>Your worklist and key dates for the next 7 days.</p>
          <p style={{ margin: '10px 0 0', color: '#627c71', fontSize: '13px', maxWidth: '52rem', lineHeight: 1.55 }}>
            <strong style={{ color: '#134252' }}>New intake link</strong> captures a lead and optional pseudo-send (saved under Intake / Leads).
            <strong style={{ color: '#134252' }}> New matter</strong> opens a file directly in this demo session. Use the table for a quick
            snapshot; <strong style={{ color: '#134252' }}>full workspace</strong> covers documents, missing-doc requests, client portal, and
            compliance (FinCEN / condo).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" style={actionBtn('#208096', 'white')} onClick={() => setIsNewIntakeOpen(true)}>
            + New intake link
          </button>
          <button type="button" style={actionBtn('rgba(94, 82, 64, 0.12)', '#134252')} onClick={() => setIsNewMatterOpen(true)}>
            + New matter
          </button>
        </div>
      </div>

      {showDemoCreationDisabledBanner && (
        <div
          role="alert"
          style={{
            marginBottom: '20px',
            padding: '14px 16px',
            border: '1px solid #f0b429',
            borderRadius: '8px',
            background: '#fff8e6',
            color: '#134252',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <strong>Demo mode:</strong> matter created in-memory for this session.{' '}
            <Link href="/auth/signup" style={{ color: '#208096', fontWeight: 800, textDecoration: 'none' }}>
              Sign up to create real matters.
            </Link>
          </div>
        </div>
      )}

      {showDemoIntakeDisabledBanner && (
        <div
          role="alert"
          style={{
            marginBottom: '20px',
            padding: '14px 16px',
            border: '1px solid #f0b429',
            borderRadius: '8px',
            background: '#fff8e6',
            color: '#134252',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <strong>Demo mode:</strong> intake saved to{' '}
            <Link href="/demo/intakes" style={{ color: '#208096', fontWeight: 800, textDecoration: 'none' }}>
              Intake / Leads
            </Link>{' '}
            (this browser session). Use &quot;Send and save (Demo)&quot; for a pseudo-email or &quot;Generate intake link and save (Demo)&quot; for link-only.{' '}
            <Link href="/auth/signup" style={{ color: '#208096', fontWeight: 800, textDecoration: 'none' }}>
              Sign up for real intakes.
            </Link>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '18px',
        }}
      >
        {[
          { label: 'Open matters', value: matters.length },
          { label: 'Tasks in progress', value: inProgressTasks },
          { label: 'Closings (next 7 days)', value: closingsNext7 },
          { label: 'Tasks not started', value: awaitingTasks },
        ].map((stat) => (
          <div key={stat.label} style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid rgba(94,82,64,0.2)' }}>
            <div style={{ fontSize: '12px', color: '#627c71', marginBottom: '10px' }}>{stat.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#208096' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '20px' }}>
        <section>
        <h2 style={{ marginBottom: '8px', fontSize: '24px' }}>Matter worklist</h2>
        <p style={{ marginTop: 0, color: '#627c71' }}>
          {demoFirm.name} - {demoFirm.office_location}
        </p>

        <div style={{ marginBottom: '14px', fontSize: '13px', color: '#627c71' }}>
          Staff: {staff.map((s) => `${s.full_name} (${s.role})`).join(' | ')}
        </div>

        <div style={{ background: 'white', border: '1px solid rgba(94,82,64,0.2)', borderRadius: '8px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fcfcf9' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>File</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Property</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Closing</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {matters.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelectedMatterId(m.id)}
                  style={{
                    borderTop: '1px solid rgba(94,82,64,0.12)',
                    cursor: 'pointer',
                    background: m.id === selectedMatter.id ? '#f7fbfc' : 'white',
                  }}
                >
                  <td style={{ padding: '12px', color: '#134252', fontWeight: 700 }}>
                    {m.file_id}
                    <div style={{ color: '#627c71', fontWeight: 500, fontSize: '12px' }}>{m.matter_type}</div>
                  </td>
                  <td style={{ padding: '12px', color: '#134252' }}>{m.property.address}</td>
                  <td style={{ padding: '12px', color: '#627c71' }}>
                    {new Date(m.key_dates.closing_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', color: statusColor(m.status), fontWeight: 700 }}>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside ref={detailPanelRef}>
        <div style={{ background: 'white', border: '1px solid rgba(94,82,64,0.2)', borderRadius: '8px', padding: '16px' }}>
          <h2 style={{ marginTop: 0, fontSize: '18px' }}>{selectedMatter.file_id}</h2>
          <p style={{ marginTop: 0, color: '#627c71', fontSize: '13px' }}>
            {selectedMatter.property.property_type} - {selectedMatter.property.county}
          </p>
          <p style={{ margin: '0 0 12px' }}>
            <Link
              href={`/demo/matters?matter=${encodeURIComponent(selectedMatter.file_id)}`}
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#208096',
                textDecoration: 'none',
              }}
            >
              Open full matter workspace →
            </Link>
          </p>
          <label style={{ fontSize: '12px', color: '#627c71', display: 'block', marginBottom: '6px' }}>
            Matter status
          </label>
          <select
            value={selectedMatter.status}
            onChange={(e) => updateMatterStatus(selectedMatter.id, e.target.value as DemoMatter['status'])}
            style={{ width: '100%', marginBottom: '14px', padding: '10px' }}
          >
            <option>Intake</option>
            <option>Title Search</option>
            <option>Cleared to Close</option>
            <option>Scheduled for Closing</option>
            <option>Closed/Post-Closing</option>
          </select>

          <div style={{ fontSize: '14px', marginBottom: '10px' }}>
            {selectedMatterPartyRows.length > 0 ? (
              selectedMatterPartyRows.map((row) => (
                <div key={`${selectedMatter.id}-${row.label}`}>
                  <strong>{row.label}:</strong> {row.value}
                </div>
              ))
            ) : (
              <div style={{ color: '#627c71' }}>No parties added</div>
            )}
          </div>

          <h3 style={{ marginBottom: '8px', fontSize: '15px' }}>Task checklist</h3>
          <DemoTaskChecklist matterId={selectedMatter.id} />

          <h3 style={{ marginBottom: '8px', fontSize: '15px' }}>Timeline notes</h3>
          <DemoTimelineNotes matterId={selectedMatter.id} />
        </div>
      </aside>
      </div>

      <SystemContractMapCard />

      <NewMatterModal
        isOpen={isNewMatterOpen}
        onClose={() => setIsNewMatterOpen(false)}
        nextFileId={nextDemoFileId}
        onCreateDemo={() => {
          setIsNewMatterOpen(false)
          setShowDemoCreationDisabledBanner(true)
        }}
      />

      <NewIntakeDemoModal
        isOpen={isNewIntakeOpen}
        onClose={() => setIsNewIntakeOpen(false)}
        nextFileId={nextDemoFileId}
        mode="demo"
        onCreateDemo={() => {
          setShowDemoIntakeDisabledBanner(true)
        }}
      />
    </div>
  )
}

function actionBtn(background: string, color: string) {
  return {
    background,
    color,
    padding: '12px 18px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '14px',
  } as const
}

function mattersDefault(matters: DemoMatter[]) {
  return matters[0]?.id ?? ''
}
