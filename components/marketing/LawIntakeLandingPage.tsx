'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import '@/styles/marketing-landing.css'

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32" role="img">
        <path d="M16 5v20M9 8h14M11 8 6 18h10L11 8Zm10 0-5 10h10L21 8ZM10 26h12" />
      </svg>
    </span>
  )
}

export default function LawIntakeLandingPage() {
  const [navOpen, setNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const year = new Date().getFullYear()

  const closeNavigation = () => setNavOpen(false)

  useEffect(() => {
    document.body.classList.toggle('lawintake-nav-open', navOpen)
    return () => document.body.classList.remove('lawintake-nav-open')
  }, [navOpen])

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 12)
    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && navOpen) {
        closeNavigation()
      }
    }
    const onResize = () => {
      if (window.innerWidth > 800) closeNavigation()
    }
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
    }
  }, [navOpen])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const revealItems = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const revealNode = (item: Element) => item.classList.add('visible')

    const revealHashTarget = () => {
      const id = window.location.hash.slice(1)
      if (!id) return null
      let target: HTMLElement | null = null
      try {
        target = document.getElementById(id)
      } catch {
        return null
      }
      if (!target || !root.contains(target)) return null
      if (target.hasAttribute('data-reveal')) revealNode(target)
      target.querySelectorAll?.('[data-reveal]')?.forEach(revealNode)
      let parent = target.parentElement
      while (parent) {
        if (parent.hasAttribute?.('data-reveal')) revealNode(parent)
        parent = parent.parentElement
      }
      target.scrollIntoView({ block: 'start', behavior: 'auto' })
      return target
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach(revealNode)
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              revealNode(entry.target)
              observer.unobserve(entry.target)
            }
          })
        },
        { rootMargin: '0px 0px -4% 0px', threshold: 0 },
      )

      revealItems.forEach((item) => {
        if (item.classList.contains('article-body')) {
          revealNode(item)
          return
        }
        observer.observe(item)
      })

      revealHashTarget()
      window.addEventListener('hashchange', revealHashTarget)
      return () => {
        observer.disconnect()
        window.removeEventListener('hashchange', revealHashTarget)
      }
    }

    revealHashTarget()
    window.addEventListener('hashchange', revealHashTarget)
    return () => window.removeEventListener('hashchange', revealHashTarget)
  }, [])

  return (
    <div className="lawintake-landing" ref={rootRef}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
        <div className="container nav-wrap">
          <a className="brand" href="#top" aria-label="LawIntake home">
            <BrandMark />
            <span>LawIntake</span>
          </a>

          <button
            className="nav-toggle"
            type="button"
            aria-expanded={navOpen}
            aria-controls="site-nav"
            onClick={() => setNavOpen((open) => !open)}
          >
            <span className="sr-only">Toggle navigation</span>
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav id="site-nav" className={`site-nav${navOpen ? ' open' : ''}`} aria-label="Primary navigation">
            <a href="#product" onClick={closeNavigation}>
              Product
            </a>
            <a href="#workflow" onClick={closeNavigation}>
              Workflow
            </a>
            <a href="#trust" onClick={closeNavigation}>
              Trust
            </a>
            <a href="/insights/" onClick={closeNavigation}>
              Insights
            </a>
            <a href="https://github.com/TommyJackson85/intake-app" onClick={closeNavigation}>
              GitHub
            </a>
            <Link className="button button-small" href="/demo" onClick={closeNavigation}>
              Explore the demo
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <section id="top" className="hero">
          <div className="hero-glow hero-glow-one" aria-hidden="true"></div>
          <div className="hero-glow hero-glow-two" aria-hidden="true"></div>
          <div className="container hero-grid">
            <div className="hero-copy" data-reveal>
              <p className="eyebrow">
                <span></span> Built for modern real estate law firms
              </p>
              <h1>
                Turn every new inquiry into an <em>organized matter.</em>
              </h1>
              <p className="hero-intro">
                LawIntake brings client intake, matter details, documents, and compliance workflows into one focused
                workspace—so your team can move work forward with confidence.
              </p>
              <div className="hero-actions">
                <div className="hero-cta-stack">
                  <a className="button" href="/product/sample-workspace/" target="_blank" rel="noopener noreferrer">
                    <svg
                      className="button-icon"
                      viewBox="0 0 20 20"
                      width="18"
                      height="18"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <rect x="2.5" y="3" width="15" height="14" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path
                        d="M2.5 8h15M2.5 13h15M8 3v14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    View sample data
                  </a>
                  <Link className="button button-secondary" href="/demo">
                    Explore the interactive demo
                    <svg
                      className="button-icon button-icon--trail"
                      viewBox="0 0 20 20"
                      width="18"
                      height="18"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <rect x="2" y="2.5" width="11.5" height="9.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M2 5.5h11.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path
                        d="M10.2 9.8 10.2 17.4 12.5 15.2 14.1 18.4 15.7 17.6 14.1 14.5 16.8 14.5Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="0.4"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                  <p className="hero-cta-help">Fictional workflow example + 60-second research questions</p>
                </div>
                <a className="text-link" href="https://github.com/TommyJackson85/intake-app">
                  View the source <span aria-hidden="true">→</span>
                </a>
              </div>
              <ul className="hero-points" aria-label="Product highlights">
                <li>
                  <span aria-hidden="true">✓</span> Guided intake
                </li>
                <li>
                  <span aria-hidden="true">✓</span> Matter workspace
                </li>
                <li>
                  <span aria-hidden="true">✓</span> Audit-ready activity
                </li>
              </ul>
            </div>

            <div className="product-preview" data-reveal>
              <div className="preview-window">
                <div className="window-bar">
                  <div className="window-dots" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="window-title">Matter workspace</span>
                  <span className="secure-label">
                    <span aria-hidden="true">◆</span> Secure
                  </span>
                </div>
                <div className="preview-body">
                  <aside className="preview-sidebar" aria-hidden="true">
                    <div className="mini-brand">L</div>
                    <span className="side-item active"></span>
                    <span className="side-item"></span>
                    <span className="side-item"></span>
                    <span className="side-item"></span>
                  </aside>
                  <div className="preview-content">
                    <div className="preview-heading">
                      <div>
                        <span className="label">MATTER 2026-0148</span>
                        <h2>Oceanview Closing</h2>
                      </div>
                      <span className="status">On track</span>
                    </div>
                    <div className="progress-card">
                      <div className="progress-top">
                        <span>Closing readiness</span>
                        <strong>72%</strong>
                      </div>
                      <div className="progress-track">
                        <span></span>
                      </div>
                      <div className="progress-steps">
                        <span className="done">Intake</span>
                        <span className="done">Identity</span>
                        <span className="current">Documents</span>
                        <span>Review</span>
                      </div>
                    </div>
                    <div className="preview-columns">
                      <div className="panel">
                        <div className="panel-title">
                          <span>Client details</span>
                          <span>•••</span>
                        </div>
                        <div className="client-row">
                          <span className="avatar">JM</span>
                          <div>
                            <strong>Jordan Miller</strong>
                            <small>Buyer</small>
                          </div>
                        </div>
                        <dl>
                          <div>
                            <dt>Property</dt>
                            <dd>Miami, Florida</dd>
                          </div>
                          <div>
                            <dt>Transaction</dt>
                            <dd>Residential purchase</dd>
                          </div>
                          <div>
                            <dt>Target close</dt>
                            <dd>September 18</dd>
                          </div>
                        </dl>
                      </div>
                      <div className="panel task-panel">
                        <div className="panel-title">
                          <span>Next actions</span>
                          <span className="task-count">3</span>
                        </div>
                        <label>
                          <input type="checkbox" defaultChecked disabled />
                          <span>Client intake reviewed</span>
                        </label>
                        <label>
                          <input type="checkbox" defaultChecked disabled />
                          <span>Identity documents received</span>
                        </label>
                        <label>
                          <input type="checkbox" disabled />
                          <span>Complete risk review</span>
                        </label>
                        <label>
                          <input type="checkbox" disabled />
                          <span>Send engagement letter</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="floating-card">
                <span className="floating-icon" aria-hidden="true">
                  ✓
                </span>
                <div>
                  <strong>Intake complete</strong>
                  <small>All required fields received</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="proof-strip" aria-label="Core capabilities">
          <div className="container proof-grid">
            <p>One clear system for</p>
            <span>CLIENT INTAKE</span>
            <span>MATTER TRACKING</span>
            <span>DOCUMENTS</span>
            <span>AML WORKFLOWS</span>
          </div>
        </section>

        <section id="product" className="section">
          <div className="container">
            <div className="section-heading" data-reveal>
              <div>
                <p className="eyebrow">
                  <span></span> The workspace
                </p>
                <h2>
                  Less chasing.
                  <br />
                  More practicing.
                </h2>
              </div>
              <p>Replace scattered forms, inbox threads, and hand-built trackers with a single view of every client and matter.</p>
            </div>

            <div className="feature-grid">
              <article className="feature-card feature-card-large" data-reveal>
                <div className="feature-icon" aria-hidden="true">
                  01
                </div>
                <div className="feature-copy">
                  <p className="card-kicker">Structured from the start</p>
                  <h3>Intake that arrives ready to review</h3>
                  <p>
                    Collect the people, property, ownership, and transaction details your team needs through a guided
                    client experience.
                  </p>
                </div>
                <div className="form-illustration" aria-hidden="true">
                  <div className="form-top">
                    <span>New client intake</span>
                    <small>3 of 4</small>
                  </div>
                  <div className="form-progress">
                    <span></span>
                  </div>
                  <div className="form-row">
                    <span>Property address</span>
                    <strong>240 Ocean Drive</strong>
                  </div>
                  <div className="form-split">
                    <div>
                      <span>Transaction</span>
                      <strong>Purchase</strong>
                    </div>
                    <div>
                      <span>Entity</span>
                      <strong>Individual</strong>
                    </div>
                  </div>
                  <button type="button" tabIndex={-1}>
                    Continue →
                  </button>
                </div>
              </article>

              <article className="feature-card dark-card" data-reveal>
                <div className="feature-icon gold" aria-hidden="true">
                  02
                </div>
                <p className="card-kicker">Designed for the work</p>
                <h3>Every detail in context</h3>
                <p>Keep contacts, notes, tasks, documents, and milestones attached to the matter they belong to.</p>
                <div className="stack-illustration" aria-hidden="true">
                  <span>
                    <b>01</b> Client &amp; parties <i>Ready</i>
                  </span>
                  <span>
                    <b>02</b> Property details <i>Ready</i>
                  </span>
                  <span>
                    <b>03</b> Due diligence <i>In review</i>
                  </span>
                </div>
              </article>

              <article className="feature-card mint-card" data-reveal>
                <div className="feature-icon" aria-hidden="true">
                  03
                </div>
                <p className="card-kicker">Built-in visibility</p>
                <h3>Know what needs attention</h3>
                <p>Surface incomplete steps and upcoming work before they become bottlenecks.</p>
                <div className="signal-illustration" aria-hidden="true">
                  <div>
                    <span>Intake quality</span>
                    <strong>Complete</strong>
                  </div>
                  <div>
                    <span>Documents</span>
                    <strong>2 requested</strong>
                  </div>
                  <div>
                    <span>Risk review</span>
                    <strong>Pending</strong>
                  </div>
                </div>
              </article>
            </div>

            <div className="insights-preview-actions" data-reveal>
              <a className="text-link" href="/product/sample-workspace/">
                View sample matter workspace <span aria-hidden="true">→</span>
              </a>
              <a className="text-link" href="/product/sample-workspace/#research-pulse-check">
                Take the research survey <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

        <section id="workflow" className="section workflow-section">
          <div className="container workflow-grid">
            <div className="workflow-copy" data-reveal>
              <p className="eyebrow light">
                <span></span> One connected workflow
              </p>
              <h2>From first contact to closing table.</h2>
              <p>Give the team a shared process without forcing every matter into the same mold.</p>
              <Link className="text-link light-link" href="/demo">
                See the workflow in action <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <ol className="workflow-list">
              <li data-reveal>
                <span className="step-number">01</span>
                <div>
                  <h3>Invite the client</h3>
                  <p>Send a secure intake link built for the transaction.</p>
                </div>
              </li>
              <li data-reveal>
                <span className="step-number">02</span>
                <div>
                  <h3>Review and qualify</h3>
                  <p>See complete details, documents, and risk signals together.</p>
                </div>
              </li>
              <li data-reveal>
                <span className="step-number">03</span>
                <div>
                  <h3>Open the matter</h3>
                  <p>Carry verified intake data forward without entering it again.</p>
                </div>
              </li>
              <li data-reveal>
                <span className="step-number">04</span>
                <div>
                  <h3>Keep work moving</h3>
                  <p>Track milestones, tasks, notes, and client requests through close.</p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section id="trust" className="section trust-section">
          <div className="container trust-grid">
            <div className="trust-badge" data-reveal aria-hidden="true">
              <div className="shield">
                <svg viewBox="0 0 100 116">
                  <path d="M50 4 91 19v31c0 29-17 50-41 62C26 100 9 79 9 50V19L50 4Z" />
                  <path d="m32 57 12 12 26-29" />
                </svg>
              </div>
              <span>
                SECURITY-MINDED
                <br />
                BY DESIGN
              </span>
            </div>
            <div className="trust-copy" data-reveal>
              <p className="eyebrow">
                <span></span> Trust is foundational
              </p>
              <h2>Client information deserves deliberate protection.</h2>
              <p>
                LawIntake is designed around firm-level data separation, controlled access, audit trails, and practical
                data-subject tools.
              </p>
              <div className="trust-points">
                <div>
                  <strong>Firm isolation</strong>
                  <span>Tenant-aware data access</span>
                </div>
                <div>
                  <strong>Activity history</strong>
                  <span>Traceable workflow events</span>
                </div>
                <div>
                  <strong>Data controls</strong>
                  <span>Export and deletion workflows</span>
                </div>
                <div>
                  <strong>Secure portal</strong>
                  <span>Token-based client access</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="insights" className="section insights-preview" aria-labelledby="insights-heading">
          <div className="container">
            <div className="section-heading" data-reveal>
              <div>
                <p className="eyebrow">
                  <span></span> Insights
                </p>
                <h2 id="insights-heading">Insights for Real-Estate Transaction Teams</h2>
              </div>
              <p>
                Practical notes on client intake, document collection, matter readiness, and the operational handoffs that
                keep property transactions moving.
              </p>
            </div>

            <div className="insights-card-grid">
              <article className="insights-card" data-reveal>
                <h3>Why Email-Based Client Intake Causes Avoidable Transaction Delays</h3>
                <p>
                  Why scattered inboxes struggle as the main system for intake facts, documents, and follow-up
                  ownership—and what a clearer workflow looks like.
                </p>
                <a className="text-link" href="/insights/why-email-client-intake-causes-transaction-delays/">
                  Read Why Email-Based Client Intake Causes Avoidable Transaction Delays
                  <span aria-hidden="true">→</span>
                </a>
              </article>

              <article className="insights-card" data-reveal>
                <h3>A File-Ready Checklist for Real-Estate Transaction Teams</h3>
                <p>
                  A prospective client contacting the firm is not the same as a matter being ready to move forward. An
                  operational checklist for shared file-ready handoffs.
                </p>
                <a className="text-link" href="/insights/real-estate-file-ready-checklist/">
                  Read A File-Ready Checklist for Real-Estate Transaction Teams
                  <span aria-hidden="true">→</span>
                </a>
              </article>

              <article className="insights-card" data-reveal>
                <h3>Making Condo Due Diligence Easier to Track</h3>
                <p>
                  A practical operational framework for making condo-related information, document requests, missing
                  items, reviews, and handoffs easier to see.
                </p>
                <a className="text-link" href="/insights/making-condo-due-diligence-easier-to-track/">
                  Read Making Condo Due Diligence Easier to Track
                  <span aria-hidden="true">→</span>
                </a>
              </article>
            </div>

            <div className="insights-preview-actions" data-reveal>
              <a className="text-link" href="/insights/">
                View all insights <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container cta-card" data-reveal>
            <div>
              <p className="eyebrow light">
                <span></span> See the product
              </p>
              <h2>A calmer way to start every matter.</h2>
            </div>
            <Link className="button button-light" href="/demo">
              Open the demo <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <a className="brand footer-brand" href="#top">
              <BrandMark />
              <span>LawIntake</span>
            </a>
            <p>Client intake and matter workflows for real estate law firms.</p>
          </div>
          <div className="footer-links">
            <a href="/product/sample-workspace/">Sample workspace</a>
            <a href="/product/sample-workspace/#research-pulse-check">Research survey</a>
            <a href="/insights/">Insights</a>
            <Link href="/demo">Demo</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href="https://github.com/TommyJackson85/intake-app">GitHub</a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {year} LawIntake</span>
          <span>Built for focused legal work.</span>
        </div>
      </footer>
    </div>
  )
}
