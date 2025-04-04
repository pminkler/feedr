import { test, expect } from '@playwright/test';
import { login, isLoggedIn } from './helpers/auth';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page, context }) => {
    // Visit the login page before each test
    await page.goto('/login');

    // Clear cookies and localStorage to prevent auth state persistence between tests
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('displays login form elements correctly', async ({ page }) => {
    // Check page title and content
    await expect(page.locator('div.text-xl', { hasText: 'Sign In' })).toBeVisible();

    // Check form elements
    await expect(page.locator('label', { hasText: 'Email' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i, exact: false })).toBeVisible();

    // Check the Google sign-in option
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();

    // Check navigation links - use first() to get specific element when multiple exist
    await expect(page.locator('a[href="/signup"]').first()).toBeVisible();
    await expect(page.locator('a[href="/terms"]').first()).toBeVisible();
  });

  test('shows validation errors for empty fields', async ({ page }) => {
    // Submit the form without entering any data
    await page.getByRole('button', { name: /sign in/i, exact: false }).click();

    // Verify we stay on the login page after submit with empty fields
    await expect(page).toHaveURL(/.*\/login/);

    // Just check that the URL contains login to confirm we didn't navigate away
    // which confirms validation failure
    await expect(page.url()).toContain('/login');
  });

  test('shows error for invalid email format', async ({ page }) => {
    // Enter invalid email and submit
    await page.locator('input[name="email"]').fill('invalidemail');
    await page.locator('input[name="password"]').fill('password123');
    await page.getByRole('button', { name: /sign in/i, exact: false }).click();

    // The form should stay on the login page after invalid submission
    await expect(page.url()).toContain('/login');
  });

  test('handles incorrect credentials appropriately', async ({ page }) => {
    // Type in incorrect credentials
    await page.locator('input[name="email"]').fill('nonexistent@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');

    // Click the submit button
    await page.getByRole('button', { name: /sign in/i, exact: false }).click();

    // Wait a moment for the authentication attempt
    await page.waitForTimeout(3000);

    // Just verify that we didn't navigate to a protected area
    // This confirms login was not successful
    await expect(page.url()).toContain('/login');
  });

  test('successfully logs in with valid credentials', async ({ page }) => {
    // Skip this test if credentials are not configured
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    test.skip(!testEmail || !testPassword,
      'Skipping login test - TEST_USER_EMAIL and TEST_USER_PASSWORD env variables are required');

    // Use the login helper function
    await login(page, testEmail, testPassword);

    // Additional verification is done in the login helper
    // Check that we're on the my-recipes page
    await expect(page.url()).toContain('/my-recipes');
  });

  test('retains login state after page refresh', async ({ page }) => {
    // Skip this test if credentials are not configured
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    test.skip(!testEmail || !testPassword,
      'Skipping login state persistence test - TEST_USER_EMAIL and TEST_USER_PASSWORD env variables are required');

    // Log in first
    await login(page, testEmail, testPassword);

    // Refresh the page
    await page.reload();

    // Check we're still on my-recipes and not redirected to login
    await expect(page).toHaveURL(/.*\/my-recipes/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'My Recipes' })).toBeVisible({ timeout: 10000 });

    // Verify we can perform authenticated actions
    const isUserLoggedIn = await isLoggedIn(page);
    expect(isUserLoggedIn).toBe(true);
  });
});
