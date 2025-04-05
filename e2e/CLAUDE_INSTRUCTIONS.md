# Claude Playwright Testing Tools

## Overview

This document serves as a comprehensive guide to the Claude Playwright testing utilities in the Feedr project. These specialized tools are designed to enhance Playwright E2E testing specifically for Claude AI, making it easier to analyze, debug, and create robust tests.

## Why Claude-Specific Testing Tools?

Standard Playwright testing provides powerful automation capabilities, but when working with Claude AI, additional context is needed to effectively understand test failures and suggest improvements:

1. **Visibility into DOM Structure**: Claude needs to see the actual HTML to understand why selectors fail
2. **Visual Context**: Screenshots with annotations help Claude understand what elements are being targeted
3. **Debugging Assistance**: Additional logging and inspection tools provide crucial context when tests fail
4. **Selector Suggestions**: Automated tools to recommend robust selectors that work well across browser versions and UI changes
5. **Accessibility Insights**: Built-in accessibility checks help ensure the application remains accessible
6. **Loading State Verification**: Special utilities to properly test asynchronous loading states

## Installation and Setup

The Claude testing tools are already integrated into the Feedr project. No additional installation is needed beyond the standard project setup.

### Required NPM Scripts

```bash
# Run all E2E tests with Claude tooling enabled
npm run test:e2e:claude

# Run a specific test with Claude tooling
npm run test:e2e:claude -- e2e/landing.spec.ts

# Run tests with more concise output
npm run test:e2e:claude -- --reporter=line
```

## Core Features

### 1. HTML Capture

Captures the complete HTML structure at specific points during test execution, allowing Claude to analyze the DOM structure when debugging test failures.

```typescript
// Basic capture
await captureHtml(page, 'landing-page');

// With screenshot
await captureHtml(page, 'landing-page', { screenshot: true });

// With element highlighting
await captureHtml(page, 'landing-page', { 
  screenshot: true,
  highlight: '.important-button'
});

// With annotations
await captureHtml(page, 'landing-page', { 
  screenshot: true,
  annotate: [
    { selector: '.button', text: 'Submit button' },
    { selector: '.input', text: 'Email field' }
  ]
});
```

### 2. DOM Inspector

Generates detailed reports about DOM elements, providing insights for better selector choices and debugging element visibility issues.

```typescript
// Basic element inspection
await inspectElement(page, '.recipe-card');

// With child elements included
await inspectElement(page, '.recipe-card', { includeChildren: true });

// With custom depth for child elements
await inspectElement(page, '.recipe-card', { 
  includeChildren: true,
  maxChildDepth: 3
});
```

### 3. Enhanced Test Helper (claudeTest)

A wrapper around Playwright's test function that adds Claude-specific utilities and fixtures.

```typescript
import { claudeTest, captureHtml } from './utils/claude';

// Replace standard Playwright test with claudeTest
claudeTest('verifies landing page', async ({ page, claudePage }) => {
  await page.goto('/');
  
  // Use standard Playwright methods
  await expect(page.getByText('Welcome')).toBeVisible();
  
  // Use Claude-specific methods
  await claudePage.reportTestState('landing-page');
});
```

### 4. Selector Suggestions

Provides recommendations for robust Playwright selectors to improve test reliability.

```typescript
const suggestions = await suggestSelectors(page, '.difficult-element');
console.log(suggestions);
```

### 5. Accessibility Checks

Built-in basic accessibility testing to ensure the application remains accessible.

```typescript
// Automatically included in reportTestState
await claudePage.checkAccessibility('login-form');
```

### 6. Test Report Generation

Creates comprehensive test reports that document the state of the application at various points in the test.

```typescript
await createTestReport(page, 'after-login');
```

## Best Practices

### 1. ALWAYS Add data-testid Attributes

⚠️ **CRITICAL: When writing components or modifying UI, ALWAYS add data-testid attributes to elements!** ⚠️

This is the MOST IMPORTANT practice for reliable testing. When Claude modifies or creates components, it MUST add data-testid attributes to all interactive and key elements:

```html
<!-- ❌ Bad: No testid attributes -->
<button class="primary-btn">Submit</button>

<!-- ✅ Good: Clear testid attributes -->
<button class="primary-btn" data-testid="submit-recipe-button">Submit</button>
```

Use descriptive, hierarchical naming for data-testid values:
- `form-{name}-input`
- `{entity}-{action}-button`
- `{section}-{item}-{element}`

