import { test, expect } from './utils/debug-test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page before each test
    await page.goto('/');
    await page.captureDebug('before-each');
  });

  test('shows correct landing page elements', async ({ page }) => {
    // Capture debug state at the beginning of this test
    await page.captureDebug('initial-load');

    // Verify page title
    await expect(page).toHaveTitle(/Feedr/);

    // Verify main heading exists
    const heading = page.locator('h1:has-text("Your Recipes, Simplified"), h1:has-text("Accédez à la recette"), h1:has-text("Obtén la receta")');
    await expect(heading).toBeVisible();

    // Log DOM structure for debugging
    if (process.env.DEBUG_MODE === 'true') {
      await page.logDomStructure('h1');
    }

    // Find and verify the recipe URL input
    const urlInput = page.locator('input[placeholder*="Recipe URL"], input[placeholder*="URL de la recette"], input[placeholder*="URL de la receta"]');
    await expect(urlInput).toBeVisible();

    // Find and verify the submit button
    const submitButton = page.locator('button:has-text("Get Recipe"), button:has-text("Obtenez la recette"), button:has-text("Obtén la receta")');
    await expect(submitButton).toBeVisible();

    // Find and verify photo/camera buttons
    // These are ghost buttons with icons, so we'll look for buttons near the URL input
    const inputContainer = page.locator('div').filter({ has: urlInput });
    const actionButtons = inputContainer.locator('button');

    // Expect at least 2 buttons (browse image + take photo)
    const buttonCount = await actionButtons.count();
    await expect(buttonCount).toBeGreaterThanOrEqual(2);

    // Verify features section exists
    const featuresHeading = page.locator('h2:has-text("Why Feedr"), h2:has-text("Pourquoi Feedr"), h2:has-text("¿Por qué Feedr")');
    await expect(featuresHeading).toBeVisible();

    // Verify FAQ section exists
    const faqHeading = page.locator('h2:has-text("Frequently Asked Questions"), h2:has-text("Questions Fréquemment Posées"), h2:has-text("Preguntas Frecuentes")');
    await expect(faqHeading).toBeVisible();

    // Capture debug state at the end
    await page.captureDebug('end-of-test');
  });

  test('enters recipe URL in form field', async ({ page }) => {
    // Locate the form elements
    const urlInput = page.locator('input[placeholder*="Recipe URL"], input[placeholder*="URL de la recette"], input[placeholder*="URL de la receta"]');
    const submitButton = page.locator('button:has-text("Get Recipe"), button:has-text("Obtenez la recette"), button:has-text("Obtén la receta")');

    // Verify the form is empty initially
    await expect(urlInput).toHaveValue('');

    // Fill in a test URL
    await urlInput.fill('https://example.com/recipe');
    await page.captureDebug('form-filled');

    // Verify the URL input has the correct value
    await expect(urlInput).toHaveValue('https://example.com/recipe');

    // Verify the submit button is enabled
    await expect(submitButton).toBeEnabled();

    // We don't actually click the button as that would trigger navigation
    // to a new page, which might fail if the backend isn't running
  });
});
