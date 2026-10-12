'use client'

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'

const EASE_OPTIONS = [
  'Very easy',
  'Mostly easy',
  'Somewhat difficult',
  'Very difficult',
  'Not sure',
] as const
const CLARITY_OPTIONS = [
  'Very clear',
  'Mostly clear',
  'Somewhat unclear',
  'Very unclear',
  'Not sure',
] as const
const HELP_OPTIONS = ['Yes', 'Possibly', 'No', 'Not sure'] as const

/** Distinct from dashboard / New intake questionnaire answer titles. */
const QUESTIONNAIRE_ID = 'LawIntake existing-matter-view research feedback'

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }
  return false
}

function fieldLabelStyle(): CSSProperties {
  return {
    margin: 0,
    color: '#134252',
    fontWeight: 700,
    fontSize: '14px',
    lineHeight: 1.4,
  }
}

function helpStyle(): CSSProperties {
  return {
    margin: 0,
    color: '#60787b',
    fontSize: '13px',
    lineHeight: 1.45,
  }
}

function inputStyle(): CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    color: '#134252',
    background: 'white',
    border: '1px solid rgba(15, 39, 66, 0.18)',
    borderRadius: '8px',
    font: 'inherit',
    fontSize: '14px',
  }
}

function optionRowStyle(): CSSProperties {
  return {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    color: '#24444a',
    fontSize: '14px',
    fontWeight: 550,
    cursor: 'pointer',
  }
}

