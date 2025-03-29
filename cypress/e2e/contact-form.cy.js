// cypress/e2e/contact-form.cy.js
describe('Contact Form', () => {
  beforeEach(() => {
    // Visit the contact page before each test
    cy.visit('/contact');

    // Ensure the page is loaded by checking for the header
    cy.contains('h1', 'Contact Us').should('be.visible');
  });

  it('allows guest users to submit feedback', () => {
    // Check that form elements are visible
    cy.get('input[name="email"]').should('be.visible');
    cy.get('textarea[name="message"]').should('be.visible');

    // Fill out the form with valid data
    cy.get('input[name="email"]').type('test@example.com');

    // USelect component in Nuxt UI is a custom component and doesn't use a native select
    // The default value is already set to 'GENERAL_FEEDBACK' so we don't need to change it

    // Enter a message that's long enough (> 10 chars)
    cy.get('textarea[name="message"]').type(
      'This is a test message for the contact form. Please ignore.'
    );

    // Submit the form using the button in the footer
    cy.contains('Send Message').click();

    // Check for the success toast
    cy.contains('Message Sent', { timeout: 10000 }).should('be.visible');
    cy.contains('Thank you for your message').should('be.visible');

    // Verify form is reset
    cy.get('input[name="email"]').should('have.value', '');
    cy.get('textarea[name="message"]').should('have.value', '');
  });

  it('validates form fields', () => {
    // Clear any default values (in case there are any)
    cy.get('input[name="email"]').clear();
    cy.get('textarea[name="message"]').clear();

    // Submit empty form to trigger validation
    cy.contains('Send Message').click();

    // Check for validation errors
    cy.contains('Email address is required', { timeout: 5000 }).should('be.visible');

    // Fill only email and submit again
    cy.get('input[name="email"]').type('test@example.com');
    cy.contains('Send Message').click();

    // Add short message (less than 10 chars)
    cy.get('textarea[name="message"]').type('Too short');
    cy.contains('Send Message').click();

    // Check for minimum length validation
    cy.contains('Message must be at least 10 characters', { timeout: 5000 }).should('be.visible');

    // Fix the message length and submit
    cy.get('textarea[name="message"]').clear().type('This message is long enough now');
    cy.contains('Send Message').click();

    // Check for success toast
    cy.contains('Message Sent', { timeout: 10000 }).should('be.visible');
  });

  it('shows form in correct initial state for guest users', () => {
    // Email field should be enabled for guest users
    cy.get('input[name="email"]').should('be.enabled');

    // Message field should be empty
    cy.get('textarea[name="message"]').should('have.value', '');
  });
});
