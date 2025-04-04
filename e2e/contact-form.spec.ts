import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    // Visit the contact page before each test
    await page.goto('/contact');

    // Ensure the page is loaded by checking for the header
    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
  });

  // Skip these tests for now due to Vite plugin checker overlay issues
  test.skip('allows guest users to submit feedback', async ({ page }) => {
    // Check that form elements are visible
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();

    // Fill out the form with valid data
    await page.locator('input[name="email"]').fill('test@example.com');

    // The default value is already set to 'GENERAL_FEEDBACK' so we don't need to change it

    // Enter a message that's long enough (> 10 chars)
    await page.locator('textarea[name="message"]').fill(
      'This is a test message for the contact form. Please ignore.',
    );

    // Find button by its icon and form attribute instead of text
    await page.locator('button[form="contactForm"]').click();

    // Check for the success toast - look for content that contains Message Sent
    await expect(page.getByText('Message Sent', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Thank you for your message', { exact: false })).toBeVisible();

    // Verify form is reset
    await expect(page.locator('input[name="email"]')).toHaveValue('');
    await expect(page.locator('textarea[name="message"]')).toHaveValue('');
  });

  // Skip these tests for now due to Vite plugin checker overlay issues
  test.skip('validates form fields', async ({ page }) => {
    // Clear any default values (in case there are any)
    await page.locator('input[name="email"]').clear();
    await page.locator('textarea[name="message"]').clear();

    // Find button by its form attribute instead of text
    await page.locator('button[form="contactForm"]').click();

    // Form should remain visible, indicating submission was prevented
    await expect(page.locator('form')).toBeVisible();

    // Fill only email and submit again
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('button[form="contactForm"]').click();

    // Add short message (less than 10 chars)
    await page.locator('textarea[name="message"]').fill('Too short');
    await page.locator('button[form="contactForm"]').click();

    // Form should still be visible, indicating submission was prevented
    await expect(page.locator('form')).toBeVisible();

    // Fix the message length and submit
    await page.locator('textarea[name="message"]').clear();
    await page.locator('textarea[name="message"]').fill('This message is long enough now');
    await page.locator('button[form="contactForm"]').click();

    // Check for success toast
    await expect(page.getByText('Message Sent', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('shows form in correct initial state for guest users', async ({ page }) => {
    // Email field should be enabled for guest users
    await expect(page.locator('input[name="email"]')).toBeEnabled();

    // Message field should be empty
    await expect(page.locator('textarea[name="message"]')).toHaveValue('');
  });
});
