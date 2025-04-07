import * as path from 'path';
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI and also locally to improve test stability */
  retries: process.env.CI ? 2 : 1,
  /* Ignore development-only test files by default */
  testIgnore: process.env.RUN_DEV_TESTS === 'true' ? [] : ['**/*.development.spec.ts'],
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter:
    process.env.DEBUG_MODE === 'true'
      ? [
          ['list'], // Use list reporter for console output
          ['./e2e/utils/debug-reporter.ts'], // Use custom reporter for debug artifacts
        ]
      : process.env.CAPTURE_HTML === 'true'
        ? [
            ['html'],
            [
              'json',
              { outputFile: path.join('test-artifacts', 'test-results.json') },
            ],
          ]
        : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace only when explicitly requested to avoid file access issues */
    trace:
      process.env.DEBUG_MODE === 'true' || process.env.CAPTURE_TRACE === 'true'
        ? 'on'
        : 'off',

    /* Set a reasonable timeout for actions but increase for stability */
    actionTimeout: 15000,
    navigationTimeout: 20000,

    /* Screenshot options */
    screenshot: 'only-on-failure',

    /* Viewport size for all tests */
    viewport: { width: 1280, height: 720 },

    /* Slow down actions for better stability and debugging */
    launchOptions: {
      slowMo: process.env.CI
        ? 0
        : process.env.DEBUG_MODE === 'true'
          ? 300
          : 200,
    },
  },

  /* Configure projects for browsers - limit to Chromium only in CI */
  projects: [
    // All browsers for local development
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. (Disabled by default) */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Web server configuration for serving the preview site during tests */
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:3000',
    timeout: 30000,
    reuseExistingServer: true,
  },
});
