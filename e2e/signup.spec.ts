// e2e/signup.spec.ts
import { test, expect } from '@playwright/test';
import * as mailslurp from './helpers/mailslurp';
import { captureHtml, setupDebugHelpers, takeDebugSnapshot, analyzeEventHandlers } from './helpers/debug';

test.describe('Signup Flow', () => {
  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page, context }) => {
      // Setup debug helpers for this page
      setupDebugHelpers(page, test.info());
      
      // Visit signup page before each test
      await page.goto('/signup');

      // Clear cookies and localStorage to prevent auth state persistence
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());
      
      // Take a debug snapshot at the start of each test
      await takeDebugSnapshot(page, test.info(), 'signup-page-initial');
    });

    test('displays signup form elements correctly', async ({ page }) => {
      // Verify we're on the signup page
      await expect(page).toHaveURL(/\/signup$/);

      // Wait for the form to be fully loaded
      await page.waitForSelector('form');
      
      // Take a detailed snapshot of the form
      await captureHtml(page, test.info(), 'form', 'signup-form-elements');

      // Verify critical elements are present using simpler selectors
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="repeatPassword"]')).toBeVisible();

      // Verify some button with text that contains "Sign Up" exists (more flexible)
      const signupButtonExists = await page.locator('button').filter({ hasText: /sign up/i }).count() > 0;
      expect(signupButtonExists).toBeTruthy();
      
      // Analyze the signup button's event handlers to ensure it's interactive
      const signupButton = page.locator('button').filter({ hasText: /sign up/i }).first();
      await analyzeEventHandlers(page, 'button:has-text("Sign up"), button:has-text("Sign Up")', test.info());

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

      // Find and click the signup button
      const signupButton = page.getByRole('button', { name: /sign up/i, exact: false });
      await signupButton.click({ timeout: 5000 });

      // Verify we stay on the signup page after invalid submit
      await expect(page).toHaveURL(/.*\/signup/);
      
      // Look for email error message
      const emailError = page.locator('[id*="email-error"], [data-test="email-error"], .text-red-500, .text-error')
        .filter({ hasText: /required|empty|needed|mandatory|email/i }).first();
      
      // Verify an error message about required email is shown
      await expect(emailError).toBeVisible();
      
      // Capture the error message text
      const emailErrorText = await emailError.textContent();
      console.log(`Email validation error: ${emailErrorText}`);
      
      // Look for password error message
      const passwordError = page.locator('[id*="password-error"], [data-test="password-error"], .text-red-500, .text-error')
        .filter({ hasText: /required|empty|needed|mandatory|password/i }).first();
      
      // Verify an error message about required password is shown
      await expect(passwordError).toBeVisible();
      
      // Capture the HTML with all validation errors
      await captureHtml(page, test.info(), 'form', 'empty-fields-validation');
      
      // Take a debug snapshot of the validation state
      await takeDebugSnapshot(page, test.info(), 'signup-empty-fields-validation');
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
      
      // Look for password requirement error about uppercase
      const uppercaseError = page.locator('[id*="password-error"], [data-test="password-error"], .text-red-500, .text-error')
        .filter({ hasText: /uppercase|capital/i }).first();
      
      await expect(uppercaseError).toBeVisible();
      
      // Capture the error message
      const uppercaseErrorText = await uppercaseError.textContent();
      console.log(`Password uppercase validation error: ${uppercaseErrorText}`);
      
      // Capture the HTML showing the password requirement error
      await captureHtml(page, test.info(), 'form', 'password-missing-uppercase');

      // Clear the fields
      await page.locator('input[name="password"]').clear();
      await page.locator('input[name="repeatPassword"]').clear();

      // Test password missing number
      await page.locator('input[name="password"]').fill('Password!');
      await page.locator('input[name="repeatPassword"]').fill('Password!');
      await page.getByRole('button', { name: /sign up/i, exact: false }).click();

      // Form should still exist, we shouldn't proceed to confirmation
      await expect(page).toHaveURL(/.*\/signup/);
      
      // Look for password requirement error about number
      const numberError = page.locator('[id*="password-error"], [data-test="password-error"], .text-red-500, .text-error')
        .filter({ hasText: /number|digit/i }).first();
      
      await expect(numberError).toBeVisible();
      
      // Capture the error message
      const numberErrorText = await numberError.textContent();
      console.log(`Password number validation error: ${numberErrorText}`);
      
      // Capture the HTML showing the password requirement error
      await captureHtml(page, test.info(), 'form', 'password-missing-number');
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
      
      // Look for password mismatch error
      const mismatchError = page.locator('[id*="password-error"], [id*="repeatPassword-error"], [data-test="password-error"], .text-red-500, .text-error')
        .filter({ hasText: /match|same|identical|different/i }).first();
      
      await expect(mismatchError).toBeVisible();
      
      // Capture the error message
      const mismatchErrorText = await mismatchError.textContent();
      console.log(`Password match validation error: ${mismatchErrorText}`);
      
      // Take a debug snapshot of the form with mismatch error
      await captureHtml(page, test.info(), 'form', 'password-mismatch');
    });
  });

  test.describe('Email Verification', () => {
    const testPassword = 'TestPassword123!';

    // Skip email verification tests by default
    // Enable with RUN_EMAIL_TESTS=true environment variable
    test.beforeEach(async ({ page }) => {
      // Setup debug helpers
      setupDebugHelpers(page, test.info());
      
      const runEmailTests = process.env.RUN_EMAIL_TESTS === 'true';
      test.skip(!runEmailTests, 'Skipping email tests - set RUN_EMAIL_TESTS=true to enable');
    });

    test('signup and verification UI flow without API (fallback)', async ({ page }) => {
      // Use a test email that won't receive real verification codes
      const mockEmail = `test-fallback-${Date.now()}@example.com`;

      // Visit signup page
      await page.goto('/signup');
      
      // Take initial snapshot
      await takeDebugSnapshot(page, test.info(), 'signup-verification-start');

      // Submit the signup form
      await page.locator('input[name="email"]').fill(mockEmail);
      await page.locator('input[name="password"]').fill(testPassword);
      await page.locator('input[name="repeatPassword"]').fill(testPassword);
      await page.getByRole('button', { name: /sign up/i, exact: false }).click();

      // Should proceed to confirmation step
      await expect(page.getByText('Confirm Your Email')).toBeVisible();

      // Verify the UI shows the correct email
      await expect(page.getByText(mockEmail)).toBeVisible();

      // Capture detailed view of the confirmation page
      await captureHtml(page, test.info(), 'main', 'email-confirmation-page');
      
      // Take a detailed snapshot of the verification state
      await takeDebugSnapshot(page, test.info(), 'email-verification-screen');
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
        
        // Take initial snapshot
        await takeDebugSnapshot(page, test.info(), 'mailslurp-signup-start');

        // Submit valid signup form
        await page.locator('input[name="email"]').fill(emailAddress);
        await page.locator('input[name="password"]').fill(testPassword);
        await page.locator('input[name="repeatPassword"]').fill(testPassword);

        // Capture the form before submission
        await captureHtml(page, test.info(), 'form', 'valid-signup-form');

        // Click submit button and wait for form processing
        await page.getByRole('button', { name: /sign up/i, exact: false }).click();

        // Should proceed to confirmation step with longer timeout
        await expect(page.getByText('Confirm Your Email')).toBeVisible({ timeout: 30000 });
        
        // Take a snapshot of the confirmation page
        await takeDebugSnapshot(page, test.info(), 'confirmation-code-entry');

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
        
        // Capture confirmation code entry
        await captureHtml(page, test.info(), 'input[name="confirmationCode"]', 'confirmation-code-filled');

        // Submit verification code
        await page.getByRole('button', { name: /submit|confirm|verify/i, exact: false }).click();

        // Should redirect to login page
        await expect(page).toHaveURL(/.*\/login/, { timeout: 30000 });
        
        // Take a snapshot after successful verification
        await takeDebugSnapshot(page, test.info(), 'redirected-to-login');

        // Login with the new account
        await page.locator('input[name="email"]').fill(emailAddress);
        await page.locator('input[name="password"]').fill(testPassword);
        await page.getByRole('button', { name: /sign in/i, exact: false }).click();

        // Should redirect to my-recipes
        await expect(page).toHaveURL(/.*\/my-recipes/, { timeout: 30000 });
        
        // Take a snapshot after successful login
        await takeDebugSnapshot(page, test.info(), 'logged-in-with-new-account');

        // Clean up: Delete account
        await page.goto('/profile');

        // Wait for profile page to load
        await page.waitForSelector('text=Delete Account', { timeout: 30000 });
        
        // Take snapshot of profile page
        await takeDebugSnapshot(page, test.info(), 'profile-page');

        // Click delete account button
        await page.getByText('Delete Account').click();

        // Confirm deletion
        await page.getByText('Delete Your Account').waitFor();
        
        // Capture delete account modal
        await captureHtml(page, test.info(), '[role="dialog"], .modal, #delete-account-modal', 'delete-account-modal');
        
        await page.getByRole('button', { name: 'Yes, Delete My Account' }).click();

        // Verify account deleted
        await page.getByText('Account Deleted', { exact: false }).waitFor({ timeout: 30000 });
        
        // Take final snapshot
        await takeDebugSnapshot(page, test.info(), 'account-deleted-confirmation');

        // Clean up the test inbox
        if (inboxId) {
          console.log('Cleaning up test inbox');
          await mailslurp.deleteInbox(inboxId);
        }
      }
      catch (error) {
        // Take a detailed snapshot for failures
        await takeDebugSnapshot(page, test.info(), 'verification-error');
        
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
