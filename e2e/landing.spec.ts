import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('loads without errors and shows hero content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/LawIntake/i);
    await expect(page.getByText('Client Intake Built for Florida Real Estate Lawyers')).toBeVisible();
    await expect(page.getByText('Streamline intake, manage AML workflows')).toBeVisible();
  });

  test('shows header with branding and navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('⚖️ LawIntake')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Security' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
  });

  test('shows early access email form', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder('your@lawfirm.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Early Access' })).toBeVisible();
  });

  test('shows feature cards section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Smart Intake Forms')).toBeVisible();
    await expect(page.getByText('GDPR Built-In')).toBeVisible();
    await expect(page.getByText('AML Ready')).toBeVisible();
    await expect(page.getByText('Transparent Pricing')).toBeVisible();
    await expect(page.getByText('Modern Stack')).toBeVisible();
    await expect(page.getByText('Real Support')).toBeVisible();
  });

  test('shows security comparison table', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Security & Compliance')).toBeVisible();
    await expect(page.getByText('GDPR Compliance Built-In')).toBeVisible();
    await expect(page.getByText('Role-Based Access Control')).toBeVisible();
    await expect(page.getByText('AML/KYC Fields')).toBeVisible();
  });

  test('shows footer with links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'DPA' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Contact' })).toBeVisible();
  });

  test('Sign In link navigates to auth page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
