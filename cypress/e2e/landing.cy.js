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

    // 3. Check the submit button is present (using the text rather than attributes)
    cy.contains('button', 'Get Recipe').should('be.visible');

    // 4. Check that the Features section exists
    cy.contains('h2', 'Why Feedr?').should('be.visible');
    cy.get('#features').should('exist');

    // 5. Check that we have the expected number of feature cards
    cy.get('#features').children().should('have.length.at.least', 4);

    // 6. Check FAQ section exists
    cy.contains('h2', 'Frequently Asked Questions').should('be.visible');
    cy.get('#faq').should('exist');
  });
});
