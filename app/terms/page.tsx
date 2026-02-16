// app/terms/page.tsx
// Terms of Use page

import Link from 'next/link'

export const metadata = {
  title: 'Terms of Use - LawIntake',
  description: 'Terms of Use for LawIntake client intake portal',
}

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', lineHeight: '1.8', color: '#333' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>Terms of Use</h1>
      
      <p style={{ color: '#627c71', marginBottom: '32px', fontSize: '14px' }}>
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {/* TODO: Replace with solicitor-approved content */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>1. Acceptance of Terms</h2>
        <p style={{ marginBottom: '16px' }}>
          By accessing and using the LawIntake client intake portal ("Service"), you agree to be bound by these Terms of Use.
          If you do not agree to these terms, please do not use the Service.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>2. Use of Service</h2>
        <p style={{ marginBottom: '16px' }}>
          The Service is intended for use by law firms and legal professionals for client intake and matter management.
          You agree to use the Service only for lawful purposes and in accordance with these Terms.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>3. Account Responsibilities</h2>
        <p style={{ marginBottom: '16px' }}>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities
          that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>4. Data Protection</h2>
        <p style={{ marginBottom: '16px' }}>
          We take data protection seriously. Please review our{' '}
          <Link href="/privacy" style={{ color: '#208096', textDecoration: 'none' }}>Privacy Policy</Link>{' '}
          to understand how we collect, use, and protect your information.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>5. Limitation of Liability</h2>
        <p style={{ marginBottom: '16px' }}>
          {/* TODO: Add solicitor-approved limitation of liability clause */}
          The Service is provided "as is" without warranties of any kind, either express or implied.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>6. Changes to Terms</h2>
        <p style={{ marginBottom: '16px' }}>
          We reserve the right to modify these Terms at any time. We will notify you of any material changes.
          Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>7. Contact</h2>
        <p style={{ marginBottom: '16px' }}>
          If you have questions about these Terms, please contact us through your account dashboard.
        </p>
      </section>

      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(94, 82, 64, 0.2)' }}>
        <Link href="/" style={{ color: '#208096', textDecoration: 'none' }}>← Back to Home</Link>
      </div>
    </div>
  )
}
