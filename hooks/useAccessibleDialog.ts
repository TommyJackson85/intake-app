'use client'

import { useEffect, useRef } from 'react'
import {
  focusInitialDialogElement,
  trapTabKeyInContainer,
} from '@/lib/a11y/focusTrap'

type UseAccessibleDialogOptions = {
  open: boolean
  onClose: () => void
  /** CSS selector for preferred initial focus (e.g. cancel button). */
  initialFocusSelector?: string
  /** When false, Escape does not close (destructive flows that require an explicit choice). Default true. */
  closeOnEscape?: boolean
  /** Restore focus to the element that was focused when the dialog opened. Default true. */
  restoreFocus?: boolean
}

/**
 * Dialog a11y: Escape to close, focus trap, initial focus, restore focus on close.
 * Attach `panelRef` to the dialog panel (role=dialog element or inner panel).
 */
export function useAccessibleDialog({
  open,
  onClose,
  initialFocusSelector,
  closeOnEscape = true,
  restoreFocus = true,
}: UseAccessibleDialogOptions) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const panel = panelRef.current
    if (!panel) return

    // Defer so the dialog is in the DOM before focusing.
    const focusTimer = window.setTimeout(() => {
      focusInitialDialogElement(panel, initialFocusSelector)
    }, 0)

    const onKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }
      if (panelRef.current) {
        trapTabKeyInContainer(panelRef.current, event)
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = prevOverflow
      if (restoreFocus) {
        const prev = previouslyFocusedRef.current
        if (prev && typeof prev.focus === 'function') {
          window.setTimeout(() => prev.focus(), 0)
        }
      }
    }
  }, [open, onClose, initialFocusSelector, closeOnEscape, restoreFocus])

  return { panelRef }
}
