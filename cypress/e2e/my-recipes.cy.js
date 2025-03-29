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

// Test for Recipe Tags Editing Functionality
describe('Recipe Tags Editing', () => {
  const TEST_RECIPE_URL = 'https://www.allrecipes.com/banana-baked-oatmeal-cups-recipe-11699825';
  let recipeCreated = false;

  beforeEach(() => {
    // Login and ensure there's at least one recipe
    cy.login();
    cy.visit('/my-recipes');
    cy.url({ timeout: 10000 }).should('include', '/my-recipes');

    // Wait for page to fully load and recipes to render
    cy.wait(2000);

    // Check if we need to create a recipe first
    cy.get('body').then(($body) => {
      // Wait for recipe cards to be visible before checking count
      cy.contains('My Recipes', { timeout: 10000 }).should('exist');

      // Check if we have at least two recipes for the tag editing tests
      const recipeCount = Cypress.$('button:contains("Edit Tags")').length;
      cy.log(`Found ${recipeCount} recipes on the page`);

      if ($body.text().includes('No Recipes Found') || (recipeCount < 2 && !recipeCreated)) {
        // Create a recipe since we don't have enough
        cy.contains('Add Recipe').click();
        cy.contains('Create New Recipe').should('be.visible');
        cy.get('input[placeholder*="Recipe URL"]').type(TEST_RECIPE_URL);
        cy.contains('button', 'Get Recipe').click();

        // Wait for recipe generation to complete
        cy.url({ timeout: 10000 }).should('include', '/recipes/');
        cy.contains('h3', 'Recipe Details', { timeout: 60000 }).should('exist');

        // Now go back to My Recipes page
        cy.visit('/my-recipes');
        cy.url({ timeout: 10000 }).should('include', '/my-recipes');

        // Set flag to avoid creating recipe for subsequent tests
        recipeCreated = true;
      }
    });
  });

  it('should open the Edit Tags modal from a recipe card', () => {
    // Find the first recipe card and click its Edit Tags button
    cy.get('button').contains('Edit Tags').first().click();

    // Verify modal is open with the correct title
    cy.get('[role="dialog"]').should('exist');
    cy.get('[role="dialog"]').contains('Edit Tags').should('exist');
  });

  it('should add a new tag to a recipe', () => {
    // Create a unique tag name using timestamp
    const newTag = `test-tag-${Date.now()}`;

    // Open edit tags modal for the first recipe
    cy.get('button').contains('Edit Tags').first().click();
    cy.get('[role="dialog"]').should('exist');
    cy.get('[role="dialog"]').contains('Edit Tags').should('exist');

    // Open the select menu
    cy.get('[role="dialog"]').find('button[aria-haspopup="listbox"]').click({ force: true });

    // Wait for the combobox to be visible
    cy.get('[id^="reka-combobox-content"]').should('exist');

    // Type a new tag name in the input that appears in the combobox content
    cy.get('[id^="reka-combobox-content"]').find('input').clear().type(newTag, { force: true });
    cy.wait(500); // Wait to ensure full text is entered

    // Log the input value to confirm it's typed correctly
    cy.get('[id^="reka-combobox-content"]')
      .find('input')
      .then(($input) => {
        cy.log(`Input value: ${$input.val()}`);
      });

    // Look for the "New tag" option with a longer timeout
    cy.contains('New tag:', { timeout: 10000 }).should('exist');
    cy.contains(`New tag: ${newTag}`, { timeout: 10000 }).click({ force: true });

    // Wait a moment for the UI to update
    cy.wait(500);

    // Then click Save Changes (with force option if needed)
    cy.get('[role="dialog"]').contains('button', 'Save Changes').click({ force: true });

    // Verify the modal closes
    cy.get('[role="dialog"]').should('not.exist');

    // Verify the tag appears on the recipe card
    cy.contains(newTag).should('exist');
  });

  // More tests for tag functionality will be added later
});
