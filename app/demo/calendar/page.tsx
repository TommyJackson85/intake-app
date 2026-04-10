'use client'

import { useMemo } from 'react'
import { useDemoStore } from '@/lib/demo/store'

function kindBadge(kind: string) {
  if (kind === 'closing') return { bg: '#e8f5f0', fg: '#208096' }
  if (kind === 'deadline') return { bg: '#fff8e6', fg: '#975a16' }
  if (kind === 'client_call') return { bg: '#eef2ff', fg: '#3730a3' }
  return { bg: '#f5f5f5', fg: '#627c71' }
}

export default function DemoCalendarPage() {
  const { calendarEvents, staff, matters } = useDemoStore()

  const events = useMemo(
    () => [...calendarEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [calendarEvents]
  )

  return (
    <div>
      <h1 style={{ marginBottom: '6px', fontSize: '32px' }}>Calendar</h1>
      <p style={{ marginTop: 0, marginBottom: '24px', color: '#627c71' }}>
        Upcoming closings, deadlines, and client communications.
      </p>

      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid rgba(94,82,64,0.2)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fcfcf9', borderBottom: '1px solid rgba(94,82,64,0.2)' }}>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Date & time</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Event</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Matter</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Assigned</th>
              <th style={{ padding: '14px', textAlign: 'left', fontWeight: 800 }}>Location</th>
            </tr>
          </thead>
          <tbody>
            {events.map((evt) => {
              const matter = matters.find((m) => m.id === evt.matter_id)
              const assigned = staff.find((s) => s.id === evt.assigned_staff_id)
              const badge = kindBadge(evt.kind)
              return (
                <tr key={evt.id} style={{ borderBottom: '1px solid rgba(94,82,64,0.12)' }}>
                  <td style={{ padding: '14px', color: '#627c71' }}>{new Date(evt.date).toLocaleString()}</td>
                  <td style={{ padding: '14px', color: '#134252', fontWeight: 700 }}>
                    {evt.title}
                    <div>
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          background: badge.bg,
                          color: badge.fg,
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                        }}
                      >
                        {evt.kind.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px', color: '#627c71' }}>{matter?.file_id ?? evt.matter_id}</td>
                  <td style={{ padding: '14px', color: '#627c71' }}>{assigned?.full_name ?? 'Unassigned'}</td>
                  <td style={{ padding: '14px', color: '#627c71' }}>{evt.location}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
