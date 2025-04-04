import * as fs from 'fs';
import * as path from 'path';
import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';
import { htmlCapture } from './html-capture';
import { domInspector } from './dom-inspector';

// Extended Page class with Claude-specific helpers
export class ClaudePage {
  constructor(public page: Page) {}

  /**
   * Captures the current HTML state of the page
   */
  async captureHtml(name: string, options: Record<string, unknown> = {}) {
    return await htmlCapture.capture(this.page, name, options);
  }

  /**
   * Inspects a DOM element and generates a detailed report
   */
  async inspectElement(selector: string, options: Record<string, unknown> = {}) {
    return await domInspector.inspectElement(this.page, selector, options);
  }

  /**
   * Waits for network activity to settle
   */
  async waitForNetworkIdle(options: { timeout?: number } = {}) {
    await this.page.waitForLoadState('networkidle', { timeout: options.timeout || 5000 });
  }

  /**
   * Waits until there are no visible spinners or loading indicators
   */
  async waitForLoadingComplete(options: { timeout?: number } = {}) {
    const timeout = options.timeout || 10000;
    try {
      // Wait for common loading indicators to disappear
      // Adjust selectors based on your application's loading indicators
      await this.page.waitForSelector('.loading-spinner', { state: 'detached', timeout });
      await this.page.waitForSelector('.skeleton-loader', { state: 'detached', timeout });
      await this.page.waitForSelector('[role="progressbar"]', { state: 'detached', timeout });
    }
    catch {
      // It's okay if the selectors don't exist
    }
  }

  /**
   * Evaluates accessibility of the current page and saves a report
   */
  async checkAccessibility(name: string) {
    const outputDir = path.resolve(process.cwd(), 'test-artifacts/accessibility');
    fs.mkdirSync(outputDir, { recursive: true });

    const cleanName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${cleanName}_${timestamp}.json`;

    const results = await this.page.evaluate(() => {
      // Basic accessibility checks that can run in the browser
      const issues = [];

      // Check for images without alt text
      document.querySelectorAll('img').forEach((img) => {
        if (!img.hasAttribute('alt')) {
          issues.push({
            type: 'missing-alt',
            element: img.outerHTML,
            suggestion: 'Add alt text to image',
          });
        }
      });

      // Check for form inputs without labels
      document.querySelectorAll('input, select, textarea').forEach((input) => {
        const id = input.id;
        if (id) {
          const hasLabel = document.querySelector(`label[for="${id}"]`);
          if (!hasLabel) {
            issues.push({
              type: 'missing-label',
              element: input.outerHTML,
              suggestion: 'Add label for form control',
            });
          }
        }
        else {
          // No ID to associate a label with
          const isWrappedInLabel = input.closest('label');
          if (!isWrappedInLabel) {
            issues.push({
              type: 'missing-label-association',
              element: input.outerHTML,
              suggestion: 'Add id to input and associate a label',
            });
          }
        }
      });

      // Check for buttons without accessible names
      document.querySelectorAll('button, [role="button"]').forEach((button) => {
        const hasText = button.textContent?.trim();
        const hasAriaLabel = button.getAttribute('aria-label');

        if (!hasText && !hasAriaLabel) {
          issues.push({
            type: 'button-no-name',
            element: button.outerHTML,
            suggestion: 'Add text content or aria-label to button',
          });
        }
      });

      // Check for proper heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let lastLevel = 0;

      headings.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1));

        if (lastLevel === 0 && level > 1) {
          issues.push({
            type: 'heading-hierarchy',
            element: heading.outerHTML,
            suggestion: 'Page should start with an h1',
          });
        }
        else if (level > lastLevel + 1) {
          issues.push({
            type: 'heading-hierarchy',
            element: heading.outerHTML,
            suggestion: `Heading level jumps from h${lastLevel} to h${level}`,
          });
        }

        lastLevel = level;
      });

      // Check for low contrast (simplified check)
      const contrastThreshold = 4.5; // WCAG AA standard

      const getContrastRatio = (color1: string, color2: string) => {
        // Simple contrast check - a real implementation would be more complex
        const parseColor = (color: string) => {
          const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
          if (rgbMatch) {
            return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
          }

          // Handle hex colors
          const hexMatch = color.match(/#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i);
          if (hexMatch) {
            return [
              parseInt(hexMatch[1], 16),
              parseInt(hexMatch[2], 16),
              parseInt(hexMatch[3], 16),
            ];
          }

          return [0, 0, 0]; // Default to black if parsing fails
        };

        const getLuminance = (rgb: number[]) => {
          const [r, g, b] = rgb.map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });

          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };

        const l1 = getLuminance(parseColor(color1));
        const l2 = getLuminance(parseColor(color2));

        // Calculate contrast ratio
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        return ratio;
      };

      // Check text elements for contrast issues (simplified)
      document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6').forEach((el) => {
        const style = window.getComputedStyle(el);
        const textColor = style.color;
        const bgColor = style.backgroundColor;

        // Only check if background color is set on the element
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
          const ratio = getContrastRatio(textColor, bgColor);

          if (ratio < contrastThreshold) {
            issues.push({
              type: 'contrast',
              element: el.outerHTML,
              values: { textColor, bgColor, ratio },
              suggestion: 'Increase contrast between text and background',
            });
          }
        }
      });

      return {
        url: window.location.href,
        timestamp: new Date().toISOString(),
        issueCount: issues.length,
        issues,
        summary: issues.length === 0 ? 'No accessibility issues detected' : 'Accessibility issues found',
      };
    });

    // Save results
    fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(results, null, 2));
    console.log(`✅ Accessibility check saved: ${path.join(outputDir, filename)}`);
  }

  /**
   * Generates a test report with HTML capture and screenshot
   */
  async reportTestState(name: string) {
    await this.captureHtml(name, { screenshot: true });
    await this.checkAccessibility(name);
  }
}

// Create a custom test fixture that extends Playwright's test
export const claudeTest = base.extend({
  // Add our custom page implementation
  claudePage: async ({ page }, use) => {
    const claudePage = new ClaudePage(page);
    await use(claudePage);

    // After all tests, generate a report
    htmlCapture.generateReport();
  },
});

export { htmlCapture, domInspector };
