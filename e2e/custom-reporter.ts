// e2e/custom-reporter.ts
import fs from 'fs';
import path from 'path';
import type { Reporter, TestCase, TestResult, TestStep, TestError } from '@playwright/test/reporter';

/**
 * Claude-specific custom reporter for enhanced E2E test debugging
 * Provides deep visibility into HTML structure and test state 
 */
class ClaudeDebugReporter implements Reporter {
  private basePath = path.join(process.cwd(), 'test-artifacts');
  private testStartTimes = new Map<string, number>();
  private currentTestId: string | null = null;

  constructor() {
    // Ensure artifacts directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }

    // Clean up old artifacts but keep a reasonable history
    this.cleanupOldArtifacts();

    // Create a log file for this test run
    this.logFile = path.join(this.basePath, `claude-debug-${Date.now()}.txt`);
    fs.writeFileSync(this.logFile, `Claude Debug Test Run: ${new Date().toISOString()}\n\n`);
  }

  private logFile: string;

  private cleanupOldArtifacts() {
    try {
      const files = fs.readdirSync(this.basePath);
      const debugFiles = files.filter(f => f.startsWith('claude-debug-') && f.endsWith('.txt'));
      
      // Sort by creation time (newest first)
      const sortedFiles = debugFiles
        .map(file => ({ 
          name: file, 
          time: fs.statSync(path.join(this.basePath, file)).mtime.getTime() 
        }))
        .sort((a, b) => b.time - a.time);
      
      // Keep the 10 most recent logs, delete the rest
      if (sortedFiles.length > 10) {
        for (let i = 10; i < sortedFiles.length; i++) {
          fs.unlinkSync(path.join(this.basePath, sortedFiles[i].name));
        }
      }
    } catch (error) {
      console.error('Error cleaning up old artifacts:', error);
    }
  }

  private log(message: string) {
    // Log to console and to file with timestamp
    const timestamp = new Date().toISOString().substring(11, 23); // HH:MM:SS.mmm
    const formattedMessage = `[${timestamp}] ${message}`;
    console.log(formattedMessage);
    fs.appendFileSync(this.logFile, formattedMessage + '\n');
  }

  onBegin(config: { projects: any[] }) {
    this.log('\n🔍 CLAUDE DEBUG REPORTER: Starting tests');
    this.log(`Browser: ${config.projects[0]?.use?.browserName || 'unknown'}`);
    this.log(`Viewport: ${config.projects[0]?.use?.viewport?.width || 'default'}x${config.projects[0]?.use?.viewport?.height || 'default'}`);
    this.log(`Headless: ${config.projects[0]?.use?.headless !== false ? 'yes' : 'no'}`);
    this.log('-------------------------------------------\n');
  }

  onTestBegin(test: TestCase) {
    // Generate a unique ID for this test for artifact filenames
    this.currentTestId = `${test.title.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}`;
    this.testStartTimes.set(test.id, Date.now());
    this.log(`\n[TEST START] ${test.title}`);
    this.log(`File: ${test.location.file}`);
    this.log(`Line: ${test.location.line}:${test.location.column}`);
  }

  onStepBegin(test: TestCase, result: TestResult, step: TestStep) {
    if (step.category === 'test.step') {
      this.log(`  ▶️  Step: ${step.title}`);
    }
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep) {
    if (step.category === 'test.step') {
      const duration = step.duration || 0;
      
      if (step.error) {
        this.log(`  ❌ Step Failed: ${step.title} (${duration}ms)`);
        this.logStepError(step.error);
      }
      else {
        this.log(`  ✅ ${step.title} (${duration}ms)`);
      }
    }
  }

  private logStepError(error: TestError) {
    if (!error) return;

    this.log('  ERROR:');
    this.log(`    ${error.message?.split('\n').join('\n    ')}`);

    if (error.value) {
      this.log(`  VALUE: ${typeof error.value === 'object' ? JSON.stringify(error.value, null, 2) : error.value}`);
    }

    // Only log the first few lines of the stack trace to keep logs readable
    if (error.stack) {
      const stackLines = error.stack.split('\n');
      const relevantStack = stackLines.slice(0, Math.min(5, stackLines.length)).join('\n');
      this.log('  STACK (first 5 lines):');
      this.log(`    ${relevantStack.split('\n').join('\n    ')}`);
    }
  }

