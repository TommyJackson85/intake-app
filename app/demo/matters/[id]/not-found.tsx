import DemoMattersFallback from '@/components/demo/DemoMattersFallback'
import { buildDemoMatterNotFoundCopy } from '@/lib/demo/demoMattersFallback'

/**
 * Static not-found UI for `/demo/matters/[id]` when the param is not a seeded
 * demo matter (or when GitHub Pages serves a missing path via the app shell).
 */
export default function DemoMatterByIdNotFound() {
  const copy = buildDemoMatterNotFoundCopy()

  return (
    <div style={{ padding: '8px 0' }}>
      <DemoMattersFallback copy={copy} />
    </div>
  )
}
