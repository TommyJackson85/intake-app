// components/Footer.tsx
// Persistent footer with policy links

import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      marginTop: 'auto',
      padding: '24px 20px',
      borderTop: '1px solid rgba(94, 82, 64, 0.1)',
      background: '#fcfcf9',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        fontSize: '14px',
        color: '#627c71',
      }}>
        <div>
          <p style={{ margin: 0, fontSize: '12px' }}>
            © {new Date().getFullYear()} LawIntake. All rights reserved.
          </p>
        </div>
        <nav style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <Link 
            href="/terms" 
            style={{ color: '#208096', textDecoration: 'none' }}
          >
            Terms of Use
          </Link>
          <Link 
            href="/privacy" 
            style={{ color: '#208096', textDecoration: 'none' }}
          >
            Privacy Policy
          </Link>
          <Link 
            href="/portal-agreement" 
            style={{ color: '#208096', textDecoration: 'none' }}
          >
            Client Portal Agreement
          </Link>
        </nav>
      </div>
    </footer>
  )
}
