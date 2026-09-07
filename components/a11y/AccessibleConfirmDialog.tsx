'use client'

import { useId } from 'react'
import { useAccessibleDialog } from '@/hooks/useAccessibleDialog'

export type AccessibleConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  /** Destructive styling + confirms a risky action. */
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Accessible confirmation dialog: focus trap, Escape cancels, titled description,
 * restores focus to the trigger that opened it.
 */
export default function AccessibleConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: AccessibleConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const { panelRef } = useAccessibleDialog({
    open,
    onClose: onCancel,
    initialFocusSelector: '[data-a11y-confirm-cancel]',
    closeOnEscape: true,
    restoreFocus: true,
  })

  if (!open) return null

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        data-testid="demo-confirm-dialog"
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#fcfcf9',
          borderRadius: 10,
          border: '1px solid rgba(94,82,64,0.25)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
          padding: '20px 22px',
          outline: 'none',
        }}
      >
        <h2
          id={titleId}
          style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 900, color: '#134252' }}
        >
          {title}
        </h2>
        <p
          id={descriptionId}
          style={{ margin: '0 0 18px', fontSize: 14, lineHeight: 1.45, color: '#627c71' }}
        >
          {description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            data-a11y-confirm-cancel
            data-testid="demo-confirm-cancel"
            onClick={onCancel}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: '1px solid rgba(94,82,64,0.3)',
              background: '#fff',
              color: '#134252',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-a11y-confirm-ok
            onClick={onConfirm}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: 'none',
              background: destructive ? '#b42318' : '#208096',
              color: '#fff',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
