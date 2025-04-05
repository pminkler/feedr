import * as fs from 'fs';
import * as path from 'path';

/**
 * Creates the necessary directories for test artifacts
 */
export function setupArtifactDirectories() {
  const directories = [
    'test-artifacts/html',
    'test-artifacts/screenshots',
    'test-artifacts/dom-inspector',
    'test-artifacts/accessibility',
  ];

  for (const dir of directories) {
    const fullPath = path.resolve(process.cwd(), dir);
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }

  // Create a simple index.html file to browse artifacts
  const indexPath = path.resolve(process.cwd(), 'test-artifacts/index.html');
  const indexContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Playwright Test Artifacts</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .section { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px; padding: 15px; }
        .section-title { font-size: 24px; margin-bottom: 10px; }
        .section-link { font-size: 18px; text-decoration: none; color: #0077cc; display: block; margin-bottom: 10px; }
        .section-link:hover { text-decoration: underline; }
        .timestamp { color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <h1>Playwright Test Artifacts</h1>
      <p class="timestamp">Generated at ${new Date().toLocaleString()}</p>
      
      <div class="section">
        <div class="section-title">HTML Captures</div>
        <a href="./html/index.html" class="section-link">Browse HTML Captures</a>
        <p>HTML snapshots of pages captured during test execution</p>
      </div>
      
      <div class="section">
        <div class="section-title">Screenshots</div>
        <a href="./screenshots/" class="section-link">Browse Screenshots</a>
        <p>Screenshots taken during test execution</p>
      </div>
      
      <div class="section">
        <div class="section-title">DOM Inspector Reports</div>
        <a href="./dom-inspector/" class="section-link">Browse DOM Inspector Reports</a>
        <p>Detailed reports about DOM elements</p>
      </div>
      
      <div class="section">
        <div class="section-title">Accessibility Reports</div>
        <a href="./accessibility/" class="section-link">Browse Accessibility Reports</a>
        <p>Basic accessibility checks performed during tests</p>
      </div>
    </body>
    </html>
  `;

  fs.writeFileSync(indexPath, indexContent);
  console.log(`Created index file: ${indexPath}`);
}

// Run setup automatically
setupArtifactDirectories();

export default setupArtifactDirectories;