/** Local-only research questionnaire for the existing-matter detail modal (separate from matter data). */
export default function MatterViewFeedbackInvite() {
  const baseId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const noticeRef = useRef<HTMLParagraphElement>(null)
  const fallbackRef = useRef<HTMLTextAreaElement>(null)

  const [open, setOpen] = useState(false)
  const [currentPositionEase, setCurrentPositionEase] = useState('')
  const [nextActionClarity, setNextActionClarity] = useState('')
  const [missingDetails, setMissingDetails] = useState('')
  const [fewerFollowUps, setFewerFollowUps] = useState('')
  const [oneChange, setOneChange] = useState('')
  const [notice, setNotice] = useState(
    'There is no research inbox on this demo. Use Copy answers to keep your responses on your device.',
  )
  const [noticeEmphasized, setNoticeEmphasized] = useState(false)
  const [fallbackText, setFallbackText] = useState('')
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    if (!open) return
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    panelRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [open])

  function buildAnswersText() {
    const lines = [QUESTIONNAIRE_ID]
    if (currentPositionEase) lines.push('', `Ease understanding current position: ${currentPositionEase}`)
    if (nextActionClarity) lines.push(`Next action / ownership clarity: ${nextActionClarity}`)
    if (missingDetails.trim()) lines.push(`Missing or hard-to-find information: ${missingDetails.trim()}`)
    if (fewerFollowUps) {
      lines.push(`Would help review progress without extra messages/updates: ${fewerFollowUps}`)
    }
    if (oneChange.trim()) lines.push(`One useful change: ${oneChange.trim()}`)
    return lines.join('\n')
  }

  function publishNotice(message: string, emphasize = false) {
    setNotice(message)
    setNoticeEmphasized(emphasize)
    queueMicrotask(() => noticeRef.current?.focus())
  }

  async function handleCopyAnswers() {
    const form = formRef.current
    if (!form) return
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }

    const summary = buildAnswersText()
    const copied = await copyText(summary)
    if (copied) {
      setShowFallback(false)
      setFallbackText('')
      publishNotice('Your answers were copied on this device.', true)
      return
    }

    setFallbackText(summary)
    setShowFallback(true)
    publishNotice(
      'Automatic copying was unavailable. Your answers are shown below so you can copy them manually.',
      true,
    )
    queueMicrotask(() => {
      fallbackRef.current?.focus()
      fallbackRef.current?.select()
    })
  }

  async function handleCopyAgain() {
    const summary = fallbackText || buildAnswersText()
    const copied = await copyText(summary)
    publishNotice(
      copied
        ? 'Your answers were copied on this device.'
        : 'Copying is still unavailable. Please select the text and copy it manually.',
      true,
    )
    fallbackRef.current?.focus()
    fallbackRef.current?.select()
  }

  return (
    <aside
      id="matter-view-feedback"
      data-questionnaire-id="existing-matter-view-research-feedback"
      aria-labelledby={`${baseId}-heading`}
      style={{
        padding: '16px 18px',
        background:
          'linear-gradient(165deg, rgba(220, 239, 233, 0.55), rgba(255, 255, 255, 0.92)), white',
        border: '1px solid rgba(23, 124, 128, 0.22)',
        borderLeft: '4px solid #208096',
        borderRadius: '12px',
        boxShadow: '0 10px 28px rgba(6, 42, 49, 0.06)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '12px',
          justifyItems: 'start',
          alignItems: 'stretch',
        }}
      >
        <p
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '10px',
            margin: 0,
            color: '#208096',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span aria-hidden="true" style={{ width: '24px', height: '2px', background: 'currentColor' }} />
          Research feedback
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              color: '#24444a',
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(12, 60, 68, 0.14)',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: 750,
              letterSpacing: '0.08em',
            }}
          >
            60-second questionnaire
          </span>
        </p>
        <h3
          id={`${baseId}-heading`}
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#134252',
            maxWidth: '100%',
            overflowWrap: 'anywhere',
          }}
        >
          Does this existing matter view give your team the information it needs?
        </h3>
        <div style={{ display: 'grid', gap: '8px', maxWidth: '100%' }}>
          <p
            style={{
              margin: 0,
              color: '#3d565b',
              fontSize: '14px',
              lineHeight: 1.55,
              overflowWrap: 'anywhere',
            }}
          >
            This fictional matter view is designed to help your team understand the current position, review ownership
            and next actions, and identify anything delaying progress.
          </p>
          <p
            style={{
              margin: 0,
              color: '#3d565b',
              fontSize: '14px',
              lineHeight: 1.55,
              overflowWrap: 'anywhere',
            }}
          >
            Tell us whether this view fits how your team reviews existing real-estate matters. The questionnaire takes
            about 60 seconds and does not ask for client or confidential information.
          </p>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${baseId}-panel`}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setOpen((value) => !value)
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            width: 'fit-content',
            maxWidth: '100%',
            background: '#208096',
            color: 'white',
            padding: '12px 18px',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'normal',
            textAlign: 'left',
            justifySelf: 'start',
          }}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
            <path
              d="M4 3.75h12A1.75 1.75 0 0 1 17.75 5.5v7A1.75 1.75 0 0 1 16 14.25H9.2L5.8 16.7a.6.6 0 0 1-.95-.49V14.25H4A1.75 1.75 0 0 1 2.25 12.5v-7A1.75 1.75 0 0 1 4 3.75Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M6.25 8.25h7.5M6.25 11h4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {open ? 'Hide questionnaire' : 'Share feedback on this matter view'}
          <span aria-hidden="true" style={{ marginLeft: '2px', fontSize: '16px', lineHeight: 1 }}>
            {open ? '▴' : '▾'}
          </span>
        </button>
        <p
          style={{
            margin: 0,
            maxWidth: '100%',
            color: '#60787b',
            fontSize: '13px',
            lineHeight: 1.45,
            overflowWrap: 'anywhere',
          }}
        >
          Responses stay on your device unless you choose to copy or share them.
        </p>
      </div>

      {open ? (
        <div
          id={`${baseId}-panel`}
          ref={panelRef}
          style={{
            marginTop: '18px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(23, 124, 128, 0.16)',
          }}
        >
          <p style={{ ...helpStyle(), marginBottom: '14px' }}>
            Responses stay on this device unless you choose to copy or share them. There is no research inbox on this
            page. Do not enter confidential, privileged, client, property, financial, or case-specific information.
          </p>

          <form
            ref={formRef}
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void handleCopyAnswers()
            }}
            style={{ display: 'grid', gap: '16px' }}
          >
            <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'grid', gap: '8px' }}>
              <legend style={fieldLabelStyle()}>
                1. How easy is it to understand the current position of this matter?{' '}
                <span style={{ color: '#9f1239', fontWeight: 650 }}>(required)</span>
              </legend>
              <div style={{ display: 'grid', gap: '6px' }}>
                {EASE_OPTIONS.map((option) => (
                  <label key={option} style={optionRowStyle()}>
                    <input
                      type="radio"
                      name={`${baseId}-ease`}
                      value={option}
                      required
                      checked={currentPositionEase === option}
                      onChange={() => setCurrentPositionEase(option)}
                      style={{ marginTop: '3px' }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'grid', gap: '8px' }}>
              <legend style={fieldLabelStyle()}>
                2. Is it clear what needs to happen next and who is responsible?{' '}
                <span style={{ color: '#9f1239', fontWeight: 650 }}>(required)</span>
              </legend>
              <div style={{ display: 'grid', gap: '6px' }}>
                {CLARITY_OPTIONS.map((option) => (
                  <label key={option} style={optionRowStyle()}>
                    <input
                      type="radio"
                      name={`${baseId}-clarity`}
                      value={option}
                      required
                      checked={nextActionClarity === option}
                      onChange={() => setNextActionClarity(option)}
                      style={{ marginTop: '3px' }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div style={{ display: 'grid', gap: '6px' }}>
              <label htmlFor={`${baseId}-missing`} style={fieldLabelStyle()}>
                3. What information is missing or difficult to find?{' '}
                <span style={{ color: '#60787b', fontWeight: 550 }}>(optional)</span>
              </label>
              <textarea
                id={`${baseId}-missing`}
                rows={3}
                maxLength={2000}
                value={missingDetails}
                onChange={(event) => setMissingDetails(event.target.value)}
                placeholder="Please describe the type of information, not actual client or matter details."
                style={{ ...inputStyle(), resize: 'vertical' }}
              />
            </div>

            <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'grid', gap: '8px' }}>
              <legend style={fieldLabelStyle()}>
                4. Would this view help your team review progress without needing additional messages or updates?{' '}
                <span style={{ color: '#9f1239', fontWeight: 650 }}>(required)</span>
              </legend>
              <div style={{ display: 'grid', gap: '6px' }}>
                {HELP_OPTIONS.map((option) => (
                  <label key={option} style={optionRowStyle()}>
                    <input
                      type="radio"
                      name={`${baseId}-help`}
                      value={option}
                      required
                      checked={fewerFollowUps === option}
                      onChange={() => setFewerFollowUps(option)}
                      style={{ marginTop: '3px' }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div style={{ display: 'grid', gap: '6px' }}>
              <label htmlFor={`${baseId}-change`} style={fieldLabelStyle()}>
                5. What one change would make this existing matter view more useful?{' '}
                <span style={{ color: '#60787b', fontWeight: 550 }}>(optional)</span>
              </label>
              <textarea
                id={`${baseId}-change`}
                rows={3}
                maxLength={2000}
                value={oneChange}
                onChange={(event) => setOneChange(event.target.value)}
                style={{ ...inputStyle(), resize: 'vertical' }}
              />
              <p style={helpStyle()}>
                Please keep your answer general. Do not include client names, property addresses, financial details,
                confidential information, or privileged information.
              </p>
            </div>

            <p style={helpStyle()}>
              There is no research inbox on this page. Do not enter confidential information. LawIntake does not
              receive, store, analyse, or respond to these answers automatically.
            </p>

            <p
              ref={noticeRef}
              tabIndex={-1}
              role="status"
              aria-live="polite"
              style={{
                margin: 0,
                padding: '10px 12px',
                color: noticeEmphasized ? '#134252' : '#3d565b',
                background: noticeEmphasized ? 'rgba(32, 128, 150, 0.1)' : 'rgba(94, 82, 64, 0.06)',
                borderRadius: '8px',
                fontSize: '13px',
                lineHeight: 1.5,
                outline: 'none',
              }}
            >
              {notice}
            </p>

            {showFallback ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                <label htmlFor={`${baseId}-fallback`} style={fieldLabelStyle()}>
                  Your answers (copy manually if needed)
                </label>
                <textarea
                  id={`${baseId}-fallback`}
                  ref={fallbackRef}
                  rows={8}
                  readOnly
                  value={fallbackText}
                  style={{
                    ...inputStyle(),
                    resize: 'vertical',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: '12px',
                  }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      void handleCopyAgain()
                    }}
                    style={{
                      background: 'rgba(94, 82, 64, 0.12)',
                      color: '#134252',
                      padding: '10px 14px',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Copy again
                  </button>
                </div>
              </div>
            ) : null}

            <div>
              <button
                type="submit"
                style={{
                  background: '#208096',
                  color: 'white',
                  padding: '12px 18px',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Copy answers
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </aside>
  )
}
