'use client'

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'

const ROLE_OPTIONS = [
  'Attorney / partner',
  'Paralegal',
  'Legal assistant or secretary',
  'Closing coordinator',
  'Practice or office manager',
  'Intake staff',
  'Other',
] as const

const TRACKING_OPTIONS = [
  'Email or shared inbox',
  'Practice-management software',
  'Spreadsheet or checklist',
  'Shared drive / document system',
  'CRM',
  'A mix of several tools',
  'Other',
] as const

const FRICTION_OPTIONS = [
  {
    value: 'Collecting initial client, property, and matter information',
  },
  { value: 'Gathering party names for conflict screening' },
  {
    value: 'Chasing contracts, IDs, signatures, lender information, or other documents',
  },
  { value: 'Knowing who owns the next action' },
  { value: 'Preparing a file for attorney or internal review' },
  {
    value: 'Knowing whether the matter is ready for engagement, opening, or handoff',
  },
  {
    value: 'Tracking transaction-specific diligence, such as condo or association items',
  },
  {
    value: 'We do not experience meaningful follow-up uncertainty',
    none: true,
  },
  { value: 'Other', other: true },
] as const

const FREQUENCY_OPTIONS = [
  'Most new matters',
  'Several times a week',
  'Several times a month',
  'Occasionally',
  'Rarely',
  'Not sure',
] as const

const CONVERSATION_OPTIONS = ['Yes', 'Maybe', 'Not right now'] as const

const FRICTION_NONE = 'We do not experience meaningful follow-up uncertainty'

type ConversationChoice = (typeof CONVERSATION_OPTIONS)[number] | ''

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

