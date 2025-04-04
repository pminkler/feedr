// e2e/debug-reporter-log.ts
import fs from 'fs';
import path from 'path';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class DebugLogReporter implements Reporter {
  private logFile: string;

  constructor() {
    // Create artifacts directory if it doesn't exist
    const artifactsDir = path.join(process.cwd(), 'test-artifacts');
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    // Create a log file for this run
    this.logFile = path.join(artifactsDir, `debug-detailed-${Date.now()}.txt`);
    fs.writeFileSync(this.logFile, `Detailed Debug Log: ${new Date().toISOString()}\n\n`);
  }

  // Helper to log to both console and file
  private log(message: string) {
    console.log(message);
    fs.appendFileSync(this.logFile, message + '\n');
  }

  onBegin() {
    this.log('🔍 DEBUG REPORTER: Starting tests');
  }

  onTestBegin(test: TestCase) {
    this.log(`\n[TEST START] ${test.title}`);
  }

  onStdOut(chunk: string | Buffer) {
    // Capture and save console.log output
    const output = chunk.toString();
    this.log(`[CONSOLE] ${output.trim()}`);
  }

  onStdErr(chunk: string | Buffer) {
    // Capture and save console.error output
    const output = chunk.toString();
    this.log(`[ERROR] ${output.trim()}`);
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    this.log(`\n[TEST END] ${test.title} (${result.status})`);

    if (result.status === 'failed' && result.error) {
      this.log(`\n[ERROR DETAILS] ${result.error.message}`);
      if (result.error.stack) {
        this.log(`\n[STACK TRACE] ${result.error.stack}`);
      }
    }

    // Log attachment information
    if (result.attachments.length > 0) {
      this.log(`\n[ATTACHMENTS] Found ${result.attachments.length} attachments`);
      for (const attachment of result.attachments) {
        this.log(`- ${attachment.name}: ${attachment.contentType} (${attachment.path || 'body content'})`);
      }
    }
  }

  onEnd() {
    this.log(`\n[END] Testing complete. Full log at: ${this.logFile}`);
  }
}

export default DebugLogReporter;
