import { test, expect } from '@playwright/test';
import { SignupPage } from './page-objects/SignupPage';
import { LoginPage } from './page-objects/LoginPage';

/**
 * Signup Page Tests
 * 
 * These tests verify the core functionality of the signup page:
 * - Basic page loading
 * - Navigation to related pages
 * - Form validation
 * - UI elements presence
 */
test.describe('Signup Page', () => {
  let signupPage: SignupPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    signupPage = new SignupPage(page);
    loginPage = new LoginPage(page);
  });

  test('should load signup page correctly', async () => {
    await signupPage.goto();
    await signupPage.expectPageLoaded();
  });

  test('should navigate to login page when clicking Sign In link', async () => {
    await signupPage.goto();
    
    // Capture state before navigation attempt
    await signupPage.captureDOMState('before-signin-navigation');
    
    const loginPage = await signupPage.clickSignIn();
    
    // Capture state after navigation
    await signupPage.captureDOMState('after-signin-navigation');
    
    // Verify URL changed to login
    expect(signupPage.page.url()).toContain('/login');
    
    // Verify login page loaded
    await loginPage.expectPageLoaded();
  });

  test('should navigate to terms page when clicking Terms of Service link', async () => {
    await signupPage.goto();
    
    // Capture state before navigation attempt
    await signupPage.captureDOMState('before-terms-navigation');
    
    await signupPage.clickTermsOfService();
    
    // Capture state after navigation
    await signupPage.captureDOMState('after-terms-navigation');
    
    // Verify URL contains terms (allowing for different paths)
    const currentUrl = signupPage.page.url();
    
    // Success if:
    // 1. URL contains /terms
    // 2. OR page contains "Terms of Service" heading
    if (!currentUrl.includes('/terms')) {
      // Fallback: check for Terms of Service content on the page
      const hasTermsHeading = await signupPage.page.getByRole('heading', { name: /terms/i, exact: false }).count() > 0;
      expect(hasTermsHeading).toBeTruthy();
    } else {
      expect(currentUrl).toContain('/terms');
    }
  });

  test('should show validation errors with empty form submission', async () => {
    await signupPage.goto();
    
    // Capture initial state
    await signupPage.captureDOMState('empty-form-initial');
    
    // Submit empty form by clicking the submit button directly
    await signupPage.click(signupPage.submitButton);
    
    // Wait a moment for validation to appear
    await signupPage.page.waitForTimeout(500);
    
    // Capture state after form submission to see validation errors
    await signupPage.captureDOMState('empty-form-validation-errors');
    
    // Check for validation messages - gets all error elements
    const errorElements = await signupPage.page.locator('p:has-text("required"), .text-red-500, .error, [role="alert"], [aria-invalid="true"]').all();
    
    // Capture DOM if no errors are found (helpful for debugging)
    if (errorElements.length === 0) {
      await signupPage.captureDOMState('no-validation-errors-found');
    }
    
    // Check if we found any error elements
    expect(errorElements.length).toBeGreaterThan(0);
  });

  test('should show validation error with invalid email format', async () => {
    await signupPage.goto();
    
    // Fill form with invalid email and capture after each step
    await signupPage.fillInput(signupPage.emailInput, 'not-an-email', 'invalid-email');
    await signupPage.fillInput(signupPage.passwordInput, 'Password1!', 'password');
    await signupPage.fillInput(signupPage.repeatPasswordInput, 'Password1!', 'repeat-password');
    
    // Capture before submission
    await signupPage.captureDOMState('before-invalid-email-submission');
    
    await signupPage.click(signupPage.submitButton);
    
    // Capture after submission to see validation errors
    await signupPage.captureDOMState('invalid-email-validation-error');
    
    // Check for email validation error (using more robust selector)
    const emailError = await signupPage.page.getByText(/valid email|email invalid/i, { exact: false }).count();
    expect(emailError).toBeGreaterThan(0);
  });

  test('should show validation error with password mismatch', async () => {
    await signupPage.goto();
    
    // Fill form with mismatched passwords and capture after each step
    await signupPage.fillInput(signupPage.emailInput, 'test@example.com', 'email');
    await signupPage.fillInput(signupPage.passwordInput, 'Password1!', 'password');
    await signupPage.fillInput(signupPage.repeatPasswordInput, 'DifferentPassword1!', 'different-password');
    
    // Capture before submission
    await signupPage.captureDOMState('before-password-mismatch-submission');
    
    await signupPage.click(signupPage.submitButton);
    
    // Capture after submission to see validation errors
    await signupPage.captureDOMState('password-mismatch-validation-error');
    
    // Check for password mismatch error (using more robust selector)
    const passwordError = await signupPage.page.getByText(/match|must match/i, { exact: false }).count();
    expect(passwordError).toBeGreaterThan(0);
  });
  
  test('should show validation error with weak password', async () => {
    await signupPage.goto();
    
    // Fill form with weak password and capture after each step
    await signupPage.fillInput(signupPage.emailInput, 'test@example.com', 'email');
    await signupPage.fillInput(signupPage.passwordInput, 'password', 'weak-password');
    await signupPage.fillInput(signupPage.repeatPasswordInput, 'password', 'repeat-weak-password');
    
    // Capture before submission
    await signupPage.captureDOMState('before-weak-password-submission');
    
    await signupPage.click(signupPage.submitButton);
    
    // Capture after submission to see validation errors
    await signupPage.captureDOMState('weak-password-validation-error');
    
    // Check for password strength errors (using more robust selector)
    const strengthErrors = await signupPage.page.getByText(/uppercase|number|special|at least/i, { exact: false }).count();
    expect(strengthErrors).toBeGreaterThan(0);
  });

  test('should see Google signup button', async () => {
    await signupPage.goto();
    
    // Capture state to verify Google button presence
    await signupPage.captureDOMState('google-signup-button-verification');
    
    // Verify Google signup button is present
    await signupPage.expectVisible(signupPage.googleSignupButton);
  });
});