function optionRowStyle(disabled?: boolean): CSSProperties {
  return {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
    color: '#24444a',
    fontSize: '14px',
    fontWeight: 550,
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

export default function DashboardLayoutFeedbackInvite() {
  const baseId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const noticeRef = useRef<HTMLParagraphElement>(null)
  const fallbackRef = useRef<HTMLTextAreaElement>(null)

  const [open, setOpen] = useState(false)
  const [role, setRole] = useState('')
  const [roleOther, setRoleOther] = useState('')
  const [tracking, setTracking] = useState('')
  const [trackingOther, setTrackingOther] = useState('')
  const [friction, setFriction] = useState<string[]>([])
  const [frictionOther, setFrictionOther] = useState('')
  const [frictionError, setFrictionError] = useState('')
  const [frictionStatus, setFrictionStatus] = useState('')
  const [frequency, setFrequency] = useState('')
  const [comment, setComment] = useState('')
  const [conversation, setConversation] = useState<ConversationChoice>('')
  const [contact, setContact] = useState('')
  const [notice, setNotice] = useState(
    'There is no research inbox on this demo. Use Copy answers to keep your responses on your device.'
  )
  const [noticeEmphasized, setNoticeEmphasized] = useState(false)
  const [fallbackText, setFallbackText] = useState('')
  const [showFallback, setShowFallback] = useState(false)

  const noneSelected = friction.includes(FRICTION_NONE)
  const ordinarySelected = friction.filter((value) => value !== FRICTION_NONE)
  const showContact = conversation === 'Yes' || conversation === 'Maybe'

  useEffect(() => {
    if (!open) return
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    panelRef.current?.scrollIntoView({
      block: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [open])

  function toggleFriction(value: string, meta?: { none?: boolean; other?: boolean }) {
    setFriction((current) => {
      const isChecked = current.includes(value)
      let next = current

      if (meta?.none) {
        next = isChecked ? [] : [value]
      } else if (isChecked) {
        next = current.filter((item) => item !== value)
      } else if (current.includes(FRICTION_NONE)) {
        next = [value]
      } else if (current.filter((item) => item !== FRICTION_NONE).length >= 2) {
        setFrictionError('Please select up to two options.')
        return current
      } else {
        next = [...current.filter((item) => item !== FRICTION_NONE), value]
      }

      const ordinary = next.filter((item) => item !== FRICTION_NONE)
      if (next.includes(FRICTION_NONE)) {
        setFrictionError('')
        setFrictionStatus(
          'No meaningful uncertainty selected. Other options are unavailable until it is cleared.'
        )
      } else if (ordinary.length >= 2) {
        setFrictionError('')
        setFrictionStatus('Maximum of two options selected. Deselect one to choose another.')
      } else if (ordinary.length === 1) {
        setFrictionError('')
        setFrictionStatus('One option selected. You may select one more, or clear your choice.')
      } else {
        setFrictionError('')
        setFrictionStatus('')
      }

      return next
    })
  }

  function frictionDisabled(value: string, meta?: { none?: boolean }) {
    if (meta?.none) return ordinarySelected.length > 0
    if (noneSelected) return true
    if (ordinarySelected.length >= 2 && !friction.includes(value)) return true
    return false
  }

  function withOther(base: string, detail: string) {
    if (!base) return ''
    if (base !== 'Other') return base
    const trimmed = detail.trim()
    return trimmed ? `Other — ${trimmed}` : 'Other'
  }

  function frictionSummary() {
    if (!friction.length) return ''
    return friction
      .map((value) => {
        if (value !== 'Other') return value
        const detail = frictionOther.trim()
        return detail ? `Other — ${detail}` : 'Other'
      })
      .join('; ')
  }

  function buildAnswersText() {
    const lines = ['LawIntake workflow pulse check']
    const roleLine = withOther(role, roleOther)
    if (roleLine) lines.push('', `Role: ${roleLine}`)

    const trackingLine = withOther(tracking, trackingOther)
    if (trackingLine) lines.push(`Current intake tracking: ${trackingLine}`)

    const frictionLine = frictionSummary()
    if (frictionLine) lines.push(`Main follow-up / uncertainty: ${frictionLine}`)

    if (frequency) lines.push(`How often this slows a new matter: ${frequency}`)

    if (comment.trim()) lines.push(`Hardest to see or chase: ${comment.trim()}`)

    if (conversation) lines.push(`Open to a short research conversation: ${conversation}`)

    if (contact.trim() && showContact) lines.push(`Contact: ${contact.trim()}`)

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
    if (!friction.length) {
      setFrictionError('Please select at least one option (up to two).')
      const first = form.querySelector<HTMLInputElement>('input[name="friction"]')
      first?.focus()
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
      true
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
      true
    )
    fallbackRef.current?.focus()
    fallbackRef.current?.select()
  }

  return (
    <aside
      id="dashboard-layout-feedback"
      aria-labelledby={`${baseId}-heading`}
      style={{
        marginTop: '18px',
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
          gap: '0',
          justifyItems: 'start',
          textAlign: 'left',
        }}
      >
        <p
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '10px',
            margin: '0 0 8px',
            color: '#208096',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span
            aria-hidden="true"
            style={{ width: '24px', height: '2px', background: 'currentColor' }}
          />
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
            margin: '0 0 8px',
            fontSize: '18px',
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#134252',
          }}
        >
          Does this dashboard layout reflect how your team works?
        </h3>
        <p style={{ margin: '0 0 8px', color: '#3d565b', fontSize: '14px', lineHeight: 1.55 }}>
          This fictional Matter worklist is designed to make status, ownership, next actions,
          timing, and handoff blockers easier to see in one place.
        </p>
        <p style={{ margin: '0 0 16px', color: '#3d565b', fontSize: '14px', lineHeight: 1.55 }}>
          Tell us whether this layout feels useful for your real-estate matter workflow. The
          questionnaire takes about 60 seconds and does not ask for client or confidential
          information.
        </p>

        <div style={{ display: 'grid', gap: '8px', justifyItems: 'start', width: '100%' }}>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${baseId}-panel`}
            onClick={() => setOpen((value) => !value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
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
            {open ? 'Hide questionnaire' : 'Share feedback on this layout'}
            <span aria-hidden="true" style={{ marginLeft: '2px', fontSize: '16px', lineHeight: 1 }}>
              {open ? '▴' : '▾'}
            </span>
          </button>
          <p style={{ margin: 0, color: '#60787b', fontSize: '13px', lineHeight: 1.45 }}>
            Responses stay on your device unless you choose to copy or share them.
          </p>
        </div>
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
          <h4
            style={{
              margin: '0 0 8px',
              fontSize: '16px',
              fontWeight: 700,
              color: '#134252',
            }}
          >
            Does this reflect a workflow challenge your team faces?
          </h4>
          <p style={{ margin: '0 0 10px', color: '#3d565b', fontSize: '14px', lineHeight: 1.55 }}>
            Help shape LawIntake — 60 seconds. You have seen a fictional example of the workflow
            concept. Help validate whether similar follow-up, ownership, document, timing, and
            handoff issues arise in your team’s current process.
          </p>
          <p style={{ ...helpStyle(), marginBottom: '14px' }}>
            Responses stay on this device unless you choose to copy or share them. There is no
            research inbox on this page. Do not enter confidential, privileged, client, property,
            financial, or case-specific information.
          </p>

          <form
            ref={formRef}
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              void handleCopyAnswers()
            }}
            style={{ display: 'grid', gap: '16px' }}
          >
            <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'grid', gap: '8px' }}>
              <legend style={fieldLabelStyle()}>
                1. What best describes your role in residential real-estate matters?{' '}
                <span style={{ color: '#9f1239', fontWeight: 650 }}>(required)</span>
              </legend>
              <div style={{ display: 'grid', gap: '6px' }}>
                {ROLE_OPTIONS.map((option) => (
                  <label key={option} style={optionRowStyle()}>
                    <input
                      type="radio"
                      name={`${baseId}-role`}
                      value={option}
                      required
                      checked={role === option}
                      onChange={() => setRole(option)}
                      style={{ marginTop: '3px' }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {role === 'Other' ? (
                <div style={{ display: 'grid', gap: '6px' }}>
                  <label htmlFor={`${baseId}-role-other`} style={fieldLabelStyle()}>
                    Please describe your role{' '}
                    <span style={{ color: '#60787b', fontWeight: 550 }}>(optional)</span>
                  </label>
                  <input
                    id={`${baseId}-role-other`}
                    type="text"
                    maxLength={200}
                    autoComplete="off"
                    value={roleOther}
                    onChange={(event) => setRoleOther(event.target.value)}
                    style={inputStyle()}
                  />
                </div>
              ) : null}
            </fieldset>

            <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'grid', gap: '8px' }}>
              <legend style={fieldLabelStyle()}>
                2. Where is a new real-estate matter’s status mainly tracked today?{' '}
                <span style={{ color: '#9f1239', fontWeight: 650 }}>(required)</span>
              </legend>
              <div style={{ display: 'grid', gap: '6px' }}>
                {TRACKING_OPTIONS.map((option) => (
                  <label key={option} style={optionRowStyle()}>
                    <input
                      type="radio"
                      name={`${baseId}-tracking`}
                      value={option}
                      required
                      checked={tracking === option}
                      onChange={() => setTracking(option)}
                      style={{ marginTop: '3px' }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {tracking === 'Other' ? (
                <div style={{ display: 'grid', gap: '6px' }}>
                  <label htmlFor={`${baseId}-tracking-other`} style={fieldLabelStyle()}>
                    Please describe where it is tracked{' '}
                    <span style={{ color: '#60787b', fontWeight: 550 }}>(optional)</span>
                  </label>
                  <input
                    id={`${baseId}-tracking-other`}
                    type="text"
                    maxLength={200}
                    autoComplete="off"
                    value={trackingOther}
                    onChange={(event) => setTrackingOther(event.target.value)}
                    style={inputStyle()}
                  />
                </div>
              ) : null}
            </fieldset>

            <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'grid', gap: '8px' }}>
              <legend id={`${baseId}-friction-legend`} style={fieldLabelStyle()}>
                3. Which areas create the most follow-up or uncertainty? Select up to two.{' '}
                <span style={{ color: '#9f1239', fontWeight: 650 }}>(required)</span>
              </legend>
              <p id={`${baseId}-friction-help`} style={helpStyle()}>
                Choose one or two options. The “no meaningful uncertainty” option cannot be combined
                with other choices.
              </p>
              <div
                role="group"
                aria-labelledby={`${baseId}-friction-legend`}
                aria-describedby={`${baseId}-friction-help ${baseId}-friction-error ${baseId}-friction-status`}
                style={{ display: 'grid', gap: '6px' }}
              >
                {FRICTION_OPTIONS.map((option) => {
                  const disabled = frictionDisabled(option.value, {
                    none: 'none' in option && option.none,
                  })
                  return (
                    <label key={option.value} style={optionRowStyle(disabled)}>
                      <input
                        type="checkbox"
                        name="friction"
                        value={option.value}
                        checked={friction.includes(option.value)}
                        disabled={disabled}
                        onChange={() =>
                          toggleFriction(option.value, {
                            none: 'none' in option && option.none,
                            other: 'other' in option && option.other,
                          })
                        }
                        style={{ marginTop: '3px' }}
                      />
                      <span>{option.value}</span>
                    </label>
                  )
                })}
              </div>
              {frictionError ? (
                <p
                  id={`${baseId}-friction-error`}
                  role="alert"
                  style={{ margin: 0, color: '#9f1239', fontSize: '13px', fontWeight: 650 }}
                >
                  {frictionError}
                </p>
              ) : (
                <p id={`${baseId}-friction-error`} hidden />
              )}
              <p
                id={`${baseId}-friction-status`}
                className="sr-only"
                aria-live="polite"
                style={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: 0,
                }}
              >
                {frictionStatus}
              </p>
              {friction.includes('Other') ? (
                <div style={{ display: 'grid', gap: '6px' }}>
                  <label htmlFor={`${baseId}-friction-other`} style={fieldLabelStyle()}>
                    Please describe the other source of uncertainty{' '}
                    <span style={{ color: '#60787b', fontWeight: 550 }}>(optional)</span>
                  </label>
                  <input
                    id={`${baseId}-friction-other`}
                    type="text"
                    maxLength={200}
                    autoComplete="off"
                    value={frictionOther}
                    onChange={(event) => setFrictionOther(event.target.value)}
                    style={inputStyle()}
                  />
                </div>
              ) : null}
            </fieldset>

            <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'grid', gap: '8px' }}>
              <legend style={fieldLabelStyle()}>
                4. How often do incomplete information, missing documents, unclear ownership,
                unclear timing, or unclear handoffs slow a new real-estate matter?{' '}
                <span style={{ color: '#9f1239', fontWeight: 650 }}>(required)</span>
              </legend>
              <div style={{ display: 'grid', gap: '6px' }}>
                {FREQUENCY_OPTIONS.map((option) => (
                  <label key={option} style={optionRowStyle()}>
                    <input
                      type="radio"
                      name={`${baseId}-frequency`}
                      value={option}
                      required
                      checked={frequency === option}
                      onChange={() => setFrequency(option)}
                      style={{ marginTop: '3px' }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div style={{ display: 'grid', gap: '6px' }}>
              <label htmlFor={`${baseId}-comment`} style={fieldLabelStyle()}>
                5. Thinking of a recent new matter, what information, document, owner, timing, or
                handoff step was hardest to see or chase?{' '}
                <span style={{ color: '#60787b', fontWeight: 550 }}>(optional)</span>
              </label>
              <textarea
                id={`${baseId}-comment`}
                rows={3}
                maxLength={2000}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                style={{ ...inputStyle(), resize: 'vertical' }}
              />
              <p style={helpStyle()}>
                Please keep your answer general. Do not include client names, property addresses,
                financial details, confidential information, or privileged information.
              </p>
            </div>

            <fieldset style={{ margin: 0, padding: 0, border: 0, display: 'grid', gap: '8px' }}>
              <legend style={fieldLabelStyle()}>
                Would you be open to a short, no-obligation research conversation about your current
                workflow? <span style={{ color: '#60787b', fontWeight: 550 }}>(optional)</span>
              </legend>
              <div style={{ display: 'grid', gap: '6px' }}>
                {CONVERSATION_OPTIONS.map((option) => (
                  <label key={option} style={optionRowStyle()}>
                    <input
                      type="radio"
                      name={`${baseId}-conversation`}
                      value={option}
                      checked={conversation === option}
                      onChange={() => setConversation(option)}
                      style={{ marginTop: '3px' }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {showContact ? (
                <div style={{ display: 'grid', gap: '6px' }}>
                  <label htmlFor={`${baseId}-contact`} style={fieldLabelStyle()}>
                    Optional contact detail{' '}
                    <span style={{ color: '#60787b', fontWeight: 550 }}>(optional)</span>
                  </label>
                  <input
                    id={`${baseId}-contact`}
                    type="text"
                    maxLength={320}
                    autoComplete="off"
                    inputMode="email"
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    style={inputStyle()}
                  />
                  <p style={helpStyle()}>
                    Only add a contact detail if you are comfortable sharing it. Responses remain on
                    this device unless you choose to copy or share them.
                  </p>
                </div>
              ) : null}
            </fieldset>

            <p style={helpStyle()}>
              There is no research inbox on this page. Do not enter confidential information.
              LawIntake does not receive, store, analyse, or respond to these answers automatically.
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
                  style={{ ...inputStyle(), resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '12px' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => void handleCopyAgain()}
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
