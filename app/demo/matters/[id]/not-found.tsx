import Link from 'next/link'

/**
 * Static not-found UI for `/demo/matters/[id]` when the param is not a seeded
 * demo matter (or when GitHub Pages serves a missing path via the app shell).
 */
export default function DemoMatterByIdNotFound() {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid rgba(94,82,64,0.2)',
        borderRadius: '8px',
        padding: '20px',
        margin: '24px',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Matter not found in demo</h2>
      <p style={{ marginTop: 0, color: '#627c71' }}>
        That file reference doesn&apos;t exist in this demo dataset.
      </p>
      <Link href="/demo/matters" style={{ color: '#208096', textDecoration: 'none', fontWeight: 800 }}>
        Back to matters
      </Link>
    </div>
  )
}
