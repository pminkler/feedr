import { test, expect } from '@playwright/test';

test('add-recipe-modal', async ({ page }) => {
  await page.goto('http://localhost:3000/my-recipes');
  await page.getByRole('button', { name: 'Add Recipe' }).click();
  await page.getByRole('textbox', { name: 'Recipe URL' }).click();
  await page
    .getByRole('textbox', { name: 'Recipe URL' })
    .fill(
      'https://www.allrecipes.com/recipe/21014/good-old-fashioned-pancakes/',
    );
  await page.getByRole('button', { name: 'Get Recipe' }).click();
  await expect(
    page.getByTestId('recipe-details-skeleton-line').first(),
  ).toBeVisible();
  await expect(page.getByTestId('details-heading')).toContainText(
    'Recipe Details',
    { timeout: 30000 },
  );
  await expect(page.getByTestId('nutrition-calories')).toContainText(
    'Calories',
    { timeout: 30000 },
  );
});
