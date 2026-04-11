'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useDemoStore } from '@/lib/demo/store'
import NewMatterModal, { getNextDemoFileId } from '@/app/demo/_components/NewMatterModal'
import MatterDetailModal from '@/components/demo/MatterDetailModal'
import type { DemoMatter } from '@/lib/demo/types'
import { getMatterPartyDisplayRows } from '@/lib/demo/matterPartyDisplay'
import { useSearchParams } from 'next/navigation'

function statusColor(status: DemoMatter['status']) {
  if (status === 'Closed/Post-Closing') return '#2f855a'
  if (status === 'Scheduled for Closing') return '#805ad5'
  if (status === 'Cleared to Close') return '#208096'
  if (status === 'Title Search') return '#975a16'
  return '#627c71'
}

export default function DemoMattersPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading matters…</div>}>
      <DemoMattersContent />
    </Suspense>
  )
}

function DemoMattersContent() {
  const { matters, archiveMatter, archivedMatters } = useDemoStore()

  const [hoveredMatterId, setHoveredMatterId] = useState<string | null>(null)
  const [selectedMatter, setSelectedMatter] = useState<DemoMatter | null>(null)
  const didOpenFromQueryRef = useRef(false)
  const [isNewMatterOpen, setIsNewMatterOpen] = useState(false)
  const [showDemoCreationDisabledBanner, setShowDemoCreationDisabledBanner] = useState(false)
  const [copiedMatterId, setCopiedMatterId] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const selectedMatterFromQuery = searchParams.get('matter')

  const nextDemoFileId = useMemo(() => {
    const allFileIds = [...matters, ...archivedMatters].map((m) => m.file_id)
    return getNextDemoFileId(allFileIds)
  }, [matters, archivedMatters])

  useEffect(() => {
    if (didOpenFromQueryRef.current) return
    if (!selectedMatterFromQuery) return
    const match = matters.find((m) => m.file_id === selectedMatterFromQuery)
    if (!match) return
    didOpenFromQueryRef.current = true
    setSelectedMatter(match)
  }, [selectedMatterFromQuery, matters])

  useEffect(() => {
    if (!showDemoCreationDisabledBanner) return
    const t = window.setTimeout(() => setShowDemoCreationDisabledBanner(false), 8000)
    return () => window.clearTimeout(t)
  }, [showDemoCreationDisabledBanner])

  useEffect(() => {
    setSelectedMatter((prev) => {
      if (!prev) return null
      const fresh = matters.find((m) => m.id === prev.id)
      return fresh ?? prev
    })
  }, [matters])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Matters</h1>
          <p style={{ margin: 0, color: '#627c71' }}>Open matters for your demo firm.</p>
          <p style={{ marginTop: '6px', marginBottom: 0, color: '#627c71', fontSize: '12px' }}>
            Demo mode: archiving only affects this session and resets on refresh.
          </p>
        </div>
        <button
          type="button"
          style={{
            background: '#208096',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '6px',
            fontWeight: 800,
          }}
          onClick={() => setIsNewMatterOpen(true)}
        >
          + 
        </button>
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
          }}
        >
          <strong>Demo mode:</strong> matter created in-memory for this session.{' '}
          <Link href="/auth/signup" style={{ color: '#208096', fontWeight: 800, textDecoration: 'none' }}>
            Sign up to create real matters.
          </Link>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94,82,64,0.2)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>File</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Parties</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Property</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Closing</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }} />
            </tr>
          </thead>
          <tbody>
            {matters.map((m) => (
              <tr
                key={m.id}
                onClick={() => setSelectedMatter(m)}
                onMouseEnter={() => setHoveredMatterId(m.id)}
                onMouseLeave={() => setHoveredMatterId(null)}
                style={{
                  borderBottom: '1px solid rgba(94,82,64,0.12)',
                  cursor: 'pointer',
                  background: hoveredMatterId === m.id ? 'rgba(32, 128, 150, 0.07)' : 'white',
                }}
              >
                {(() => {
                  const partyRows = getMatterPartyDisplayRows(m)
                  return (
                    <>
                <td style={{ padding: '14px', color: '#134252', fontWeight: 800 }}>
                  <span style={{ color: '#208096', textDecoration: 'underline' }}>{m.file_id}</span>
                </td>
                <td style={{ padding: '14px', color: '#134252' }}>
                  {partyRows.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {partyRows.map((row) => (
                        <div key={`${m.id}-${row.label}`}>
                          <span style={{ fontWeight: 700 }}>{row.value}</span>
                          <span style={{ color: '#627c71', fontSize: '12px', marginLeft: 6 }}>{row.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#627c71', fontSize: '12px' }}>No parties added</div>
                  )}
                </td>
                <td style={{ padding: '14px', color: '#134252' }}>
                  <div style={{ fontWeight: 700 }}>{m.property.property_type}</div>
                  <div style={{ color: '#627c71', fontSize: '12px' }}>{m.property.address}</div>
                </td>
                <td style={{ padding: '14px', color: '#627c71' }}>
                  {new Date(m.key_dates.closing_date).toLocaleDateString()}
                </td>
                <td style={{ padding: '14px', color: statusColor(m.status), fontWeight: 800 }}>{m.status}</td>
                <td style={{ padding: '14px', whiteSpace: 'nowrap' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(`${window.location.origin}/demo/portal/${m.portal_token}`)
                      setCopiedMatterId(m.id)
                      setTimeout(() => setCopiedMatterId((prev) => (prev === m.id ? null : prev)), 2000)
                    }}
                    style={{
                      background: copiedMatterId === m.id ? '#0f766e' : 'none',
                      border: '1px solid #0f766e',
                      color: copiedMatterId === m.id ? 'white' : '#0f766e',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      marginRight: '6px',
                    }}
                  >
                    {copiedMatterId === m.id ? 'Copied!' : 'Copy Portal Link'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      const ok = window.confirm(
                        'Archive this matter? In demo mode this only hides it for this session and resets on refresh.'
                      )
                      if (ok) archiveMatter(m.id)
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(94,82,64,0.3)',
                      color: '#134252',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Archive
                  </button>
                </td>
                    </>
                  )
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {archivedMatters.length > 0 && (
        <p style={{ marginTop: '10px', fontSize: '12px', color: '#627c71' }}>
          {archivedMatters.length} matter(s) archived in this demo session.{' '}
          <Link href="/demo/archive/matters" style={{ color: '#208096' }}>
            View Archive
          </Link>
        </p>
      )}

      <NewMatterModal
        isOpen={isNewMatterOpen}
        onClose={() => setIsNewMatterOpen(false)}
        nextFileId={nextDemoFileId}
        onCreateDemo={() => {
          setIsNewMatterOpen(false)
          setShowDemoCreationDisabledBanner(true)
        }}
      />

      <MatterDetailModal
        matter={selectedMatter}
        open={selectedMatter !== null}
        onClose={() => setSelectedMatter(null)}
        onArchive={(id) => archiveMatter(id)}
      />
    </div>
  )
}
