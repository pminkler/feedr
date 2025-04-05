# Feedr E2E Testing

This directory contains end-to-end tests for the Feedr application using Playwright with Claude-specific enhancements.

## Setup

The test environment runs with Playwright and requires the following:

```bash
# Install dependencies
npm install

# Install playwright browsers
npx playwright install
```

## Running Tests

You can run the tests with the following commands:

```bash
# Run all tests
npm run test:e2e

# Run tests with Claude debugging tools (ALWAYS USE THIS WITH CLAUDE)
npm run test:e2e:claude

# Run a specific test file with Claude tooling
CAPTURE_HTML=true npx playwright test e2e/landing.spec.ts

# Run tests with concise output for a specific browser
npx playwright test --reporter=line --project=chromium

# Run a specific test (using line numbers)
npx playwright test e2e/recipe-url-generation.spec.ts:152
```

## Important for Claude

When working with Claude on E2E tests, ALWAYS:
1. Use the Claude-specific test helpers (`claudeTest`, `captureHtml`, etc.)
2. Run tests with `npm run test:e2e:claude` or set `CAPTURE_HTML=true` environment variable
3. Generate test reports at key points with `createTestReport()`
4. Document both loading states and final states in tests
5. Use the `--reporter=line` flag for more manageable output in the CLI

## Claude Testing Utilities

We've added special utilities to help Claude (and developers) debug tests more effectively. These are found in the `e2e/utils/claude` directory.

### Key Features

1. **HTML Capture**: Captures HTML snapshots of pages during test execution
2. **Screenshot Generation**: Captures screenshots at key points
3. **DOM Inspection**: Analyzes page elements and suggests selectors
4. **Element Highlighting**: Visually highlights elements in screenshots
5. **Annotations**: Adds notes directly to screenshots
6. **Accessibility Checking**: Basic a11y checking during test runs

### Using Claude Test Helpers

Import and use Claude testing utilities in your test files:

```typescript
import { claudeTest, captureHtml, createTestReport } from './utils/claude';

// Use claudeTest instead of regular test
claudeTest('my test name', async ({ page }) => {
  // Capture HTML at key points
  await captureHtml(page, 'my-test-name', { 
    screenshot: true,
    highlight: '.my-selector',
    annotate: [{ selector: '.my-selector', text: 'Important element' }]
  });
  
  // Generate a comprehensive report
  await createTestReport(page, 'test-report-name');
});
```

### Test Artifacts

When running tests with Claude tools, the following artifacts are generated:

- **HTML Snapshots**: `test-artifacts/html/`
- **Screenshots**: `test-artifacts/screenshots/`
- **Test Reports**: `test-artifacts/reports/`
- **Accessibility Reports**: `test-artifacts/accessibility/`

A browsable index is generated at `test-artifacts/index.html`.

## Test Organization

Tests are organized into focused files:

- `landing.spec.ts`: Tests for the landing page
- `landing-i18n.spec.ts`: Tests for landing page internationalization
- `image-upload.spec.ts`: Tests for image upload functionality

## Debugging Tests

If tests are failing, you can:

1. Check the test artifacts in the `test-artifacts` directory
2. Use the `--debug` flag for interactive debugging: `npx playwright test --debug`
3. Review the HTML snapshots and element annotations

## Writing Resilient Tests

When writing tests:

1. Use multiple ways to identify elements (text, role, test-id)
2. Add Claude capture points at key state changes
3. Use `createTestReport()` for complex pages
4. Handle potential timeouts and loading states
5. Make selectors more general when targeting elements that might change
6. Test for different states (loading, error, success)
7. Make tests compatible with different languages by using regex patterns

### Testing Loading States

For testing loading states and transitions:

```typescript
// Submit form and wait for navigation
await Promise.all([
  page.waitForURL(/\/recipes\//, { timeout: 60000 }),
  submitButton.click()
]);

// Capture loading state
await captureHtml(page, 'recipe-loading-state', {
  screenshot: true,
  annotate: [{ selector: '.animate-pulse', text: 'Loading message' }]
});

// Check for loading indicators
const loadingMessage = page.locator('.animate-pulse').first();
await expect(loadingMessage).toBeVisible();

// Check for skeletons
const skeletons = page.locator('.h-4.w-full');
await expect(skeletons.first()).toBeVisible();

// Wait for content to load and replace skeletons
await page.waitForSelector('.list-disc.list-inside', { timeout: 120000 });

// Verify loading indicators are gone
const loadingElements = page.locator('.animate-pulse, .h-4.w-full');
for (let i = 0; i < await loadingElements.count(); i++) {
  const isVisible = await loadingElements.nth(i).isVisible();
  expect(isVisible).toBeFalsy();
}
```

## Common Selectors

For reference, here are some common selectors for Feedr UI components:

- Recipe URL Input: `page.getByPlaceholder('Recipe URL')`
- Submit Button: `page.getByRole('button', { name: /Get Recipe|Obtén la receta|Obtenez la recette/i })` (i18n compatible)
- Features Section: `page.locator('#features')`
- FAQ Section: `page.locator('#faq')`
- Navigation Links: `page.locator('a[href]').filter({ hasText: /Sign Up|Login|Get Started/i })`
- Photo Upload Button: `page.getByRole('button', { name: '' }).filter({ has: page.locator('.i-heroicons\\:photo-16-solid') })`
- Camera Button: `page.getByRole('button', { name: '' }).filter({ has: page.locator('.i-heroicons\\:camera') })`
- Loading Message: `page.locator('.animate-pulse')`
- Loading Skeletons: `page.locator('.h-4.w-full')`
- Recipe Ingredients List: `page.locator('.list-disc.list-inside')`
- Recipe Steps List: `page.locator('.list-decimal.list-inside')`
