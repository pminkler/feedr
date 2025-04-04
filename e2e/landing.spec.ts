import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Visit the landing page before each test
    await page.goto('/');
  });

  test('displays the main components of the landing page', async ({ page }) => {
    // 1. Check the title and subtitle
    await expect(page.getByRole('heading', { name: 'Your Recipes, Simplified' })).toBeVisible();
    await expect(page.getByText('Convert any recipe into a clean, consistent format')).toBeVisible();

    // 2. Check the input form is present
    await expect(page.getByPlaceholder('Recipe URL')).toBeVisible();

    // 3. Check the submit button is present
    await expect(page.getByRole('button', { name: 'Get Recipe' })).toBeVisible();

    // 4. Check that the Features section exists
    await expect(page.getByRole('heading', { name: 'Why Feedr?' })).toBeVisible();
    await expect(page.locator('#features')).toBeVisible();

    // 5. Check that we have the expected number of feature cards
    const featureCards = page.locator('#features').locator('> *');
    const count = await featureCards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // 6. Check FAQ section exists
    await expect(page.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible();
    await expect(page.locator('#faq')).toBeVisible();
  });
});
