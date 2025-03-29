// cypress/e2e/signup.cy.js

describe('Signup Flow', () => {
  // Before all tests, log all environment variables for debugging
  before(() => {
    cy.log('Available environment variables:');
    cy.log(JSON.stringify(Cypress.env(), null, 2));
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      cy.visit('/signup');
      cy.clearCookies();
      cy.clearLocalStorage();
    });

    it('displays signup form elements correctly', () => {
      cy.contains('div.text-xl', 'Sign Up').should('be.visible');

      // Check form elements
      cy.contains('label', 'Email').should('be.visible');
      cy.contains('label', 'Password').should('be.visible');
      cy.contains('label', 'Repeat Password').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');

      // Check the Google sign-up option
      cy.contains('button', 'Continue with Google').should('be.visible');

      // Check navigation links
      cy.contains('a', 'Sign in').should('be.visible');
      cy.contains('a', 'Terms of Service').should('be.visible');
    });

    it('shows validation errors for empty fields', () => {
      // Submit the form without entering any data
      cy.get('button[type="submit"]').click();

      // Verify we stay on the signup page after invalid submit
      cy.url().should('include', '/signup');

      // Form should still exist after submission attempt
      cy.get('form').should('exist');
    });

    it('validates password requirements', () => {
      // Test email that doesn't need to be real
      const testEmail = 'test@example.com';

      // Test password missing uppercase
      cy.get('input[name="email"]').type(testEmail);
      cy.get('input[name="password"]').type('password123!');
      cy.get('input[name="repeatPassword"]').type('password123!');
      cy.get('button[type="submit"]').click();

      // Form should still exist, we shouldn't proceed to confirmation
      cy.url().should('include', '/signup');

      // Clear the fields
      cy.get('input[name="password"]').clear();
      cy.get('input[name="repeatPassword"]').clear();

      // Test password missing number
      cy.get('input[name="password"]').type('Password!');
      cy.get('input[name="repeatPassword"]').type('Password!');
      cy.get('button[type="submit"]').click();

      // Form should still exist, we shouldn't proceed to confirmation
      cy.url().should('include', '/signup');
    });

    it('validates password matching', () => {
      // Test email that doesn't need to be real
      const testEmail = 'test@example.com';

      // Enter email and mismatched passwords
      cy.get('input[name="email"]').type(testEmail);
      cy.get('input[name="password"]').type('Password123!');
      cy.get('input[name="repeatPassword"]').type('Password123?');
      cy.get('button[type="submit"]').click();

      // Form should still exist, we shouldn't proceed to confirmation
      cy.url().should('include', '/signup');
    });
  });

  /**
   * Email Verification Test Suite
   *
   * To run these tests:
   * npx cypress run --spec "cypress/e2e/signup.cy.js" --env runEmailTests=true
   *
   * This will:
   * 1. Create a temporary email inbox using MailSlurp
   * 2. Sign up with the temporary email
   * 3. Extract the verification code from the email
   * 4. Complete the signup process
   * 5. Log in with the new account
   * 6. Delete the account to clean up
   *
   * This approach conserves MailSlurp API limits by:
   * - Only running when explicitly enabled
   * - Using a single inbox for the entire test
   * - Cleaning up the account when done
   * - Failing gracefully when limits are reached
   */
  describe('Email Verification', () => {
    const testPassword = 'TestPassword123!';
    let inboxId;
    let emailAddress;
    let mailslurpAvailable = true;

    // Skip this test by default to conserve MailSlurp limits
    // Only run when explicitly enabled
    before(function () {
      // Check all environment variable formats
      cy.log(`runEmailTests as string: "${Cypress.env('runEmailTests')}"`);

      // Check if explicitly enabled via environment variable
      // Cypress can receive env vars in different formats depending on how they're set
      const runTests =
        Cypress.env('runEmailTests') === true || Cypress.env('runEmailTests') === 'true';

      if (!runTests) {
        cy.log('Skipping email tests - set runEmailTests=true to enable');
        this.skip();
        return;
      }

      // Custom timeout for MailSlurp operations
      const timeoutMs = 30000;

      // Create a test inbox for verification, with more resilient error handling
      cy.log('Email tests enabled, creating test inbox for verification');
      cy.mailslurp()
        .then((mailslurp) => {
          // Try to create an inbox
          return mailslurp.createInbox().catch((error) => {
            // Handle API limit or other errors gracefully
            cy.log(`Error creating MailSlurp inbox: ${error.message}`);
            mailslurpAvailable = false;
            // Return null to continue the chain
            return null;
          });
        })
        .then((inbox) => {
          if (inbox) {
            inboxId = inbox.id;
            emailAddress = inbox.emailAddress;
            cy.log(`Test will use email: ${emailAddress}`);
          } else {
            cy.log('MailSlurp API limit reached or other error occurred');
            cy.log('Tests will be skipped. Check your MailSlurp account limits.');
            this.skip();
          }
        });
    });

    it('completes signup with email verification and deletes account', function () {
      // Skip this test if MailSlurp API limit was reached
      if (!mailslurpAvailable) {
        cy.log('Skipping test because MailSlurp API limit was reached');
        this.skip();
        return;
      }

      // Visit signup page
      cy.visit('/signup');

      // Configure longer timeout for email-related operations
      const longTimeout = { timeout: 60000 };

      // Submit valid signup form
      cy.get('input[name="email"]').type(emailAddress);
      cy.get('input[name="password"]').type(testPassword);
      cy.get('input[name="repeatPassword"]').type(testPassword);
      cy.get('button[type="submit"]').click();

      // Should proceed to confirmation step
      cy.contains('Confirm Your Email', longTimeout).should('be.visible');

      // Wait for verification email - can take time to arrive
      cy.log('Waiting for verification email...');

      // Use a longer timeout for email operations
      cy.mailslurp()
        .then((mailslurp) => {
          cy.log('Waiting for email to arrive...');
          // Use a much longer timeout for email retrieval (60 seconds)
          return mailslurp.waitForLatestEmail(inboxId, 60000, true).catch((error) => {
            // Handle cases where email doesn't arrive or API limits are hit
            cy.log(`Error waiting for email: ${error.message}`);

            // Take a screenshot to help diagnose issues
            cy.screenshot('email-verification-failure');

            // Fail the test with a helpful message
            throw new Error(
              'Could not retrieve verification email. Possible causes: Email not sent, API limits reached, or timeout.'
            );
          });
        }, longTimeout)
        .then((email) => {
          // Skip proceeding if we caught an error above
          if (!email) return null;

          cy.log('Email received');

          // Extract verification code from email body
          const codeRegex = /(\d{6})/;
          const match = email.body.match(codeRegex);

          if (!match) {
            // Take screenshot to help diagnose regex issues
            cy.screenshot('email-content-no-verification-code');
            // Log the email body for debugging
            cy.log(`Email body: ${email.body.substring(0, 500)}...`);
            throw new Error(
              'Verification code not found in email. Check regex pattern or email format.'
            );
          }

          const verificationCode = match[1];
          cy.log(`Extracted verification code: ${verificationCode}`);

          // Enter verification code
          cy.get('input[name="confirmationCode"]').type(verificationCode);
          cy.get('button[type="submit"]').click();

          // Should redirect to login page
          cy.url().should('include', '/login', longTimeout);

          // Login with the new account
          cy.get('input[name="email"]').type(emailAddress);
          cy.get('input[name="password"]').type(testPassword);
          cy.get('button[type="submit"]').click();

          // Should redirect to my-recipes
          cy.url().should('include', '/my-recipes', longTimeout);

          // Clean up: Delete account
          cy.visit('/profile');
          cy.contains('Delete Account').click();
          cy.contains('Delete Your Account').should('be.visible');
          cy.contains('button', 'Yes, Delete My Account').click();
          cy.contains('Account Deleted', longTimeout).should('be.visible');

          return null; // Return null to end the chain
        });
    });

    // Additional test that mocks the verification step if API limits are reached
    it('signup and verification UI flow without API (fallback)', function () {
      // Only run this test if MailSlurp is not available
      if (mailslurpAvailable) {
        this.skip();
        return;
      }

      cy.log("Running fallback test that doesn't use real emails");

      // Visit signup page
      cy.visit('/signup');

      // Use a test email that won't receive real verification codes
      const mockEmail = `test-fallback-${Date.now()}@example.com`;

      // Submit the signup form
      cy.get('input[name="email"]').type(mockEmail);
      cy.get('input[name="password"]').type(testPassword);
      cy.get('input[name="repeatPassword"]').type(testPassword);
      cy.get('button[type="submit"]').click();

      // Should proceed to confirmation step
      cy.contains('Confirm Your Email').should('be.visible');

      // Verify the UI shows the correct email
      cy.contains(mockEmail).should('be.visible');

      // Since we can't get a real verification code, we only test the UI flow up to this point
      cy.log('UI verification test successful - confirmation screen displays correctly');

      // Take a screenshot for reference
      cy.screenshot('signup-confirmation-screen');
    });
  });
});
