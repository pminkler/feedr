# E2E Testing for Feedr

This directory contains end-to-end tests for the Feedr application using Playwright.

## Test Suites

- **Landing Page Tests** (`landing.spec.ts`): Tests for the main landing page, including form functionality and UI elements.

## Debug Utilities

Special debug utilities are provided in `utils/` to help diagnose test failures:

- `debug-test.ts`: Enhanced test fixtures with debug capabilities
- `debug-reporter.ts`: Custom reporter that captures detailed failure information
- `test-helpers.ts`: Utility functions for debugging tests

## How to Run Tests

Run tests using npm scripts:

```bash
# Run all E2E tests with regular settings
npm run test:e2e

# Run tests with line reporter (more concise output)
npm run test:e2e:fast

# Run tests in CI mode
npm run test:e2e:ci

# Run tests with debug mode enabled
npm run test:e2e:debug
```

## Debug Artifacts

When running tests with `test:e2e:debug`, debug artifacts will be saved to `debug-artifacts/`:

- **HTML**: Captured HTML content at failure points
- **Screenshots**: Visual snapshots of the page state
- **Traces**: Playwright trace files for playback

To view a trace file, use:

```bash
npx playwright show-trace debug-artifacts/traces/[filename].zip
```

## Adding New Tests

When adding new tests, follow these principles:

1. Keep tests isolated and independent
2. Use robust selectors (text content, data-testid attributes, etc.)
3. Avoid hard-coded timeouts
4. Use page objects for complex pages
5. Include meaningful debug captures using `page.captureDebug()`
