import fs from 'fs';
import path from 'path';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Custom Playwright reporter that captures detailed debug information
 * on test failures, including screenshots and HTML output
 */
class DebugReporter implements Reporter {
  private debugDir: string;

  constructor() {
    // Create the debug artifacts directory
    this.debugDir = path.join(process.cwd(), 'debug-artifacts');
    if (!fs.existsSync(this.debugDir)) {
      fs.mkdirSync(this.debugDir, { recursive: true });
    }

    // Create subdirectories
    const dirs = ['html', 'screenshots', 'traces'];
    dirs.forEach((dir) => {
      const dirPath = path.join(this.debugDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    console.log(`Debug reporter initialized. Artifacts will be saved to: ${this.debugDir}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Only capture information for failed tests
    if (result.status !== 'failed') return;

    const testId = this.sanitizeFilename(`${test.title}`);
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const testInfo = `${testId}-${timestamp}`;

    // Process each attachment (screenshots, traces, etc.)
    result.attachments.forEach((attachment, index) => {
      try {
        if (attachment.name === 'screenshot') {
          // Handle screenshot attachments
          if (attachment.path) {
            const screenshotPath = path.join(this.debugDir, 'screenshots', `${testInfo}-${index}.png`);
            fs.copyFileSync(attachment.path, screenshotPath);
            console.log(`Screenshot saved: ${screenshotPath}`);
          }
          else if (attachment.body) {
            const screenshotPath = path.join(this.debugDir, 'screenshots', `${testInfo}-${index}.png`);
            fs.writeFileSync(screenshotPath, attachment.body);
            console.log(`Screenshot saved: ${screenshotPath}`);
          }
        }
        else if (attachment.name === 'trace') {
          // Handle trace attachments if present
          if (attachment.path) {
            const tracePath = path.join(this.debugDir, 'traces', `${testInfo}.zip`);
            fs.copyFileSync(attachment.path, tracePath);
            console.log(`Trace saved: ${tracePath}`);
          }
        }
      }
      catch (error) {
        console.error(`Error processing attachment: ${error}`);
      }
    });

    // Capture and save full HTML content if available
    const htmlAttachment = result.attachments.find((a) => a.name === 'html' && (a.path || a.body));
    if (!htmlAttachment) {
      // If no HTML attachment exists, we'll create one from the last attachment's context information
      const lastAttachment = result.attachments[result.attachments.length - 1];
      if (lastAttachment && lastAttachment.contentType === 'text/plain') {
        const htmlPath = path.join(this.debugDir, 'html', `${testInfo}.html`);
        try {
          if (lastAttachment.path) {
            const content = fs.readFileSync(lastAttachment.path, 'utf8');
            fs.writeFileSync(htmlPath, content);
          }
          else if (lastAttachment.body) {
            fs.writeFileSync(htmlPath, lastAttachment.body);
          }
          console.log(`HTML content saved: ${htmlPath}`);
        }
        catch (error) {
          console.error(`Error saving HTML content: ${error}`);
        }
      }
    }
    else {
      // Process HTML attachment
      const htmlPath = path.join(this.debugDir, 'html', `${testInfo}.html`);
      try {
        if (htmlAttachment.path) {
          fs.copyFileSync(htmlAttachment.path, htmlPath);
        }
        else if (htmlAttachment.body) {
          fs.writeFileSync(htmlPath, htmlAttachment.body);
        }
        console.log(`HTML content saved: ${htmlPath}`);
      }
      catch (error) {
        console.error(`Error saving HTML content: ${error}`);
      }
    }

    // Save test information in a summary file
    const summaryPath = path.join(this.debugDir, `${testInfo}-summary.json`);
    const summary = {
      title: test.title,
      testPath: test.location.file,
      status: result.status,
      error: result.error?.message || null,
      duration: result.duration,
      retries: test.retries,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`Test summary saved: ${summaryPath}`);
  }

  // Sanitize filename to remove invalid characters
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[\\/:"*?<>|]+/g, '-') // Replace invalid filename chars with dash
      .replace(/\s+/g, '-') // Replace spaces with dash
      .replace(/-+/g, '-') // Collapse multiple dashes
      .substring(0, 100); // Limit length
  }
}

export default DebugReporter;
