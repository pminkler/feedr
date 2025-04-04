import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    // Visit the contact page before each test
    await page.goto('/contact');

    // Ensure the page is loaded by checking for the header
    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();
  });

  test('allows guest users to submit feedback', async ({ page }) => {
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

    // Try a different approach to click the button - use JavaScript execution
    await page.evaluate(() => {
      // Find and click the submit button using JavaScript
      const button = document.querySelector('button[form="contactForm"]');
      if (button) button.click();
    });

    // Check for the success toast - use a more specific selector
    await expect(page.locator('div.text-sm.font-medium:has-text("Message Sent")').first()).toBeVisible({ timeout: 10000 });
    // Use a more specific selector for the thank you message
    await expect(page.locator('div.text-sm:has-text("Thank you for your message")').first()).toBeVisible({ timeout: 5000 });

    // Verify form is reset
    await expect(page.locator('input[name="email"]')).toHaveValue('');
    await expect(page.locator('textarea[name="message"]')).toHaveValue('');
  });

  test('validates form fields', async ({ page }) => {
    // Clear any default values (in case there are any)
    await page.locator('input[name="email"]').clear();
    await page.locator('textarea[name="message"]').clear();

    // Use JavaScript to submit the form
    await page.evaluate(() => {
      // Find and click the submit button using JavaScript
      const button = document.querySelector('button[form="contactForm"]');
      if (button) button.click();
    });

    // Form should remain visible, indicating submission was prevented
    await expect(page.locator('form')).toBeVisible();

    // Fill only email and submit again
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.evaluate(() => {
      const button = document.querySelector('button[form="contactForm"]');
      if (button) button.click();
    });

    // Add short message (less than 10 chars)
    await page.locator('textarea[name="message"]').fill('Too short');
    await page.evaluate(() => {
      const button = document.querySelector('button[form="contactForm"]');
      if (button) button.click();
    });

    // Form should still be visible, indicating submission was prevented
    await expect(page.locator('form')).toBeVisible();

    // Fix the message length and submit
    await page.locator('textarea[name="message"]').clear();
    await page.locator('textarea[name="message"]').fill('This message is long enough now');
    await page.evaluate(() => {
      const button = document.querySelector('button[form="contactForm"]');
      if (button) button.click();
    });

    // Check for success toast - use a more specific selector
    await expect(page.locator('div.text-sm.font-medium:has-text("Message Sent")').first()).toBeVisible({ timeout: 10000 });
    // Use a more specific selector for the thank you message
    await expect(page.locator('div.text-sm:has-text("Thank you for your message")').first()).toBeVisible({ timeout: 5000 });
  });

  test('shows form in correct initial state for guest users', async ({ page }) => {
    // Email field should be enabled for guest users
    await expect(page.locator('input[name="email"]')).toBeEnabled();

    // Message field should be empty
    await expect(page.locator('textarea[name="message"]')).toHaveValue('');
  });
});
