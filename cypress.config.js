import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    screenshotOnRunFailure: true,
    video: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    experimentalRunAllSpecs: true,
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/report/mochawesome-report',
      overwrite: false,
      html: false,
      json: true
    }
  },
  env: {
    // Environment variables can be configured here for local development
    // These will be overridden by Amplify environment variables or CI/CD pipeline
    TEST_USER_EMAIL: "pminkler+testuser@gmail.com",
    TEST_USER_PASSWORD: "Password1!"
  }
});