  async onTestEnd(test: TestCase, result: TestResult) {
    const duration = Date.now() - (this.testStartTimes.get(test.id) || Date.now());

    this.log(`\n[TEST END] ${test.title}`);
    this.log(`  Status: ${result.status.toUpperCase()}`);
    this.log(`  Duration: ${duration}ms`);

    // Process attachments for all tests (not just failed ones)
    if (result.attachments.length > 0) {
      await this.processAttachments(test, result);
    }

    if (result.status === 'failed') {
      this.log('\n📋 FAILURE DETAILS:');
      if (result.error) {
        this.log(`  Error: ${result.error.message?.split('\n').join('\n  ')}`);
        
        // Generate a searchable error message format for Claude
        const errorSummary = result.error.message?.split('\n')[0] || 'Unknown error';
        this.log(`\n  [CLAUDE-ERROR-MARKER] ${errorSummary}`);
      }
    }

    this.log('\n-------------------------------------------\n');
    this.currentTestId = null;
  }

  private async processAttachments(test: TestCase, result: TestResult) {
    const testId = this.currentTestId || `test-${Date.now()}`;
    
    this.log('\n📎 ATTACHMENTS:');
    
    // Group attachments by type for better organization
    const screenshots: any[] = [];
    const htmlDocs: any[] = [];
    const textDocs: any[] = [];
    const jsonDocs: any[] = [];
    const otherDocs: any[] = [];
    
    for (const attachment of result.attachments) {
      if (!attachment) continue;
      
      try {
        if (attachment.contentType?.startsWith('image/')) {
          screenshots.push(attachment);
        } else if (attachment.contentType === 'text/html') {
          htmlDocs.push(attachment);
        } else if (attachment.contentType === 'application/json') {
          jsonDocs.push(attachment);
        } else if (attachment.contentType === 'text/plain') {
          textDocs.push(attachment);
        } else {
          otherDocs.push(attachment);
        }
      } catch (error) {
        this.log(`  • Error processing attachment: ${error}`);
      }
    }
    
    // Process HTML docs first for better context
    if (htmlDocs.length > 0) {
      this.log(`\n  🌐 HTML DOCUMENTS (${htmlDocs.length}):`);
      for (let i = 0; i < htmlDocs.length; i++) {
        await this.saveAttachment(htmlDocs[i], testId, i, 'html');
      }
    }
    
    // Process screenshots
    if (screenshots.length > 0) {
      this.log(`\n  📷 SCREENSHOTS (${screenshots.length}):`);
      for (let i = 0; i < screenshots.length; i++) {
        await this.saveAttachment(screenshots[i], testId, i, 'screenshot');
      }
    }
    
    // Process JSON docs (element analysis)
    if (jsonDocs.length > 0) {
      this.log(`\n  📊 JSON DATA (${jsonDocs.length}):`);
      for (let i = 0; i < jsonDocs.length; i++) {
        await this.saveAttachment(jsonDocs[i], testId, i, 'json');
      }
    }
    
    // Process text docs
    if (textDocs.length > 0) {
      this.log(`\n  📝 TEXT DOCUMENTS (${textDocs.length}):`);
      for (let i = 0; i < textDocs.length; i++) {
        await this.saveAttachment(textDocs[i], testId, i, 'text');
      }
    }
    
    // Process other attachments
    if (otherDocs.length > 0) {
      this.log(`\n  📦 OTHER DOCUMENTS (${otherDocs.length}):`);
      for (let i = 0; i < otherDocs.length; i++) {
        await this.saveAttachment(otherDocs[i], testId, i, 'other');
      }
    }
  }
  
