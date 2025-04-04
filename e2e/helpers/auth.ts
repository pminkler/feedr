import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Helper function to log in using email and password
 */
export async function login(page: Page, email?: string, password?: string) {
  // Use environment variables if no credentials provided
  const loginEmail = email || process.env.TEST_USER_EMAIL;
  const loginPassword = password || process.env.TEST_USER_PASSWORD;

  if (!loginEmail || !loginPassword) {
    throw new Error(
      'Missing login credentials. Provide email/password or set TEST_USER_EMAIL and TEST_USER_PASSWORD env variables',
    );
  }

  console.log(`Attempting to log in with email: ${loginEmail}`);
  await page.goto('/login');

  // Wait for login form to be fully loaded
  await page.locator('input[name="email"]').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('input[name="email"]').clear();
  await page.locator('input[name="email"]').fill(loginEmail);

  await page.locator('input[name="password"]').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('input[name="password"]').clear();
  await page.locator('input[name="password"]').fill(loginPassword);

  // Click the submit button
  await page.getByRole('button', { name: /sign in/i, exact: false }).click();

  // Wait for redirect to confirm login was successful (with longer timeout)
  await expect(page).toHaveURL(/.*\/my-recipes/, { timeout: 15000 });

  // Verify we're on the recipes page
  await expect(page.getByRole('heading', { name: 'My Recipes' })).toBeVisible({ timeout: 15000 });
}

/**
 * Helper function to check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Go to a protected page that requires authentication
  await page.goto('/my-recipes');

  try {
    // If we see "My Recipes" heading, we're logged in
    await expect(page.getByRole('heading', { name: 'My Recipes' })).toBeVisible({ timeout: 5000 });
    return true;
  }
  catch {
    // If we get redirected to login, we're not logged in
    const currentUrl = page.url();
    return !currentUrl.includes('/login');
  }
}

/**
 * Helper function to log out
 */
export async function logout(page: Page) {
  await page.goto('/logout');

  // Verify we get redirected to homepage or login
  await expect(page).toHaveURL(/^\/$|\/login/, { timeout: 10000 });
}
