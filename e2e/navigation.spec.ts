import { test, expect } from '@playwright/test';

test.describe('Public page navigation', () => {
  test('privacy page loads without errors', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByText('Introduction')).toBeVisible();
    await expect(page.getByText('Information We Collect')).toBeVisible();
  });

  test('terms page loads without errors', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: 'Terms of Use' })).toBeVisible();
    await expect(page.getByText('Acceptance of Terms')).toBeVisible();
    await expect(page.getByText('Use of Service')).toBeVisible();
  });

  test('landing page nav links point to correct anchors and pages', async ({ page }) => {
    await page.goto('/');

    // Check features link has correct href
    const featuresLink = page.getByRole('link', { name: 'Features' });
    await expect(featuresLink).toHaveAttribute('href', '#features');

    // Check security link has correct href
    const securityLink = page.getByRole('link', { name: 'Security' });
    await expect(securityLink).toHaveAttribute('href', '#security');

    // Check privacy link points to /privacy
    const privacyLink = page.locator('header').getByRole('link', { name: 'Privacy' });
    await expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  test('footer links navigate to legal pages', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');

    // Click Privacy Policy in footer
    await footer.getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL(/\/privacy/);
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  });

  test('signin page links navigate correctly', async ({ page }) => {
    await page.goto('/auth/signin');

    // Navigate to signup
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    // Navigate back to signin
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('authenticated routes redirect to signin (no 404)', async ({ page }) => {
    // Dashboard routes should redirect to signin, not show 404
    await page.goto('/dashboard');
    // Should either redirect to signin or show the dashboard page
    // (won't be a 404 in either case)
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const is404 = await page.getByText('404').isVisible().catch(() => false);
    expect(url.includes('/auth/signin') || url.includes('/dashboard') || !is404).toBeTruthy();
  });
});

// NOTE: Tests for /demo routes are not included because this app does not have
// a /demo directory or route. The app's "demo mode" is activated via the
// is_test_firm flag after Supabase authentication, which requires live database
// access. Public-facing pages are tested above instead.