Example testid hierarchy:
```html
<div data-testid="recipe-edit-form">
  <input data-testid="recipe-title-input" />
  <input data-testid="recipe-description-input" />
  <div data-testid="recipe-times-section">
    <input data-testid="recipe-prep-time-input" />
    <input data-testid="recipe-cook-time-input" />
  </div>
  <button data-testid="recipe-save-button">Save</button>
</div>
```

Then in tests:
```typescript
// ✅ Fastest and most reliable way to find elements
await page.getByTestId('recipe-title-input').fill('Pasta Carbonara');
await page.getByTestId('recipe-save-button').click();
```

### 2. Always Use Claude Test

Always use `claudeTest` instead of the standard Playwright `test` function:

```typescript
// ❌ Don't use this
test('my test', async ({ page }) => {
  // ...
});

// ✅ Use this instead
claudeTest('my test', async ({ page, claudePage }) => {
  // ...
});
```

### 2. Capture HTML at Key Points

Add HTML captures at important points in your test flow:

```typescript
claudeTest('user can log in', async ({ page }) => {
  // Initial state
  await captureHtml(page, 'login-form-initial', { screenshot: true });
  
  // After filling form
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await captureHtml(page, 'login-form-filled', { screenshot: true });
  
  // After submission (loading state)
  await page.click('button[type="submit"]');
  await captureHtml(page, 'login-form-submitting', { screenshot: true });
  
  // Final state after redirect
  await page.waitForURL('/dashboard');
  await captureHtml(page, 'dashboard-after-login', { screenshot: true });
});
```

### 3. Document Element Interactions

Use annotations to clearly document what elements are being interacted with:

```typescript
await captureHtml(page, 'before-edit', {
  screenshot: true,
  highlight: '.edit-button',
  annotate: [
    { selector: '.edit-button', text: 'Click this edit button' }
  ]
});
```

### 4. Verify Loading States

Always test both loading states and final content:

```typescript
// Click button that triggers async action
await page.click('.generate-button');

// Capture and verify loading state
await captureHtml(page, 'loading-state', {
  screenshot: true,
  annotate: [{ selector: '.skeleton-loader', text: 'Loading indicator visible' }]
});

// Verify loading indicator is visible
await expect(page.locator('.skeleton-loader')).toBeVisible();

// Wait for content to load
await page.waitForSelector('.content-loaded', { state: 'visible' });

// Capture and verify loaded content
await captureHtml(page, 'content-loaded', {
  screenshot: true,
  annotate: [{ selector: '.content-loaded', text: 'Content successfully loaded' }]
});

// Verify content is now visible
await expect(page.locator('.content-loaded')).toBeVisible();
```

### 5. Use Error Handling for Robust Tests

```typescript
claudeTest('handles potential timing issues', async ({ page }) => {
  try {
    // Attempt to interact with an element
    await page.click('.notification-dismiss', { timeout: 5000 });
    console.log('Notification was present and dismissed');
  } catch (e) {
    // Element might not be present, which is fine
    console.log('No notification was present');
  }
  
  // Continue with the test...
});
```

### 6. Use data-testid First, Then Flexible Selectors

**ALWAYS prefer data-testid selectors first!** Only use other selector types when data-testid is unavailable:

```typescript
// 1️⃣ BEST: Use data-testid whenever possible (fastest and most reliable)
await page.getByTestId('recipe-card-title').click();

// 2️⃣ SECOND BEST: Use role-based selectors when data-testid is not available
await page.getByRole('heading', { name: 'Recipe Title' }).click();

// 3️⃣ THIRD CHOICE: For i18n content without testids, use regex with alternatives
await page.locator('button:has-text(/Save|Sauvegarder|Guardar/)').click();

// ❌ AVOID: Complex CSS selectors that are fragile and break easily
await page.locator('div.recipe-card > div.header > h3').click();
```

**Selector Priority List (Best to Worst):**
1. `getByTestId()` - Most stable, resistant to UI changes, fastest
2. `getByRole()` - Good for standard UI elements with semantic roles
3. `getByLabel()` - Good for form controls with labels
4. `getByPlaceholder()` - Acceptable for inputs with placeholders
5. `getByText()` - Use with caution (affected by i18n)
6. `locator()` with simple attributes - Use sparingly
7. `locator()` with complex CSS - Avoid whenever possible

**IMPORTANT:** When writing new tests, if you find elements without data-testid attributes, add them to the component code! This is a critical part of test maintenance.

