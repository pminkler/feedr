// ***********************************************************
// This support file is processed and loaded automatically before your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
// import './commands'

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
    throw new Error('Missing login credentials. Provide email/password or set TEST_USER_EMAIL and TEST_USER_PASSWORD env variables');
  }
  
  cy.visit('/login');
  cy.get('input[name="email"]').type(loginEmail);
  cy.get('input[name="password"]').type(loginPassword, { log: false });
  cy.get('button[type="submit"]').click();
  
  // Wait for redirect to confirm login was successful
  cy.url().should('include', '/my-recipes');
  
  // Verify we're on the recipes page
  cy.contains('My Recipes').should('exist');
});

// Additional custom commands can be added here