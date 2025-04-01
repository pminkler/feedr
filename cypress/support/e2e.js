// ***********************************************************
// This support file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
// import './commands'

// Import MailSlurp Cypress plugin
import 'cypress-mailslurp';

// Load environment variables for testing
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // This is useful when the application generates errors that don't affect test functionality
  return false;
});

// Custom command for login
Cypress.Commands.add('login', (email, password) => {
  // Use environment variables if no credentials provided
  const loginEmail = email || Cypress.env('TEST_USER_EMAIL');
  const loginPassword = password || Cypress.env('TEST_USER_PASSWORD');

  if (!loginEmail || !loginPassword) {
    throw new Error(
      'Missing login credentials. Provide email/password or set TEST_USER_EMAIL and TEST_USER_PASSWORD env variables'
    );
  }

  cy.log(`Attempting to log in with email: ${loginEmail}`);
  cy.visit('/login');
  
  // Wait for login form to be fully loaded
  cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible');
  cy.get('input[name="email"]').clear().type(loginEmail);
  
  cy.get('input[name="password"]', { timeout: 5000 }).should('be.visible');
  cy.get('input[name="password"]').clear().type(loginPassword, { log: false });
  
  // Debug: Log that we're about to click the submit button
  cy.log('Clicking submit button');
  cy.get('button[type="submit"]').click();

  // Check for error messages after login attempt
  cy.get('body').then(($body) => {
    if ($body.text().includes('Authentication Error') || 
        $body.text().includes('incorrect') || 
        $body.text().includes('invalid')) {
      cy.log('*** LOGIN ERROR DETECTED ***');
    }
  });

  // Wait for redirect to confirm login was successful (with longer timeout)
  cy.url({ timeout: 15000 }).should('include', '/my-recipes');

  // Verify we're on the recipes page
  cy.contains('My Recipes', { timeout: 15000 }).should('exist');
  cy.log('Login successful');
});

// Additional custom commands can be added here
