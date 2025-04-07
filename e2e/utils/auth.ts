import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { infoLog, warnLog } from './debug-logger';

/**
 * Logs in a user with specified credentials
 * @param page The Playwright page object
 * @param email User's email address
 * @param password User's password
 */
export async function login(
  page: Page,
  email: string = 'pminkler+testuser@gmail.com',
  password: string = 'Password1!',
): Promise<void> {
  await page.goto('http://localhost:3000/');

  // Wait for page to fully load
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');

  // Wait for the login button to be visible and stable
  await page.getByTestId('login-button').waitFor({ state: 'visible', timeout: 10000 });
  await page.getByTestId('login-button').click();
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Email' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'My Recipes' })).toContainText(
    'My Recipes',
  );
}