## Debugging Failed Tests

When a test fails, follow these steps to debug effectively:

### 1. Examine Test Artifacts

After running a failed test with `npm run test:e2e:claude`, examine the generated artifacts:

```
test-artifacts/
  ├── html/            # HTML snapshots
  ├── screenshots/     # Screenshots with annotations
  ├── dom-inspector/   # Element inspection reports
  └── accessibility/   # Accessibility check reports
```

Browse the HTML report at `test-artifacts/html/index.html` to view all captured test states.

### 2. Analyze DOM Structure

Use the HTML snapshots to understand the actual structure of the page at the failure point:

1. Open the relevant HTML snapshot file
2. Use browser dev tools to inspect elements
3. Compare expected selectors with actual DOM structure
4. Check for timing issues (content not yet loaded)

### 3. Review Element Inspection Reports

DOM inspector reports contain detailed information about elements, including:

- Visibility status (and reasons for invisibility)
- Recommended Playwright selectors
- Element properties and attributes
- Computed styles
- Child elements and their properties

### 4. Check Console Logs

The test output will contain additional debugging information:

```
✅ HTML capture saved: login_form_2023-04-05T12-34-56.html
Inspected Element: button#submit
Visibility: ✅ Visible
Recommended Playwright Selectors:
  page.locator('#submit')
  page.getByRole('button', { name: 'Sign In' })
  page.getByText('Sign In')
```

### 5. Common Failure Causes and Solutions

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| Element not found | Selector incorrect | Use DOM inspector to find better selector |
| Element not visible | Element hidden or not yet rendered | Add appropriate wait conditions |
| Timeout waiting for navigation | Network issues or incorrect URL pattern | Increase timeout or fix URL matcher |
| Text not found | Text varies (i18n) | Use more flexible text matching with regex |
| Click not working | Element obscured or disabled | Check visibility and state in inspector report |

## Advanced Features

### Working with Complex UI Components

For complex UI components like modals, slide-overs, or date pickers:

```typescript
claudeTest('handles complex UI components', async ({ page }) => {
  // Open a modal
  await page.click('.open-modal-button');
  
  // Wait for modal to be visible
  await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  
  // Capture modal state
  await captureHtml(page, 'modal-opened', {
    screenshot: true,
    highlight: '[role="dialog"]',
    annotate: [
      { selector: '[role="dialog"]', text: 'Modal dialog' },
      { selector: 'button:has-text("Close")', text: 'Close button' }
    ]
  });
  
  // Interact with elements inside the modal
  // Note: Always scope selectors to the modal for reliability
  const modal = page.locator('[role="dialog"]');
  await modal.locator('input[name="name"]').fill('Test User');
  
  // Close the modal
  await modal.locator('button:has-text("Close")').click();
  
  // Verify modal is closed
  await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
});
```

### Testing Loading States

For features with complex loading states (like the recipe generation in Feedr):

```typescript
claudeTest('tests feature with loading states', async ({ page }) => {
  // Trigger action that causes loading state
  await page.click('.generate-recipe-button');
  
  // Immediately capture the loading state
  await captureHtml(page, 'initial-loading', {
    screenshot: true,
    annotate: [{ selector: '.loading-spinner', text: 'Loading spinner visible' }]
  });
  
  // Verify loading indicators
  await expect(page.locator('.loading-spinner')).toBeVisible();
  await expect(page.locator('.loading-message')).toContainText('Generating');
  
  // Wait for loading to complete (may be a long-running process)
  await page.waitForSelector('.recipe-content', { 
    state: 'visible',
    timeout: 60000  // Long timeout for AI-generated content
  });
  
  // Capture completed state
  await captureHtml(page, 'generation-complete', {
    screenshot: true,
    highlight: '.recipe-content',
    annotate: [{ selector: '.recipe-content', text: 'Generated content' }]
  });
  
  // Verify content was generated properly
  await expect(page.locator('.recipe-title')).toBeVisible();
  await expect(page.locator('.recipe-ingredients')).toBeVisible();
});
```

### Handling Dynamic Content

For pages with dynamic content that may change between test runs:

