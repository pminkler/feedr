# Claude Playwright Testing Tools

This project now includes a set of specialized tools designed to help Claude analyze, debug, and create Playwright tests more effectively.

## Overview

The tools capture HTML snapshots, take screenshots, inspect DOM elements, and generate detailed reports during test execution. These artifacts make it much easier for Claude to understand the page structure and recommend fixes when tests fail.

## How to Use

Run tests with Claude tools enabled:

```bash
npm run test:e2e:claude
```

This will:
1. Create the necessary artifact directories
2. Run tests with HTML capture enabled
3. Generate a browsable report

To run a specific test file:

```bash
npm run test:e2e:claude -- e2e/landing.spec.ts
```

## Viewing Results

After running tests with Claude tools, you can browse the results at:

```
test-artifacts/index.html
```

This report contains links to:
- HTML snapshots
- Screenshots
- DOM inspection reports
- Accessibility reports

## Key Features

### HTML Snapshots

Each snapshot includes:
- Full HTML content of the page
- Metadata about the page (URL, viewport size, etc.)
- Timestamp of when the snapshot was taken
- Optional screenshot

Example:
```typescript
await captureHtml(page, 'landing-page', { screenshot: true });
```

### DOM Inspector

Generates detailed reports about DOM elements, including:
- Element properties and attributes
- Computed styles
- Visibility status
- Recommended Playwright selectors
- Child elements (optional)

Example:
```typescript
await inspectElement(page, '.hero-title', { includeChildren: true });
```

### Extended Test Fixtures

The `claudeTest` fixture includes additional utilities:
- `claudePage`: Extended Page object with Claude-specific methods
- HTML capture built in
- Accessibility checks

Example:
```typescript
claudeTest('my test', async ({ claudePage }) => {
  await claudePage.reportTestState('landing-page');
});
```

### Element Highlighting and Annotations

Helps visualize elements in screenshots:

```typescript
await captureHtml(page, 'landing-page', { 
  screenshot: true,
  highlight: '.important-button',
  annotate: [{ selector: '.form', text: 'User input area' }]
});
```

## File Structure

- `e2e/utils/claude/html-capture.ts`: HTML snapshot utility
- `e2e/utils/claude/dom-inspector.ts`: DOM element inspection tool
- `e2e/utils/claude/test-helper.ts`: Extended test fixtures
- `e2e/utils/claude/index.ts`: Main export file
- `e2e/utils/claude/setup.ts`: Setup script for directories

## Best Practices

1. **When creating new tests**:
   - Run with `CAPTURE_HTML=true` to get detailed debugging information
   - Use the `claudeTest` fixture for enhanced capabilities
   - Add strategic HTML captures at key points in your test

2. **When fixing failing tests**:
   - Look at the HTML snapshots to understand the page structure
   - Use the DOM inspector reports to find better selectors
   - Check the accessibility reports for potential issues

3. **For Claude to debug effectively**:
   - Add HTML capture points before and after interactions
   - Use element highlighting to identify UI components
   - Annotate screenshots to document expected behavior