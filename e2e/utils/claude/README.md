# Claude Test Utilities

This directory contains test utilities specifically designed to help Claude AI analyze, debug, and create Playwright tests.

## Features

- **HTML Capture**: Captures HTML snapshots during test runs for later analysis
- **DOM Inspector**: Generates detailed reports about DOM elements for better selector choices
- **Test Helper**: Extended Page class with Claude-specific utilities
- **Accessibility Checker**: Basic accessibility checks during test runs
- **Element Highlighting**: Highlights important elements in screenshots
- **Annotations**: Adds context notes directly to screenshots
- **Selector Suggestions**: Recommends robust Playwright selectors

## IMPORTANT GUIDELINES FOR CLAUDE INTEGRATION

When working with Claude on E2E testing:

1. **ALWAYS** run tests with `npm run test:e2e:claude` or set `CAPTURE_HTML=true` environment variable
2. **ALWAYS** use `claudeTest` instead of regular Playwright test
3. **ALWAYS** capture HTML at key points in the test with detailed annotations
4. **ALWAYS** create test reports at important state transitions
5. **ALWAYS** verify both loading states and final UI states
6. **ALWAYS** use the `--reporter=line` flag for more manageable output in the CLI
7. **ALWAYS** make selectors i18n compatible using regex patterns with alternatives

## Usage

### Enable HTML Capture

Set the environment variable `CAPTURE_HTML=true` to enable HTML capture during test runs:

```bash
CAPTURE_HTML=true npx playwright test
```

### Use Claude Test Helpers

```typescript
import { claudeTest, captureHtml, inspectElement } from './utils/claude';

claudeTest.describe('My Test Suite', () => {
  claudeTest('should perform some action', async ({ claudePage, page }) => {
    // Navigate to page
    await page.goto('/');
    
    // Capture HTML at this point (with screenshot)
    await captureHtml(page, 'landing-page', { screenshot: true });
    
    // Inspect a specific element
    await inspectElement(page, '.hero-title', { includeChildren: true });
    
    // Use the extended claudePage for even more features
    await claudePage.reportTestState('after-click');
    
    // Normal test assertions
    await expect(page.getByText('Welcome')).toBeVisible();
  });
});
```

### View Reports

After running tests with `CAPTURE_HTML=true`, you can find:

- HTML snapshots in `test-artifacts/html/`
- Screenshots in `test-artifacts/screenshots/`
- DOM inspection reports in `test-artifacts/dom-inspector/`
- Accessibility reports in `test-artifacts/accessibility/`

An HTML report index is generated at `test-artifacts/html/index.html`

## Advanced Features

### Element Highlighting

```typescript
await captureHtml(page, 'highlight-example', { 
  screenshot: true,
  highlight: '.important-element'
});
```

### Annotations

```typescript
await captureHtml(page, 'annotated-example', { 
  screenshot: true,
  annotate: [
    { selector: '.button', text: 'This button should be clicked' },
    { selector: '.form-input', text: 'Enter data here' }
  ]
});
```

### Selector Suggestions

```typescript
const suggestions = await suggestSelectors(page, '.hard-to-select-element');
console.log(suggestions);
```

## Implementation Details

- All artifacts are stored in the `test-artifacts/` directory
- HTML snapshots include the full page HTML and metadata
- Screenshots can highlight specific elements for better visibility
- DOM inspection provides detailed information about elements and suggested Playwright selectors

## Test Loading States and Transitions

When testing features that involve loading states (like recipe generation):

```typescript
// Example test for loading states
claudeTest('verifies loading states and final content', async ({ page }) => {
  // Submit form and track navigation
  await Promise.all([
    page.waitForURL(/\/recipes\//, { timeout: 60000 }),
    submitButton.click()
  ]);
  
  // Immediately capture loading state
  await captureHtml(page, 'initial-loading-state', {
    screenshot: true,
    annotate: [{ selector: '.animate-pulse', text: 'Loading message' }]
  });
  
  // Verify loading indicators
  const loadingMessage = page.locator('.animate-pulse').first();
  await expect(loadingMessage).toBeVisible();
  
  // Check for skeleton loaders
  const skeletons = page.locator('.h-4.w-full');
  await expect(skeletons.first()).toBeVisible();
  
  // Create report of loading state
  await createTestReport(page, 'loading-state-report');
  
  // Wait for actual content
  await page.waitForSelector('.list-disc.list-inside', { timeout: 120000 });
  
  // Verify content loaded and skeletons gone
  await expect(page.locator('.list-disc.list-inside')).toBeVisible();
  
  // Document final state
  await captureHtml(page, 'loaded-content', {
    screenshot: true,
    highlight: '.list-disc.list-inside',
    annotate: [{ selector: '.list-disc.list-inside', text: 'Loaded content' }]
  });
});