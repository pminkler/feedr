import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import type { DOMCapture } from '../utils/dom-capture';
import { createDOMCapture } from '../utils/dom-capture';
import { errorLog, warnLog, verboseLog } from '../utils/debug-logger';

/**
 * Flag to enable/disable DOM captures in tests
 * This is controlled by filename pattern:
 * - Regular .spec.ts files: DOM capture disabled
 * - Development .development.spec.ts files: DOM capture enabled
 */
// DOM captures are enabled/disabled based on environment or filename pattern
export const ENABLE_DOM_CAPTURE = process.env.ENABLE_DOM_CAPTURE === 'true' || 
  (typeof window !== 'undefined' && (window as any).ENABLE_DOM_CAPTURE) || 
  false;

/**
 * Base Page Object Model class
 * Contains common methods and properties that can be shared across all page objects
 */
export class BasePage {
  readonly page: Page;
  readonly baseUrl = 'http://localhost:3000';
  private domCapture: DOMCapture;

  constructor(page: Page) {
    this.page = page;
    this.domCapture = createDOMCapture(page);
  }

  /**
   * Navigate to a specific path
   * @param path The path to navigate to (relative to baseUrl)
   */
  async goto(path: string = '/') {
    await this.page.goto(`${this.baseUrl}${path}`);
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get page title
   * @returns The page title
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Check if an element is visible
   * @param locator The element locator
   */
  async expectVisible(locator: Locator) {
    await expect(locator).toBeVisible();
  }

  /**
   * Fill a text input field
   * @param locator The input field locator
   * @param text The text to fill
   */
  async fillInput(locator: Locator, text: string) {
    await locator.fill(text);
  }

  /**
   * Click a button or link with retry mechanism for better stability
   * @param locator The button or link locator
   * @param maxRetries Maximum number of retries (default: 3)
   * @param timeoutMs Timeout in milliseconds for each attempt (default: 5000)
   */
  async click(locator: Locator, maxRetries = 3, timeoutMs = 5000) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add force:true for WebKit which sometimes has issues with click
        if (attempt === 0) {
          // First try normal click
          await locator.click({ timeout: timeoutMs });
        } else if (attempt === 1) {
          // Second try with force option
          await locator.click({ force: true, timeout: timeoutMs });
          verboseLog(`Clicked with force option (attempt ${attempt + 1})`);
        } else {
          // Additional fallback strategies
          try {
            // Try JavaScript click as last resort
            await this.page.evaluate(el => el.click(), await locator.elementHandle());
            verboseLog(`Clicked using JavaScript (attempt ${attempt + 1})`);
          } catch (jsError) {
            // Final attempt: Try scrolling into view first, then clicking with force
            await locator.scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(300); // Small delay after scrolling
            await locator.click({ force: true, timeout: timeoutMs });
            verboseLog(`Clicked after scrolling into view (attempt ${attempt + 1})`);
          }
        }
        return; // Success, exit the function
      } catch (error) {
        lastError = error;
        verboseLog(`Click attempt ${attempt + 1} failed, ${maxRetries - attempt - 1} retries left`);
        
        // Wait before retrying
        if (attempt < maxRetries - 1) {
          await this.page.waitForTimeout(300 * (attempt + 1)); // Incremental backoff
          
          // Check if element became detached, which can happen during navigation
          try {
            await locator.waitFor({ state: 'attached', timeout: 1000 });
          } catch (detachedError) {
            warnLog('Element became detached, possibly due to navigation');
            return; // Consider click successful if element detached (likely navigation)
          }
        }
      }
    }
    
    // All retries failed
    warnLog(`All ${maxRetries} click attempts failed on ${locator}`);
    throw lastError;
  }

  /**
   * Captures the current DOM state to aid in Page Object Model development
   * This method is intended for test development and debugging only
   * The method will only capture DOM if ENABLE_DOM_CAPTURE is true
   * 
   * In regular tests, this becomes a no-op to prevent unnecessary captures
   *
   * @param prefix Prefix for the output files (will be saved to dom-captures directory)
   * @example
   * // Capture the edit recipe form DOM and test IDs
   * await recipePage.captureDOMState('edit-recipe-form');
   */
  async captureDOMState(prefix: string): Promise<void> {
    // Skip DOM captures in production tests to improve performance
    if (!ENABLE_DOM_CAPTURE) {
      return;
    }
    
    try {
      await this.domCapture.captureDOMState(prefix);
    } catch (e) {
      errorLog(`DOM capture failed for '${prefix}': ${e}`);
    }
  }
}
