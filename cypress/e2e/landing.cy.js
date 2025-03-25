// cypress/e2e/landing.cy.js
describe('Landing Page', () => {
  beforeEach(() => {
    // Visit the landing page before each test
    cy.visit('/');
  });

  it('displays the main components of the landing page', () => {
    // 1. Check the title and subtitle
    cy.contains('h1', 'Your Recipes, Simplified').should('be.visible');
    cy.contains('div', 'Convert any recipe into a clean, consistent format').should('be.visible');
    
    // 2. Check the input form is present
    cy.get('input[placeholder="Recipe URL"]').should('be.visible');
    cy.get('button[type="submit"]').contains('Get Recipe').should('be.visible');
    
    // 3. Check that the upload buttons are present
    cy.get('button[aria-label*="photo"],button[icon*="photo"]').should('be.visible');
    cy.get('button[aria-label*="camera"],button[icon*="camera"]').should('be.visible');
    
    // 4. Check that the Features section exists
    cy.contains('h2', 'Why Feedr?').should('be.visible');
    cy.get('#features').should('exist');
    
    // 5. Check that we have the expected number of feature cards
    cy.get('#features').find('div').should('have.length.at.least', 8);
    
    // 6. Check FAQ section exists
    cy.contains('h2', 'Frequently Asked Questions').should('be.visible');
    cy.get('#faq').should('exist');
  });

  it('allows URL input and form submission', () => {
    // 1. Type a URL into the input
    cy.get('input[placeholder="Recipe URL"]').type('https://www.example.com/recipe');
    
    // 2. Click the submit button
    cy.get('button[type="submit"]').contains('Get Recipe').click();
    
    // 3. Since we can't fully test the submission without backend,
    // let's just verify the button shows loading state
    cy.get('button[type="submit"]').should('have.attr', 'aria-busy', 'true');
  });
});