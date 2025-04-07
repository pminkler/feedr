import { test, expect } from '@playwright/test';
import { LoginPage } from './page-objects/LoginPage';

// Override DOM capture flag for development tests
process.env.ENABLE_DOM_CAPTURE = 'true';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should login successfully with valid credentials', async () => {
    await loginPage.goto();
    await loginPage.expectPageLoaded();
    await loginPage.login();
  });

  test('should display error with invalid credentials', async () => {
    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword', false);

    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).not.toBeNull();

    // Capture the error state for debugging
    await loginPage.captureDOMState('login-error-state');

    // Check for any error indication on the page
    const anyErrorElement = await loginPage.page.locator('.text-red-500, .error, [data-testid*="error"]').count();
    console.log(`Found ${anyErrorElement} possible error elements on the page`);

    // In development environment, we accept any error message or presence of error elements
    expect(anyErrorElement > 0 || errorMessage !== null).toBeTruthy();
  });

  test('should navigate to signup page when clicking Sign Up link', async () => {
    await loginPage.goto();
    await loginPage.clickSignUp();

    // Verify URL changed to signup
    expect(loginPage.page.url()).toContain('/signup');
  });

  test('should navigate to login page from landing page', async () => {
    await loginPage.gotoViaLanding();
    await loginPage.expectPageLoaded();
  });
});
