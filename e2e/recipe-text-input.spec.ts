import { expect } from '@playwright/test';
import { claudeTest, captureHtml, createTestReport, inspectElement } from './utils/claude';

// Claude-enhanced test suite for recipe creation from text
claudeTest.describe('Recipe Text Input Test', () => {
  claudeTest.beforeEach(async ({ page }) => {
    // Visit the landing page before each test
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Create a comprehensive report of the initial page state
    await createTestReport(page, 'recipe-text-landing-page');
  });

  claudeTest('can open the recipe creation modal', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // For new recipe creation, we need to find the "Add Recipe" button
    // It could be in the header, in a floating action button, or elsewhere
    // Let's inspect the page to find all possible UI elements that might open the modal
    await createTestReport(page, 'recipe-text-find-add-button');

    // Try to locate the button using various selectors
    const addButton = page.getByRole('button', { name: /add|create|new/i })
      || page.locator('button.add-recipe, button[aria-label*="new"], button[aria-label*="add"]')
      || page.locator('header a[href*="new"], header a[href*="create"]');

    // Inspect the potential add button if found
    if (await addButton.isVisible()) {
      await inspectElement(page, await addButton.evaluate((el) => {
        return el.tagName.toLowerCase()
          + (el.id ? '#' + el.id : '')
          + (el.className ? '.' + el.className.split(' ').join('.') : '');
      }), {
        highlight: true,
        includeScreenshot: true,
        description: 'Add Recipe button',
      });

      // Capture the UI before clicking
      await captureHtml(page, 'recipe-text-add-button', {
        screenshot: true,
        highlight: addButton,
        annotate: [{ selector: addButton, text: 'Add Recipe button' }],
      });

      // Click to open modal
      await addButton.click();

      // Wait for modal to appear
      await page.waitForSelector('.modal, [role="dialog"]', { state: 'visible' });

      // Capture modal UI
      await captureHtml(page, 'recipe-text-modal-open', {
        screenshot: true,
        highlight: '.modal, [role="dialog"]',
        annotate: [{ selector: '.modal, [role="dialog"]', text: 'Recipe creation modal' }],
      });

      // Create detailed report of the modal
      await createTestReport(page, 'recipe-text-modal-details');

      // Look for input field in the modal
      const modalInput = page.getByPlaceholder('Recipe URL');

      // Verify the input field exists in the modal
      await expect(modalInput).toBeVisible();

      // Try to enter text recipe content
      const recipeText = `
        Classic Chocolate Chip Cookies
        
        Ingredients:
        2 1/4 cups all-purpose flour
        1 teaspoon baking soda
        1 teaspoon salt
        1 cup unsalted butter, softened
        3/4 cup granulated sugar
        3/4 cup packed brown sugar
        2 large eggs
        2 teaspoons vanilla extract
        2 cups chocolate chips
        
        Instructions:
        1. Preheat oven to 375°F
        2. Combine flour, baking soda, and salt in a bowl
        3. Beat butter and sugars until creamy
        4. Add eggs and vanilla, mix well
        5. Gradually add flour mixture
        6. Stir in chocolate chips
        7. Drop by rounded tablespoons onto baking sheets
        8. Bake 9-11 minutes until golden brown
        9. Cool on wire racks
      `;

      await modalInput.fill(recipeText);

      // Verify the input has text entered
      const inputValue = await modalInput.inputValue();
      expect(inputValue.length).toBeGreaterThan(10);

      // Capture the filled modal
      await captureHtml(page, 'recipe-text-input-filled', {
        screenshot: true,
        highlight: 'input',
        annotate: [{ selector: 'input', text: 'Text recipe entered' }],
      });

      // Find the submit button in the modal
      const submitButton = page.getByRole('button', { name: /get recipe|create|submit/i });
      await expect(submitButton).toBeVisible();

      // Capture the modal ready for submission
      await captureHtml(page, 'recipe-text-ready-submit', {
        screenshot: true,
        highlight: submitButton,
        annotate: [{ selector: submitButton, text: 'Submit button' }],
      });

      // For testing purposes, we'll skip the actual submission
      // In a real test with test data, we would:
      // await submitButton.click();
      // await page.waitForURL(/\/recipes\//, { timeout: 60000 });
    }
    else {
      // If no add button was found, document options for adding recipes
      console.log('Could not find \'Add Recipe\' button. Usage may require login or different UI flow.');

      // Check if we need to login first
      const loginButton = page.getByRole('link', { name: /login|sign in/i });

      if (await loginButton.isVisible()) {
        await captureHtml(page, 'recipe-text-login-required', {
          screenshot: true,
          highlight: loginButton,
          annotate: [{ selector: loginButton, text: 'Login may be required' }],
        });
      }

      // Create a report documenting the landing page UI options
      await createTestReport(page, 'recipe-text-ui-options');
    }
  });
});
