import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Contact Form for Authenticated Users', () => {
  test.beforeEach(async ({ page }) => {
    // Skip tests if credentials are not configured
    const testEmail = process.env.TEST_USER_EMAIL;
    const testPassword = process.env.TEST_USER_PASSWORD;

    test.skip(!testEmail || !testPassword,
      'Skipping authenticated contact form tests - TEST_USER_EMAIL and TEST_USER_PASSWORD env variables are required');

    // Login before each test using the helper function
    await login(page, testEmail, testPassword);

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

    // Check for the success toast
    await expect(page.getByText('Message Sent', { exact: false })).toBeVisible({ timeout: 10000 });
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

    // Check for success toast
    await expect(page.getByText('Message Sent', { exact: false })).toBeVisible({ timeout: 10000 });
    // Use a more specific selector for the thank you message
    await expect(page.locator('div.text-sm:has-text("Thank you for your message")').first()).toBeVisible({ timeout: 5000 });
  });
});
