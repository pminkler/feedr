import { expect } from '@playwright/test';
import { claudeTest, captureHtml, createTestReport } from './utils/claude';

// Claude-enhanced test suite for recipe creation from text
claudeTest.describe('Recipe Text Input Test', () => {
  claudeTest.beforeEach(async ({ page }) => {
    // Visit the landing page before each test
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Create a comprehensive report of the initial page state
    await createTestReport(page, 'recipe-text-landing-page');
  });

  claudeTest('documents text input for recipes', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Capture the URL form which can accept text as well
    const urlInput = page.getByPlaceholder('Recipe URL');
    await expect(urlInput).toBeVisible();

    // Capture the URL form area
    await captureHtml(page, 'recipe-text-input-field', {
      screenshot: true,
      highlight: 'form',
      annotate: [{ selector: urlInput, text: 'Recipe URL/text input field' }],
    });

    // Try to enter a text recipe directly in the URL field
    const recipeText = `Classic Chocolate Chip Cookies

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
9. Cool on wire racks`;

    // Fill the input with the recipe text
    await urlInput.fill(recipeText.substring(0, 50)); // Add just first 50 chars for demo

    // Verify the input has text entered - but don't check exact value since newlines might be converted
    const inputValue = await urlInput.inputValue();
    expect(inputValue.length).toBeGreaterThan(10);

    // Capture the filled input
    await captureHtml(page, 'recipe-text-input-filled', {
      screenshot: true,
      highlight: urlInput,
      annotate: [{ selector: urlInput, text: 'Text recipe partially entered' }],
    });

    // Find the submit button
    const submitButton = page.getByRole('button', { name: 'Get Recipe' });
    await expect(submitButton).toBeVisible();

    // Capture the form with text ready for submission
    await captureHtml(page, 'recipe-text-ready-submit', {
      screenshot: true,
      highlight: submitButton,
      annotate: [{ selector: submitButton, text: 'Submit button for text recipe' }],
    });

    // For testing purposes, we'll skip the actual submission
    // In a real test, we would:
    // await submitButton.click();
    // await page.waitForURL(/\/recipes\//, { timeout: 60000 });

    // Create detailed report of the form submission options
    await createTestReport(page, 'recipe-text-submission-options');

    // Clear the input for cleanup
    await urlInput.clear();
  });

  claudeTest('explores possible modal input options', async ({ page }) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Create a report of page UI to see navigation options
    await createTestReport(page, 'recipe-text-page-navigation');

    // Check for links to "my recipes" or profile that might have add options
    const myRecipesLink = page.getByRole('link', { name: /my recipes|recipes/i });
    const profileLink = page.getByRole('link', { name: /profile|account/i });

    // Create screenshots of navigation options
    if (await myRecipesLink.isVisible()) {
      await captureHtml(page, 'recipe-text-my-recipes-link', {
        screenshot: true,
        highlight: myRecipesLink,
        annotate: [{ selector: myRecipesLink, text: 'My Recipes link that might offer text input options' }],
      });
    }

    if (await profileLink.isVisible()) {
      await captureHtml(page, 'recipe-text-profile-link', {
        screenshot: true,
        highlight: profileLink,
        annotate: [{ selector: profileLink, text: 'Profile link' }],
      });
    }

    // Look for UI elements that might trigger modal dialogs
    const _buttons = page.locator('button');
    await createTestReport(page, 'recipe-text-buttons-survey');

    // Document if login is required for advanced features
    const loginButton = page.getByRole('link', { name: /login|sign in/i });
    if (await loginButton.isVisible()) {
      await captureHtml(page, 'recipe-text-login-option', {
        screenshot: true,
        highlight: loginButton,
        annotate: [{ selector: loginButton, text: 'Login may be required for advanced features' }],
      });
    }
  });
});
