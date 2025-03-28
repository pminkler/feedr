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

  it('should have an Instacart button below ingredients that opens correct URL with partner ID', () => {
    // Start the test directly with recipe generation
    cy.get('input[placeholder*="Recipe URL"]').type(TEST_RECIPE_URL);
    cy.get('button').contains('Get Recipe').click();
    
    // Wait for recipe generation to complete
    cy.url({ timeout: 10000 }).should('include', '/recipes/');
    cy.contains('h3', 'Recipe Details', { timeout: 60000 }).should('exist');
    
    // Verify ingredients are loaded
    cy.contains('h3', 'Ingredients').should('exist');
    cy.get('ul.list-disc.list-inside li', { timeout: 20000 }).should('have.length.at.least', 1);
    
    // Check that the Instacart button exists in the correct location (below ingredients)
    // First find the ingredients section card
    cy.contains('h3', 'Ingredients')
      .closest('div.space-y-4') // Find the containing card
      .within(() => {
        // Check for a border with button below (visual separator before Instacart button)
        cy.get('.border-t.mt-6').should('exist');
        
        // Find the actual Instacart button with the carrot icon
        cy.get('img[src="/Instacart_Carrot.svg"]').should('exist');
        cy.contains('button', 'Get Recipe Ingredients').should('exist');
        // Check for affiliate disclosure text
        cy.contains('I earn a commission from Instacart for qualifying purchases').should('exist');
      });
    
    // Now test that clicking the button opens a new tab with correct URL parameters
    // Set up to intercept window.open calls
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });
    
    // Click the button - we use the exact button text
    cy.get('button').contains('Get Recipe Ingredients').click();
    
    // Wait for the generation and check what URL was opened
    cy.get('@windowOpen', { timeout: 30000 }).should('be.called');
    cy.get('@windowOpen').then((windowOpenStub) => {
      // Check that it was called with a URL matching expected pattern
      // Can be instacart.com or instacart.tools (development environment)
      expect(windowOpenStub).to.be.calledWithMatch(/.*instacart\.(com|tools).*/) 
      
      // Verify the URL contains the partner ID
      const url = windowOpenStub.args[0][0];
      expect(url).to.include('utm_medium=affiliate');
      
      // Specific partner ID checks
      expect(url).to.include('partnerid-');
      expect(url).to.include('campaignid-');
    });
  });
});

describe('Add Recipe Modal', () => {
  const TEST_RECIPE_URL = 'https://www.allrecipes.com/banana-baked-oatmeal-cups-recipe-11699825'; // Recipe URL for testing

  beforeEach(() => {
    // Log in first for all tests
    cy.login();
    
    // Navigate to a page with the sidebar
    cy.visit('/my-recipes');
    
    // Wait for the page to load
    cy.contains('My Recipes', { timeout: 10000 }).should('exist');
  });

  it('should open Add Recipe modal when clicking on the sidebar link', () => {
    // Click on the Add Recipe link in the sidebar
    cy.contains('Add Recipe').click();
    
    // Verify the modal appears
    cy.contains('Create New Recipe').should('be.visible');
    cy.contains('Enter a recipe URL or upload an image to generate a new recipe').should('be.visible');
    
    // Verify the input field and buttons exist
    cy.get('input[placeholder*="Recipe URL"]').should('be.visible');
    cy.get('button[aria-label="Browse for Image"]').should('be.visible');
    cy.get('button[aria-label="Take Photo"]').should('be.visible');
  });

  it('should close the modal when clicking outside it', () => {
    // Open the modal
    cy.contains('Add Recipe').click();
    cy.contains('Create New Recipe').should('be.visible');
    
    // Click on the backdrop/overlay - use force:true because pointer-events may be disabled
    // Instead of trying to click the body, look for the backdrop/overlay element
    cy.get('[role="dialog"]').parent().click({ force: true });
    
    // Verify the modal is no longer visible
    cy.contains('Create New Recipe').should('not.exist');
  });

  it('should close the modal when clicking the X button', () => {
    // Open the modal
    cy.contains('Add Recipe').click();
    cy.contains('Create New Recipe').should('be.visible');
    
    // Click the X button (close button)
    cy.get('[aria-label="Close"]').click();
    
    // Verify the modal is no longer visible
    cy.contains('Create New Recipe').should('not.exist');
  });

  it('should close the modal when clicking the Cancel button', () => {
    // Open the modal
    cy.contains('Add Recipe').click();
    cy.contains('Create New Recipe').should('be.visible');
    
    // Click the Cancel button
    cy.contains('button', 'Cancel').click();
    
    // Verify the modal is no longer visible
    cy.contains('Create New Recipe').should('not.exist');
  });

  it('should submit a recipe URL and redirect to the recipe page', () => {
    // Open the modal
    cy.contains('Add Recipe').click();
    cy.contains('Create New Recipe').should('be.visible');
    
    // Enter a recipe URL
    cy.get('input[placeholder*="Recipe URL"]').type(TEST_RECIPE_URL);
    
    // Submit the form
    cy.contains('button', 'Get Recipe').click();
    
    // Check that we're redirected to a recipe page
    cy.url({ timeout: 10000 }).should('include', '/recipes/');
    
    // Verify loading messages appear
    cy.get('.animate-pulse').should('exist');
    
    // Wait for recipe details to appear, which indicates processing is complete
    cy.contains('h3', 'Recipe Details', { timeout: 60000 }).should('exist');
    
    // Verify key recipe elements are present
    cy.contains('Ingredients').should('exist');
    cy.contains('Steps').should('exist');
    cy.get('ul.list-disc.list-inside li', { timeout: 20000 }).should('have.length.at.least', 1);
  });
});