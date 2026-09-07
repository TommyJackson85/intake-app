import { expect, test, type Page } from '@playwright/test'

const KNOWN_FILE_ID = 'FL-2026-001'
const INVALID_FILE_ID = 'NOT-A-REAL-MATTER'

async function openMatters(page: Page) {
  await page.goto('/demo/matters')
  await expect(page.getByTestId('demo-matters-page')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Matters', exact: true })).toBeVisible()
}

test.describe('Demo matters journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear demo localStorage so list starts from seed fixtures.
    await page.addInitScript(() => {
      try {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith('lawintake-demo-'))
        for (const key of keys) localStorage.removeItem(key)
        const sessionKeys = Object.keys(sessionStorage).filter((k) => k.startsWith('lawintake-demo-'))
        for (const key of sessionKeys) sessionStorage.removeItem(key)
      } catch {
        /* ignore */
      }
    })
  })

  test('loads the initial matters list', async ({ page }) => {
    await openMatters(page)
    await expect(page.getByTestId('demo-matters-table')).toBeVisible()
    await expect(page.getByTestId(`demo-matters-row-${KNOWN_FILE_ID}`)).toBeVisible()
    await expect(page.getByTestId('demo-matters-count')).toContainText('matter')
  })

  test('search finds a known matter and clear restores the list', async ({ page }) => {
    await openMatters(page)
    const search = page.getByTestId('demo-matters-search')
    await search.fill(KNOWN_FILE_ID)
    await expect(page.getByTestId(`demo-matters-row-${KNOWN_FILE_ID}`)).toBeVisible()
    await expect(page.getByTestId('demo-matters-count')).toContainText('1 matter')

    await search.fill('zzz-no-such-matter')
    await expect(page.getByText('No matters match your search or filters.')).toBeVisible()

    await page.getByTestId('demo-matters-clear-filters').click()
    await expect(page.getByTestId('demo-matters-table')).toBeVisible()
    await expect(page.getByTestId(`demo-matters-row-${KNOWN_FILE_ID}`)).toBeVisible()
  })

  test('applies and clears a status filter', async ({ page }) => {
    await openMatters(page)
    const status = page.getByTestId('demo-matters-status-filter')
    await status.selectOption({ label: 'Title Search' })
    await expect(page.getByTestId('demo-matters-count')).toContainText('matching filters')
    await expect(page.getByTestId('demo-matters-clear-filters')).toBeVisible()

    await page.getByTestId('demo-matters-clear-filters').click()
    await expect(page.getByTestId('demo-matters-clear-filters')).toHaveCount(0)
    await expect(page.getByTestId(`demo-matters-row-${KNOWN_FILE_ID}`)).toBeVisible()
  })

  test('opens a known matter detail from the list', async ({ page }) => {
    await openMatters(page)
    await page.getByTestId(`demo-matters-file-link-${KNOWN_FILE_ID}`).click()
    await expect(page.getByTestId('demo-matter-detail-dialog')).toBeVisible()
    await expect(page.getByTestId('demo-matter-detail-dialog')).toContainText(KNOWN_FILE_ID)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('demo-matter-detail-dialog')).toHaveCount(0)
  })

  test('loads a known matter detail URL directly', async ({ page }) => {
    await page.goto(`/demo/matters/${KNOWN_FILE_ID}`)
    // Detail route redirects into the list deep-link + opens the modal.
    await expect(page).toHaveURL(new RegExp(`/demo/matters\\?matter=${KNOWN_FILE_ID}`))
    await expect(page.getByTestId('demo-matters-page')).toBeVisible()
    await expect(page.getByTestId('demo-matter-detail-dialog')).toBeVisible({ timeout: 20_000 })
  })

  test('loads an invalid matter detail URL with not-found recovery', async ({ page }) => {
    await page.goto(`/demo/matters/${INVALID_FILE_ID}`)
    await expect(page.getByTestId('demo-page-not-found')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
    await page.getByTestId('demo-matters-recovery-link').click()
    await expect(page).toHaveURL(/\/demo\/matters/)
    await expect(page.getByTestId('demo-matters-page')).toBeVisible()
  })

  test('row actions menu and archive confirm close with Escape', async ({ page }) => {
    await openMatters(page)
    const actions = page.getByTestId(`demo-matters-actions-${KNOWN_FILE_ID}`)
    await actions.click()
    await expect(page.getByTestId(`demo-matters-actions-menu-${KNOWN_FILE_ID}`)).toBeVisible()

    // Non-destructive action: copy portal link
    await page.getByTestId('demo-matters-action-copy-portal').click()
    await expect(page.getByTestId(`demo-matters-actions-menu-${KNOWN_FILE_ID}`)).toHaveCount(0)

    // Re-open menu → archive → Escape cancels confirm (no mutation)
    await actions.click()
    await page.getByTestId('demo-matters-action-archive').click()
    await expect(page.getByTestId('demo-confirm-dialog')).toBeVisible()
    await expect(page.getByTestId('demo-confirm-dialog')).toContainText(KNOWN_FILE_ID)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('demo-confirm-dialog')).toHaveCount(0)
    await expect(page.getByTestId(`demo-matters-row-${KNOWN_FILE_ID}`)).toBeVisible()
  })
})
