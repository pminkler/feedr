// cypress/e2e/signup.cy.js

describe('Signup Flow - Form Validation', () => {
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

// Separate test suite for email verification
describe('Signup Flow - Email Verification', () => {
  // These tests will only run when explicitly enabled or when auto-determined based on API usage
  const testPassword = 'TestPassword123!';
  let shouldRunTests = false;
  let inboxId;
  let emailAddress;
  
  // Define test tracker inbox constants - helps limit API usage
  const TRACKER_INBOX_NAME = 'feedr-test-tracker';
  const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
  
  before(function() {
    // Check if explicitly enabled via environment variable
    if (Cypress.env('runEmailTests') === 'true') {
      shouldRunTests = true;
      cy.log('Email tests explicitly enabled via environment variable');
    } else {
      // Check when the last test was run using MailSlurp's API
      cy.log('Checking when the last email test was run...');
      
      // Use a tracker inbox to check when we last ran tests
      cy.mailslurp()
        .then(mailslurp => {
          // First try to get existing tracker inbox
          return mailslurp.getInboxByName(TRACKER_INBOX_NAME)
            .catch(() => {
              // If it doesn't exist, create it
              cy.log('Creating test tracker inbox');
              return mailslurp.createInbox({ name: TRACKER_INBOX_NAME });
            });
        })
        .then(inbox => {
          // Get most recent email in the tracker inbox
          cy.mailslurp()
            .then(mailslurp => {
              // This gets the latest email - if no emails exist, it'll throw an error
              return mailslurp.getEmails(inbox.id, { limit: 1 })
                .catch(() => {
                  // No emails found - we should run the test
                  cy.log('No previous test run detected');
                  shouldRunTests = true;
                  return [];
                });
            })
            .then(emails => {
              if (emails.length > 0) {
                const lastEmailDate = new Date(emails[0].createdAt);
                const now = new Date();
                const timeSinceLastRun = now - lastEmailDate;
                
                // If it's been more than a week, run the tests
                if (timeSinceLastRun > WEEK_IN_MS) {
                  shouldRunTests = true;
                  cy.log(`Last test run was ${timeSinceLastRun/WEEK_IN_MS.toFixed(1)} weeks ago`);
                } else {
                  cy.log(`Skipping email tests (last run ${(timeSinceLastRun/(24*60*60*1000)).toFixed(1)} days ago)`);
                }
              } else {
                // No emails - this is our first run
                shouldRunTests = true;
              }
              
              // If we should run tests, create our test inbox now
              if (shouldRunTests) {
                cy.log('Creating test inbox for verification');
                return cy.mailslurp()
                  .then(mailslurp => {
                    return mailslurp.createInbox();
                  })
                  .then(testInbox => {
                    inboxId = testInbox.id;
                    emailAddress = testInbox.emailAddress;
                    cy.log(`Test will use email: ${emailAddress}`);
                  });
              } else {
                // Skip these tests
                this.skip();
              }
            });
        });
    }
  });
  
  after(function() {
    // If we ran the tests, send a tracking email
    if (shouldRunTests) {
      cy.log('Sending test completion tracker email');
      cy.mailslurp()
        .then(mailslurp => {
          // Get tracker inbox
          return mailslurp.getInboxByName(TRACKER_INBOX_NAME)
            .then(inbox => {
              // Send a simple email to track when this test was last run
              return mailslurp.sendEmail(inbox.id, {
                to: [inbox.emailAddress],
                subject: 'Signup Test Completion',
                body: `Signup tests run at ${new Date().toISOString()}`
              });
            });
        });
    }
  });

  it('completes signup with email verification and deletes account', function() {
    // Skip this test if shouldRunTests is false
    if (!shouldRunTests) {
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
      .then(mailslurp => {
        cy.log('Waiting for email to arrive...');
        // Use a much longer timeout for email retrieval (60 seconds)
        return mailslurp.waitForLatestEmail(inboxId, 60000, true);
      }, longTimeout)
      .then(email => {
        cy.log('Email received');
        
        // Extract verification code from email body
        const codeRegex = /(\d{6})/;
        const match = email.body.match(codeRegex);
        
        if (!match) {
          throw new Error('Verification code not found in email');
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
      });
  });
});