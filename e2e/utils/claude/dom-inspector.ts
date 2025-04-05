import * as fs from 'fs';
import * as path from 'path';
import type { Page } from '@playwright/test';
import { debugLog } from './setup';

export class DomInspector {
  /**
   * Generates a detailed report about the element matching the selector
   */
  async inspectElement(
    page: Page,
    selector: string,
    options: {
      outputDir?: string;
      name?: string;
      includeChildren?: boolean;
      maxChildDepth?: number;
    } = {},
  ): Promise<void> {
    const outputDir = options.outputDir || path.resolve(process.cwd(), 'test-artifacts/dom-inspector');
    fs.mkdirSync(outputDir, { recursive: true });

    const name = options.name || 'element-inspection';
    const cleanName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${cleanName}_${timestamp}.json`;

    try {
      // Get detailed information about the element
      const elementInfo = await page.evaluate((selector, includeChildren, maxChildDepth = 2) => {
        const elements = document.querySelectorAll(selector);
        if (!elements || elements.length === 0) {
          return { error: `No elements found matching selector: ${selector}` };
        }

        const results = Array.from(elements).map((element, index) => {
          // Basic element properties
          const tagName = element.tagName.toLowerCase();
          const id = element.id;
          const classList = Array.from(element.classList);
          const attributes = {};
          Array.from(element.attributes).forEach((attr) => {
            attributes[attr.name] = attr.value;
          });

          // Computed styles
          const computedStyle = window.getComputedStyle(element);
          const styles = {
            position: computedStyle.position,
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            zIndex: computedStyle.zIndex,
            width: computedStyle.width,
            height: computedStyle.height,
            color: computedStyle.color,
            backgroundColor: computedStyle.backgroundColor,
            boxShadow: computedStyle.boxShadow,
            overflow: computedStyle.overflow,
          };

          // Bounding box and position information
          const rect = element.getBoundingClientRect();
          const boundingBox = {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
          };

          // Visibility checks
          const isVisible = (() => {
            // Element has dimensions
            if (rect.width === 0 || rect.height === 0) return false;

            // Check computed styles
            if (computedStyle.display === 'none') return false;
            if (computedStyle.visibility === 'hidden') return false;
            if (parseFloat(computedStyle.opacity) === 0) return false;

            // Check if element is actually in viewport
            const viewport = {
              width: window.innerWidth,
              height: window.innerHeight,
            };

            // Simplified check - a proper implementation would check if any part is in viewport
            const isInViewport = !(
              rect.bottom < 0
              || rect.top > viewport.height
              || rect.right < 0
              || rect.left > viewport.width
            );

            return isInViewport;
          })();

          // Text content
          const textContent = element.textContent?.trim() || '';
          const innerText = 'innerText' in element ? element.innerText.trim() : '';

          // Accessibility information
          const role = element.getAttribute('role');
          const ariaLabel = element.getAttribute('aria-label');
          const ariaExpanded = element.getAttribute('aria-expanded');
          const ariaHidden = element.getAttribute('aria-hidden');

          // Element state
          const isDisabled = element.hasAttribute('disabled');
          const isReadOnly = element.hasAttribute('readonly');
          const isChecked = 'checked' in element ? element.checked : undefined;

          // Form-specific properties
          const value = 'value' in element ? element.value : undefined;
          const isRequired = 'required' in element ? element.required : undefined;
          const placeholder = element.getAttribute('placeholder');

          // Interactive element properties
          const hasClickHandler = element.onclick !== null || element.getAttribute('onClick') !== null;

          // Inspect children if requested
          const children = [];

          if (includeChildren && maxChildDepth > 0) {
            const childElements = element.children;
            if (childElements.length > 0) {
              // Recursive function to get child data with depth limit
              const getChildInfo = (el, depth) => {
                if (depth <= 0) return { tagName: el.tagName.toLowerCase(), truncated: true };

                const childInfo = {
                  tagName: el.tagName.toLowerCase(),
                  id: el.id || undefined,
                  classList: Array.from(el.classList),
                  textContent: el.textContent?.trim() || undefined,
                  attributes: {},
                  children: [],
                };

                // Add attributes
                Array.from(el.attributes).forEach((attr) => {
                  childInfo.attributes[attr.name] = attr.value;
                });

                // Add children (with reduced depth)
                if (depth > 1) {
                  Array.from(el.children).forEach((childEl) => {
                    childInfo.children.push(getChildInfo(childEl, depth - 1));
                  });
                }

                return childInfo;
              };

              // Get information for each direct child
              Array.from(childElements).forEach((child) => {
                children.push(getChildInfo(child, maxChildDepth));
              });
            }
          }

          // Get selector paths to the element
          const getSelectors = (el) => {
            // ID selector (most specific)
            if (el.id) {
              return `#${el.id}`;
            }

