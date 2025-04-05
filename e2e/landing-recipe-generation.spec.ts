import { test, expect } from '@playwright/test';

test('landing recipe generation', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByTestId('recipe-url-input').click();
  await page
    .getByTestId('recipe-url-input')
    .fill(
      'https://www.allrecipes.com/recipe/21014/good-old-fashioned-pancakes/',
    );
  await page.getByTestId('submit-button').click();
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
