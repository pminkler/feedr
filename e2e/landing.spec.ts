import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(
    page.getByRole('heading', { name: 'Your Recipes, Simplified' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  await expect(page.getByTestId('recipe-url-input')).toBeVisible();
  await expect(page.getByTestId('submit-button')).toBeVisible();
  await expect(page.getByTestId('features-grid')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'How does Feedr work?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'How does Feedr work?' }).click();
  await expect(page.getByText('Feedr uses advanced AI to')).toBeVisible();
});
