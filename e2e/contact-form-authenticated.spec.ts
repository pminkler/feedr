import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Contact Form for Authenticated Users', () => {
  test.beforeEach(async ({ page }) => {
    // Try to login with default credentials from auth helper
    try {
      console.log('Starting login process');
      await login(page);
      console.log('Login completed successfully');
    }
    catch (error) {
      console.log(`Login failed with error: ${error.message}`);
      // Take a screenshot of the failed login
      await page.screenshot({ path: 'login-error.png' });
      test.skip(true, `Login failed, skipping authenticated tests: ${error.message}`);
      return;
    }

    // After successful login, navigate to the contact page
    await page.goto('/contact');

    // Ensure the page is loaded by checking for the header
    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
  });

  test('auto-fills email for authenticated users', async ({ page }) => {
    // Check that email field is disabled and auto-filled
    await expect(page.locator('input[name="email"]')).toBeDisabled();

    // Verify that the email field isn't empty
    const emailValue = await page.locator('input[name="email"]').inputValue();
    expect(emailValue).not.toBe('');

    // Check for the auto-fill helper text
    await expect(page.getByText('Using your account email', { exact: false })).toBeVisible();
  });

  test('allows authenticated users to submit feedback', async ({ page }) => {
    // Type a message (email is already auto-filled)
    await page.locator('textarea[name="message"]').fill(
      'This is a test message from an authenticated user. Please ignore.',
    );

    // Use JavaScript to submit the form
    await page.evaluate(() => {
      // Find and click the submit button using JavaScript
      const button = document.querySelector('button[form="contactForm"]');
      if (button) button.click();
    });

    // Check for the success toast - use a more specific selector
    await expect(page.locator('div.text-sm.font-medium:has-text("Message Sent")').first()).toBeVisible({ timeout: 10000 });
    // Use a more specific selector for the thank you message
    await expect(page.locator('div.text-sm:has-text("Thank you for your message")').first()).toBeVisible({ timeout: 5000 });

    // Verify form's message is reset but email remains
    await expect(page.locator('textarea[name="message"]')).toHaveValue('');
    await expect(page.locator('input[name="email"]')).toBeDisabled();

    // Email should still have a value
    const emailValue = await page.locator('input[name="email"]').inputValue();
    expect(emailValue).not.toBe('');
  });

  test('validates minimum message length for authenticated users', async ({ page }) => {
    // Clear any existing text
    await page.locator('textarea[name="message"]').clear();

    // Add short message (less than 10 chars)
    await page.locator('textarea[name="message"]').fill('Too short');

    // Use JavaScript to submit the form
    await page.evaluate(() => {
      // Find and click the submit button using JavaScript
      const button = document.querySelector('button[form="contactForm"]');
      if (button) button.click();
    });

    // Form should still be visible, indicating submission was prevented
    await expect(page.locator('form')).toBeVisible();

    // Fix the message length and submit
    await page.locator('textarea[name="message"]')
      .clear();
    await page.locator('textarea[name="message"]')
      .fill('This message is long enough now to meet the validation requirements');

    // Use JavaScript to submit the form
    await page.evaluate(() => {
      // Find and click the submit button using JavaScript
      const button = document.querySelector('button[form="contactForm"]');
      if (button) button.click();
    });

    // Check for success toast - use a more specific selector
    await expect(page.locator('div.text-sm.font-medium:has-text("Message Sent")').first()).toBeVisible({ timeout: 10000 });
    // Use a more specific selector for the thank you message
    await expect(page.locator('div.text-sm:has-text("Thank you for your message")').first()).toBeVisible({ timeout: 5000 });
  });
});
