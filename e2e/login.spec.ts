import { test, expect } from '@playwright/test';
import { login, isLoggedIn } from './helpers/auth';
import { captureHtml, setupDebugHelpers, takeDebugSnapshot } from './helpers/debug';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup debug helpers for this page
    setupDebugHelpers(page, test.info());
    
    // Visit the login page before each test
    await page.goto('/login');

    // Clear cookies and localStorage to prevent auth state persistence between tests
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Take a debug snapshot at the start of each test
    await takeDebugSnapshot(page, test.info(), 'login-page-initial');
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
    
    // Take a detailed snapshot of the form
    await captureHtml(page, test.info(), 'form', 'login-form-elements');
  });

  test('shows validation errors for empty fields', async ({ page }) => {
    // Submit the form without entering any data
    await page.getByRole('button', { name: /sign in/i, exact: false }).click();

    // Verify we stay on the login page after submit with empty fields
    await expect(page).toHaveURL(/.*\/login/);
    
    // Now check for specific error messages
    const emailError = page.locator('[id*="email-error"], [data-test="email-error"], .text-red-500, .text-error')
      .filter({ hasText: /required|empty|needed|mandatory/i }).first();
    
    // Verify an error message about required fields is shown
    await expect(emailError).toBeVisible();

    // Capture the HTML around the error message for debugging
    await captureHtml(page, test.info(), '[id*="email-error"], [data-test="email-error"], .text-red-500, .text-error', 'email-empty-error');
    
    // Take a snapshot of the page with the validation errors
    await takeDebugSnapshot(page, test.info(), 'empty-fields-validation');
  });

  test('shows error for invalid email format', async ({ page }) => {
    // Enter invalid email and submit
    await page.locator('input[name="email"]').fill('invalidemail');
    await page.locator('input[name="password"]').fill('password123');
    await page.getByRole('button', { name: /sign in/i, exact: false }).click();

    // The form should stay on the login page after invalid submission
    await expect(page.url()).toContain('/login');
    
    // Check for a specific error message about email format
    const emailFormatError = page.locator('[id*="email-error"], [data-test="email-error"], .text-red-500, .text-error')
      .filter({ hasText: /invalid|format|valid email/i }).first();
    
    await expect(emailFormatError).toBeVisible();
    
    // Capture the state of the form with the error
    await captureHtml(page, test.info(), 'form', 'invalid-email-format');
    
    // Get the text of the error message
    const errorText = await emailFormatError.textContent();
    console.log(`Invalid email error message: ${errorText}`);
  });

  test('handles incorrect credentials appropriately', async ({ page }) => {
    // Type in incorrect credentials
    await page.locator('input[name="email"]').fill('nonexistent@example.com');
    await page.locator('input[name="password"]').fill('wrongpassword');

    // Click the submit button
    await page.getByRole('button', { name: /sign in/i, exact: false }).click();

    // Wait a moment for the authentication attempt
    await page.waitForTimeout(3000);

    // Take a debug snapshot after authentication attempt
    await takeDebugSnapshot(page, test.info(), 'after-bad-credential-attempt');

    // Verify we're still on the login page
    await expect(page.url()).toContain('/login');
    
    // Check for authentication error message
    // Try multiple possible selectors for error messages
    const authError = page.locator([
      '.text-red-500', 
      '.text-error',
      '.text-destructive',
      '[role="alert"]',
      '.auth-error',
      '.error-message'
    ].join(', ')).first();
    
    // Verify some error is shown
    await expect(authError).toBeVisible();
    
    // Get the text of the error
    const errorText = await authError.textContent();
    console.log(`Authentication error message: ${errorText}`);
    
    // Verify the error contains expected text about invalid credentials
    expect(errorText?.toLowerCase()).toMatch(/incorrect|invalid|wrong|not found|doesn't exist|does not exist|credentials/);
    
    // Capture the HTML showing the error
    await captureHtml(page, test.info(), authError, 'auth-error-message');
  });

  test('successfully logs in with valid credentials', async ({ page }) => {
    // Skip this test if credentials are not configured
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    test.skip(!testEmail || !testPassword,
      'Skipping login test - TEST_USER_EMAIL and TEST_USER_PASSWORD env variables are required');

    // Use the login helper function
    await login(page, testEmail, testPassword);

    // Take a snapshot of successful login result
    await takeDebugSnapshot(page, test.info(), 'after-successful-login');

    // Additional verification is done in the login helper
    // Check that we're on the my-recipes page
    await expect(page.url()).toContain('/my-recipes');
    
    // Verify we see the My Recipes heading
    await expect(page.getByRole('heading', { name: 'My Recipes' })).toBeVisible();
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

    // Take a snapshot after page refresh
    await takeDebugSnapshot(page, test.info(), 'after-refresh-still-logged-in');

    // Verify we can perform authenticated actions
    const isUserLoggedIn = await isLoggedIn(page);
    expect(isUserLoggedIn).toBe(true);
  });
});
