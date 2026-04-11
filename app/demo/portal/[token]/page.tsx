'use client'

import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { demoSeedData, DEMO_MILESTONE_LOGS, MILESTONE_LABELS, MILESTONE_ORDER } from '@/lib/demo/demoData'
import type { MatterMilestoneStatus } from '@/lib/demo/types'

const DEMO_MATTERS = demoSeedData.matters

export default function ClientPortalPage() {
  const params = useParams()
  const token = typeof params.token === 'string' ? params.token : ''

  const matter = useMemo(
    () => DEMO_MATTERS.find((m) => m.portal_token === token) ?? null,
    [token],
  )

  const logs = useMemo(
    () => (matter ? DEMO_MILESTONE_LOGS.filter((l) => l.matter_id === matter.id) : []),
    [matter],
  )

  const completedStatuses = useMemo(
    () => new Set(logs.map((l) => l.status)),
    [logs],
  )

  if (!matter) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <h1 style={{ fontSize: 24, color: '#134252', marginBottom: 8 }}>Portal not found</h1>
          <p style={{ color: '#627c71', fontSize: 14 }}>This portal link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  // Find the next step (first milestone not completed)
  const nextStatus: MatterMilestoneStatus | null = MILESTONE_ORDER.find((s) => !completedStatuses.has(s)) ?? null

  // Current status = last completed milestone
  const lastCompleted = [...MILESTONE_ORDER].reverse().find((s) => completedStatuses.has(s))
  const currentLabel = lastCompleted ? MILESTONE_LABELS[lastCompleted] : 'Pending'

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ background: '#0f766e', color: 'white', padding: '28px 24px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: 6 }}>
            {matter.matter_type}
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>
            {matter.property.address}
          </h1>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
            File {matter.file_id}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
        {/* Current status card */}
        <div style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '20px 24px',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#627c71', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Current Status
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f766e' }}>
            {currentLabel}
          </div>
        </div>

        {/* Expected closing date card */}
        <div style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '20px 24px',
          marginBottom: 28,
          borderLeft: '4px solid #16a34a',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#627c71', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Expected Closing Date
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}>
            {new Date(matter.key_dates.closing_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Timeline */}
        <div style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '24px',
          marginBottom: 28,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#134252', marginBottom: 20 }}>
            Transaction Progress
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {MILESTONE_ORDER.map((status, idx) => {
              const isCompleted = completedStatuses.has(status)
              const isNext = status === nextStatus
              const isPending = !isCompleted && !isNext
              const isLast = idx === MILESTONE_ORDER.length - 1
              const log = logs.find((l) => l.status === status)

              let circleStyle: React.CSSProperties
              let circleContent: string
              let labelStyle: React.CSSProperties

              if (isCompleted) {
                circleStyle = {
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#0f766e',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }
                circleContent = '\u2713'
                labelStyle = { fontSize: 14, fontWeight: 600, color: '#134252' }
              } else if (isNext) {
                circleStyle = {
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'white',
                  border: '2px solid #d97706',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }
                circleContent = '\u2192'
                labelStyle = { fontSize: 14, fontWeight: 600, color: '#d97706' }
              } else {
                circleStyle = {
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'white',
                  border: '2px solid #d1d5db',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0,
                }
                circleContent = '\u25CB'
                labelStyle = { fontSize: 14, fontWeight: 500, color: '#9ca3af' }
              }

              return (
                <div key={status}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Timeline connector + circle */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={circleStyle}>{circleContent}</div>
                      {!isLast && (
                        <div style={{
                          width: 2,
                          height: 32,
                          background: isCompleted ? '#0f766e' : '#e5e7eb',
                        }} />
                      )}
                    </div>
                    {/* Label + meta */}
                    <div style={{ paddingTop: 3, paddingBottom: isLast ? 0 : 18 }}>
                      <div style={labelStyle}>
                        {MILESTONE_LABELS[status]}
                        {isNext && (
                          <span style={{
                            marginLeft: 10,
                            fontSize: 11,
                            fontWeight: 700,
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}>
                            Next step
                          </span>
                        )}
                      </div>
                      {isCompleted && log && (
                        <div style={{ fontSize: 12, color: '#627c71', marginTop: 2 }}>
                          {new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {log.note && <span> &mdash; {log.note}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Update history */}
        {logs.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '24px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#134252', marginBottom: 16 }}>
              Update History
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[...logs].reverse().map((log) => (
                <div key={log.id} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#134252' }}>
                      {log.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                      {new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  {log.note && (
                    <div style={{ fontSize: 13, color: '#627c71', marginTop: 4 }}>
                      {log.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 40 }}>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            Powered by LawIntake &middot; {demoSeedData.demoFirm.name}
          </div>
        </div>
      </div>
    </div>
  )
}
