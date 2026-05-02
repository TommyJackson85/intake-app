/**
 * FinCEN **eligibility** helper for demo matters. Reporting payload lives on `DemoMatter.fincen`; cert tokens live in
 * `fincenCertRequests` in the store (`split-fincen-storage` in `lib/domain/system-contract.ts`).
 */
import type { DemoMatter } from '@/lib/demo/types'

/** Cash purchase by a legal entity or trust — full FinCEN UI in demo. */
export function isFincenEligibleMatter(matter: DemoMatter): boolean {
  return matter.financingType === 'Cash' && matter.buyer.type === 'entity'
}
