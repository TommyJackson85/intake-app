/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import {
  focusInitialDialogElement,
  listFocusableElements,
  trapTabKeyInContainer,
} from '@/lib/a11y/focusTrap'

describe('focusTrap helpers', () => {
  it('lists focusable elements and traps Tab at edges', () => {
    document.body.innerHTML = `
      <div id="panel">
        <button id="a">A</button>
        <button id="b" disabled>B</button>
        <button id="c">C</button>
      </div>
    `
    const panel = document.getElementById('panel') as HTMLElement
    const focusable = listFocusableElements(panel)
    expect(focusable.map((el) => el.id)).toEqual(['a', 'c'])

    document.getElementById('c')!.focus()
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    const handled = trapTabKeyInContainer(panel, tabEvent)
    expect(handled).toBe(true)
    expect(document.activeElement?.id).toBe('a')

    document.getElementById('a')!.focus()
    const shiftTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    trapTabKeyInContainer(panel, shiftTab)
    expect(document.activeElement?.id).toBe('c')
  })

  it('focuses preferred initial element when present', () => {
    document.body.innerHTML = `
      <div id="panel" tabindex="-1">
        <button id="cancel" data-a11y-confirm-cancel>Cancel</button>
        <button id="ok">OK</button>
      </div>
    `
    const panel = document.getElementById('panel') as HTMLElement
    focusInitialDialogElement(panel, '[data-a11y-confirm-cancel]')
    expect(document.activeElement?.id).toBe('cancel')
  })
})
