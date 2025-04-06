import { test } from '@playwright/test';
import { LandingPage } from './page-objects/LandingPage';

/**
 * This is a development test for building the EditRecipeSlideover Page Object Model
 * It demonstrates how to capture DOM information at different stages of test execution
 */
test('recipe edit slideover DOM capture', async ({ page }) => {
  // Allow a longer timeout for recipe generation
  test.setTimeout(120000);

  // Step 1: Start at the landing page
  const landingPage = new LandingPage(page);
  await landingPage.goto();

  // Capture the landing page state if needed
  await landingPage.captureDOMState('landing-page');

  // Step 2: Submit a recipe URL and navigate to the recipe page
  console.log('Submitting recipe URL...');
  const recipePage = await landingPage.submitRecipeAndWaitForResult(
    'https://www.allrecipes.com/recipe/21014/good-old-fashioned-pancakes/',
  );

  // Capture the recipe page state
  await recipePage.captureDOMState('recipe-page');

  // Step 3: Click the edit button when it becomes available
  try {
    // Wait for the edit button to appear (may need to adjust selector based on DOM capture)
    await page.waitForSelector('[data-testid="edit-recipe-button"]', { timeout: 30000 });

    // Click the edit button
    console.log('Clicking edit recipe button...');
    await page.click('[data-testid="edit-recipe-button"]');

    // Wait for the edit slideover to appear
    await page.waitForSelector('[data-testid="edit-recipe-slideover"]', { timeout: 10000 });

    // Capture the edit slideover state
    await recipePage.captureDOMState('edit-recipe-slideover');

    console.log('DOM capture completed for edit recipe slideover');
  }
  catch (error) {
    console.error('Error during edit recipe interaction:', error);

    // Still try to capture the current state to aid debugging
    await recipePage.captureDOMState('edit-recipe-error-state');
  }
});
