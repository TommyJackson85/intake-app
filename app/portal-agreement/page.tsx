// app/portal-agreement/page.tsx
// Client Portal Agreement page

import Link from 'next/link'

export const metadata = {
  title: 'Client Portal Agreement - LawIntake',
  description: 'Client Portal Agreement for LawIntake',
}

export default function PortalAgreementPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', lineHeight: '1.8', color: '#333' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>Client Portal Agreement</h1>
      
      <p style={{ color: '#627c71', marginBottom: '32px', fontSize: '14px' }}>
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {/* TODO: Replace with solicitor-approved content */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>1. Portal Access</h2>
        <p style={{ marginBottom: '16px' }}>
          This Client Portal Agreement governs your use of the LawIntake client portal. By accessing the portal,
          you agree to the terms set forth in this agreement.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>2. Confidentiality</h2>
        <p style={{ marginBottom: '16px' }}>
          All information shared through the portal is confidential and protected by attorney-client privilege
          where applicable. You agree to maintain the confidentiality of your portal access credentials.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>3. Use of Portal</h2>
        <p style={{ marginBottom: '16px' }}>
          The portal is provided for the purpose of client intake, document submission, and communication
          with your legal representative. You agree to use the portal only for lawful purposes.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>4. Data Protection</h2>
        <p style={{ marginBottom: '16px' }}>
          Your data is handled in line with our{' '}
          <Link href="/privacy" style={{ color: '#208096', textDecoration: 'none' }}>Privacy Policy</Link>.
          We implement security measures to protect your information.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>5. Contact</h2>
        <p style={{ marginBottom: '16px' }}>
          If you have questions about this agreement, please contact your legal representative or our support team.
        </p>
      </section>

      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(94, 82, 64, 0.2)' }}>
        <Link href="/" style={{ color: '#208096', textDecoration: 'none' }}>← Back to Home</Link>
      </div>
    </div>
  )
}
