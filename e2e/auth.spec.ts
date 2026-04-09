import { test, expect } from '@playwright/test';

test.describe('Sign In page', () => {
  test('loads and shows sign in form', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByText('Secure client portal for your real estate matters')).toBeVisible();
  });

  test('shows email and password fields', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByPlaceholder('your@lawfirm.com')).toBeVisible();
  });

  test('shows Sign In button', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('shows password visibility toggle', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('button', { name: 'Show' })).toBeVisible();
  });

  test('shows Forgot password link', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
  });

  test('shows Sign Up link', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible();
  });

  test('shows legal footer links', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('link', { name: 'Terms of Use' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Client Portal Agreement' })).toBeVisible();
  });

  test('Sign Up link navigates to signup page', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });
});

test.describe('Sign Up page', () => {
  test('loads and shows create account form', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    await expect(page.getByText('You can register a law firm now or later from your dashboard')).toBeVisible();
  });

  test('shows email and password fields', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('shows firm registration checkbox', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.getByText('Register with a law firm now')).toBeVisible();
  });

  test('shows terms acceptance checkbox', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.getByText('I agree to the')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Terms of Use' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
  });

  test('Create Account button is disabled until terms accepted', async ({ page }) => {
    await page.goto('/auth/signup');
    const submitBtn = page.getByRole('button', { name: 'Create Account' });
    await expect(submitBtn).toBeDisabled();
  });

  test('reveals firm fields when register checkbox is checked', async ({ page }) => {
    await page.goto('/auth/signup');

    // Firm fields should not be visible initially
    await expect(page.getByLabel('Firm Name')).not.toBeVisible();

    // Check the checkbox
    await page.getByText('Register with a law firm now').click();

    // Now firm fields should appear
    await expect(page.getByLabel('Firm Name')).toBeVisible();
    await expect(page.getByLabel('State')).toBeVisible();
  });

  test('has link back to sign in', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });
});
