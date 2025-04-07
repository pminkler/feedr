import { test, expect } from '@playwright/test';
import { createDOMCapture } from './utils/dom-capture';
import { LandingPage } from './page-objects/LandingPage';
import { RecipePage } from './page-objects/RecipePage';

// This is a development test file, so we can use DOM capture
process.env.ENABLE_DOM_CAPTURE = 'true';

test('capture landing page DOM for recipe generation', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // Capture DOM state before any interaction
  const domCapture = createDOMCapture(page);
  await domCapture.captureDOMState('landing-page-initial');

  // Create page object model instances
  const landingPage = new LandingPage(page);

  // Use Page Object Model with DOM capturing
  await landingPage.captureDOMState('landing-page-using-pom');

  // Try to locate the input element
  await page.waitForSelector('[data-testid="recipe-url-input"]', { state: 'visible', timeout: 5000 });

  // Capture DOM after element is visible
  await domCapture.captureDOMState('landing-page-input-visible');

  // Focus and click on the input
  await page.focus('[data-testid="recipe-url-input"]');
  await domCapture.captureDOMState('landing-page-input-focused');

  // Fill the input and capture DOM
  await page.fill('[data-testid="recipe-url-input"]',
    'https://www.allrecipes.com/recipe/21014/good-old-fashioned-pancakes/');
  await domCapture.captureDOMState('landing-page-input-filled');

  // Find and click the submit button
  await page.click('[data-testid="submit-button"]');
  await domCapture.captureDOMState('landing-page-after-submit');

  // Wait for the loading skeleton
  try {
    await page.waitForSelector('[data-testid="recipe-details-skeleton-line"]', { timeout: 5000 });
    await domCapture.captureDOMState('landing-page-loading-skeleton');
  }
  catch (e) {
    console.log('Could not find loading skeleton');
  }

  // Wait for results to load
  try {
    await page.waitForSelector('[data-testid="details-heading"]', { timeout: 10000 });
    await domCapture.captureDOMState('landing-page-results-loaded');

    // Create RecipePage object for additional captures
    const recipePage = new RecipePage(page);
    await recipePage.captureDOMState('recipe-page-loaded-via-pom');
  }
  catch (e) {
    console.log('Could not find details heading');
  }
});
