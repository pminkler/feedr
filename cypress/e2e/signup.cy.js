// cypress/e2e/signup.cy.js
import * as fs from 'fs';
import * as path from 'path';

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

// Helper function to check when the last test run was
function shouldRunEmailVerificationTest() {
  // Read from environment variable first (explicit user request)
  if (Cypress.env('runEmailTests') === 'true') {
    return true;
  }
  
  // State file path
  const stateFilePath = path.join(Cypress.config('projectRoot'), 'cypress', 'mailslurp-state.json');
  
  try {
    // Check if state file exists
    if (fs.existsSync(stateFilePath)) {
      const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
      const lastRun = state.lastRun ? new Date(state.lastRun) : null;
      const now = new Date();
      
      // If we've never run it, or it's been more than 7 days, run it
      if (!lastRun || ((now - lastRun) > 7 * 24 * 60 * 60 * 1000)) {
        // Update the state file with current time
        fs.writeFileSync(stateFilePath, JSON.stringify({ lastRun: now.toISOString() }, null, 2));
        return true;
      }
      
      // Otherwise skip it
      return false;
    } else {
      // If state file doesn't exist, create it and run the tests
      fs.writeFileSync(stateFilePath, JSON.stringify({ lastRun: new Date().toISOString() }, null, 2));
      return true;
    }
  } catch (error) {
    // If there's any error reading/writing the file, default to the environment variable
    console.error('Error handling mailslurp state file:', error);
    return Cypress.env('runEmailTests') === 'true';
  }
}

// Separate test suite for email verification
describe('Signup Flow - Email Verification', {
  // Dynamically determine if we should skip based on last run time
  skip: !shouldRunEmailVerificationTest()
}, () => {
  let inboxId;
  let emailAddress;
  const testPassword = 'TestPassword123!';

  before(function() {
    // Create a MailSlurp inbox for testing
    cy.log('Creating MailSlurp inbox');
    
    // Use a longer timeout for inbox creation
    const timeout = 30000;
    Cypress.config('defaultCommandTimeout', timeout);
    
    return cy
      .mailslurp()
      .then(mailslurp => {
        return mailslurp.createInbox();
      })
      .then(inbox => {
        inboxId = inbox.id;
        emailAddress = inbox.emailAddress;
        cy.log(`Test will use email: ${emailAddress}`);
      });
  });

  it('completes signup with email verification and deletes account', function() {
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