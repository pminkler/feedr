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

# Run tests with Claude debugging tools
npm run test:e2e:claude

# Run a specific test file
npx playwright test e2e/landing.spec.ts
```

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

## Common Selectors

For reference, here are some common selectors for Feedr UI components:

- Recipe URL Input: `page.getByPlaceholder('Recipe URL')`
- Submit Button: `page.getByRole('button', { name: 'Get Recipe' })`
- Features Section: `page.locator('#features')`
- FAQ Section: `page.locator('#faq')`
- Navigation Links: `page.locator('a[href]').filter({ hasText: /Sign Up|Login|Get Started/i })`
