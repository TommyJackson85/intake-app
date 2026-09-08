import { expect, test } from '@playwright/test'
import { DEMO_SEED_INTAKE_TOKENS } from '../lib/demo/demoData'

test.describe('Demo intake seed tokens', () => {
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

  test('pending seed token opens the client intake form', async ({ page }) => {
    await page.goto(`/demo/intake/${DEMO_SEED_INTAKE_TOKENS.pendingClient}`)
    await expect(page.getByTestId('demo-intake-not-found')).toHaveCount(0)
    await expect(page.getByTestId('demo-intake-form')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Review and complete your intake/i })).toBeVisible()
  })

  test('invalid token shows recovery with seed link', async ({ page }) => {
    await page.goto('/demo/intake/does-not-exist')
    await expect(page.getByTestId('demo-intake-not-found')).toBeVisible()
    await expect(page.getByTestId('demo-intake-seed-pending-link')).toBeVisible()
    await page.getByTestId('demo-intake-seed-pending-link').click()
    await expect(page).toHaveURL(new RegExp(`/demo/intake/${DEMO_SEED_INTAKE_TOKENS.pendingClient}`))
    await expect(page.getByTestId('demo-intake-form')).toBeVisible()
  })
})
