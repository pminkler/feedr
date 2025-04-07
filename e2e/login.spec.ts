import { test } from '@playwright/test';
import { LoginPage } from './page-objects/LoginPage';

test('login with page object model', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.gotoViaLanding();
  await loginPage.login();
});
