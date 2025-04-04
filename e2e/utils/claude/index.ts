import { claudeTest, ClaudePage, htmlCapture, domInspector } from './test-helper';

// Export all our Claude-specific tools
export {
  claudeTest,
  ClaudePage,
  htmlCapture,
  domInspector,
};

/**
 * Helper functions to be used in tests
 */

/**
 * Adds a command to capture HTML at specific points
 */
export function captureHtml(page, name, options = {}) {
  return htmlCapture.capture(page, name, options);
}

/**
 * Inspects an element and provides detailed information for testing
 */
export function inspectElement(page, selector, options = {}) {
  return domInspector.inspectElement(page, selector, options);
}

/**
 * Creates a snapshot report documenting the current state
 */
export function createTestReport(page, name) {
  return new ClaudePage(page).reportTestState(name);
}

/**
 * Utility function that logs available Playwright selectors for an element
 */
export async function suggestSelectors(page, selector) {
  return await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (!element) return { error: `Element not found: ${selector}` };

    const suggestions = [];

    // ID-based selector
    if (element.id) {
      suggestions.push({
        type: 'id',
        code: `page.locator('#${element.id}')`,
      });
    }

    // Role-based selector
    const role = element.getAttribute('role');
    if (role) {
      const name = element.textContent?.trim();
      if (name) {
        suggestions.push({
          type: 'role-with-name',
          code: `page.getByRole('${role}', { name: '${name}' })`,
        });
      }
      else {
        suggestions.push({
          type: 'role',
          code: `page.getByRole('${role}')`,
        });
      }
    }

    // Text-based selector
    const text = element.textContent?.trim();
    if (text) {
      suggestions.push({
        type: 'text',
        code: `page.getByText('${text}')`,
      });
    }

    // Placeholder-based selector (for inputs)
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) {
      suggestions.push({
        type: 'placeholder',
        code: `page.getByPlaceholder('${placeholder}')`,
      });
    }

    // Test ID selector
    const testId = element.getAttribute('data-testid');
    if (testId) {
      suggestions.push({
        type: 'testid',
        code: `page.getByTestId('${testId}')`,
      });
    }

    // Label-based selector (for form controls)
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)) {
      if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) {
          suggestions.push({
            type: 'label',
            code: `page.getByLabel('${label.textContent?.trim()}')`,
          });
        }
      }
    }

    return {
      element: {
        tagName: element.tagName.toLowerCase(),
        id: element.id || undefined,
        className: element.className || undefined,
        textContent: text || undefined,
      },
      suggestions,
    };
  }, selector);
}
