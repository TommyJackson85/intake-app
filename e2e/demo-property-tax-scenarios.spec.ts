import { expect, test } from '@playwright/test'
import {
  PROPERTY_TAX_DEMO_SCENARIOS,
  PROPERTY_TAX_DEMO_SCENARIOS_SECTION_TITLE,
} from '../lib/demo/propertyTaxDemoScenarios'

test.describe('Property-tax demo scenarios smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        for (const k of Object.keys(localStorage).filter((x) => x.startsWith('lawintake-demo-'))) {
          localStorage.removeItem(k)
        }
        for (const k of Object.keys(sessionStorage).filter((x) => x.startsWith('lawintake-demo-'))) {
          sessionStorage.removeItem(k)
        }
      } catch {
        /* ignore */
      }
    })
  })

  test('demo landing shows scenario cards and tax-deed matter shows firm verification wording', async ({
    page,
  }) => {
    await page.goto('/demo')
    await expect(page.getByTestId('property-tax-demo-scenarios')).toBeVisible()
    await expect(page.getByRole('heading', { name: PROPERTY_TAX_DEMO_SCENARIOS_SECTION_TITLE })).toBeVisible()
    await expect(page.getByTestId('property-tax-demo-scenarios-disclaimer')).toContainText(
      /does not provide legal or tax advice/i,
    )

    for (const scenario of PROPERTY_TAX_DEMO_SCENARIOS) {
      await expect(page.getByTestId(`property-tax-demo-scenario-${scenario.id}`)).toBeVisible()
      await expect(page.getByTestId(`property-tax-demo-scenario-tag-${scenario.id}`)).toContainText(
        scenario.tag,
      )
      await expect(page.getByTestId(`property-tax-demo-intake-${scenario.id}`)).toBeVisible()
      await expect(page.getByTestId(`property-tax-demo-matter-${scenario.id}`)).toBeVisible()
    }

    const assessment = PROPERTY_TAX_DEMO_SCENARIOS.find((s) => s.id === 'assessment_vab')!
    await page.getByTestId(`property-tax-demo-intake-${assessment.id}`).click()
    await expect(page).toHaveURL(new RegExp(`/demo/intake/${assessment.intakeToken}`))
    await expect(page.getByTestId('demo-intake-form')).toBeVisible()
    await expect(page.getByTestId('client-intake-property-tax-section')).toBeVisible()

    await page.goto('/demo')
    const taxDeed = PROPERTY_TAX_DEMO_SCENARIOS.find((s) => s.id === 'tax_deed_surplus')!
    await page.getByTestId(`property-tax-demo-matter-${taxDeed.id}`).click()
    await expect(page.getByTestId('demo-matter-detail-dialog')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByTestId('matter-property-tax-overview')).toBeVisible()
    await expect(page.getByTestId('matter-property-tax-overview')).toContainText(
      /Deadline reported or documented — firm verification required/i,
    )
  })
})
