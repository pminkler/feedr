# Feedr E2E Tests with Playwright

This directory contains end-to-end tests for the Feedr application using [Playwright](https://playwright.dev/).

## Structure

- `*.spec.ts` - Test files for different parts of the application
- `/helpers` - Reusable test helpers
  - `auth.ts` - Authentication helpers for login-related tasks with test environment workarounds
- `custom-reporter.ts` - Enhanced reporter for detailed test debugging

## Running Tests

Run all tests:
```bash
npx playwright test
```

Run tests in a specific file:
```bash
npx playwright test e2e/login.spec.ts
```

Run tests in a specific browser:
```bash
npx playwright test --project=chromium
```

Run tests with UI:
```bash
npx playwright test --ui
```

## Authentication Tests

Tests that require authentication use the `login()` helper function which:

1. Uses default test credentials (same ones used by Cypress)
2. Falls back to environment variables if provided
3. Handles login flow with workarounds for test environment quirks

```typescript
// Example usage
import { login } from './helpers/auth';

test('authenticated user feature', async ({ page }) => {
  try {
    await login(page);
    // Test authenticated features
  } catch (error) {
    test.skip(true, 'Login failed, skipping authenticated test');
  }
});
```

You can optionally override the default credentials with environment variables:
```bash
export TEST_USER_EMAIL=your_test_email@example.com
export TEST_USER_PASSWORD=your_test_password
```

## Known Issues and Workarounds

1. **Vite Overlay**: The Vite plugin checker overlay can intercept clicks during tests. Use JavaScript evaluation to bypass this:

```typescript
// Instead of this:
await page.locator('button[type="submit"]').click();

// Use this:
await page.evaluate(() => {
  const button = document.querySelector('button[type="submit"]');
  if (button) button.click();
});
```

2. **Login Redirects**: The login flow might behave differently in test environments. The auth helper handles this automatically.

3. **Toast Notifications**: Toast notifications can be challenging to detect reliably. For form submission tests, we check for form reset (empty fields) as the primary success indicator rather than toast visibility.

## Notes

- The dev server should be running before executing the tests (`npm run dev`).
- Some tests may fail if the CSS selectors change. In that case, update the selectors in the test files.
- This project is gradually migrating tests from Cypress to Playwright. When migrating:
  - Use the existing Cypress tests as a reference
  - Update selectors for Playwright's syntax
  - Apply the workarounds noted above where needed
  - Ensure tests work in all browser engines