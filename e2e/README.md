# Feedr E2E Tests with Playwright

This directory contains end-to-end tests for the Feedr application using Playwright.

## Structure

- `*.spec.ts` - Test files for different parts of the application
- `/helpers` - Reusable test helpers
  - `auth.ts` - Authentication helpers for login-related tasks

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

Some tests require valid authentication credentials. These tests are automatically skipped when the required environment variables are not set.

To run these tests, set the following environment variables:
```bash
export TEST_USER_EMAIL=your_test_email@example.com
export TEST_USER_PASSWORD=your_test_password
```

Then run the tests:
```bash
npx playwright test
```

## Notes

- For contact form tests, we use JavaScript execution to bypass the Vite overlay that sometimes blocks direct button clicks.
- The dev server should be running before executing the tests (`npm run dev`).
- Some tests may fail if the CSS selectors change. In that case, update the selectors in the test files.