import * as fs from 'fs';
import * as path from 'path';
import type { Page } from '@playwright/test';
import { debugLog } from './setup';

interface AnnotationItem {
  selector: string;
  text: string;
}

interface CaptureOptions {
  screenshot?: boolean;
  highlight?: string;
  annotate?: AnnotationItem[];
}

export class HtmlCapture {
  private outputDir: string;
  private screenshotDir: string;
  private enabled: boolean;

  constructor() {
    // Check if HTML capture is enabled via env variable
    this.enabled = process.env.CAPTURE_HTML === 'true';

    // Create output directories if enabled
    if (this.enabled) {
      this.outputDir = path.resolve(process.cwd(), 'test-artifacts/html');
      this.screenshotDir = path.resolve(process.cwd(), 'test-artifacts/screenshots');

      fs.mkdirSync(this.outputDir, { recursive: true });
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  /**
   * Captures the current HTML content and optionally takes a screenshot
   *
   * @param page Playwright page object
   * @param name Identifier for the capture (used in filename)
   * @param options Additional capture options
   */
  async capture(
    page: Page,
    name: string,
    options: CaptureOptions = {},
  ): Promise<void> {
    if (!this.enabled) return;

    // Clean the name for use in filenames
    const cleanName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${cleanName}_${timestamp}`;

    try {
      // Capture full HTML with error handling
      let html = '';
      try {
        // First try to wait for network to be idle
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        html = await page.content();
      }
      catch (error) {
        debugLog('Warning: Could not get page content, saving partial data', error);
        // Try to get innerHTML from body as fallback
        html = await page.evaluate(() => {
          return document.documentElement ? document.documentElement.outerHTML : 'Could not capture HTML';
        }).catch((e) => 'Failed to capture HTML: ' + e.toString());
      }
      const htmlPath = path.join(this.outputDir, `${filename}.html`);
      fs.writeFileSync(htmlPath, html);

      // Generate page info data
      let url = '';
      let title = '';
      let viewport = null;

      try {
        url = page.url();
        title = await page.title();
        viewport = page.viewportSize();
      }
      catch (error) {
        debugLog('Could not get page metadata', error);
      }

      const pageInfo = {
        url,
        title,
        viewport,
        timestamp: new Date().toISOString(),
        capturePoint: name,
      };

      const infoPath = path.join(this.outputDir, `${filename}.json`);
      fs.writeFileSync(infoPath, JSON.stringify(pageInfo, null, 2));

      // Take screenshot if requested
      if (options.screenshot) {
        const screenshotPath = path.join(this.screenshotDir, `${filename}.png`);

        // If highlight is provided, temporarily add a border
        if (options.highlight) {
          await page.evaluate((selector) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => {
              const originalOutline = (el as HTMLElement).style.outline;
              const originalZIndex = (el as HTMLElement).style.zIndex;
              (el as HTMLElement).style.outline = '3px solid red';
              (el as HTMLElement).style.zIndex = '9999';

              // Store original values for later restoration
              (el as HTMLElement)._originalOutline = originalOutline;
              (el as HTMLElement)._originalZIndex = originalZIndex;
            });
          }, options.highlight);
        }

        // Add annotations if requested
        if (options.annotate && options.annotate.length > 0) {
          await page.evaluate((annotations: AnnotationItem[]) => {
            annotations.forEach(({ selector, text }) => {
              const elements = document.querySelectorAll(selector);
              elements.forEach((el) => {
                const annotation = document.createElement('div');
                annotation.textContent = text;
                annotation.style.position = 'absolute';
                annotation.style.background = 'rgba(255, 0, 0, 0.8)';
                annotation.style.color = 'white';
                annotation.style.padding = '5px';
                annotation.style.borderRadius = '3px';
                annotation.style.fontSize = '14px';
                annotation.style.zIndex = '10000';
                annotation.style.pointerEvents = 'none';
                annotation.className = '_claude_annotation_';

                // Position at top-right of element
                const rect = el.getBoundingClientRect();
                annotation.style.top = `${rect.top}px`;
                annotation.style.left = `${rect.right + 5}px`;

                document.body.appendChild(annotation);
              });
            });
          }, options.annotate);
        }

        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Clean up highlights and annotations
        if (options.highlight) {
          await page.evaluate((selector) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => {
              (el as HTMLElement).style.outline = (el as HTMLElement)._originalOutline || '';
              (el as HTMLElement).style.zIndex = (el as HTMLElement)._originalZIndex || '';
            });
          }, options.highlight);
        }

        if (options.annotate) {
          await page.evaluate(() => {
            document.querySelectorAll('._claude_annotation_').forEach((el) => el.remove());
          });
        }
      }

      debugLog(`✅ HTML capture saved: ${filename}`);
    }
    catch (error) {
      debugLog(`❌ HTML capture failed:`, error);
    }
  }

  /**
   * Utility method to generate an HTML report with links to all captures
   */
  generateReport(): void {
    if (!this.enabled) return;

    try {
      const files = fs.readdirSync(this.outputDir)
        .filter((file) => file.endsWith('.html'))
        .sort();

      const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Playwright Test Captures</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; max-width: 1200px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .capture-list { list-style: none; padding: 0; }
          .capture-item { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px; padding: 15px; }
          .capture-link { font-size: 18px; text-decoration: none; color: #0077cc; }
          .capture-link:hover { text-decoration: underline; }
          .timestamp { color: #666; font-size: 14px; }
          .screenshot { display: block; margin-top: 10px; }
        </style>
      </head>
      <body>
        <h1>Playwright Test Captures</h1>
        <p>Generated at ${new Date().toLocaleString()}</p>
        <ul class="capture-list">
          ${files.map((file) => {
            const baseName = file.replace('.html', '');
            const jsonFile = `${baseName}.json`;
            const screenshotFile = `${baseName}.png`;

            let pageInfo = { capturePoint: 'Unknown', timestamp: 'Unknown', url: '' };
            if (fs.existsSync(path.join(this.outputDir, jsonFile))) {
              pageInfo = JSON.parse(fs.readFileSync(path.join(this.outputDir, jsonFile), 'utf8'));
            }

            const hasScreenshot = fs.existsSync(path.join(this.screenshotDir, screenshotFile));

            return `
              <li class="capture-item">
                <a href="${file}" class="capture-link" target="_blank">${pageInfo.capturePoint}</a>
                <div class="timestamp">
                  ${pageInfo.timestamp} - ${pageInfo.url}
                </div>
                ${hasScreenshot ? `<a href="../screenshots/${screenshotFile}" class="screenshot" target="_blank">View Screenshot</a>` : ''}
              </li>
            `;
          }).join('')}
        </ul>
      </body>
      </html>
      `;

      fs.writeFileSync(path.join(this.outputDir, 'index.html'), reportContent);
      debugLog(`✅ HTML capture report generated at ${path.join(this.outputDir, 'index.html')}`);
    }
    catch (error) {
      debugLog(`❌ Failed to generate HTML capture report:`, error);
    }
  }
}

// Create and export singleton instance
export const htmlCapture = new HtmlCapture();