```typescript
claudeTest('handles dynamic content', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Capture before attempting to interact
  await captureHtml(page, 'dashboard-initial', { screenshot: true });
  
  // Check if a specific notification is present
  const notification = page.locator('.notification');
  const isNotificationVisible = await notification.isVisible().catch(() => false);
  
  if (isNotificationVisible) {
    // Document the notification
    await captureHtml(page, 'notification-present', {
      screenshot: true,
      highlight: '.notification',
      annotate: [{ selector: '.notification', text: 'Notification present' }]
    });
    
    // Dismiss it
    await notification.locator('.dismiss-button').click();
    
    // Verify dismissed
    await expect(notification).toBeHidden();
  }
  
  // Continue with the main test logic...
});
```

## Implementation Details

### File Structure

```
e2e/
  ├── utils/
  │   └── claude/
  │       ├── index.ts            # Main export file
  │       ├── test-helper.ts      # Enhanced test function
  │       ├── html-capture.ts     # HTML snapshot utility
  │       ├── dom-inspector.ts    # Element inspection
  │       └── setup.ts            # Environment setup
  └── CLAUDE_INSTRUCTIONS.md      # This documentation
```

### Environment Variables

- `CAPTURE_HTML=true`: Enables HTML capture (set automatically by `npm run test:e2e:claude`)
- `CLAUDE_DEBUG=true`: Enables additional debugging output

### Artifact Storage

All test artifacts are stored in the following directories:

```
test-artifacts/
  ├── html/                # HTML snapshots
  │   └── index.html       # Browsable report of all captures
  ├── screenshots/         # Screenshots with annotations
  ├── dom-inspector/       # Element inspection reports
  └── accessibility/       # Accessibility check reports
```

## Common Issues and Troubleshooting

### Issue: Test Fails with "Element Not Found"

**Symptoms:**
- Test fails with `Error: locator.click: Target closed` or similar
- Element cannot be found despite being visible in the UI

**Troubleshooting Steps:**
1. Run the test with Claude tooling: `npm run test:e2e:claude -- path/to/test.spec.ts`
2. Examine the HTML captures before the failure point
3. Check the actual DOM structure and compare with your selectors
4. Use DOM inspector reports to find more robust selectors
5. Add appropriate wait conditions before interacting with elements

**Common Solutions:**
```typescript
// Add explicit wait for element to be ready
await page.waitForSelector('.my-button', { state: 'visible' });

// Use more specific selectors
const dialog = page.locator('[role="dialog"]');
await dialog.locator('button:has-text("Save")').click();

// Add timeout for slow-loading elements
await page.locator('.recipe-card').click({ timeout: 10000 });
```

### Issue: Flaky Tests with Timeouts

**Symptoms:**
- Tests sometimes pass, sometimes fail
- Failures often mention timeouts

**Troubleshooting Steps:**
1. Examine the test artifacts from a failed run
2. Look for loading indicators that might still be present
3. Check for race conditions in the test flow

**Common Solutions:**
```typescript
// Wait for specific content instead of fixed timeouts
await page.waitForSelector('.content-loaded', { state: 'visible' });

// Wait for loading indicators to disappear
await page.waitForSelector('.loading-spinner', { state: 'hidden' });

// Use more reliable wait patterns for navigation
await Promise.all([
  page.waitForURL('/dashboard'),
  page.click('.submit-button')
]);
```

### Issue: Selectors Breaking After UI Changes

**Symptoms:**
- Tests that previously passed now fail after UI updates
- Failures mention elements not found or not visible

**Troubleshooting Steps:**
1. Compare HTML captures from passing and failing runs
2. Look for changes in class names, attributes, or DOM structure
3. Check for new CSS transitions or animations that might affect timing

**Common Solutions:**
```typescript
// Use more stable selectors based on roles and accessibility attributes
await page.getByRole('button', { name: 'Submit' }).click();

// Add data-testid attributes to important elements and use those
await page.getByTestId('recipe-card').click();

// Use more flexible text matching for i18n content
await page.locator('button:has-text(/Submit|Enviar|Soumettre/)').click();
```

## Conclusion

The Claude Playwright testing tools provide a comprehensive suite of utilities designed to make E2E testing with Claude AI more effective. By following these best practices and using the provided tools, you can create robust tests that are easier to debug and maintain.

Remember:
1. **ALWAYS add data-testid attributes** to all important UI elements
2. Always use `claudeTest` instead of regular Playwright test
3. Add HTML captures at key points in your test flow
4. Document UI interactions with annotations
5. Test both loading states and final content
6. Use data-testid selectors first, then fallback to more flexible options
7. When tests fail, examine the generated artifacts for debugging

If you have suggestions for improving these tools, please contribute to the project!