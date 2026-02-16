'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * Firm Registration Landing Page
 * This is a separate flow for law firm admins who want to register their firm
 * before creating an account. It provides information and links to signup.
 */
export default function FirmRegistrationPage() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fcfcf9' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', width: '100%', maxWidth: '500px', border: '1px solid rgba(94, 82, 64, 0.2)' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '12px', textAlign: 'center' }}>Register Your Law Firm</h1>
        <p style={{ fontSize: '16px', color: '#627c71', marginBottom: '32px', lineHeight: '1.6', textAlign: 'center' }}>
          To get started with LawIntake, you'll need to create an account. During signup, you can register your law firm.
        </p>

        <div style={{ marginBottom: '32px', padding: '20px', background: '#f5f5f5', borderRadius: '6px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>What you'll need:</h2>
          <ul style={{ marginLeft: '24px', lineHeight: '1.8', color: '#627c71' }}>
            <li>Your email address</li>
            <li>Firm name</li>
            <li>State/Jurisdiction</li>
            <li>Contact email (optional)</li>
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/auth/signup"
            style={{
              display: 'block',
              padding: '12px',
              background: '#208096',
              color: 'white',
              textAlign: 'center',
              borderRadius: '6px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Create Account & Register Firm
          </Link>

          <Link
            href="/auth/signin"
            style={{
              display: 'block',
              padding: '12px',
              background: 'white',
              color: '#208096',
              textAlign: 'center',
              borderRadius: '6px',
              fontWeight: 600,
              textDecoration: 'none',
              border: '1px solid #208096',
            }}
          >
            Already have an account? Sign In
          </Link>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(94, 82, 64, 0.1)', fontSize: '12px', color: '#627c71', textAlign: 'center' }}>
          <p style={{ marginBottom: '8px' }}>
            By creating an account, you agree to our{' '}
            <Link href="/terms" style={{ color: '#208096', textDecoration: 'none' }}>Terms of Use</Link>
            {' '}and acknowledge our{' '}
            <Link href="/privacy" style={{ color: '#208096', textDecoration: 'none' }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
