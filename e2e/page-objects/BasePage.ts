import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Base Page Object Model class
 * Contains common methods and properties that can be shared across all page objects
 */
export class BasePage {
  readonly page: Page;
  readonly baseUrl = 'http://localhost:3000';

  constructor(page: Page) {
    this.page = page;
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
}
