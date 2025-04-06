import { test } from '@playwright/test';
import { LandingPage } from './page-objects/LandingPage';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { RecipePage } from './page-objects/RecipePage';

/**
 * Development test for iteratively building the edit recipe functionality
 * This is a development-focused test that is used to capture DOM states
 * and iteratively build the page object model.
 *
 * It won't run in CI or regular test runs due to the .development.spec.ts naming.
 */
test('capture edit recipe slideover DOM for iterative development', async ({ page }) => {
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
  await recipePage.setEditFormTitle('Modified Title for Development');
  await recipePage.setEditFormDescription('This is a modified description for testing purposes in development');

  // Set time values
  await recipePage.setEditFormPrepTime(15);
  await recipePage.setEditFormCookTime(25);
  await recipePage.setEditFormServings(4);

  // Add a new ingredient and step
  await recipePage.addEditFormIngredient();
  await recipePage.updateEditFormIngredient(0, '2 tablespoons', 'Test ingredient during development');

  await recipePage.addEditFormStep();
  await recipePage.updateEditFormStep(0, 'This is a test step added during development testing');

  // Capture DOM state after modifications
  await recipePage.captureDOMState('recipe-page-edit-slideover-after-changes');

  // Try deleting an ingredient and step if they exist
  const ingredients = await recipePage.getIngredientsList();
  if (ingredients.length > 1) {
    await recipePage.deleteEditFormIngredient(1);
    await recipePage.captureDOMState('recipe-page-edit-after-delete-ingredient');
  }

  const instructions = await recipePage.getInstructionsList();
  if (instructions.length > 1) {
    await recipePage.deleteEditFormStep(1);
    await recipePage.captureDOMState('recipe-page-edit-after-delete-step');
  }

  // Cancel the edit (we don't want to save during development testing)
  await recipePage.cancelEditForm();

  // Capture final state after closing the form
  await recipePage.captureDOMState('recipe-page-after-cancel-edit');
});
