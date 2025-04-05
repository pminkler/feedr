import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Logs in a user with the provided credentials
 * @param page Playwright Page object
 * @param email User email
 * @param password User password
 */
export async function login(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  // Navigate to login page if not already there
  if (!page.url().includes('/login')) {
    await page.goto('http://localhost:3000/login');
  }

  // Fill login form
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);

  // Submit form
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // Wait for navigation to complete and verify we're logged in
  await expect(page.getByRole('heading', { name: 'My Recipes' })).toContainText(
    'My Recipes',
  );
  await expect(page.getByTestId('user-menu-button')).toContainText(email);
}

/**
 * Logs out the current user
 * @param page Playwright Page object
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu to open dropdown
  await page.getByTestId('user-menu-button').click();

  // Click logout option
  await page.getByRole('menuitem', { name: /log out|logout/i }).click();

  // Wait for redirect to landing page
  await expect(page).toHaveURL(/\/$/);
}
