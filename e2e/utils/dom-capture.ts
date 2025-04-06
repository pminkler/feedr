import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Page } from '@playwright/test';

// Get the current directory in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DOM capture utility for extracting page structure to aid in POM creation
 * This can be called from any test to capture the current state of the DOM
 */
export class DOMCapture {
  private page: Page;
  private captureDir: string;

  constructor(page: Page) {
    this.page = page;
    this.captureDir = path.join(__dirname, '../../dom-captures');

    // Create the capture directory if it doesn't exist
    if (!fs.existsSync(this.captureDir)) {
      fs.mkdirSync(this.captureDir, { recursive: true });
    }
  }

  /**
   * Capture the current DOM state to files for analysis
   * @param prefix Prefix for the output files (e.g., 'edit-recipe', 'login-form')
   */
  async captureDOMState(prefix: string): Promise<void> {
    console.log(`Capturing DOM state with prefix: ${prefix}`);

    try {
      // Capture the full HTML content
      const htmlContent = await this.page.content();

      // Save the HTML to a file
      const htmlPath = path.join(this.captureDir, `${prefix}-dom.html`);
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`HTML saved to: ${htmlPath}`);

      // Extract all elements with data-testid attributes
      const testIdElements = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('[data-testid]');
        return Array.from(elements).map((el) => {
          return {
            testId: el.getAttribute('data-testid'),
            tagName: el.tagName,
            text: el.textContent?.trim(),
            type: el.getAttribute('type'),
            className: el.className,
            ariaLabel: el.getAttribute('aria-label'),
          };
        });
      });

      // Save the test ID elements to a file
      const testIdsPath = path.join(this.captureDir, `${prefix}-testids.json`);
      fs.writeFileSync(testIdsPath, JSON.stringify(testIdElements, null, 2));
      console.log(`Test IDs saved to: ${testIdsPath}`);

      // Also extract all form elements for convenience
      const formElements = await this.page.evaluate(() => {
        return {
          inputs: Array.from(document.querySelectorAll('input, textarea, select')).map((el) => ({
            id: el.id,
            name: el.getAttribute('name'),
            type: el.getAttribute('type'),
            placeholder: el.getAttribute('placeholder'),
            value: (el as HTMLInputElement).value,
            testId: el.getAttribute('data-testid'),
          })),
          buttons: Array.from(document.querySelectorAll('button')).map((el) => ({
            id: el.id,
            text: el.textContent?.trim(),
            type: el.getAttribute('type'),
            testId: el.getAttribute('data-testid'),
            ariaLabel: el.getAttribute('aria-label'),
          })),
        };
      });

      // Save the form elements to a file
      const formElementsPath = path.join(this.captureDir, `${prefix}-form-elements.json`);
      fs.writeFileSync(formElementsPath, JSON.stringify(formElements, null, 2));
      console.log(`Form elements saved to: ${formElementsPath}`);
    }
    catch (error) {
      console.error('Error capturing DOM state:', error);
    }
  }
}

/**
 * Helper function to create a DOM capture utility for a page
 * @param page Playwright page object
 * @returns DOMCapture instance
 */
export function createDOMCapture(page: Page): DOMCapture {
  return new DOMCapture(page);
}
