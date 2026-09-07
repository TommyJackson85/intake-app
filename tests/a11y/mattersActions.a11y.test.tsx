/** @vitest-environment jsdom */
import React, { useState } from 'react'
import { describe, expect, it, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import AccessibleConfirmDialog from '@/components/a11y/AccessibleConfirmDialog'
import MatterRowActionsMenu from '@/components/demo/MatterRowActionsMenu'

afterEach(() => {
  cleanup()
})

describe('AccessibleConfirmDialog', () => {
  it('exposes title and description, traps focus, Escape cancels, restores focus', async () => {
    const user = userEvent.setup()
    let confirmed = false
    let cancelled = false

    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Open archive
          </button>
          <AccessibleConfirmDialog
            open={open}
            destructive
            title="Archive matter FL-2026-001?"
            description="Archive FL-2026-001? This is a demo-only archive."
            confirmLabel="Archive matter"
            cancelLabel="Cancel"
            onConfirm={() => {
              confirmed = true
              setOpen(false)
            }}
            onCancel={() => {
              cancelled = true
              setOpen(false)
            }}
          />
        </div>
      )
    }

    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Open archive' })
    await user.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: 'Archive matter FL-2026-001?' })
    expect(dialog).toHaveAccessibleDescription('Archive FL-2026-001? This is a demo-only archive.')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    })

    await user.keyboard('{Tab}')
    expect(screen.getByRole('button', { name: 'Archive matter' })).toHaveFocus()
    await user.keyboard('{Tab}')
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(cancelled).toBe(true)
    await waitFor(() => {
      expect(trigger).toHaveFocus()
    })
    expect(confirmed).toBe(false)
  })
})

describe('MatterRowActionsMenu', () => {
  it('opens from keyboard, supports Escape, and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    let archived = false

    render(
      <MatterRowActionsMenu
        matterId="matter-1"
        matterFileId="FL-2026-001"
        items={[
          {
            id: 'archive',
            label: 'Archive',
            destructive: true,
            onSelect: () => {
              archived = true
            },
          },
          {
            id: 'copy',
            label: 'Copy portal link',
            onSelect: () => undefined,
          },
        ]}
      />,
    )

    const trigger = screen.getByRole('button', { name: 'Actions for matter FL-2026-001' })
    trigger.focus()
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('menu', { name: 'Actions for matter FL-2026-001' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toBeTruthy()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull()
      expect(trigger).toHaveFocus()
    })

    await user.click(trigger)
    await user.click(screen.getByRole('menuitem', { name: 'Archive' }))
    await waitFor(() => {
      expect(archived).toBe(true)
    })
  })
})
