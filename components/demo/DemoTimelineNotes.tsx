'use client'

import React, { useMemo, useState } from 'react'
import { useDemoData } from '@/context/DemoDataContext'

export default function DemoTimelineNotes({ matterId }: { matterId: string }) {
  const { matters, addNote } = useDemoData()
  const matter = matters.find((m) => m.id === matterId)
  const timeline = useMemo(() => matter?.timeline ?? [], [matter])
  const [noteDraft, setNoteDraft] = useState('')

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          addNote(matterId, noteDraft)
          setNoteDraft('')
        }}
        style={{ marginBottom: '10px' }}
      >
        <input
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="Add a demo note..."
          style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
        />
        <button
          type="submit"
          style={{ background: '#208096', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px' }}
        >
          Add note
        </button>
      </form>
      <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {timeline.filter((evt) => !evt.deletedAt).map((evt) => (
          <div key={evt.id} style={{ fontSize: '12px', borderLeft: '2px solid #208096', paddingLeft: '8px' }}>
            <div style={{ color: '#627c71' }}>{evt.at}</div>
            <div style={{ color: '#134252' }}>{evt.note}</div>
          </div>
        ))}
      </div>
    </>
  )
}

