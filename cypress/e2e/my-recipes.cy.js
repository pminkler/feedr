// cypress/e2e/my-recipes.cy.js
describe('My Recipes Page', () => {
  // Use the custom login command to authenticate before each test
  beforeEach(() => {
    cy.login(); // Uses environment variables for credentials
  });

  it('displays the My Recipes page after login', () => {
    // Verify we're on the My Recipes page
    cy.url({ timeout: 10000 }).should('include', '/my-recipes');
    cy.contains('My Recipes', { timeout: 10000 }).should('exist');
  });

  // This is just a stub test to demonstrate the login command
  // Add your actual My Recipes page tests here
  it('shows user recipes if available', () => {
    // This test is just a placeholder to demonstrate using the login command
    // You would typically add assertions to check for recipe cards or other content
    cy.url({ timeout: 10000 }).should('include', '/my-recipes');
  });
});