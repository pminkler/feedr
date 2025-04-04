# Claude Test Utilities

This directory contains test utilities specifically designed to help Claude AI analyze, debug, and create Playwright tests.

## Features

- **HTML Capture**: Captures HTML snapshots during test runs for later analysis
- **DOM Inspector**: Generates detailed reports about DOM elements for better selector choices
- **Test Helper**: Extended Page class with Claude-specific utilities
- **Accessibility Checker**: Basic accessibility checks during test runs

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