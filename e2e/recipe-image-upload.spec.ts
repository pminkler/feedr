import { expect } from '@playwright/test';
import { claudeTest, captureHtml, createTestReport, debugLog } from './utils/claude';

// Claude-enhanced test suite for recipe creation from image upload
claudeTest.describe('Recipe Image Upload Test', () => {
  claudeTest.beforeEach(async ({ page }) => {
    // Visit the landing page before each test
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Create a report of the initial page state
    await createTestReport(page, 'recipe-image-landing-page');
  });

  claudeTest('verifies form for image uploads exists', async ({ page }) => {
    // Wait for the form to be visible
    await page.waitForSelector('form', { state: 'visible' });

    // Use Claude's tools to create a detailed report of the form
    await createTestReport(page, 'recipe-image-form-analysis');

    // Capture the form
    await captureHtml(page, 'recipe-image-upload-form', {
      screenshot: true,
      highlight: 'form',
      annotate: [{ selector: 'form', text: 'Form that should include upload capabilities' }],
    });

    // Verify hidden file inputs - which should exist regardless of button UI
    const fileInputs = page.locator('input[type="file"]');
    expect(await fileInputs.count()).toBeGreaterThan(0);

    // Verify at least one input accepts images
    const imageInputs = page.locator('input[type="file"][accept*="image"]');
    expect(await imageInputs.count()).toBeGreaterThan(0);

    // Verify a submit button exists - use a specific query to avoid strict mode violation
    const submitButton = page.getByRole('button', { name: 'Get Recipe' });
    await expect(submitButton).toBeVisible();

    // Check the form is set up for recipe creation
    const urlInput = page.getByPlaceholder(/url/i);
    await expect(urlInput).toBeVisible();
  });

  claudeTest('documents upload capabilities on the form', async ({ page }) => {
    // Wait for the form to be visible
    await page.waitForSelector('form', { state: 'visible' });

    // Find form buttons
    const formButtons = page.locator('form button');
    expect(await formButtons.count()).toBeGreaterThan(0);

    // Take a screenshot of the form showing all its controls
    await captureHtml(page, 'recipe-image-form-controls', {
      screenshot: true,
      highlight: 'form',
      annotate: [{ selector: 'form', text: 'Recipe form with potential upload controls' }],
    });

    // Verify file inputs exist somewhere (they may be hidden)
    const fileInputs = page.locator('input[type="file"]');
    expect(await fileInputs.count()).toBeGreaterThan(0);

    // Create a comprehensive report documenting the form
    await createTestReport(page, 'recipe-image-form-with-inputs');
  });

  claudeTest('checks attributes of file inputs', async ({ page }) => {
    // Wait for form to be visible
    await page.waitForSelector('form', { state: 'visible' });

    // Find file inputs first since they're essential for uploads
    const fileInputs = page.locator('input[type="file"]');
    expect(await fileInputs.count()).toBeGreaterThan(0);

    // Capture a detailed report about file input configuration
    await createTestReport(page, 'recipe-image-file-inputs');

    // Check if there are image-accepting inputs
    const imageInputs = page.locator('input[type="file"][accept*="image"]');
    expect(await imageInputs.count()).toBeGreaterThan(0);

    // Document the type of file inputs available
    for (let i = 0; i < await imageInputs.count(); i++) {
      const input = imageInputs.nth(i);
      const accept = await input.getAttribute('accept');
      const capture = await input.getAttribute('capture');

      debugLog(`File input ${i}: accept=${accept}, capture=${capture || 'none'}`);
    }

    // Take a screenshot showing the form's capabilities
    await captureHtml(page, 'recipe-image-upload-capabilities', {
      screenshot: true,
      highlight: 'form',
    });
  });
});