  private async saveAttachment(attachment: any, testId: string, index: number, type: string) {
    try {
      if (attachment.path) {
        const extension = path.extname(attachment.path) || this.getExtensionFromContentType(attachment.contentType);
        const filename = `claude-${type}-${testId}-${index}${extension}`;
        const destPath = path.join(this.basePath, filename);
        
        fs.copyFileSync(attachment.path, destPath);
        this.log(`  • ${attachment.name || type}: ${destPath}`);
        
        // For screenshots, make a special marker for Claude
        if (type === 'screenshot') {
          this.log(`    [CLAUDE-SCREENSHOT] ${destPath}`);
        }
      } else if (attachment.body) {
        const extension = this.getExtensionFromContentType(attachment.contentType);
        const filename = `claude-${type}-${testId}-${index}${extension}`;
        const destPath = path.join(this.basePath, filename);
        
        fs.writeFileSync(destPath, attachment.body);
        this.log(`  • ${attachment.name || type}: ${destPath}`);
        
        // For HTML, save a snippet to the log with special Claude marker
        if (attachment.contentType === 'text/html') {
          const htmlContent = attachment.body.toString();
          
          // Extract and log page title
          const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
          const pageTitle = titleMatch ? titleMatch[1] : 'Unnamed Page';
          this.log(`    Page Title: ${pageTitle}`);
          
          // Extract body content for analysis
          const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          if (bodyMatch) {
            // Create a simplified version of the HTML for Claude to analyze
            const simplifiedHtml = this.createSimplifiedHtml(bodyMatch[1]);
            const simplifiedPath = path.join(this.basePath, `claude-simplified-html-${testId}-${index}.html`);
            fs.writeFileSync(simplifiedPath, simplifiedHtml);
            this.log(`    [CLAUDE-HTML-STRUCTURE] ${simplifiedPath}`);
          }
          
          // Log special marker for raw HTML
          this.log(`    [CLAUDE-RAW-HTML] ${destPath}`);
        }
        
        // For JSON element info, extract key details
        if (attachment.contentType === 'application/json') {
          try {
            const jsonContent = JSON.parse(attachment.body.toString());
            if (jsonContent.elements) {
              this.log(`    Found ${jsonContent.count} elements matching selector`);
              for (let i = 0; i < Math.min(jsonContent.elements.length, 3); i++) {
                const el = jsonContent.elements[i];
                this.log(`    Element #${i}: ${el.tagName}${el.id ? '#'+el.id : ''} (visible: ${el.isVisible})`);
              }
            } else if (jsonContent.found === false) {
              this.log(`    [CLAUDE-ELEMENT-NOT-FOUND] ${jsonContent.message}`);
            }
          } catch (e) {
            // Ignore JSON parsing errors
          }
        }
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.log(`  • Failed to save ${type} attachment: ${errorMessage}`);
    }
  }
  
  private getExtensionFromContentType(contentType?: string): string {
    if (!contentType) return '.txt';
    
    switch (contentType) {
      case 'text/html': return '.html';
      case 'text/plain': return '.txt';
      case 'application/json': return '.json';
      case 'image/png': return '.png';
      case 'image/jpeg': return '.jpg';
      default: return '.dat';
    }
  }
  
  private createSimplifiedHtml(bodyContent: string): string {
    // Create a simplified version that highlights key elements for debugging
    // Remove script tags and inline styles to make it easier to read
    const cleanedContent = bodyContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/style="[^"]*"/gi, '');
    
    const simplifiedHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Claude Simplified HTML View</title>
  <style>
    body { font-family: monospace; line-height: 1.5; padding: 20px; }
    .claude-highlight { border: 2px solid red; padding: 2px; }
    .claude-form { border: 2px solid blue; padding: 4px; }
    .claude-button { border: 2px solid green; margin: 2px; }
    .claude-interactive { border: 2px solid purple; }
    summary { cursor: pointer; font-weight: bold; }
    .claude-info { color: #666; font-style: italic; }
  </style>
</head>
<body>
  <h1>Claude Simplified HTML View</h1>
  <div class="claude-info">
    This is a simplified view of the page's HTML specially formatted for Claude's analysis.
    Interactive elements are highlighted with colored borders.
  </div>
  <hr>
  ${this.transformHtmlForClaudeViewing(cleanedContent)}
</body>
</html>`;
    
    return simplifiedHtml;
  }
  
  private transformHtmlForClaudeViewing(html: string): string {
    // Add special Claude-specific markup to help with visual debugging
    return html
      // Highlight form elements
      .replace(/<form\b/gi, '<form class="claude-form"')
      // Highlight buttons and links
      .replace(/<button\b/gi, '<button class="claude-button"')
      .replace(/<input\s+type=["']submit["']/gi, '<input type="submit" class="claude-button"')
      // Highlight all interactive elements
      .replace(/<(a|input|select|textarea)\b/gi, '<$1 class="claude-interactive"')
      // Wrap large sections in details/summary for better readability
      .replace(/<div\s+class=["'][^"']*container[^"']*["'][^>]*>/gi, 
               '<details open><summary>Container Section</summary><div class="container">');
  }

  onEnd(result: { status?: string }) {
    const status = result.status ? result.status.toUpperCase() : 'COMPLETED';
    this.log(`\n🏁 TEST RUN ${status}`);
    this.log(`📄 Full debug log: ${this.logFile}`);
    
    // Generate a summary for Claude
    this.log(`\n[CLAUDE-SUMMARY-MARKER] Debug artifacts saved to ${this.basePath}`);
  }
}

export default ClaudeDebugReporter;