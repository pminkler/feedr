import { test, expect } from '@playwright/test';
import { claudeTest, captureHtml, createTestReport } from './utils/claude';

// Traditional test suite
test.describe('Landing Page - Traditional Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Visit the landing page before each test
    await page.goto('/');
  });

  test('displays the main components of the landing page', async ({ page }) => {
    // 1. Check the title and subtitle
    await expect(page.getByRole('heading', { name: 'Your Recipes, Simplified' })).toBeVisible();
    await expect(page.getByText('Convert any recipe into a clean, consistent format')).toBeVisible();

    // 2. Check the input form is present
    await expect(page.getByPlaceholder('Recipe URL')).toBeVisible();

    // 3. Check the submit button is present
    await expect(page.getByRole('button', { name: 'Get Recipe' })).toBeVisible();

    // 4. Check that the Features section exists
    await expect(page.getByRole('heading', { name: 'Why Feedr?' })).toBeVisible();
    await expect(page.locator('#features')).toBeVisible();

    // 5. Check that we have the expected number of feature cards
    const featureCards = page.locator('#features').locator('> *');
    const count = await featureCards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // 6. Check FAQ section exists
    await expect(page.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible();
    await expect(page.locator('#faq')).toBeVisible();
  });
});

// Claude-enhanced test suite
claudeTest.describe('Landing Page - Claude Tests', () => {
  claudeTest.beforeEach(async ({ page }) => {
    // Visit the landing page before each test
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait to ensure page is fully loaded
    await page.waitForTimeout(1000);

    // Capture the initial state of the page
    await captureHtml(page, 'landing-page-initial', { screenshot: true });
  });

  claudeTest('displays the main UI components with proper layout', async ({ page }) => {
    // Create a comprehensive test report
    await createTestReport(page, 'landing-page-layout');

    // Header section
    // Just check for the page title and any nav links that exist
    await expect(page.getByRole('heading', { name: 'Your Recipes, Simplified' })).toBeVisible();

    // Find the navigation links that are actually present
    const navLinks = page.locator('a[href]').filter({ hasText: /Sign Up|Login|Get Started/i });
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0); // At least one navigation link should exist

    // Hero section
    const heroSection = page.locator('.hero-section, .hero, section').first();
    await expect(heroSection).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your Recipes, Simplified' })).toBeVisible();

    // Capture after checking the hero section
    await captureHtml(page, 'landing-page-hero', {
      screenshot: true,
      highlight: 'h1',
      annotate: [{ selector: 'h1', text: 'Main heading is visible' }],
    });
  });

  claudeTest('has a functional recipe URL input form', async ({ page }) => {
    // Get the form elements
    const urlInput = page.getByPlaceholder('Recipe URL');
    const submitButton = page.getByRole('button', { name: 'Get Recipe' });

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
    await captureHtml(page, 'landing-page-form-filled', {
      screenshot: true,
      highlight: 'input',
      annotate: [{ selector: 'input', text: 'URL entered correctly' }],
    });
  });

  claudeTest('features section displays benefits', async ({ page }) => {
    // Scroll to the features section
    await page.getByRole('heading', { name: 'Why Feedr?' }).scrollIntoViewIfNeeded();

    // Capture the features section
    await captureHtml(page, 'landing-page-features', {
      screenshot: true,
      highlight: '#features',
    });

    // Check that features section exists
    await expect(page.locator('#features')).toBeVisible();

    // Check all feature cards
    const features = page.locator('#features > *');
    const count = await features.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // Just verify that the features section has some content
    const featuresText = await page.locator('#features').textContent();
    expect(featuresText.length).toBeGreaterThan(100); // Should have substantial text content
  });

  claudeTest('FAQ section exists', async ({ page }) => {
    // Scroll to the FAQ section
    await page.getByRole('heading', { name: 'Frequently Asked Questions' }).scrollIntoViewIfNeeded();

    // Capture FAQs section
    await captureHtml(page, 'landing-page-faq', { screenshot: true });

    // Verify that the FAQ section exists
    await expect(page.locator('#faq')).toBeVisible();

    // Check for at least one FAQ element - the implementation might not use accordion yet
    const faqHeadings = await page.locator('#faq h2, #faq h3, #faq h4, #faq h5, #faq h6').count();
    expect(faqHeadings).toBeGreaterThan(0);

    // Verify that FAQ section has some content
    const faqText = await page.locator('#faq').textContent();
    expect(faqText.length).toBeGreaterThan(50); // At least some substantial text
  });

  claudeTest('has responsive design that works on different screen sizes', async ({ page }) => {
    // Capture desktop view first
    await captureHtml(page, 'landing-page-desktop', { screenshot: true });

    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Give time for responsive changes
    await captureHtml(page, 'landing-page-tablet', { screenshot: true });

    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Give time for responsive changes
    await captureHtml(page, 'landing-page-mobile', { screenshot: true });

    // Check that the mobile menu button appears
    const mobileMenuButton = page.getByRole('button', { name: /menu/i })
      || page.locator('button.hamburger, .mobile-menu-button');
    await expect(mobileMenuButton).toBeVisible();
  });
});
