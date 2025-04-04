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

  // Skip interactive tests due to Vite plugin checker overlay issues
  test.skip('allows authenticated users to submit feedback', async ({ page }) => {
    // Type a message (email is already auto-filled)
    await page.locator('textarea[name="message"]').fill(
      'This is a test message from an authenticated user. Please ignore.',
    );

    // Submit the form using the form attribute instead of button text
    await page.locator('button[form="contactForm"]').click();

    // Check for the success toast
    await expect(page.getByText('Message Sent', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Thank you for your message', { exact: false })).toBeVisible();

    // Verify form's message is reset but email remains
    await expect(page.locator('textarea[name="message"]')).toHaveValue('');
    await expect(page.locator('input[name="email"]')).toBeDisabled();

    // Email should still have a value
    const emailValue = await page.locator('input[name="email"]').inputValue();
    expect(emailValue).not.toBe('');
  });

  // Skip interactive tests due to Vite plugin checker overlay issues
  test.skip('validates minimum message length for authenticated users', async ({ page }) => {
    // Clear any existing text
    await page.locator('textarea[name="message"]').clear();

    // Add short message (less than 10 chars)
    await page.locator('textarea[name="message"]').fill('Too short');
    await page.locator('button[form="contactForm"]').click();

    // Form should still be visible, indicating submission was prevented
    await expect(page.locator('form')).toBeVisible();

    // Fix the message length and submit
    await page.locator('textarea[name="message"]')
      .clear();
    await page.locator('textarea[name="message"]')
      .fill('This message is long enough now to meet the validation requirements');
    await page.locator('button[form="contactForm"]').click();

    // Check for success toast
    await expect(page.getByText('Message Sent', { exact: false })).toBeVisible({ timeout: 10000 });
  });
});
