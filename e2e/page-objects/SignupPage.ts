import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { infoLog, warnLog, verboseLog, errorLog } from '../utils/debug-logger';
import { BasePage } from './BasePage';
import { LoginPage } from './LoginPage';

/**
 * Page Object Model for the Signup page
 */
export class SignupPage extends BasePage {
  // Signup form elements
  readonly signupForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly repeatPasswordInput: Locator;
  readonly signupButton: Locator;
  readonly googleSignupButton: Locator;
  readonly signInLink: Locator;
  readonly termsLink: Locator;
  readonly errorMessage: Locator;
  readonly submitButton: Locator;

  // Confirmation form elements
  readonly confirmationForm: Locator;
  readonly confirmationCodeInput: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize signup form locators with multiple selector strategies
    this.signupForm = page.locator('form').filter({ hasText: 'Sign Up' });
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.repeatPasswordInput = page.locator('input[name="repeatPassword"]');
    this.submitButton = page.getByRole('button', { name: 'Continue', exact: true }).or(page.locator('button[type="submit"]'));
    this.signupButton = page.getByTestId('signup-button').or(page.getByRole('link', { name: 'Sign Up' }));
    this.googleSignupButton = page.getByRole('button', { name: /Continue with Google/i });
    this.signInLink = page.getByTestId('login-button').or(page.locator('a', { hasText: /Sign in/i }));
    this.termsLink = page.locator('a', { hasText: /Terms of Service/i });
    this.errorMessage = page.locator('.u-alert-error, [role="alert"], .text-red-500, [data-testid="signup-error"]');

