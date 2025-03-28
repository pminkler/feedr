// cypress/e2e/recipe-generation.cy.js
describe('Recipe Generation Flow', () => {
  const TEST_RECIPE_URL = 'https://www.allrecipes.com/banana-baked-oatmeal-cups-recipe-11699825'; // Recipe URL for testing

  beforeEach(() => {
    // Start from the homepage
    cy.visit('/');
    // Make sure the homepage properly loads with the recipe input
    cy.contains('Get Recipe').should('exist');
  });

  it('should generate a recipe from a URL for a guest user', () => {
    // Enter a recipe URL
    cy.get('input[placeholder*="Recipe URL"]').type(TEST_RECIPE_URL);
    
    // Submit the form
    cy.get('button').contains('Get Recipe').click();
    
    // Check that we're redirected to a recipe page (with 10 second timeout)
    cy.url({ timeout: 10000 }).should('include', '/recipes/');
    
    // Verify loading messages appear by checking for their component
    cy.get('.animate-pulse').should('exist');
    
    // Since recipe generation takes time, we need a longer timeout
    // Wait for recipe details to appear, which indicates processing is complete
    cy.contains('h3', 'Recipe Details', { timeout: 60000 }).should('exist');
    
    // Verify key recipe elements are present
    cy.contains('Ingredients').should('exist');
    cy.contains('Steps').should('exist');
    // Check for a list item in the ingredients section (with extended timeout)
    cy.get('ul.list-disc.list-inside li', { timeout: 20000 }).should('have.length.at.least', 1);
  });

  it('should generate a recipe from a URL for an authenticated user', () => {
    // Log in first
    cy.login();
    
    // Navigate to the homepage
    cy.visit('/');
    
    // Enter a recipe URL
    cy.get('input[placeholder*="Recipe URL"]').type(TEST_RECIPE_URL);
    
    // Submit the form
    cy.get('button').contains('Get Recipe').click();
    
    // Check that we're redirected to a recipe page (with 10 second timeout)
    cy.url({ timeout: 10000 }).should('include', '/recipes/');
    
    // Verify loading messages appear by checking for their component
    cy.get('.animate-pulse').should('exist');
    
    // Wait for recipe details to appear, which indicates processing is complete
    cy.contains('h3', 'Recipe Details', { timeout: 60000 }).should('exist');
    
    // Verify key recipe elements are present
    cy.contains('Ingredients').should('exist');
    cy.contains('Steps').should('exist');
    // Check for a list item in the ingredients section (with extended timeout)
    cy.get('ul.list-disc.list-inside li', { timeout: 20000 }).should('have.length.at.least', 1);
    
    // Verify user-specific features are available
    // Look for the Copy Recipe button with document-duplicate icon
    cy.get('button[title="Copy Recipe"]', { timeout: 10000 }).should('exist');
    
    // Alternative selector targeting the icon inside the button
    cy.get('.i-heroicons\\:document-duplicate', { timeout: 10000 }).should('exist');
  });
});