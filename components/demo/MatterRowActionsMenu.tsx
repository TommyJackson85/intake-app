'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { listFocusableElements, trapTabKeyInContainer } from '@/lib/a11y/focusTrap'

export type MatterRowActionItem = {
  id: string
  label: string
  onSelect: () => void
  disabled?: boolean
  destructive?: boolean
}

type MatterRowActionsMenuProps = {
  matterFileId: string
  matterId: string
  items: MatterRowActionItem[]
}

/**
 * Keyboard-accessible actions menu for a matters list row.
 * Opens with Enter/Space, closes on Escape, restores focus to the trigger.
 */
export default function MatterRowActionsMenu({
  matterFileId,
  matterId,
  items,
}: MatterRowActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const menuId = useId()

  const closeMenu = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) {
      window.setTimeout(() => triggerRef.current?.focus(), 0)
    }
  }

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeMenu(true)
        return
      }
      if (menuRef.current) {
        trapTabKeyInContainer(menuRef.current, event)
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const focusable = menuRef.current ? listFocusableElements(menuRef.current) : []
        if (focusable.length === 0) return
        const active = document.activeElement as HTMLElement | null
        const idx = focusable.findIndex((el) => el === active)
        if (event.key === 'ArrowDown') {
          const next = focusable[(idx + 1 + focusable.length) % focusable.length]
          next?.focus()
        } else {
          const prev = focusable[(idx - 1 + focusable.length) % focusable.length]
          prev?.focus()
        }
      }
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      closeMenu(false)
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('mousedown', onPointerDown)
    const focusTimer = window.setTimeout(() => {
      const first = menuRef.current ? listFocusableElements(menuRef.current)[0] : null
      first?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('mousedown', onPointerDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- closeMenu is stable enough for this effect
  }, [open])

  if (items.length === 0) return null

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Actions for matter ${matterFileId}`}
        data-matter-actions-trigger={matterId}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            setOpen(true)
          }
        }}
        style={{
          background: '#fff',
          border: '1px solid rgba(94,82,64,0.3)',
          color: '#134252',
          borderRadius: '6px',
          padding: '6px 10px',
          fontSize: '12px',
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        Actions
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={`Actions for matter ${matterFileId}`}
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 4px)',
            minWidth: 200,
            background: '#fff',
            border: '1px solid rgba(94,82,64,0.25)',
            borderRadius: 8,
            boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
            zIndex: 20,
            padding: 4,
          }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation()
                if (item.disabled) return
                closeMenu(true)
                // Defer action so focus restore / menu unmount settle before dialogs open.
                window.setTimeout(() => item.onSelect(), 0)
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 13,
                fontWeight: 700,
                color: item.destructive ? '#b42318' : '#134252',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.5 : 1,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