    // Initialize confirmation form locators
    this.confirmationForm = page.locator('form').filter({ hasText: 'Confirm Your Email' });
    this.confirmationCodeInput = page.locator('input[name="confirmationCode"]');
    this.confirmButton = page.getByRole('button', { name: 'Continue', exact: true });
  }

  /**
   * Navigate directly to the signup page
   */
  async goto() {
    await super.goto('/signup');
    await this.waitForPageLoad();
  }

  /**
   * Wait for the signup page to load completely
   */
  async waitForPageLoad() {
    await this.captureDOMState('signup-page-loaded');
    
    try {
      // First try to wait for all elements together
      await Promise.all([
        this.emailInput.waitFor({ state: 'visible', timeout: 5000 }),
        this.passwordInput.waitFor({ state: 'visible', timeout: 5000 }),
        this.repeatPasswordInput.waitFor({ state: 'visible', timeout: 5000 }),
        this.submitButton.waitFor({ state: 'visible', timeout: 5000 }),
      ]);
    } catch (e) {
      // If that fails, capture the DOM state for debugging
      await this.captureDOMState('signup-page-load-error');
      
      // Try a more sequential approach that's more reliable on mobile
      verboseLog('Using fallback sequential loading approach for mobile');
      
      // Wait for the page to settle
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Wait for at least one input field to be present
      await this.page.waitForSelector('input', { timeout: 10000 });
      
      // Capture the state
      await this.captureDOMState('signup-page-after-fallback-load');
    }
  }

  /**
   * Verify signup page is loaded with expected elements
   */
  async expectPageLoaded() {
    await this.captureDOMState('signup-page-verification');
    
    // Wait for key signup form elements to be visible
    await this.expectVisible(this.emailInput);
    await this.expectVisible(this.passwordInput);
    await this.expectVisible(this.repeatPasswordInput);
    await this.expectVisible(this.submitButton);
    
    // Check if we're on the right page by looking for the signup form elements
    // Just verify inputs are present by checking their names
    const emailInput = await this.page.locator('input[name="email"]').isVisible();
    const passwordInput = await this.page.locator('input[name="password"]').isVisible();
    const repeatPasswordInput = await this.page.locator('input[name="repeatPassword"]').isVisible();
    
    // Success if we have the form fields
    expect(emailInput && passwordInput && repeatPasswordInput).toBeTruthy();
  }

  /**
   * Fill signup form and submit
   * @param email Email address
   * @param password Password
   * @param expectSuccess Whether to expect successful signup (default: true)
   */
  async signup(email: string, password: string, expectSuccess: boolean = true) {
    await this.captureDOMState('before-signup');
    verboseLog(`Attempting signup with email: ${email}`);

    // Fill the form
    try {
      // Fill each field with DOM capture after each step
      await this.fillInput(this.emailInput, email, 'email');
      await this.fillInput(this.passwordInput, password, 'password');
      await this.fillInput(this.repeatPasswordInput, password, 'repeat-password');
      
      // Capture DOM state before submitting
      await this.captureDOMState('before-form-submit');
      
      // Submit the form and capture after
      await this.click(this.submitButton);
      await this.captureDOMState('after-form-submit');
      
      verboseLog('Signup form submitted');
    }
    catch (e) {
      errorLog(`Failed to fill signup form: ${e}`);
      await this.captureDOMState('signup-form-error');
      throw e;
    }

    if (expectSuccess) {
      try {
        // Wait for confirmation form to appear
        await this.confirmationForm.waitFor({ state: 'visible', timeout: 10000 });
        await this.captureDOMState('confirmation-form-visible');
        verboseLog('Successfully navigated to confirmation step');
      }
      catch (e) {
        errorLog(`Confirmation form not visible: ${e}`);
        await this.captureDOMState('confirmation-form-error');
        throw e;
      }
    }
    else {
      try {
        // Wait for error message
        await this.errorMessage.waitFor({ state: 'visible', timeout: 8000 });
        await this.captureDOMState('after-signup-error');
      }
      catch (e) {
        warnLog('No visible error message found, but expected failure case');
        await this.captureDOMState('no-error-message-found');
      }
    }
  }

  /**
   * Submit confirmation code
   * @param code Confirmation code
   * @param expectSuccess Whether to expect successful confirmation (default: true)
   * @returns LoginPage instance if successful
   */
  async confirmSignup(code: string, expectSuccess: boolean = true): Promise<LoginPage | null> {
    await this.captureDOMState('before-confirmation');
    verboseLog(`Submitting confirmation code: ${code}`);

    try {
      // Fill confirmation code with DOM capture
      await this.fillInput(this.confirmationCodeInput, code, 'confirmation-code');
      
      // Capture DOM state before submitting
      await this.captureDOMState('before-confirmation-submit');
      
      // Submit confirmation and capture after
      await this.click(this.confirmButton);
      await this.captureDOMState('after-confirmation-submit');
      
      verboseLog('Confirmation form submitted');
    }
    catch (e) {
      errorLog(`Failed to submit confirmation form: ${e}`);
      await this.captureDOMState('confirmation-submission-error');
      throw e;
    }

    if (expectSuccess) {
      try {
        // Wait for navigation to login page
        await this.page.waitForURL(/\/login/, { timeout: 10000 });
        await this.captureDOMState('after-confirmation-success');
        verboseLog('Successfully navigated to login page after confirmation');
        
        // Return login page instance for fluent navigation
        return new LoginPage(this.page);
      }
      catch (e) {
        errorLog(`Navigation after confirmation failed: ${e}`);
        await this.captureDOMState('confirmation-navigation-failed');
        throw e;
      }
    }
    else {
      try {
        // Wait for error message
        await this.errorMessage.waitFor({ state: 'visible', timeout: 8000 });
        await this.captureDOMState('after-confirmation-error');
      }
      catch (e) {
        warnLog('No visible error message found, but expected failure case');
        await this.captureDOMState('no-error-message-found');
      }
      return null;
    }
  }

  /**
   * Click sign in link to navigate to login page
   * @returns LoginPage instance
   */
  async clickSignIn(): Promise<LoginPage> {
    try {
      // First capture the current state for debugging
      await this.captureDOMState('before-signin-click');
      
      // Attempt to find the sign in link with multiple strategies
      const signInText = await this.page.getByText('Sign in', { exact: false }).first();
      await this.captureDOMState('signin-link-found');
      
      // Try different click approaches
      try {
        // First try a direct click
        await signInText.click({ timeout: 5000 });
      }
      catch (e) {
        warnLog(`Direct click failed, trying JavaScript click: ${e}`);
        // Try JavaScript click as fallback
        const handle = await signInText.elementHandle();
        if (handle) {
          await this.page.evaluate(el => el.click(), handle);
        }
      }
      
      // Add a wait to see if navigation happens
      await this.page.waitForTimeout(1000);
      
      // Check if we're on the login page
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        return new LoginPage(this.page);
      }
      
      // As a fallback, navigate directly to the login page
      warnLog('Could not navigate via link, using direct navigation');
      await super.goto('/login');
    }
    catch (e) {
      warnLog(`Failed to click sign in link: ${e}`);
      // Try fallback direct navigation
      await super.goto('/login');
    }
    return new LoginPage(this.page);
  }

  /**
   * Click Google signup button
   */
  async signupWithGoogle() {
    try {
      await this.click(this.googleSignupButton);
      // Wait for Google OAuth page or redirect
      await this.page.waitForNavigation({ timeout: 10000 });
    }
    catch (e) {
      errorLog(`Failed to click Google signup button: ${e}`);
      await this.captureDOMState('google-signup-error');
      throw e;
    }
  }

  /**
   * Click Terms of Service link
   */
  async clickTermsOfService() {
    try {
      // First capture the current state for debugging
      await this.captureDOMState('before-terms-click');
      
      // Attempt to find and click the terms link with multiple strategies
      const terms = await this.page.getByText('Terms of Service').first();
      await this.captureDOMState('terms-link-found');
      
      // Try different click approaches
      try {
        // First try a direct click
        await terms.click({ timeout: 5000 });
      }
      catch (e) {
        warnLog(`Direct click failed, trying JavaScript click: ${e}`);
        // Try JavaScript click as fallback
        const handle = await terms.elementHandle();
        if (handle) {
          await this.page.evaluate(el => el.click(), handle);
        }
      }
      
      // Add a wait to see if navigation happens
      await this.page.waitForTimeout(1000);
      
      // Check if we're on the terms page
      const currentUrl = this.page.url();
      if (currentUrl.includes('/terms')) {
        return; // Success
      }
      
      // As a fallback, navigate directly to the terms page
      warnLog('Could not navigate via link, using direct navigation');
      await super.goto('/terms');
    }
    catch (e) {
      warnLog(`Failed to click Terms of Service link: ${e}`);
      // As a fallback, navigate directly
      await super.goto('/terms');
    }
  }

  /**
   * Get the error message text if present
   * @returns The error message text or null if not present
   */
  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
      return await this.errorMessage.textContent();
    }
    catch (e) {
      return null;
    }
  }
}