import DemoMattersFallback from '@/components/demo/DemoMattersFallback'
import { buildDemoMatterNotFoundCopy } from '@/lib/demo/demoMattersFallback'

/** Segment not-found for `/demo/matters` (rare; keeps recovery consistent). */
export default function DemoMattersNotFound() {
  return (
    <div style={{ padding: '8px 0' }}>
      <DemoMattersFallback copy={buildDemoMatterNotFoundCopy()} />
    </div>
  )
}
