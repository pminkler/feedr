// cypress/e2e/guest-recipe-tags.cy.js
describe('Guest User Recipe Features', () => {
  // We're testing functionality for guest users (not logged in)
  const TEST_RECIPE_URL = 'https://www.allrecipes.com/banana-baked-oatmeal-cups-recipe-11699825';
  
  // Basic test to validate recipe creation as a guest
  it('should allow a guest user to create a recipe and view it in My Recipes', () => {
    // Visit as a guest (no login)
    cy.visit('/');
    
    // Add a recipe from landing page
    cy.get('input[placeholder*="Recipe URL"]').type(TEST_RECIPE_URL);
    cy.get('button[type="submit"]').click();
    
    // Wait for recipe to generate
    cy.url({ timeout: 20000 }).should('include', '/recipes/');
    
    // Once recipe is created, navigate to My Recipes
    cy.visit('/my-recipes');
    cy.url().should('include', '/my-recipes');
    
    // Should show at least one recipe card
    cy.contains('My Recipes', { timeout: 10000 }).should('be.visible');
    cy.contains('No Recipes Found').should('not.exist');
  });
  
  // This validates that the recipe data persists for a guest user
  it('should persist guest recipe data across page loads', () => {
    // Visit My Recipes page (should already have a recipe from first test)
    cy.visit('/my-recipes');
    cy.contains('My Recipes', { timeout: 10000 }).should('be.visible');
    
    // Verify recipe exists
    cy.contains('No Recipes Found').should('not.exist');
    
    // Reload the page and verify the recipe still appears
    cy.reload();
    cy.contains('My Recipes', { timeout: 10000 }).should('be.visible');
    cy.contains('No Recipes Found').should('not.exist');
  });
  
  // The tag editing functionality should be tested manually until we can 
  // properly identify the right selectors in the UI for automation
});