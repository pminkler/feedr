// cypress/e2e/contact-form-authenticated.cy.js
describe('Contact Form for Authenticated Users', () => {
  beforeEach(() => {
    // Login before each test using the custom command defined in support/e2e.js
    cy.login();

    // After successful login, navigate to the contact page
    cy.visit('/contact');

    // Ensure the page is loaded by checking for the header
    cy.contains('h1', 'Contact Us').should('be.visible');
  });

  it('auto-fills email for authenticated users', () => {
    // Check that email field is disabled and auto-filled
    cy.get('input[name="email"]').should('be.disabled').should('not.have.value', '');

    // Just verify that the email field isn't empty and is disabled,
    // which is enough to confirm the auto-fill behavior is working
    cy.get('input[name="email"]').should('be.disabled').invoke('val').should('not.be.empty');
  });

  it('allows authenticated users to submit feedback', () => {
    // Type a message (email is already auto-filled)
    cy.get('textarea[name="message"]').type(
      'This is a test message from an authenticated user. Please ignore.'
    );

    // Submit the form
    cy.contains('Send Message').click();

    // Check for the success toast
    cy.contains('Message Sent', { timeout: 10000 }).should('be.visible');
    cy.contains('Thank you for your message').should('be.visible');

    // Verify form's message is reset but email remains
    cy.get('textarea[name="message"]').should('have.value', '');
    cy.get('input[name="email"]').should('be.disabled');
  });

  it('validates minimum message length for authenticated users', () => {
    // Clear any existing text
    cy.get('textarea[name="message"]').clear();

    // Add short message (less than 10 chars)
    cy.get('textarea[name="message"]').type('Too short');
    cy.contains('Send Message').click();

    // Check for minimum length validation
    // Look for text containing the validation message, it might be inside a span or div
    cy.contains(/must be at least 10 characters/i, { timeout: 5000 }).should('be.visible');

    // Fix the message length and submit
    cy.get('textarea[name="message"]')
      .clear()
      .type('This message is long enough now to meet the validation requirements');
    cy.contains('Send Message').click();

    // Check for success toast
    cy.contains('Message Sent', { timeout: 10000 }).should('be.visible');
  });
});
