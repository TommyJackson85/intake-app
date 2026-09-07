import Link from 'next/link'

/**
 * App-wide not-found. Used when a route has no segment-level not-found
 * (e.g. static `dynamicParams = false` unknown paths). Keeps copy non-technical.
 */
export default function RootNotFound() {
  return (
    <main
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#fcfcf9',
      }}
    >
      <section
        role="status"
        aria-live="polite"
        style={{
          background: 'white',
          border: '1px solid rgba(94,82,64,0.2)',
          borderRadius: 8,
          padding: 24,
          maxWidth: 560,
          width: '100%',
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 22, fontWeight: 900, color: '#134252' }}>
          Page not found
        </h1>
        <p style={{ marginTop: 0, marginBottom: 18, color: '#627c71', fontSize: 14, lineHeight: 1.45 }}>
          We couldn’t find that page. If you were looking for a demo matter, it may have been removed
          or the link may be incorrect.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link
            href="/demo/matters"
            style={{
              display: 'inline-flex',
              background: '#208096',
              color: 'white',
              padding: '10px 16px',
              borderRadius: 6,
              fontWeight: 800,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            Back to matters
          </Link>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              background: '#fff',
              color: '#134252',
              padding: '10px 16px',
              borderRadius: 6,
              fontWeight: 800,
              fontSize: 14,
              textDecoration: 'none',
              border: '1px solid rgba(94,82,64,0.3)',
            }}
          >
            Go home
          </Link>
        </div>
      </section>
    </main>
  )
}
