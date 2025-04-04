// e2e/helpers/debug.ts
import type { Page, TestInfo, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Utility to check for specific form/auth errors and capture details for debugging
 * @param page The Playwright page object
 * @param testInfo The TestInfo object (from test.info())
 * @param errorPatterns Array of regex patterns to check in error messages
 * @param description Description for the debug capture
 * @param selectors Array of selectors to look for errors (defaults to common error selectors)
 * @returns The matched error message or null if no match found
 */
export async function checkAndCaptureError(
  page: Page,
  testInfo: TestInfo,
  errorPatterns: RegExp[],
  description: string,
  selectors?: string[]
): Promise<string | null> {
  // Default selectors that cover most common error message implementations
  const defaultSelectors = [
    '.text-red-500',
    '.text-error',
    '.text-destructive',
    '[role="alert"]',
    '.validation-error',
    '.error-message',
    '[id*="-error"]',
    '[data-test*="error"]',
    '.invalid-feedback',
    '.error',
    '.alert-danger',
    '.toast-error'
  ];

  const errorSelectors = selectors || defaultSelectors;
  const selector = errorSelectors.join(', ');
  
  // Try to find any error message
  const errorElements = await page.locator(selector).all();
  let matchedError: string | null = null;
  
  // Check each error element against our patterns
  for (const element of errorElements) {
    try {
      const text = await element.textContent();
      
      if (!text) continue;
      
      // Check if this error matches any of our patterns
      for (const pattern of errorPatterns) {
        if (pattern.test(text)) {
          console.log(`Found matching error: "${text}"`);
          matchedError = text;
          
          // Highlight and capture this specific error
          await captureHtml(page, testInfo, element, `${description}-error-match`);
          break;
        }
      }
      
      if (matchedError) break;
    } catch (e) {
      // Element might have been detached, just continue
      continue;
    }
  }
  
  // Capture the full page state even if no specific error matched
  await takeDebugSnapshot(page, testInfo, `${description}-page-state`);
  
  return matchedError;
}

/**
 * Enhanced HTML capture function specifically designed for Claude
 * Provides deep visibility into DOM structure with visual cues for Claude's analysis
 * @param page The Playwright page object
 * @param testInfo The TestInfo object (from test.info())
 * @param selector Optional selector to highlight specific elements
 * @param description Optional description for debugging context
 */
export async function captureHtml(
  page: Page,
  testInfo: TestInfo,
  selector?: string,
  description?: string,
) {
  // Create a meaningful name for attachments
  const debugName = `claude-${description ? 
    description.toLowerCase().replace(/[^a-z0-9]/g, '-') : 
    'page-debug'}-${Date.now()}`;
  
  // Get the full page HTML
  const html = await page.content();
  
  // Create an attachment with the full HTML
  await testInfo.attach(
    `${debugName}.html`,
    { body: html, contentType: 'text/html' },
  );
  
  // Always take a screenshot for visual context
  await page.screenshot({
    path: path.join(process.cwd(), 'test-artifacts', `${debugName}.png`),
    fullPage: true
  });
  
  // Attach the screenshot
  await testInfo.attach(
    `${debugName}.png`,
    { path: path.join(process.cwd(), 'test-artifacts', `${debugName}.png`), contentType: 'image/png' },
  );

  // If a selector is provided, enhance debugging for those elements
  if (selector) {
    try {
      // Element visibility and properties analysis
      const elementInfo = await page.evaluate((sel) => {
        const elements = document.querySelectorAll(sel);

        if (elements.length === 0) {
          return { found: false, message: `No elements match selector: ${sel}` };
        }

        // Get detailed info about matched elements
        const elementsInfo = Array.from(elements).map((el, index) => {
          const rect = el.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(el);
          const isVisible = rect.width > 0 && rect.height > 0 && 
            computedStyle.visibility !== 'hidden' && computedStyle.display !== 'none';
          const isInViewport = 
            rect.top >= 0 && rect.left >= 0 &&
            rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
          
          // Get computed styles relevant for debugging
          const styleProps = {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            position: computedStyle.position,
            zIndex: computedStyle.zIndex,
            opacity: computedStyle.opacity,
            pointerEvents: computedStyle.pointerEvents,
          };
          
          // Check if element is potentially covered by other elements
          const elementAtPoint = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
          );
          
          const isCovered = isVisible && elementAtPoint && !el.contains(elementAtPoint) && !elementAtPoint.contains(el);
          const coveringElement = isCovered && elementAtPoint ? {
            tagName: elementAtPoint.tagName.toLowerCase(),
            id: elementAtPoint.id,
            classes: Array.from(elementAtPoint.classList),
            zIndex: window.getComputedStyle(elementAtPoint).zIndex,
          } : null;

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
            innerHtml: el.innerHTML.substring(0, 200),
            isVisible,
            isInViewport,
            isCovered,
            coveringElement,
            dimensions: {
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left,
            },
            styles: styleProps,
            html: el.outerHTML,
            xpath: getElementXPath(el),
            ancestry: getElementAncestry(el),
          };
        });

        return {
          found: true,
          count: elements.length,
          elements: elementsInfo,
          url: window.location.href,
          title: document.title,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          }
        };
        
        // Helper function to get XPath
        function getElementXPath(element: Element): string {
          if (!element) return '';
          
          // Special case for document
          if (element.nodeType === 9) return '/';
          
          // Use id if available
          if (element.id) {
            return `//*[@id="${element.id}"]`;
          }
          
          const sameTagSiblings = Array.from(element.parentElement?.children || [])
            .filter(sibling => sibling.tagName === element.tagName);
          
          const idx = sameTagSiblings.indexOf(element) + 1;
          
          const path = element.parentElement ? 
            `${getElementXPath(element.parentElement)}/${element.tagName.toLowerCase()}[${idx}]` : 
            `/${element.tagName.toLowerCase()}[${idx}]`;
            
          return path;
        }
        
        // Helper function to get element ancestry
        function getElementAncestry(element: Element): {tag: string, id?: string, classes?: string[]}[] {
          const ancestry = [];
          let current = element;
          
          while (current && current.tagName) {
            ancestry.unshift({
              tag: current.tagName.toLowerCase(),
              id: current.id || undefined,
              classes: current.classList.length > 0 ? Array.from(current.classList) : undefined
            });
            current = current.parentElement as Element;
          }
          
          return ancestry;
        }
      }, selector);

      // Attach the element info as JSON
      await testInfo.attach(
        `${debugName}-elements.json`,
        {
          body: JSON.stringify(elementInfo, null, 2),
          contentType: 'application/json',
        },
      );
      
      // Add visual highlighting of the selected elements if they exist
      if (elementInfo.found && elementInfo.elements.length > 0) {
        // Take a screenshot with the elements highlighted
        await page.evaluate((sel) => {
          // Create a style element to highlight the selected elements
          const style = document.createElement('style');
          style.id = 'claude-highlight-style';
          style.textContent = `
            ${sel} {
              outline: 3px solid red !important;
              outline-offset: 2px !important;
              background-color: rgba(255, 0, 0, 0.1) !important;
            }
          `;
          document.head.appendChild(style);
        }, selector);
        
        // Take a screenshot with highlights
        await page.screenshot({
          path: path.join(process.cwd(), 'test-artifacts', `${debugName}-highlighted.png`),
          fullPage: true,
        });
        
        // Attach the highlighted screenshot
        await testInfo.attach(
          `${debugName}-highlighted.png`,
          { 
            path: path.join(process.cwd(), 'test-artifacts', `${debugName}-highlighted.png`), 
            contentType: 'image/png' 
          },
        );
        
        // Remove the highlight style
        await page.evaluate(() => {
          const style = document.getElementById('claude-highlight-style');
          if (style) style.remove();
        });
      }
      
      // Create a human-readable report
      let report = `CLAUDE DEBUG REPORT: ${description || 'Element inspection'}\n`;
      report += `URL: ${await page.url()}\n`;
      report += `Selector: ${selector}\n\n`;

      if (elementInfo.found) {
        report += `Found ${elementInfo.count} matching element(s):\n\n`;

        elementInfo.elements?.forEach((el, i) => {
          report += `--- Element #${i} ---\n`;
          report += `Tag: ${el.tagName}${el.id ? ' #' + el.id : ''}\n`;
          report += `Classes: ${el.classList.join(', ') || 'none'}\n`;
          report += `Visibility: ${el.isVisible ? 'Visible' : 'Not visible'}\n`;
          report += `In Viewport: ${el.isInViewport ? 'Yes' : 'No'}\n`;
          
          if (el.isCovered && el.coveringElement) {
            report += `⚠️ COVERED BY: ${el.coveringElement.tagName}${el.coveringElement.id ? ' #' + el.coveringElement.id : ''} with z-index: ${el.coveringElement.zIndex}\n`;
          }
          
          report += `Position: ${el.dimensions.width}x${el.dimensions.height} @ (${el.dimensions.left},${el.dimensions.top})\n`;
          report += `Computed styles: ${JSON.stringify(el.styles, null, 2)}\n`;
          report += `XPath: ${el.xpath}\n`;
          report += `Ancestry: ${el.ancestry.map(a => `${a.tag}${a.id ? '#'+a.id : ''}${a.classes ? '.'+a.classes.join('.') : ''}`).join(' > ')}\n`;
          report += `Text: ${el.textContent || '(empty)'}\n`;
          report += `HTML: ${el.html.substring(0, 300)}${el.html.length > 300 ? '...' : ''}\n\n`;
        });
      } else {
        report += `${elementInfo.message}\n\n`;
        report += `TROUBLESHOOTING:\n`;
        report += `- Selector syntax: ${selector}\n`;
        report += `- Is the element in an iframe? If so, you need to first access the iframe\n`;
        report += `- The element might be dynamically created. Try adding a wait\n`;
        report += `- Check if the element ID or class names are dynamically generated\n`;
        report += `- Try a more general selector or use xpath\n`;
      }

      // Attach the report
      await testInfo.attach(
        `${debugName}-report.txt`,
        {
          body: report,
          contentType: 'text/plain',
        },
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to get element info for selector "${selector}":`, errorMessage);

      // Attach error information
      await testInfo.attach(
        `${debugName}-error.txt`,
        {
          body: `Error analyzing "${selector}":\n${errorMessage}`,
          contentType: 'text/plain',
        },
      );
    }
  }
}

/**
 * Captures the accessibility tree of the page for debugging
 * Very useful for understanding how screen readers perceive the page
 */
export async function captureAccessibilityTree(
  page: Page,
  testInfo: TestInfo,
  description?: string
) {
  const debugName = `claude-a11y-${description ? 
    description.toLowerCase().replace(/[^a-z0-9]/g, '-') : 
    'a11y-tree'}-${Date.now()}`;
  
  try {
    // Get the accessibility tree
    const accessibilityTree = await page.accessibility.snapshot();
    
    // Attach as JSON
    await testInfo.attach(
      `${debugName}.json`,
      {
        body: JSON.stringify(accessibilityTree, null, 2),
        contentType: 'application/json',
      },
    );
    
    // Create a more readable text version
    let report = `ACCESSIBILITY TREE: ${description || 'Page analysis'}\n`;
    report += `URL: ${await page.url()}\n\n`;
    
    function printNode(node: any, depth: number = 0) {
      const indent = '  '.repeat(depth);
      let output = `${indent}${node.role || 'unknown'}: ${node.name || ''}\n`;
      
      if (node.children) {
        for (const child of node.children) {
          output += printNode(child, depth + 1);
        }
      }
      
      return output;
    }
    
    if (accessibilityTree) {
      report += printNode(accessibilityTree);
    } else {
      report += 'No accessibility tree available';
    }
    
    // Attach the readable report
    await testInfo.attach(
      `${debugName}-readable.txt`,
      {
        body: report,
        contentType: 'text/plain',
      },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to get accessibility tree:`, errorMessage);
  }
}

