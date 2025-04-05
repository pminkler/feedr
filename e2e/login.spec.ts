import { test, expect } from './utils/debug-test';
import { login, logout } from './utils/auth-helpers';

test.describe('Authentication', () => {
  test('user can login successfully', async ({ page }) => {
    // Go to the landing page
    await page.goto('http://localhost:3000/');
    await page.captureDebug('landing-page');

    // Click the login button
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.captureDebug('login-page');

    // Fill in the login form
    await page
      .getByRole('textbox', { name: 'Email' })
      .fill('pminkler+testuser@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password1!');
    await page.captureDebug('login-form-filled');

    // Submit the form
    await page.getByRole('button', { name: 'Continue', exact: true }).click();

    // Verify successful login
    await expect(
      page.getByRole('heading', { name: 'My Recipes' }),
    ).toContainText('My Recipes');
    await expect(page.getByTestId('user-menu-button')).toContainText(
      'pminkler+testuser@gmail.com',
    );
    await page.captureDebug('logged-in');

    // Logout to clean up
    await logout(page);
    await page.captureDebug('logged-out');
  });

  test('using auth helper functions', async ({ page }) => {
    // Login using the auth helper
    await login(page, 'pminkler+testuser@gmail.com', 'Password1!');
    await page.captureDebug('logged-in-with-helper');

    // Verify we can access protected content
    await page.goto('http://localhost:3000/my-recipes');
    await expect(
      page.getByRole('heading', { name: 'My Recipes' }),
    ).toContainText('My Recipes');

    // Logout using the auth helper
    await logout(page);
    await page.captureDebug('logged-out-with-helper');

    // Verify we're redirected to the landing page
    await expect(page).toHaveURL(/\/$/);
  });
});
