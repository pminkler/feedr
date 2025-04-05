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
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CAPTURE_HTML === 'true'
    ? [
        ['html'],
        ['json', { outputFile: path.join('test-artifacts', 'test-results.json') }],
      ]
    : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3333',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Set a reasonable timeout for actions */
    actionTimeout: 15000,

    /* Screenshot options */
    screenshot: 'only-on-failure',

    /* Viewport size for all tests */
    viewport: { width: 1280, height: 720 },

    /* Slow down actions for better stability and debugging */
    launchOptions: {
      slowMo: process.env.CI ? 0 : 200,
    },
  },

  /* Configure projects for major browsers */
  projects: process.env.CAPTURE_HTML === 'true'
    ? [
        // Use only Chromium for Claude's HTML capture tests
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },

        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },

        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },

        /* Test against mobile viewports. (Disabled by default) */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

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
    command: 'npm run preview:e2e',
    url: 'http://localhost:3333',
    reuseExistingServer: !process.env.CI, // Only reuse in dev environment
    timeout: 120000,
  },
});
