// e2e/custom-reporter.ts
import fs from 'fs';
import path from 'path';
import type { Reporter, TestCase, TestResult, TestStep, TestError } from '@playwright/test/reporter';

/**
 * Enhanced custom reporter specifically designed for debugging authentication issues
 */
class DebugReporter implements Reporter {
  private basePath = path.join(process.cwd(), 'test-artifacts');
  private testStartTimes = new Map<string, number>();

  constructor() {
    // Ensure artifacts directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }

    // Clean up old artifacts to avoid confusion
    const files = fs.readdirSync(this.basePath);
    for (const file of files) {
      if (file.startsWith('debug-')) {
        fs.unlinkSync(path.join(this.basePath, file));
      }
    }

    // Create a log file for this test run
    this.logFile = path.join(this.basePath, `debug-log-${Date.now()}.txt`);
    fs.writeFileSync(this.logFile, `Debug Test Run: ${new Date().toISOString()}\n\n`);
  }

  private logFile: string;

  private log(message: string) {
    // Log to console and to file
    console.log(message);
    fs.appendFileSync(this.logFile, message + '\n');
  }

  onBegin() {
    this.log('\n🔍 DEBUG REPORTER: Starting tests\n');
  }

  onTestBegin(test: TestCase) {
    this.testStartTimes.set(test.id, Date.now());
    this.log(`\n[TEST START] ${test.title}`);
  }

  onStepBegin(test: TestCase, result: TestResult, step: TestStep) {
    if (step.category === 'test.step') {
      this.log(`  ▶️  Step: ${step.title}`);
    }
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep) {
    // Only show detailed step info for specific operations we're debugging
    const debugKeywords = ['login', 'auth', 'credential', 'submit', 'click'];

    if (step.category === 'test.step'
      && debugKeywords.some((keyword) => step.title.toLowerCase().includes(keyword))) {
      const duration = step.duration || 0;
      if (step.error) {
        this.log(`  ❌ Step Failed: ${step.title} (${duration}ms)`);
        this.logStepError(step.error);
      }
      else {
        this.log(`  ✅ Step Completed: ${step.title} (${duration}ms)`);
      }
    }
  }

  private logStepError(error: TestError) {
    if (!error) return;

    this.log('  ERROR:');
    this.log(`    ${error.message?.split('\n').join('\n    ')}`);

    if (error.stack) {
      this.log('  STACK:');
      this.log(`    ${error.stack.split('\n').join('\n    ')}`);
    }
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    const duration = Date.now() - (this.testStartTimes.get(test.id) || Date.now());

    this.log(`\n[TEST END] ${test.title}`);
    this.log(`  Status: ${result.status.toUpperCase()}`);
    this.log(`  Duration: ${duration}ms`);

    if (result.status === 'failed') {
      this.log('\n📋 FAILURE DETAILS:');
      if (result.error) {
        this.log(`  Error: ${result.error.message?.split('\n').join('\n  ')}`);
      }

      // Process attachments for failed tests
      if (result.attachments.length > 0) {
        const testId = `debug-${test.title.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}`;

        this.log('\n📎 ATTACHMENTS:');
        for (let i = 0; i < result.attachments.length; i++) {
          const attachment = result.attachments[i];

          if (attachment.path) {
            const filename = `${testId}-attachment-${i}-${path.basename(attachment.path)}`;
            const destPath = path.join(this.basePath, filename);

            try {
              fs.copyFileSync(attachment.path, destPath);
              this.log(`  • ${attachment.name || 'Attachment'}: ${destPath}`);

              // For screenshots, print the path more prominently
              if (attachment.contentType?.startsWith('image/')) {
                this.log(`\n    📷 SCREENSHOT: ${destPath}\n`);
              }
            }
            catch (e) {
              this.log(`  • Failed to copy attachment: ${e}`);
            }
          }
          else if (attachment.body) {
            let extension = '.txt';
            if (attachment.contentType === 'text/html') extension = '.html';

            const filename = `${testId}-attachment-${i}${extension}`;
            const destPath = path.join(this.basePath, filename);

            try {
              fs.writeFileSync(destPath, attachment.body);
              this.log(`  • ${attachment.name || 'Attachment'}: ${destPath}`);

              // For HTML, save a snippet to the log
              if (attachment.contentType === 'text/html') {
                const snippet = attachment.body.toString().slice(0, 500) + '...';
                this.log(`\n    🌐 HTML SNIPPET:\n    ${snippet.split('\n').join('\n    ')}\n`);
              }
            }
            catch (e) {
              this.log(`  • Failed to save attachment: ${e}`);
            }
          }
        }
      }
    }

    this.log('\n-------------------------------------------\n');
  }

  onEnd(result) {
    this.log(`\n🏁 TEST RUN COMPLETED: ${result.status.toUpperCase()}`);
    this.log(`📄 Full debug log: ${this.logFile}\n`);
  }
}

export default DebugReporter;
