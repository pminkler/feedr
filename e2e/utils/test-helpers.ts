import path from 'path';
import fs from 'fs';
import type { Page, TestInfo } from '@playwright/test';

/**
 * Captures the current state of the page including HTML content and screenshot
 * @param page The Playwright Page object
 * @param testInfo The TestInfo object from the test
 * @param name Optional name to identify this capture point
 */
export async function captureDebugState(
  page: Page,
  testInfo: TestInfo,
  name = 'debug-capture',
): Promise<void> {
  try {
    // Only run in debug mode
    if (!process.env.DEBUG_MODE) return;

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const captureName = `${name}-${timestamp}`;

    // Capture HTML content
    const html = await page.content();
    // Push the attachment but don't need to use the index
    testInfo.attachments.push({
      name: 'html',
      contentType: 'text/html',
      body: Buffer.from(html),
    });

    // Also save to debug-artifacts for easy access
    const debugDir = path.join(process.cwd(), 'debug-artifacts', 'html');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    const htmlPath = path.join(debugDir, `${testInfo.title}-${captureName}.html`);
    fs.writeFileSync(htmlPath, html);

    // Capture screenshot
    await page.screenshot({
      path: path.join(debugDir, '..', 'screenshots', `${testInfo.title}-${captureName}.png`),
      fullPage: true,
    });

    console.log(`Debug state captured: ${captureName}`);
  }
  catch (error) {
    console.error(`Error capturing debug state: ${error}`);
  }
}

/**
 * Logs DOM structure of specified element for debugging purposes
 * @param page Playwright Page object
 * @param selector CSS selector to find the element
 * @param depth Maximum depth to traverse (default: 3)
 */
export async function logDomStructure(
  page: Page,
  selector: string,
  depth = 3,
): Promise<void> {
  try {
    // Only run in debug mode
    if (!process.env.DEBUG_MODE) return;

    const structure = await page.evaluate(
      ({ selector, depth }) => {
        function getNodeDetails(node: Element, currentDepth: number): Record<string, unknown> {
          if (currentDepth > depth) return { type: node.nodeName, truncated: true };

          const result: Record<string, unknown> = {
            type: node.nodeName,
            id: node.id || undefined,
            classes: Array.from(node.classList).join(' ') || undefined,
            attributes: {},
            children: [],
          };

          // Get other attributes
          for (const attr of Array.from(node.attributes)) {
            if (attr.name !== 'id' && attr.name !== 'class') {
              (result.attributes as Record<string, string>)[attr.name] = attr.value;
            }
          }

          if (Object.keys(result.attributes as object).length === 0) {
            delete result.attributes;
          }

          // Get children (only Element nodes)
          if (currentDepth < depth) {
            for (const child of Array.from(node.children)) {
              (result.children as Record<string, unknown>[]).push(getNodeDetails(child, currentDepth + 1));
            }
          }

          return result;
        }

        const element = document.querySelector(selector);
        if (!element) return { error: `Element not found: ${selector}` };

        return getNodeDetails(element, 1);
      },
      { selector, depth },
    );

    console.log(`DOM Structure for "${selector}":`);
    console.log(JSON.stringify(structure, null, 2));
  }
  catch (error) {
    console.error(`Error logging DOM structure: ${error}`);
  }
}
