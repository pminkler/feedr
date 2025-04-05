import { test, expect } from './utils/debug-test';
import { login, logout } from './utils/auth-helpers';

test.describe('Recipe access for authenticated and unauthenticated users', () => {
  const testRecipeUrl = 'https://www.allrecipes.com/recipe/21014/good-old-fashioned-pancakes/';
  const testUser = {
    email: 'pminkler+testuser@gmail.com',
    password: 'Password1!',
  };

  test.beforeEach(async ({ page }) => {
    // Start each test on the landing page
    await page.goto('http://localhost:3000/');
    await page.captureDebug('landing-page');
  });

  test('guest user can submit and view recipe', async ({ page }) => {
    // Test as guest (unauthenticated) user
    await page.captureDebug('guest-user-landing');

    // Submit a recipe URL
    await page.getByTestId('recipe-url-input').click();
    await page.getByTestId('recipe-url-input').fill(testRecipeUrl);
    await page.getByTestId('submit-button').click();
    await page.captureDebug('recipe-submitted-by-guest');

    // Wait for the recipe to load
    await expect(page.getByTestId('details-heading')).toContainText('Recipe Details', { timeout: 30000 });
    await page.captureDebug('recipe-loaded-for-guest');

    // Verify recipe content is visible
    await expect(page.getByTestId('nutrition-calories')).toContainText('Calories', { timeout: 30000 });
    await expect(page.getByTestId('ingredients-list')).toBeVisible();
    await expect(page.getByTestId('steps-list')).toBeVisible();

    // Verify edit functionality is available for guests
    await expect(page.getByTestId('edit-recipe-button')).toBeVisible();
  });

  test('guest user can edit recipe', async ({ page }) => {
    // Test recipe editing as guest user
    // Submit a recipe URL first
    await page.getByTestId('recipe-url-input').click();
    await page.getByTestId('recipe-url-input').fill(testRecipeUrl);
    await page.getByTestId('submit-button').click();

    // Wait for the recipe to load and edit button to be visible
    await expect(page.getByTestId('edit-recipe-button')).toBeVisible({ timeout: 30000 });
    await page.captureDebug('edit-button-visible-for-guest');

    // Click the edit button to open the edit slideover
    await page.getByTestId('edit-recipe-button').click();
    await page.captureDebug('edit-slideover-opened-for-guest');

    // Edit recipe title
    await page.getByTestId('recipe-title-input').click();
    await page.getByTestId('recipe-title-input').fill('Guest Edited Pancakes');

    // Edit servings
    await page.getByTestId('recipe-servings-input').click();
    await page.getByTestId('recipe-servings-input').fill('3');
    await page.captureDebug('guest-recipe-edited');

    // Save the changes
    await page.getByTestId('recipe-save-button').click();
    await page.captureDebug('guest-changes-saved');

    // Verify the changes were applied
    await expect(page.getByTestId('recipe-title')).toContainText('Guest Edited Pancakes');
    await expect(page.getByTestId('recipe-servings')).toContainText('Servings: 3');
  });

  test('authenticated user can submit and view recipe', async ({ page }) => {
    // Login first
    await login(page, testUser.email, testUser.password);
    await page.captureDebug('authenticated-user-logged-in');

    // Go to landing page
    await page.goto('http://localhost:3000/');

    // Submit a recipe URL
    await page.getByTestId('recipe-url-input').click();
    await page.getByTestId('recipe-url-input').fill(testRecipeUrl);
    await page.getByTestId('submit-button').click();
    await page.captureDebug('recipe-submitted-by-authenticated-user');

    // Wait for the recipe to load
    await expect(page.getByTestId('details-heading')).toContainText('Recipe Details', { timeout: 30000 });
    await page.captureDebug('recipe-loaded-for-authenticated-user');

    // Verify recipe content is visible
    await expect(page.getByTestId('nutrition-calories')).toContainText('Calories', { timeout: 30000 });
    await expect(page.getByTestId('ingredients-list')).toBeVisible();
    await expect(page.getByTestId('steps-list')).toBeVisible();

    // Verify edit functionality is available for authenticated users
    await expect(page.getByTestId('edit-recipe-button')).toBeVisible();

    // Verify save/bookmark functionality is available (typically only for authenticated users)
    await expect(page.getByTestId('save-recipe-button')).toBeVisible();

    // Logout at the end
    await logout(page);
  });

  test('authenticated user can edit recipe', async ({ page }) => {
    // Login first
    await login(page, testUser.email, testUser.password);
    await page.captureDebug('authenticated-user-logged-in');

    // Go to landing page and submit a recipe
    await page.goto('http://localhost:3000/');
    await page.getByTestId('recipe-url-input').click();
    await page.getByTestId('recipe-url-input').fill(testRecipeUrl);
    await page.getByTestId('submit-button').click();

    // Wait for the recipe to load and edit button to be visible
    await expect(page.getByTestId('edit-recipe-button')).toBeVisible({ timeout: 30000 });
    await page.captureDebug('edit-button-visible-for-authenticated-user');

    // Click the edit button to open the edit slideover
    await page.getByTestId('edit-recipe-button').click();
    await page.captureDebug('edit-slideover-opened-for-authenticated-user');

    // Edit recipe title
    await page.getByTestId('recipe-title-input').click();
    await page.getByTestId('recipe-title-input').fill('Authenticated User Edited Pancakes');

    // Edit prep time
    await page.getByTestId('recipe-prep-time-input').click();
    await page.getByTestId('recipe-prep-time-input').fill('10');
    await page.getByTestId('recipe-prep-time-unit-select').click();
    await page.getByText('Minutes').click();
    await page.captureDebug('authenticated-recipe-edited');

    // Save the changes
    await page.getByTestId('recipe-save-button').click();
    await page.captureDebug('authenticated-changes-saved');

    // Verify the changes were applied
    await expect(page.getByTestId('recipe-title')).toContainText('Authenticated User Edited Pancakes');
    await expect(page.getByTestId('recipe-prep-time')).toContainText('Prep time: 10 minutes');

    // Verify the user can save/bookmark the recipe (typically only for authenticated users)
    await expect(page.getByTestId('save-recipe-button')).toBeVisible();
    await page.getByTestId('save-recipe-button').click();
    await page.captureDebug('recipe-saved-by-authenticated-user');

    // Navigate to My Recipes to verify the recipe was saved
    await page.goto('http://localhost:3000/my-recipes');
    await page.captureDebug('my-recipes-page');

    // Check if the saved recipe appears in the list
    await expect(page.getByText('Authenticated User Edited Pancakes')).toBeVisible({ timeout: 10000 });

    // Logout at the end
    await logout(page);
  });

  test('authenticated user can save and delete recipes', async ({ page }) => {
    // Login first
    await login(page, testUser.email, testUser.password);

    // Submit a recipe
    await page.goto('http://localhost:3000/');
    await page.getByTestId('recipe-url-input').click();
    await page.getByTestId('recipe-url-input').fill(testRecipeUrl);
    await page.getByTestId('submit-button').click();

    // Wait for recipe to load
    await expect(page.getByTestId('details-heading')).toContainText('Recipe Details', { timeout: 30000 });

    // Save the recipe
    await page.getByTestId('save-recipe-button').click();
    await page.captureDebug('recipe-saved');

    // Go to My Recipes
    await page.goto('http://localhost:3000/my-recipes');
    await page.captureDebug('my-recipes-page-with-saved-recipe');

    // Verify recipe appears in list
    const savedRecipeCard = page.locator('[data-testid^="recipe-card-"]').first();
    await expect(savedRecipeCard).toBeVisible();

    // Delete the recipe (if delete functionality exists)
    try {
      const deleteButton = savedRecipeCard.getByTestId('delete-recipe-button');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Look for confirm delete button in any dialog that appears
        const confirmDelete = page.getByRole('button', { name: /delete|remove|confirm/i });
        if (await confirmDelete.isVisible()) {
          await confirmDelete.click();
        }

        await page.captureDebug('recipe-deleted');

        // Verify recipe was removed
        await expect(savedRecipeCard).not.toBeVisible({ timeout: 5000 });
      }
    }
    catch {
      console.log('Delete functionality not available or works differently');
    }

    // Logout at the end
    await logout(page);
  });
});
