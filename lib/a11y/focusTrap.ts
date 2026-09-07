/**
 * Small focus helpers for accessible dialogs (demo UI).
 * Pure / DOM-only — safe to unit-test under jsdom.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function listFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.getAttribute('aria-hidden') === 'true') return false
    if (el.tabIndex < 0) return false
    // Offset parent null can mean hidden; still allow fixed-position dialogs.
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    return true
  })
}

/** Keep Tab / Shift+Tab cycling inside `container`. Returns true when handled. */
export function trapTabKeyInContainer(container: HTMLElement, event: KeyboardEvent): boolean {
  if (event.key !== 'Tab') return false
  const focusable = listFocusableElements(container)
  if (focusable.length === 0) {
    event.preventDefault()
    container.focus()
    return true
  }
  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  const active = document.activeElement as HTMLElement | null

  if (event.shiftKey) {
    if (!active || active === first || !container.contains(active)) {
      event.preventDefault()
      last.focus()
      return true
    }
  } else if (!active || active === last || !container.contains(active)) {
    event.preventDefault()
    first.focus()
    return true
  }
  return false
}

export function focusInitialDialogElement(
  container: HTMLElement,
  preferredSelector?: string,
): void {
  const preferred = preferredSelector
    ? container.querySelector<HTMLElement>(preferredSelector)
    : null
  if (preferred) {
    preferred.focus()
    return
  }
  const focusable = listFocusableElements(container)
  ;(focusable[0] ?? container).focus()
}
