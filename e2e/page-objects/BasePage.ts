import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import type { DOMCapture } from '../utils/dom-capture';
import { createDOMCapture } from '../utils/dom-capture';

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
   * Click a button or link
   * @param locator The button or link locator
   */
  async click(locator: Locator) {
    await locator.click();
  }

  /**
   * Captures the current DOM state to aid in Page Object Model development
   * This method is intended for test development and debugging only
   *
   * @param prefix Prefix for the output files (will be saved to dom-captures directory)
   * @example
   * // Capture the edit recipe form DOM and test IDs
   * await recipePage.captureDOMState('edit-recipe-form');
   */
  async captureDOMState(prefix: string): Promise<void> {
    await this.domCapture.captureDOMState(prefix);
  }
}
