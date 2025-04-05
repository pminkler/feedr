import { expect } from '@playwright/test';
import { claudeTest, captureHtml } from './utils/claude';

// Language testing suite
claudeTest.describe('Landing Page - Internationalization Tests', () => {
  // Currently only testing English - we can expand to other languages once the
  // locale switching mechanism is confirmed to be working
  const language = {
    code: 'en',
    name: 'English',
    heading: 'Your Recipes, Simplified',
    button: 'Get Recipe',
    placeholder: 'Recipe URL',
    features: 'Why Feedr?',
    faq: 'Frequently Asked Questions',
  };

  claudeTest(`displays landing page correctly in ${language.name}`, async ({ page }) => {
    // Visit the landing page
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Capture the initial state of the page in this language
    await captureHtml(page, `landing-page-${language.code}-initial`, {
      screenshot: true,
      annotate: [{ selector: 'h1', text: `${language.name} heading` }],
    });

    // Check the main heading
    await expect(page.getByRole('heading', { level: 1 })).toContainText(language.heading);

    // Check the submit button text
    const submitButton = page.getByRole('button', { name: language.button });
    await expect(submitButton).toBeVisible();

    // Capture the form
    await captureHtml(page, `landing-page-${language.code}-form`, {
      screenshot: true,
      highlight: 'form',
      annotate: [{ selector: 'form', text: `Form in ${language.name}` }],
    });

    // Verify Features section heading
    const featuresHeading = page.getByRole('heading', { name: language.features });
    await featuresHeading.scrollIntoViewIfNeeded();
    await expect(featuresHeading).toBeVisible();

    // Capture features section
    await captureHtml(page, `landing-page-${language.code}-features`, {
      screenshot: true,
      highlight: '#features',
      annotate: [{ selector: '#features', text: `Features in ${language.name}` }],
    });

    // Verify FAQ section
    const faqHeading = page.getByRole('heading', { name: language.faq });
    await faqHeading.scrollIntoViewIfNeeded();
    await expect(faqHeading).toBeVisible();

    // Capture FAQ section
    await captureHtml(page, `landing-page-${language.code}-faq`, {
      screenshot: true,
      highlight: '#faq',
      annotate: [{ selector: '#faq', text: `FAQ in ${language.name}` }],
    });
  });

  claudeTest(`has functioning form in ${language.name}`, async ({ page }) => {
    // Visit the landing page
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Get the form elements
    const urlInput = page.getByPlaceholder(language.placeholder);
    const submitButton = page.getByRole('button', { name: language.button });

    // Check initial form state
    await expect(urlInput).toBeVisible();
    await expect(urlInput).toBeEmpty();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    // Fill the input with a test URL
    await urlInput.fill('https://example.com/recipe');

    // Verify the input value
    await expect(urlInput).toHaveValue('https://example.com/recipe');

    // Capture the form with data
    await captureHtml(page, `landing-page-${language.code}-form-filled`, {
      screenshot: true,
      highlight: 'input',
      annotate: [{ selector: 'input', text: `URL entered in ${language.name}` }],
    });
  });

  // As a placeholder for future internationalization testing,
  // we can add a test that verifies the language selector exists
  claudeTest('has language selection functionality', async ({ page }) => {
    // Visit the landing page
    await page.goto('/', { waitUntil: 'networkidle' });

    // Capture the header area where language selector would typically be located
    await captureHtml(page, 'landing-page-header', {
      screenshot: true,
      highlight: 'header',
      annotate: [{ selector: 'header', text: 'Header area with potential language selector' }],
    });

    // For a future test, we would check for actual language selector and verify it works:
    // const languageSelector = page.locator('.language-selector');
    // await expect(languageSelector).toBeVisible();

    // TODO: When language selector is implemented, expand this test to verify
    // that changing the language actually updates the UI text
  });
});
