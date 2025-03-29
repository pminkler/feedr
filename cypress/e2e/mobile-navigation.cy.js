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

  it('fresh guest users should not see My Recipes in mobile navigation', () => {
    // Visit the home page as a fresh guest user
    cy.visit('/');

    // Verify we're on the home page
    cy.url().should('eq', Cypress.config().baseUrl + '/');

    // Find and click the mobile menu button
    cy.get('button[aria-label="Open menu"]').should('be.visible').click();

    // The My Recipes link should NOT be present in the DOM at all for fresh guest users
    cy.get('body').then(($body) => {
      // If there's a mobile menu with My Recipes link, it would contain this text
      const hasMyRecipesLink = $body.find('a[href="/my-recipes"]').length > 0;
      expect(hasMyRecipesLink).to.be.false;
    });
  });

  it('guest users with recipes can access My Recipes', () => {
    // This test verifies that after a guest creates a recipe, they can access my-recipes

    // Start with a clean state
    cy.clearLocalStorage();

    // First verify My Recipes link is NOT in header for fresh guests
    cy.visit('/');
    cy.get('button[aria-label="Open menu"]').should('be.visible').click();
    cy.get('body').then(($body) => {
      // Verify link is initially not present
      const hasInitialLink = $body.find('a[href="/my-recipes"]').length > 0;
      expect(hasInitialLink).to.be.false;
    });

    // Now create a guest recipe
    cy.visit('/');
    cy.get('input[placeholder="Recipe URL"]').should('be.visible');

    // Use a simple URL that's more likely to process quickly
    const testRecipeUrl = 'https://www.allrecipes.com/recipe/228641/quick-and-easy-pizza-crust/';
    cy.get('input[placeholder="Recipe URL"]').type(testRecipeUrl);

    // Submit the form
    cy.contains('button', 'Get Recipe').click();

    // Wait for recipe creation to complete with a LONG timeout
    cy.contains('Recipe Details', { timeout: 120000 }).should('be.visible');

    // Wait a bit more to ensure the recipe is fully saved
    cy.wait(2000);

    // Directly navigate to my-recipes page
    cy.visit('/my-recipes');

    // Verify we're on the my-recipes page
    cy.url().should('include', '/my-recipes');

    // Verify we see recipe content on the page with generous timeout
    cy.contains('button', 'Edit Tags', { timeout: 20000 }).should('exist');

    // Check for recipe content
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      const hasRecipeContent = bodyText.includes('Recipe') || bodyText.includes('Pizza');

      expect(hasRecipeContent).to.be.true;
    });

    // Wait to ensure recipe is fully processed
    cy.wait(2000);

    // Go back to home page to check if My Recipes link appears in the menu
    cy.visit('/');

    // Open the mobile menu
    cy.get('button[aria-label="Open menu"]').should('be.visible').click();

    // Check for a link to my-recipes in the DOM after clicking the menu
    // We use { timeout: 10000 } to give it extra time to appear
    cy.get('a[href="/my-recipes"]', { timeout: 10000 }).should('exist');
  });
});
