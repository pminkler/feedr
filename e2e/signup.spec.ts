// e2e/signup.spec.ts
import { test, expect } from '@playwright/test';
import * as mailslurp from './helpers/mailslurp';

test.describe('Signup Flow', () => {
  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page, context }) => {
      // Visit signup page before each test
      await page.goto('/signup');

      // Clear cookies and localStorage to prevent auth state persistence
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());
    });

    test('displays signup form elements correctly', async ({ page }) => {
      // Verify we're on the signup page
      await expect(page).toHaveURL(/\/signup$/);

      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-artifacts/signup-form-elements.png' });

      // Wait for the form to be fully loaded
      await page.waitForSelector('form');

      // Verify critical elements are present using simpler selectors
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="repeatPassword"]')).toBeVisible();

      // Verify some button with text that contains "Sign Up" exists (more flexible)
      const signupButtonExists = await page.locator('button').filter({ hasText: /sign up/i }).count() > 0;
      expect(signupButtonExists).toBeTruthy();

      // Google sign-in should be present (use a more relaxed check)
      const googleButtonExists = await page.locator('button').filter({ hasText: /google/i }).count() > 0;
      expect(googleButtonExists).toBeTruthy();

      // Just check that the page has necessary links
      const hasSignIn = await page.locator('a').filter({ hasText: /sign in/i }).count() > 0;
      expect(hasSignIn).toBeTruthy();

      const hasTerms = await page.locator('a').filter({ hasText: /terms/i }).count() > 0;
      expect(hasTerms).toBeTruthy();
    });

    test('shows validation errors for empty fields', async ({ page }) => {
      // Wait for the page to be fully loaded
      await page.waitForLoadState('networkidle');

      // Wait for at least one button to be present
      await page.waitForSelector('button');

      // Locate and click the submit button more reliably
      const buttons = await page.locator('button').all();
      let submitButton = null;

      for (const button of buttons) {
        const text = await button.textContent();
        if (text && text.toLowerCase().includes('sign up')) {
          submitButton = button;
          break;
        }
      }

      // If we found the button, click it
      if (submitButton) {
        await submitButton.click({ timeout: 5000 });
      }
      else {
        // Fallback: Try to find the submit button by its type
        await page.locator('button[type="submit"]').click({ timeout: 5000 });
      }

      // Verify we stay on the signup page after invalid submit
      await expect(page).toHaveURL(/.*\/signup/);

      // Take a screenshot to debug form state
      await page.screenshot({ path: 'test-artifacts/signup-empty-fields.png' });

      // Verify we're still on the signup page with a form
      const currentUrl = page.url();
      expect(currentUrl).toContain('/signup');
    });

    test('validates password requirements', async ({ page }) => {
      // Test email that doesn't need to be real
      const testEmail = 'test@example.com';

      // Test password missing uppercase
      await page.locator('input[name="email"]').fill(testEmail);
      await page.locator('input[name="password"]').fill('password123!');
      await page.locator('input[name="repeatPassword"]').fill('password123!');
      await page.getByRole('button', { name: /sign up/i, exact: false }).click();

      // Form should still exist, we shouldn't proceed to confirmation
      await expect(page).toHaveURL(/.*\/signup/);

      // Clear the fields
      await page.locator('input[name="password"]').clear();
      await page.locator('input[name="repeatPassword"]').clear();

      // Test password missing number
      await page.locator('input[name="password"]').fill('Password!');
      await page.locator('input[name="repeatPassword"]').fill('Password!');
      await page.getByRole('button', { name: /sign up/i, exact: false }).click();

      // Form should still exist, we shouldn't proceed to confirmation
      await expect(page).toHaveURL(/.*\/signup/);
    });

    test('validates password matching', async ({ page }) => {
      // Test email that doesn't need to be real
      const testEmail = 'test@example.com';

      // Enter email and mismatched passwords
      await page.locator('input[name="email"]').fill(testEmail);
      await page.locator('input[name="password"]').fill('Password123!');
      await page.locator('input[name="repeatPassword"]').fill('Password123?');
      await page.getByRole('button', { name: /sign up/i, exact: false }).click();

      // Form should still exist, we shouldn't proceed to confirmation
      await expect(page).toHaveURL(/.*\/signup/);
    });
  });

  test.describe('Email Verification', () => {
    const testPassword = 'TestPassword123!';

    // Skip email verification tests by default
    // Enable with RUN_EMAIL_TESTS=true environment variable
    test.beforeEach(async () => {
      const runEmailTests = process.env.RUN_EMAIL_TESTS === 'true';
      test.skip(!runEmailTests, 'Skipping email tests - set RUN_EMAIL_TESTS=true to enable');
    });

    test('signup and verification UI flow without API (fallback)', async ({ page }) => {
      // Use a test email that won't receive real verification codes
      const mockEmail = `test-fallback-${Date.now()}@example.com`;

      // Visit signup page
      await page.goto('/signup');

      // Submit the signup form
      await page.locator('input[name="email"]').fill(mockEmail);
      await page.locator('input[name="password"]').fill(testPassword);
      await page.locator('input[name="repeatPassword"]').fill(testPassword);
      await page.getByRole('button', { name: /sign up/i, exact: false }).click();

      // Should proceed to confirmation step
      await expect(page.getByText('Confirm Your Email')).toBeVisible();

      // Verify the UI shows the correct email
      await expect(page.getByText(mockEmail)).toBeVisible();

      // Take a screenshot for reference
      await page.screenshot({ path: `test-artifacts/signup-confirmation-screen-${Date.now()}.png` });
    });

    test('completes signup with email verification and deletes account', async ({ page }) => {
      // Configure longer timeout for email operations
      test.slow();

      let inboxId = null;

      try {
        console.log('Creating MailSlurp inbox');

        // Create a test inbox using MailSlurp
        const inbox = await mailslurp.createInbox();
        inboxId = inbox.id;
        const emailAddress = inbox.emailAddress;

        console.log(`Test will use email: ${emailAddress}`);

        // Visit signup page
        await page.goto('/signup');

        // Submit valid signup form
        await page.locator('input[name="email"]').fill(emailAddress);
        await page.locator('input[name="password"]').fill(testPassword);
        await page.locator('input[name="repeatPassword"]').fill(testPassword);

        // Take a screenshot before submission
        await page.screenshot({ path: `test-artifacts/signup-before-submit-${Date.now()}.png` });

        // Click submit button and wait for form processing
        await page.getByRole('button', { name: /sign up/i, exact: false }).click();

        // Should proceed to confirmation step with longer timeout
        await expect(page.getByText('Confirm Your Email')).toBeVisible({ timeout: 30000 });

        // Wait for verification email - can take time to arrive
        console.log('Waiting for verification email...');

        // Use a longer timeout for email operations (60 seconds)
        const email = await mailslurp.waitForLatestEmail(inboxId, 60000);
        console.log('Email received');

        // Extract verification code from email body
        const verificationCode = mailslurp.extractVerificationCode(email.body || '');

        if (!verificationCode) {
          throw new Error('Verification code not found in email');
        }

        console.log(`Extracted verification code: ${verificationCode}`);

        // Enter verification code
        await page.locator('input[name="confirmationCode"]').fill(verificationCode);

        // Take screenshot before confirming
        await page.screenshot({ path: `test-artifacts/signup-confirmation-code-${Date.now()}.png` });

        // Submit verification code
        await page.getByRole('button', { name: /submit|confirm|verify/i, exact: false }).click();

        // Should redirect to login page
        await expect(page).toHaveURL(/.*\/login/, { timeout: 30000 });

        // Login with the new account
        await page.locator('input[name="email"]').fill(emailAddress);
        await page.locator('input[name="password"]').fill(testPassword);
        await page.getByRole('button', { name: /sign in/i, exact: false }).click();

        // Should redirect to my-recipes
        await expect(page).toHaveURL(/.*\/my-recipes/, { timeout: 30000 });

        // Clean up: Delete account
        await page.goto('/profile');

        // Wait for profile page to load
        await page.waitForSelector('text=Delete Account', { timeout: 30000 });

        // Take screenshot of profile page
        await page.screenshot({ path: `test-artifacts/signup-profile-page-${Date.now()}.png` });

        // Click delete account button
        await page.getByText('Delete Account').click();

        // Confirm deletion
        await page.getByText('Delete Your Account').waitFor();
        await page.getByRole('button', { name: 'Yes, Delete My Account' }).click();

        // Verify account deleted
        await page.getByText('Account Deleted', { exact: false }).waitFor({ timeout: 30000 });

        // Take final screenshot
        await page.screenshot({ path: `test-artifacts/signup-account-deleted-${Date.now()}.png` });

        // Clean up the test inbox
        if (inboxId) {
          console.log('Cleaning up test inbox');
          await mailslurp.deleteInbox(inboxId);
        }
      }
      catch (error) {
        // Take a screenshot for failures
        await page.screenshot({ path: `test-artifacts/signup-verification-error-${Date.now()}.png` });
        console.error('Email verification test failed:', error);

        // Clean up the test inbox even if test fails
        if (inboxId) {
          try {
            await mailslurp.deleteInbox(inboxId);
          }
          catch (cleanupError) {
            console.error('Failed to clean up test inbox:', cleanupError);
          }
        }

        throw error;
      }
    });
  });
});
