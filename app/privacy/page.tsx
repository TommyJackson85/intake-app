// app/privacy/page.tsx
// Privacy Policy page

import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy - LawIntake',
  description: 'Privacy Policy for LawIntake client intake portal',
}

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', lineHeight: '1.8', color: '#333' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>Privacy Policy</h1>
      
      <p style={{ color: '#627c71', marginBottom: '32px', fontSize: '14px' }}>
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {/* TODO: Replace with solicitor-approved content */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>1. Introduction</h2>
        <p style={{ marginBottom: '16px' }}>
          LawIntake ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains
          how we collect, use, disclose, and safeguard your information when you use our client intake portal.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>2. Information We Collect</h2>
        <p style={{ marginBottom: '16px' }}>
          We collect information that you provide directly to us, including:
        </p>
        <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
          <li>Account information (email, password, firm details)</li>
          <li>Client information submitted through the intake portal</li>
          <li>Matter and case information</li>
          <li>Communication records</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>3. How We Use Your Information</h2>
        <p style={{ marginBottom: '16px' }}>
          We use the information we collect to:
        </p>
        <ul style={{ marginLeft: '24px', marginBottom: '16px' }}>
          <li>Provide and maintain the Service</li>
          <li>Process client intake forms</li>
          <li>Comply with legal and regulatory requirements</li>
          <li>Improve our Service</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>4. Data Security</h2>
        <p style={{ marginBottom: '16px' }}>
          We implement appropriate technical and organizational measures to protect your personal data against
          unauthorized access, alteration, disclosure, or destruction. Data is handled in line with our Privacy Policy.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>5. Data Retention</h2>
        <p style={{ marginBottom: '16px' }}>
          {/* TODO: Add solicitor-approved data retention policy */}
          We retain your data for as long as necessary to provide the Service and comply with legal obligations.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>6. Your Rights</h2>
        <p style={{ marginBottom: '16px' }}>
          You have the right to access, correct, or delete your personal data. You may also request a copy
          of your data or object to certain processing activities.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', marginTop: '32px' }}>7. Contact</h2>
        <p style={{ marginBottom: '16px' }}>
          If you have questions about this Privacy Policy, please contact us through your account dashboard.
        </p>
      </section>

      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(94, 82, 64, 0.2)' }}>
        <Link href="/" style={{ color: '#208096', textDecoration: 'none' }}>← Back to Home</Link>
      </div>
    </div>
  )
}
