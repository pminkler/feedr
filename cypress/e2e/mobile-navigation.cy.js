// cypress/e2e/mobile-navigation.cy.js
describe('Mobile Navigation Menu', () => {
  beforeEach(() => {
    // Set viewport to mobile size
    cy.viewport('iphone-x');

    // Clear auth state
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('authenticated users can access My Recipes through mobile navigation', () => {
    // Login first using the custom command
    cy.login();

    // Then navigate to home page where we'll test the mobile menu
    cy.visit('/');

    // Verify we're on the home page
    cy.url().should('eq', Cypress.config().baseUrl + '/');

    // Find and click the mobile menu button using its aria-label
    cy.get('button[aria-label="Open menu"]').should('be.visible').click();

    // The mobile menu should now be open with a vertical navigation
    // Target specifically the nav with the data-orientation="vertical" attribute
    cy.get('nav[data-orientation="vertical"]').should('be.visible');

    // Find My Recipes link within the mobile navigation
    cy.get('nav[data-orientation="vertical"] a[href="/my-recipes"]').should('be.visible');

    // Click on the My Recipes link
    cy.get('nav[data-orientation="vertical"] a[href="/my-recipes"]').click();

    // Verify we're redirected to my-recipes page
    cy.url().should('include', '/my-recipes');
  });

  it('guest users with recipes can access My Recipes through mobile navigation', () => {
    // First create a guest recipe
    cy.visit('/');

    // Check if the landing page has a recipe creation form
    cy.get('input[placeholder="Recipe URL"]').should('be.visible');

    // Enter recipe URL
    const testRecipeUrl = 'https://www.allrecipes.com/recipe/24074/alysias-basic-meat-lasagna/';
    cy.get('input[placeholder="Recipe URL"]').type(testRecipeUrl);

    // Submit the form
    cy.contains('button', 'Get Recipe').click();

    // Wait for recipe creation to complete and navigate back
    cy.contains('Recipe Details', { timeout: 60000 }).should('be.visible');

    // Go back to home page
    cy.visit('/');

    // Now the mobile menu should show "My Recipes" because there's a saved recipe
    // Find and click the mobile menu button
    cy.get('button[aria-label="Open menu"]').should('be.visible').click();

    // The mobile menu should now contain My Recipes link
    cy.get('nav[data-orientation="vertical"] a[href="/my-recipes"]').should('be.visible');

    // Click on the My Recipes link
    cy.get('nav[data-orientation="vertical"] a[href="/my-recipes"]').click();

    // Verify we're on the my-recipes page
    cy.url().should('include', '/my-recipes');

    // Verify we see recipe content on the page
    // The page should have either "Edit Tags" button or recipe content
    cy.contains('button', 'Edit Tags', { timeout: 10000 }).should('exist');

    // Check for recipe content (either specific or general)
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      // Check if we can find any recipe-related text
      const hasRecipeContent =
        bodyText.includes('Untitled Recipe') ||
        bodyText.includes('Recipe') ||
        bodyText.includes('Lasagna');

      expect(hasRecipeContent).to.be.true;
    });
  });
});
