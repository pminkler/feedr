# Playwright E2E Tests

This directory contains end-to-end tests using Playwright. These tests verify that the application works correctly from a user's perspective.

## Running Tests

To run all tests:

```bash
npm run test:e2e
```

To run a specific test file:

```bash
npx playwright test landing.spec.ts
```

## Debugging with Claude

We've added special utilities to make it easier for Claude to create and debug tests. These utilities capture HTML, take screenshots, and provide detailed information about the DOM.

### Enabling Claude Tools

To enable HTML capture and other Claude-specific tools:

```bash
CAPTURE_HTML=true npx playwright test
```

This will:
1. Capture HTML snapshots of pages during test execution
2. Take screenshots at important points
3. Generate accessibility reports
4. Create a browsable report with all captures

### Viewing Captures

After running tests with `CAPTURE_HTML=true`, you can find the captures in:

```
test-artifacts/html/index.html
```

This report contains links to all HTML snapshots and screenshots taken during test execution.

### Available Claude Tools

Claude tools are implemented in `e2e/utils/claude/`. The main ones are:

- `htmlCapture`: Captures HTML and takes screenshots
- `domInspector`: Inspects DOM elements and generates detailed reports
- `claudeTest`: Extended test fixtures with Claude-specific utilities

See the [Claude Utils README](./utils/claude/README.md) for more details.

## Test Organization

Tests are organized by feature area. Each test file should:

1. Test a specific feature or page
2. Use descriptive test names
3. Follow the AAA pattern (Arrange, Act, Assert)
4. Be independent of other tests

## Creating New Tests

When creating new tests:

1. Look at existing tests as examples
2. Use role-based selectors when possible (accessibility-friendly)
3. Use Claude's HTML captures to understand the page structure
4. Run with `CAPTURE_HTML=true` to get detailed debugging information

For example:

```typescript
import { claudeTest, captureHtml } from './utils/claude';

claudeTest('my test', async ({ page }) => {
  await page.goto('/');
  await captureHtml(page, 'my-page', { screenshot: true });
  // Test assertions here
});
```