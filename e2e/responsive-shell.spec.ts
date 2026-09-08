import { expect, test } from '@playwright/test'

/**
 * Regression: Tailwind lg:* utilities must ship so desktop shows the sidebar
 * and hides the mobile chrome.
 */
test.describe('Demo responsive shell', () => {
  test('desktop shows sidebar and hides mobile nav', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/demo')

    await expect(page.getByRole('link', { name: '⚖️ LawIntake' })).toBeVisible()
    const sidebar = page.locator('aside.hidden.lg\\:flex')
    await expect(sidebar).toBeVisible()

    // Mobile chrome must not remain visible once lg utilities apply.
    await expect(page.locator('nav.lg\\:hidden')).toBeHidden()
    await expect(page.locator('header.lg\\:hidden')).toBeHidden()
  })

  test('mobile shows bottom nav and burger chrome', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/demo')

    await expect(page.locator('nav.lg\\:hidden')).toBeVisible()
    await expect(page.locator('header.lg\\:hidden')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Matters' }).first()).toBeVisible()
  })
})