            // Class-based selector (if unique enough)
            if (el.classList.length > 0) {
              const classSelector = '.' + Array.from(el.classList).join('.');
              if (document.querySelectorAll(classSelector).length === 1) {
                return classSelector;
              }
            }

            // Generate a more specific selector based on tag and attributes
            let specificSelector = el.tagName.toLowerCase();

            // Add text-based selector for buttons, links, etc.
            if (['BUTTON', 'A', 'LABEL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
              const text = el.textContent?.trim();
              if (text) {
                specificSelector += `:has-text("${text}")`;
              }
            }

            // Add common attribute selectors
            ['name', 'type', 'data-test', 'data-testid', 'placeholder'].forEach((attr) => {
              const value = el.getAttribute(attr);
              if (value) {
                specificSelector += `[${attr}="${value}"]`;
              }
            });

            return specificSelector;
          };

          // Generate multiple selector options
          const selectors = {
            basic: getSelectors(element),
            role: role ? `[role="${role}"]` : undefined,
            testid: element.getAttribute('data-testid') ? `[data-testid="${element.getAttribute('data-testid')}"]` : undefined,
            text: textContent ? `:text("${textContent}")` : undefined,
          };

          // Create summary of best selector strategy for Playwright
          const playwrightSelectors = [];

          // ID selector is usually most reliable
          if (id) {
            playwrightSelectors.push(`page.locator('#${id}')`);
          }

          // Role is good for accessibility-friendly selection
          if (role) {
            if (innerText) {
              playwrightSelectors.push(`page.getByRole('${role}', { name: '${innerText}' })`);
            }
            else {
              playwrightSelectors.push(`page.getByRole('${role}')`);
            }
          }

          // Text-based selectors
          if (innerText) {
            playwrightSelectors.push(`page.getByText('${innerText}')`);
          }

          // Placeholder for inputs
          if (placeholder) {
            playwrightSelectors.push(`page.getByPlaceholder('${placeholder}')`);
          }

          // Label for form fields
          if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
            playwrightSelectors.push(`page.getByLabel('...')`);
          }

          // Test ID selector
          if (element.getAttribute('data-testid')) {
            playwrightSelectors.push(`page.getByTestId('${element.getAttribute('data-testid')}')`);
          }

          return {
            index,
            tagName,
            id,
            classList,
            attributes,
            styles,
            boundingBox,
            isVisible,
            textContent,
            innerText,
            accessibility: {
              role,
              ariaLabel,
              ariaExpanded,
              ariaHidden,
            },
            state: {
              isDisabled,
              isReadOnly,
              isChecked,
              isRequired,
            },
            formProperties: {
              value,
              placeholder,
            },
            interactivity: {
              hasClickHandler,
            },
            selectors,
            playwrightSelectors,
            children: includeChildren ? children : undefined,
          };
        });

        return {
          selector,
          count: elements.length,
          elements: results,
        };
      }, selector, options.includeChildren, options.maxChildDepth);

      // Write the element info to a file
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(elementInfo, null, 2));

      debugLog(`✅ DOM Inspector report saved: ${filePath}`);

      // Also log some useful information to the console
      if (elementInfo.elements) {
        for (const el of elementInfo.elements) {
          debugLog(`\nInspected Element: ${el.tagName}${el.id ? `#${el.id}` : ''}`);
          debugLog(`Visibility: ${el.isVisible ? '✅ Visible' : '❌ Not Visible'}`);
          debugLog('Recommended Playwright Selectors:');
          for (const selector of el.playwrightSelectors) {
            debugLog(`  ${selector}`);
          }
        }
      }
    }
    catch (error) {
      debugLog(`❌ DOM Inspector failed:`, error);
    }
  }
}

// Create and export singleton instance
export const domInspector = new DomInspector();
