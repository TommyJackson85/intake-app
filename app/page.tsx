'use client'

import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firm_name: '',
          state: '',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
        setEmail('')
      } else {
        setError(data.error || 'Failed to submit')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fcfcf9' }}>
      <header style={{
        background: 'white',
        borderBottom: '1px solid rgba(94, 82, 64, 0.2)',
        padding: '20px 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: '24px', color: '#208096' }}>⚖️ LawIntake</div>
          <nav style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <a href="#features" style={{ textDecoration: 'none', color: '#134252', fontSize: '14px' }}>Features</a>
            <a href="#security" style={{ textDecoration: 'none', color: '#134252', fontSize: '14px' }}>Security</a>
            <a href="/privacy" style={{ textDecoration: 'none', color: '#134252', fontSize: '14px' }}>Privacy</a>
            <a href="/auth/login" style={{ background: '#208096', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Sign In</a>
          </nav>
        </div>
      </header>

      <main>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <section style={{ padding: '100px 0', textAlign: 'center' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '20px', lineHeight: 1.2 }}>
              Client Intake Built for Florida Real Estate Lawyers
            </h1>
            <p style={{ fontSize: '18px', color: '#627c71', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
              Streamline intake, manage AML workflows, and stay GDPR-compliant. Built by developers who understand legal practice.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', maxWidth: '500px', margin: '0 auto', justifyContent: 'center', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  placeholder="your@lawfirm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    minWidth: '250px',
                    padding: '12px 16px',
                    border: '1px solid rgba(94, 82, 64, 0.2)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 32px',
                    background: loading ? '#ccc' : '#208096',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {loading ? 'Sending...' : 'Get Early Access'}
                </button>
              </form>
            ) : (
              <div style={{
                background: '#e8f5f0',
                color: '#208096',
                padding: '16px',
                borderRadius: '6px',
                marginTop: '20px',
                borderLeft: '4px solid #208096',
                maxWidth: '500px',
                margin: '0 auto',
              }}>
                ✓ Thanks! Check your email for next steps. <a href="https://forms.google.com/YOUR_SURVEY_LINK" target="_blank" rel="noopener noreferrer" style={{ color: '#208096', textDecoration: 'underline' }}>Take the survey now →</a>
              </div>
            )}

            {error && (
              <div style={{
                background: '#fee',
                color: '#c0152f',
                padding: '16px',
                borderRadius: '6px',
                marginTop: '20px',
                borderLeft: '4px solid #c0152f',
                maxWidth: '500px',
                margin: '0 auto',
              }}>
                {error}
              </div>
            )}
          </section>

          <section id="features" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', margin: '80px 0' }}>
            {[
              { icon: '📋', title: 'Smart Intake Forms', desc: 'Customize forms for real estate transactions. Capture KYC, beneficial owners, and AML flags automatically.' },
              { icon: '🔒', title: 'GDPR Built-In', desc: 'EU processor architecture, RLS-enforced multi-tenancy, audit logs, and data-subject rights tools included.' },
              { icon: '✅', title: 'AML Ready', desc: 'Support your AML/KYC workflows with structured fields, risk flags, and immutable audit trails.' },
              { icon: '💰', title: 'Transparent Pricing', desc: 'No hidden fees. Simple subscription. Pay only for what you use.' },
              { icon: '🚀', title: 'Modern Stack', desc: 'Built on Next.js, Supabase, and Stripe. Easy integrations, fast, and reliable.' },
              { icon: '📞', title: 'Real Support', desc: 'Email support from founders who built legal tech. No gatekeepers.' },
            ].map((feature, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '18px', marginBottom: '12px', color: '#134252' }}>{feature.title}</h3>
                <p style={{ fontSize: '14px', color: '#627c71' }}>{feature.desc}</p>
              </div>
            ))}
          </section>

          <section id="security" style={{ background: 'white', borderRadius: '8px', padding: '40px', margin: '80px 0', border: '1px solid rgba(94, 82, 64, 0.2)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '32px' }}>Security & Compliance</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ fontWeight: 600, background: '#fcfcf9' }}>
                  <td style={{ padding: '12px', borderBottom: '1px solid rgba(94, 82, 64, 0.2)', fontSize: '14px' }}></td>
                  <td style={{ padding: '12px', borderBottom: '1px solid rgba(94, 82, 64, 0.2)', fontSize: '14px' }}><strong>LawIntake</strong></td>
                  <td style={{ padding: '12px', borderBottom: '1px solid rgba(94, 82, 64, 0.2)', fontSize: '14px' }}><strong>Generic CRM</strong></td>
                </tr>
                {[
                  { feature: 'GDPR Compliance Built-In', lawintake: true, crm: false },
                  { feature: 'Data Encryption at Rest', lawintake: true, crm: true },
                  { feature: 'Role-Based Access Control', lawintake: true, crm: true },
                  { feature: 'Audit Logging (Immutable)', lawintake: true, crm: false },
                  { feature: 'AML/KYC Fields', lawintake: true, crm: false },
                  { feature: 'Data Export for Portability', lawintake: true, crm: true },
                  { feature: 'EU Data Residency Option', lawintake: true, crm: false },
                ].map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(94, 82, 64, 0.2)', fontSize: '14px' }}>{row.feature}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(94, 82, 64, 0.2)', fontSize: '14px', color: row.lawintake ? '#208096' : '#999' }}>
                      {row.lawintake ? '✓' : '—'}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid rgba(94, 82, 64, 0.2)', fontSize: '14px', color: row.crm ? '#208096' : '#999' }}>
                      {row.crm ? '✓' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>

      <footer style={{ background: '#134252', color: 'white', padding: '40px 0', marginTop: '100px', textAlign: 'center', fontSize: '12px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <a href="/privacy" style={{ color: '#90cfd9', textDecoration: 'none', margin: '0 15px' }}>Privacy Policy</a>
            <a href="/terms" style={{ color: '#90cfd9', textDecoration: 'none', margin: '0 15px' }}>Terms of Service</a>
            <a href="/dpa" style={{ color: '#90cfd9', textDecoration: 'none', margin: '0 15px' }}>DPA</a>
            <a href="mailto:hello@lawintake.io" style={{ color: '#90cfd9', textDecoration: 'none', margin: '0 15px' }}>Contact</a>
          </div>
          <p>&copy; 2025 LawIntake. Built for real estate lawyers who take compliance seriously.<br />
          Ireland-based processor serving non-EU clients. All data processed in accordance with GDPR.</p>
        </div>
      </footer>
    </div>
  )
}