/**
 * Takes a snapshot of all relevant page information for debugging
 * Creates a comprehensive debug bundle with HTML, visual, and interactive elements
 */
export async function takeDebugSnapshot(
  page: Page,
  testInfo: TestInfo,
  description: string = 'debug-snapshot'
) {
  const timestamp = Date.now();
  const debugName = `claude-snapshot-${description.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}`;
  const artifactDir = path.join(process.cwd(), 'test-artifacts');
  
  // Ensure directory exists
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }
  
  try {
    // 1. Capture full page HTML
    const html = await page.content();
    await testInfo.attach(
      `${debugName}.html`,
      { body: html, contentType: 'text/html' },
    );
    
    // 2. Take a full page screenshot
    await page.screenshot({
      path: path.join(artifactDir, `${debugName}.png`),
      fullPage: true
    });
    
    await testInfo.attach(
      `${debugName}.png`,
      { path: path.join(artifactDir, `${debugName}.png`), contentType: 'image/png' },
    );
    
    // 3. Collect detailed page information
    const pageInfo = await page.evaluate(() => {
      // Collect all forms
      const forms = Array.from(document.querySelectorAll('form')).map(form => {
        const inputs = Array.from(form.querySelectorAll('input, select, textarea'))
          .map(input => {
            const el = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            return {
              type: el.tagName.toLowerCase() === 'input' ? (el as HTMLInputElement).type : el.tagName.toLowerCase(),
              id: el.id,
              name: (el as any).name || null,
              value: ['password', 'hidden'].includes((el as HTMLInputElement).type || '') 
                ? '[MASKED]' 
                : (el as any).value || null,
              placeholder: (el as any).placeholder || null,
              required: el.hasAttribute('required'),
              disabled: el.hasAttribute('disabled')
            };
          });
          
        return {
          id: form.id,
          action: form.getAttribute('action'),
          method: form.getAttribute('method'),
          inputs
        };
      });
      
      // Collect all buttons
      const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]'))
        .map(button => {
          const rect = button.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(button);
          const isVisible = rect.width > 0 && rect.height > 0 && 
            computedStyle.visibility !== 'hidden' && computedStyle.display !== 'none';
          
          return {
            type: button.tagName.toLowerCase(),
            id: button.id,
            text: button.textContent?.trim(),
            isVisible,
            classes: Array.from(button.classList),
            disabled: button.hasAttribute('disabled')
          };
        });
      
      // Collect navigation elements
      const navElements = Array.from(document.querySelectorAll('nav, [role="navigation"]'))
        .map(nav => {
          const links = Array.from(nav.querySelectorAll('a')).map(a => ({
            href: a.href,
            text: a.textContent?.trim(),
            isActive: a.classList.contains('active') || 
                      a.classList.contains('current') || 
                      a.getAttribute('aria-current') === 'page'
          }));
          
          return {
            id: nav.id,
            classes: Array.from(nav.classList),
            links
          };
        });
      
      // Collect error messages and alerts
      const errors = Array.from(document.querySelectorAll('.error, .alert, .notification, [role="alert"], [aria-invalid="true"]'))
        .map(error => ({
          type: error.tagName.toLowerCase(),
          id: error.id,
          classes: Array.from(error.classList),
          text: error.textContent?.trim()
        }));
      
      return {
        url: window.location.href,
        title: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        forms,
        buttons,
        navElements,
        errors
      };
    });
    
    // 4. Attach page information
    await testInfo.attach(
      `${debugName}-info.json`,
      {
        body: JSON.stringify(pageInfo, null, 2),
        contentType: 'application/json',
      },
    );
    
    // 5. Create human-readable report
    let report = `CLAUDE PAGE ANALYSIS: ${description}\n`;
    report += `URL: ${pageInfo.url}\n`;
    report += `Title: ${pageInfo.title}\n`;
    report += `Timestamp: ${new Date().toISOString()}\n\n`;
    
    report += `FORMS (${pageInfo.forms.length}):\n`;
    pageInfo.forms.forEach((form, i) => {
      report += `Form #${i + 1}${form.id ? ` (id: ${form.id})` : ''}: ${form.action || 'no action'} [${form.method || 'GET'}]\n`;
      form.inputs.forEach(input => {
        report += `  - ${input.type}${input.name ? ` name="${input.name}"` : ''}${input.placeholder ? ` placeholder="${input.placeholder}"` : ''}${input.required ? ' (required)' : ''}${input.disabled ? ' (disabled)' : ''}\n`;
      });
      report += `\n`;
    });
    
    report += `BUTTONS (${pageInfo.buttons.length}):\n`;
    pageInfo.buttons.forEach(button => {
      report += `  - ${button.text || '[no text]'} (${button.type}${button.id ? ` id="${button.id}"` : ''})${button.isVisible ? '' : ' [HIDDEN]'}${button.disabled ? ' [DISABLED]' : ''}\n`;
    });
    report += `\n`;
    
    report += `NAVIGATION (${pageInfo.navElements.length}):\n`;
    pageInfo.navElements.forEach((nav, i) => {
      report += `Nav #${i + 1}${nav.id ? ` (id: ${nav.id})` : ''}:\n`;
      nav.links.forEach(link => {
        report += `  - ${link.text || '[no text]'} → ${link.href}${link.isActive ? ' [ACTIVE]' : ''}\n`;
      });
    });
    report += `\n`;
    
    report += `ERRORS/ALERTS (${pageInfo.errors.length}):\n`;
    pageInfo.errors.forEach(error => {
      report += `  - ${error.text || '[no text]'} (${error.type}${error.id ? ` id="${error.id}"` : ''})\n`;
    });
    
    // 6. Attach the readable report
    await testInfo.attach(
      `${debugName}-report.txt`,
      {
        body: report,
        contentType: 'text/plain',
      },
    );
    
    console.log(`✅ Created debug snapshot: ${debugName}`);
    return debugName;
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to create debug snapshot:`, errorMessage);
    
    // Still try to provide some debug info even if the full snapshot fails
    await testInfo.attach(
      `${debugName}-error.txt`,
      {
        body: `Error creating debug snapshot:\n${errorMessage}`,
        contentType: 'text/plain',
      },
    );
  }
}

/**
 * Sets up automatic error handling and debugging for a page
 * @param page The Playwright page object
 * @param testInfo The TestInfo object (from test.info())
 */
export function setupDebugHelpers(page: Page, testInfo: TestInfo) {
  // Listen for console errors
  page.on('console', async (msg) => {
    if (msg.type() === 'error') {
      await testInfo.attach(
        `claude-console-error-${Date.now()}.txt`,
        {
          body: `Page console error: ${msg.text()}\nLocation: ${await page.url()}`,
          contentType: 'text/plain',
        },
      );
      
      // Take a snapshot on console errors
      await takeDebugSnapshot(page, testInfo, `console-error-${msg.text().substring(0, 20)}`);
    }
  });

  // Listen for page errors
  page.on('pageerror', async (error) => {
    await testInfo.attach(
      `claude-page-error-${Date.now()}.txt`,
      {
        body: `Page error: ${error.message}\n${error.stack || ''}\nLocation: ${await page.url()}`,
        contentType: 'text/plain',
      },
    );
    
    // Take a snapshot on page errors
    await takeDebugSnapshot(page, testInfo, `page-error`);
  });
  
  // Set up a response handler to capture problematic API responses
  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    
    // Only capture HTTP error responses from the same origin
    if ((status >= 400) && url.includes(page.url().split('/').slice(0, 3).join('/'))) {
      const contentType = response.headers()['content-type'] || '';
      let responseBody = '';
      
      try {
        if (contentType.includes('json')) {
          responseBody = JSON.stringify(await response.json(), null, 2);
        } else if (contentType.includes('text')) {
          responseBody = await response.text();
        } else {
          responseBody = `[Binary response with content-type: ${contentType}]`;
        }
      } catch (e) {
        responseBody = `[Failed to parse response: ${e}]`;
      }
      
      await testInfo.attach(
        `claude-http-error-${status}-${Date.now()}.txt`,
        {
          body: `HTTP Error ${status} from ${url}\nContent-Type: ${contentType}\n\nResponse:\n${responseBody}`,
          contentType: 'text/plain',
        },
      );
      
      // For 5xx errors, also capture a snapshot
      if (status >= 500) {
        await takeDebugSnapshot(page, testInfo, `http-${status}-error`);
      }
    }
  });
}

/**
 * A helper function to click elements that might be covered by overlays
 * @param page The Playwright page
 * @param selector Selector for the element to click
 * @param testInfo Optional TestInfo object for debugging
 */
export async function safeClick(page: Page, selector: string, testInfo?: TestInfo) {
  try {
    // Try regular click first
    await page.click(selector);
  }
  catch (error) {
    console.log(`Regular click failed, attempting alternative methods for ${selector}`);
    
    // If testInfo is provided, capture debug information
    if (testInfo) {
      await captureHtml(page, testInfo, selector, `click-failed-${selector}`);
    }
    
    try {
      // Try force: true option
      await page.click(selector, { force: true });
      console.log(`Forced click succeeded for ${selector}`);
      return;
    } catch (forceError) {
      // If force didn't work, try JavaScript click
      try {
        await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          if (element) {
            (element as HTMLElement).click();
            return true;
          }
          return false;
        }, selector);
        console.log(`JavaScript click succeeded for ${selector}`);
      } catch (jsError) {
        // If all methods fail, provide detailed error
        if (testInfo) {
          await testInfo.attach(
            `claude-click-failure-${Date.now()}.txt`,
            {
              body: `All click methods failed for "${selector}":\n` +
                    `Original error: ${error}\n` +
                    `Force error: ${forceError}\n` +
                    `JavaScript error: ${jsError}`,
              contentType: 'text/plain',
            },
          );
        }
        
        // Re-throw the original error
        throw error;
      }
    }
  }
}

/**
 * Waits for a network request matching a pattern to complete
 * @param page Playwright page object
 * @param urlPattern URL pattern to match (string or RegExp)
 * @param options Optional configuration
 */
export async function waitForRequest(
  page: Page,
  urlPattern: string | RegExp,
  options?: { timeout?: number; method?: string }
) {
  const timeout = options?.timeout || 5000;
  const method = options?.method;
  
  return new Promise<void>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    
    const requestHandler = (request: any) => {
      const url = request.url();
      const requestMethod = request.method();
      
      const urlMatches = typeof urlPattern === 'string' 
        ? url.includes(urlPattern) 
        : urlPattern.test(url);
        
      const methodMatches = !method || requestMethod === method.toUpperCase();
      
      if (urlMatches && methodMatches) {
        page.removeListener('request', requestHandler);
        clearTimeout(timeoutId);
        resolve();
      }
    };
    
    page.on('request', requestHandler);
    
    timeoutId = setTimeout(() => {
      page.removeListener('request', requestHandler);
      reject(new Error(`Timeout waiting for request matching ${urlPattern}`));
    }, timeout);
  });
}

/**
 * Analyzes and visualizes the event handlers on elements
 * Helps debug when elements aren't responding to interactions
 * @param page Playwright page object
 * @param selector Element selector to analyze
 * @param testInfo TestInfo object for attaching results
 */
export async function analyzeEventHandlers(
  page: Page, 
  selector: string,
  testInfo: TestInfo
) {
  const debugName = `claude-events-${selector.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}`;
  
  try {
    const eventData = await page.evaluate((sel) => {
      // Get the elements
      const elements = document.querySelectorAll(sel);
      if (elements.length === 0) {
        return { found: false, message: `No elements match selector: ${sel}` };
      }
      
      // Process each element
      const results = Array.from(elements).map((el, index) => {
        // Try to extract event listeners using getEventListeners (works in DevTools, not all browsers)
        let listeners: any[] = [];
        try {
          // @ts-ignore - This is a Chrome DevTools API
          const elListeners = window.getEventListeners?.(el);
          if (elListeners) {
            listeners = Object.entries(elListeners).map(([type, handlers]) => ({
              type,
              count: Array.isArray(handlers) ? handlers.length : 0
            }));
          }
        } catch (e) {
          // Ignore, browser doesn't support this API
        }
        
        // Check for inline event handlers
        const inlineHandlers = Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('on'))
          .map(attr => ({
            type: attr.name.substring(2),
            handler: attr.value
          }));
        
        // Check for elements that look clickable
        const isClickable = (
          el.tagName.toLowerCase() === 'button' ||
          el.tagName.toLowerCase() === 'a' ||
          el.hasAttribute('role') && ['button', 'link'].includes(el.getAttribute('role') || '') ||
          el.tagName.toLowerCase() === 'input' && ['button', 'submit', 'reset'].includes((el as HTMLInputElement).type) ||
          window.getComputedStyle(el).cursor === 'pointer'
        );
        
        return {
          index,
          tagName: el.tagName.toLowerCase(),
          id: el.id,
          classes: Array.from(el.classList),
          isClickable,
          inlineHandlers,
          listeners,
          // Include any relevant ARIA attributes
          ariaAttributes: {
            role: el.getAttribute('role'),
            label: el.getAttribute('aria-label'),
            hidden: el.getAttribute('aria-hidden'),
            disabled: el.getAttribute('aria-disabled'),
            expanded: el.getAttribute('aria-expanded'),
            pressed: el.getAttribute('aria-pressed'),
          }
        };
      });
      
      return {
        found: true,
        count: elements.length,
        elements: results
      };
    }, selector);
    
    // Attach the event data
    await testInfo.attach(
      `${debugName}.json`,
      {
        body: JSON.stringify(eventData, null, 2),
        contentType: 'application/json',
      },
    );
    
    // Create readable report
    let report = `EVENT HANDLER ANALYSIS: ${selector}\n\n`;
    
    if (eventData.found) {
      report += `Found ${eventData.count} matching elements\n\n`;
      
      eventData.elements.forEach((el: any, i: number) => {
        report += `--- Element #${i} ---\n`;
        report += `Tag: ${el.tagName}${el.id ? ' #' + el.id : ''}\n`;
        report += `Classes: ${el.classes.join(', ') || 'none'}\n`;
        report += `Appears Clickable: ${el.isClickable ? 'Yes' : 'No'}\n`;
        
        if (el.ariaAttributes.role) {
          report += `ARIA Role: ${el.ariaAttributes.role}\n`;
        }
        
        if (el.ariaAttributes.label) {
          report += `ARIA Label: ${el.ariaAttributes.label}\n`;
        }
        
        if (el.ariaAttributes.disabled === 'true') {
          report += `⚠️ ARIA Disabled: true\n`;
        }
        
        if (el.ariaAttributes.hidden === 'true') {
          report += `⚠️ ARIA Hidden: true\n`;
        }
        
        // Inline handlers
        report += `Inline Event Handlers: ${el.inlineHandlers.length > 0 ? '\n' : 'None\n'}`;
        el.inlineHandlers.forEach((handler: any) => {
          report += `  - on${handler.type}: ${handler.handler}\n`;
        });
        
        // JS listeners
        report += `JavaScript Event Listeners: ${el.listeners.length > 0 ? '\n' : 'None\n'}`;
        el.listeners.forEach((listener: any) => {
          report += `  - ${listener.type}: ${listener.count} handler(s)\n`;
        });
        
        report += '\n';
      });
      
      // Debugging suggestions
      report += `DEBUGGING SUGGESTIONS:\n`;
      
      // Check if elements are clickable but have no handlers
      const nonInteractive = eventData.elements.filter((el: any) => 
        el.isClickable && el.inlineHandlers.length === 0 && el.listeners.length === 0);
      
      if (nonInteractive.length > 0) {
        report += `⚠️ ${nonInteractive.length} elements appear clickable but have no event handlers.\n`;
        report += `   This might indicate event delegation (handlers on parent) or dynamic handlers added later.\n`;
      }
      
      // Check for disabled elements
      const disabledElements = eventData.elements.filter((el: any) => 
        el.ariaAttributes.disabled === 'true' || 
        (el as any).attributes?.disabled);
      
      if (disabledElements.length > 0) {
        report += `⚠️ ${disabledElements.length} elements are marked as disabled, which prevents interactions.\n`;
      }
      
      // Check for hidden elements
      const hiddenElements = eventData.elements.filter((el: any) => 
        el.ariaAttributes.hidden === 'true');
      
      if (hiddenElements.length > 0) {
        report += `⚠️ ${hiddenElements.length} elements are marked as hidden for accessibility.\n`;
      }
    } else {
      report += eventData.message + '\n';
      report += `No elements found for analysis.\n`;
    }
    
    // Attach the report
    await testInfo.attach(
      `${debugName}-report.txt`,
      {
        body: report,
        contentType: 'text/plain',
      },
    );
    
    return eventData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to analyze event handlers for "${selector}":`, errorMessage);
    
    await testInfo.attach(
      `${debugName}-error.txt`,
      {
        body: `Error analyzing event handlers for "${selector}":\n${errorMessage}`,
        contentType: 'text/plain',
      },
    );
  }
}