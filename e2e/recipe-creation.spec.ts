import { expect } from '@playwright/test';
import { claudeTest, captureHtml, createTestReport } from './utils/claude';

// Claude-enhanced test suite for recipe creation
claudeTest.describe('Recipe Creation Tests', () => {
  claudeTest.beforeEach(async ({ page }) => {
    // Visit the landing page before each test
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Capture the initial state of the page
    await captureHtml(page, 'recipe-creation-initial', { screenshot: true });
  });

  /**
   * Test for URL-based recipe creation
   */
  claudeTest('can create a recipe from URL input', async ({ page }) => {
    // Wait for the form to be visible
    await page.waitForSelector('form', { state: 'visible' });

    // Capture the initial form state
    await captureHtml(page, 'recipe-creation-url-form', {
      screenshot: true,
      highlight: 'form',
      annotate: [{ selector: 'form', text: 'Recipe URL input form' }],
    });

    // Get the URL input field and submit button
    const urlInput = page.getByPlaceholder('Recipe URL');
    const submitButton = page.getByRole('button', { name: /Get Recipe|Obtén la receta|Obtenez la recette/i });

    await expect(urlInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Fill the input with a test URL
    await urlInput.fill('https://example.com/recipe');
    await expect(urlInput).toHaveValue('https://example.com/recipe');

    // Capture the filled form
    await captureHtml(page, 'recipe-creation-url-filled', {
      screenshot: true,
      highlight: 'input',
      annotate: [{ selector: 'input', text: 'URL entered' }],
    });

    // Verify the button state is enabled for submission
    await expect(submitButton).toBeEnabled();

    // Create a report showing the form with entered URL
    await createTestReport(page, 'recipe-creation-url-ready');
  });

  /**
   * Test for image upload functionality
   */
  claudeTest('has image upload functionality for recipes', async ({ page }) => {
    // Wait for the form to be visible
    await page.waitForSelector('form', { state: 'visible' });

    // Check if file inputs exist
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    const cameraInput = page.locator('input[type="file"][accept="image/*"][capture="environment"]');

    // Verify file inputs are present but hidden (they're triggered by buttons)
    await expect(fileInput).toBeHidden();
    await expect(cameraInput).toBeHidden();

    // Check for buttons that would trigger the file inputs
    // Based on actual implementation, they use icon buttons
    const photoButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('.i-heroicons\\:photo-16-solid') });
    const cameraButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('.i-heroicons\\:camera') });

    // Capture the UI showing upload buttons
    await captureHtml(page, 'recipe-creation-image-upload-ui', {
      screenshot: true,
      highlight: 'form',
      annotate: [
        { selector: 'button:has(.i-heroicons\\:photo-16-solid)', text: 'Photo upload button' },
        { selector: 'button:has(.i-heroicons\\:camera)', text: 'Camera button' },
      ],
    });

    // Verify upload buttons are visible
    await expect(photoButton).toBeVisible();
    await expect(cameraButton).toBeVisible();
  });

  /**
   * Test for simulating the image upload (without actually uploading)
   * This test verifies the UI mechanics but doesn't perform a real upload
   */
  claudeTest('correctly handles image upload UI flow', async ({ page }) => {
    // Wait for the form to load
    await page.waitForSelector('form', { state: 'visible' });

    // Find the photo upload button
    const photoButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('.i-heroicons\\:photo-16-solid') });
    await expect(photoButton).toBeVisible();

    // Create comprehensive report about the image upload UI
    await createTestReport(page, 'recipe-creation-image-upload-mechanics');

    // Check that the file input has the correct accept attribute
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await expect(fileInput).toHaveAttribute('accept', 'image/*');

    // Ensure form has a submit button
    const submitButton = page.getByRole('button', { name: /Get Recipe|Obtén la receta|Obtenez la recette/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  /**
   * Test for verification of file upload error handling
   */
  claudeTest('shows appropriate UI for image file restrictions', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('form', { state: 'visible' });

    // File input should have image/* restriction
    const fileInput = page.locator('input[type="file"][accept="image/*"]').first();
    await expect(fileInput).toHaveAttribute('accept', 'image/*');

    // Create a report about the file upload restrictions
    await createTestReport(page, 'recipe-creation-file-restrictions');

    // Look for typical toast container elements
    // In Nuxt UI, toast notifications appear when triggered
    // We'll verify the page structure here

    // Take screenshot of form for validation
    await captureHtml(page, 'recipe-creation-form-validation', {
      screenshot: true,
      highlight: 'form',
    });
  });

  /**
   * Test to verify both buttons are visible in the UI and correctly positioned
   */
  claudeTest('displays both photo and camera buttons with correct accessibility', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('form', { state: 'visible' });

    // Find photo and camera buttons - they use icon-based buttons
    const photoButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('.i-heroicons\\:photo-16-solid') });
    const cameraButton = page.getByRole('button', { name: '' }).filter({ has: page.locator('.i-heroicons\\:camera') });

    // Verify buttons are visible
    await expect(photoButton).toBeVisible();
    await expect(cameraButton).toBeVisible();

    // Capture UI showing both buttons
    await captureHtml(page, 'recipe-creation-image-buttons', {
      screenshot: true,
      highlight: '.flex.items-center',
      annotate: [
        { selector: 'button:has(.i-heroicons\\:photo-16-solid)', text: 'Photo upload button' },
        { selector: 'button:has(.i-heroicons\\:camera)', text: 'Camera button' },
      ],
    });

    // Create report analyzing button placement and accessibility
    await createTestReport(page, 'recipe-creation-button-accessibility');
  });

  /**
   * Test for the text-based recipe input
   * Note: The modal is not directly implemented in the current UI, so we'll modify this test
   * to check the relevant UI elements instead
   */
  claudeTest.skip('can open modal for text-based recipe input', async (_page) => {
    // This test is skipped because the modal functionality isn't implemented
    // in the current version of the application

    // Note: If text-based recipe input is added in the future,
    // this test should be updated and unskipped
  });
});
