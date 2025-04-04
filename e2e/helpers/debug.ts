// e2e/helpers/debug.ts
import type { Page, TestInfo } from '@playwright/test';

/**
 * Captures HTML content around a selector for debugging
 * @param page The Playwright page object
 * @param testInfo The TestInfo object (from test.info())
 * @param selector Optional selector to highlight in the HTML
 * @param description Optional description of what you're trying to debug
 */
export async function captureHtml(
  page: Page,
  testInfo: TestInfo,
  selector?: string,
  description?: string,
) {
  // Get the full page HTML
  const html = await page.content();

  // Create an attachment with the full HTML
  await testInfo.attach(
    `html-debug-${Date.now()}.html`,
    { body: html, contentType: 'text/html' },
  );

  if (selector) {
    try {
      // Try to get information about the element matching the selector
      const elementInfo = await page.evaluate((sel) => {
        const elements = document.querySelectorAll(sel);

        if (elements.length === 0) {
          return { found: false, message: `No elements match selector: ${sel}` };
        }

        // Get info about matched elements
        const elementsInfo = Array.from(elements).map((el, index) => {
          const rect = el.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          const isInViewport
            = rect.top >= 0 && rect.left >= 0
              && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;

          return {
            index,
            tagName: el.tagName.toLowerCase(),
            id: el.id,
            classList: Array.from(el.classList),
            attributes: Array.from(el.attributes).reduce<Record<string, string>>((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {}),
            textContent: el.textContent?.trim().substring(0, 100),
            isVisible,
            isInViewport,
            dimensions: {
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left,
            },
            html: el.outerHTML,
          };
        });

        return {
          found: true,
          count: elements.length,
          elements: elementsInfo,
        };
      }, selector);

      // Attach the element info as JSON
      await testInfo.attach(
        `element-info-${Date.now()}.json`,
        {
          body: JSON.stringify(elementInfo, null, 2),
          contentType: 'application/json',
        },
      );

      // Create a more readable text version
      let report = `DEBUG: ${description || 'Element inspection'}\n`;
      report += `Selector: ${selector}\n\n`;

      if (elementInfo.found) {
        report += `Found ${elementInfo.count} matching elements:\n\n`;

        elementInfo.elements?.forEach((el, i) => {
          report += `--- Element #${i} ---\n`;
          report += `Tag: ${el.tagName}${el.id ? ' #' + el.id : ''}\n`;
          report += `Classes: ${el.classList.join(', ')}\n`;
          report += `Visible: ${el.isVisible ? 'Yes' : 'No'}\n`;
          report += `In Viewport: ${el.isInViewport ? 'Yes' : 'No'}\n`;
          report += `Dimensions: ${el.dimensions.width}x${el.dimensions.height} @ (${el.dimensions.left},${el.dimensions.top})\n`;
          report += `Text: ${el.textContent || '(empty)'}\n`;
          report += `HTML: ${el.html.substring(0, 300)}${el.html.length > 300 ? '...' : ''}\n\n`;
        });
      }
      else {
        report += `${elementInfo.message}\n\n`;
        report += `Suggestions:\n`;
        report += `- Check if the selector is correct\n`;
        report += `- Verify the element exists in the page\n`;
        report += `- Check if the element is inside an iframe\n`;
        report += `- Try using a wait statement before accessing the element\n`;
      }

      // Attach the readable report
      await testInfo.attach(
        `element-report-${Date.now()}.txt`,
        {
          body: report,
          contentType: 'text/plain',
        },
      );
    }
    catch (error) {
      // If we fail to evaluate the selector, just log the error
      console.error(`Failed to get element info for selector "${selector}":`, error);

      // Attach error information
      await testInfo.attach(
        `element-error-${Date.now()}.txt`,
        {
          body: `Error getting element info for "${selector}":\n${error}`,
          contentType: 'text/plain',
        },
      );
    }
  }
}

/**
 * Sets up error handling to automatically capture HTML on failures
 * @param page The Playwright page object
 * @param testInfo The TestInfo object (from test.info())
 */
export function setupDebugHelpers(page: Page, testInfo: TestInfo) {
  // Listen for console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      testInfo.attach(
        `console-error-${Date.now()}.txt`,
        {
          body: `Page console error: ${msg.text()}`,
          contentType: 'text/plain',
        },
      );
    }
  });

  // Listen for page errors
  page.on('pageerror', (error) => {
    testInfo.attach(
      `page-error-${Date.now()}.txt`,
      {
        body: `Page error: ${error.message}\n${error.stack || ''}`,
        contentType: 'text/plain',
      },
    );
  });
}

/**
 * A helper function to click elements that might be covered by overlays
 * @param page The Playwright page
 * @param selector Selector for the element to click
 */
export async function safeClick(page: Page, selector: string) {
  try {
    // Try regular click first
    await page.click(selector);
  }
  catch {
    console.log(`Regular click failed, trying JavaScript click for ${selector}`);

    // If that fails, try JavaScript click
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        (element as HTMLElement).click();
      }
      else {
        throw new Error(`Element not found: ${sel}`);
      }
    }, selector);
  }
}
