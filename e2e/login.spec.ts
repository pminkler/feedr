import { test } from '@playwright/test';
import { login } from './utils/auth';

test('login', async ({ page }) => {
  await login(page);
});
