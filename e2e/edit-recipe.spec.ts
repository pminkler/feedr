import { test, expect } from '@playwright/test';
import { LandingPage } from './page-objects/LandingPage';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { RecipePage } from './page-objects/RecipePage';

/**
 * Full test flow using the POM pattern to:
 * 1. Start on landing page
 * 2. Submit a recipe URL
 * 3. Wait for generation and page transition
 * 4. Verify recipe page content
 * 5. Edit the recipe
 * 6. Save changes
 * 7. Verify the changes were applied
 */
test('edit recipe with Page Object Model', async ({ page }) => {
  // Test recipe URL - using a direct, stable recipe for testing
  const recipeUrl = 'https://www.allrecipes.com/recipe/158968/spinach-and-feta-turkey-burgers/';

  // Create the landing page object and navigate to it
  const landingPage = new LandingPage(page);
  await landingPage.goto();
  await landingPage.expectPageLoaded();

  // Submit the recipe URL and wait for the recipe page
  const recipePage = await landingPage.submitRecipeAndWaitForResult(recipeUrl);

  // Verify the recipe page is loaded
  await recipePage.expectRecipeLoaded();

  // Get the original title for comparison later
  const originalTitle = await recipePage.getRecipeTitle();
  console.log(`Original title: ${originalTitle}`);

  // Click the edit button to open the edit slideover
  await recipePage.clickEditRecipe();

  // Get the current title from the edit form
  const editFormTitle = await recipePage.getEditFormTitle();

  // Modify the recipe title
  const newTitle = `${editFormTitle} - Edited`;
  await recipePage.setEditFormTitle(newTitle);

  // Update an ingredient if any exist
  const ingredients = await recipePage.getIngredientsList();
  if (ingredients.length > 0) {
    await recipePage.updateEditFormIngredient(0, 2, 'Modified ingredient');
  }

  // Update a step if any exist
  const instructions = await recipePage.getInstructionsList();
  if (instructions.length > 0) {
    await recipePage.updateEditFormStep(0, 'Modified step instructions');
  }

  // Save the changes
  await recipePage.saveEditForm();

  // Verify the changes were applied
  const updatedTitle = await recipePage.getRecipeTitle();
  expect(updatedTitle).toContain('Edited');

  // Log success
  console.log('Recipe edited successfully!');
});

/**
 * Development test for capturing DOM state
 * This test navigates to a recipe and captures the DOM state
 * of the edit slideover for analysis during development
 */
test.skip('capture edit recipe slideover DOM for development', async ({ page }) => {
  // Test recipe URL - using a direct, stable recipe for testing
  const recipeUrl = 'https://www.allrecipes.com/recipe/158968/spinach-and-feta-turkey-burgers/';

  // Create the landing page object and navigate to it
  const landingPage = new LandingPage(page);
  await landingPage.goto();

  // Submit the recipe URL and wait for the recipe page
  const recipePage = await landingPage.submitRecipeAndWaitForResult(recipeUrl);

  // Verify the recipe page is loaded
  await recipePage.expectRecipeLoaded();

  // Capture DOM state of the recipe page
  await recipePage.captureDOMState('recipe-page-before-edit');

  // Click the edit button and capture the edit form
  await recipePage.clickEditRecipe();

  // Capture DOM state of the edit slideover
  await recipePage.captureDOMState('recipe-page-edit-slideover');

  // Make some edits and capture again
  await recipePage.setEditFormTitle('Modified Title');
  await recipePage.setEditFormDescription('This is a modified description for testing');

  // Add a new ingredient and step
  await recipePage.addEditFormIngredient();
  await recipePage.addEditFormStep();

  // Capture DOM state after modifications
  await recipePage.captureDOMState('recipe-page-edit-slideover-after-changes');

  // Cancel the edit
  await recipePage.cancelEditForm();
});
